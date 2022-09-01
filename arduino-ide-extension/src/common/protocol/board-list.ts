import { naturalCompare } from '../utils';
import {
  BoardIdentifier,
  boardIdentifierComparator,
  boardIdentifierEquals,
  BoardsConfig,
  DetectedPort,
  DetectedPorts,
  emptyBoardsConfig,
  findMatchingPortIndex,
  isBoardIdentifier,
  isDefinedBoardsConfig,
  Port,
  portIdentifierEquals,
  portProtocolComparator,
} from './boards-service';

export interface BoardListItem {
  readonly port: Port;
  readonly board?: BoardIdentifier;
}

export function isBoardListItem(arg: unknown): arg is BoardListItem {
  return (
    Boolean(arg) &&
    typeof arg === 'object' &&
    (<BoardListItem>arg).port !== undefined &&
    Port.is((<BoardListItem>arg).port) &&
    ((<BoardListItem>arg).board === undefined ||
      ((<BoardListItem>arg).board !== undefined &&
        isBoardIdentifier((<BoardListItem>arg).board)))
  );
}

export function boardListItemEquals(
  left: BoardListItem,
  right: BoardListItem
): boolean {
  if (portIdentifierEquals(left.port, right.port)) {
    const leftBoard = getBoardOrInferredBoard(left);
    const rightBoard = getBoardOrInferredBoard(right);
    if (boardIdentifierEquals(leftBoard, rightBoard)) {
      const leftInferredBoard = getInferredBoardOrBoard(left);
      const rightInferredBoard = getInferredBoardOrBoard(right);
      return boardIdentifierEquals(leftInferredBoard, rightInferredBoard);
    }
  }
  return false;
}

export interface BoardListItemWithBoard extends BoardListItem {
  readonly board: BoardIdentifier;
}

export function isBoardListItemWithBoard(
  arg: unknown
): arg is BoardListItemWithBoard {
  return isBoardListItem(arg) && Boolean(arg.board);
}

export function getBoardOrInferredBoard(
  item: BoardListItem
): BoardIdentifier | undefined {
  let board: BoardIdentifier | undefined = undefined;
  board = item.board;
  if (!board && isInferredBoardListItem(item)) {
    board = item.inferredBoard;
  }
  return board;
}

export function getInferredBoardOrBoard(
  item: BoardListItem
): BoardIdentifier | undefined {
  if (isInferredBoardListItem(item)) {
    return item.inferredBoard;
  }
  return item.board;
}

interface BoardSelectedBoardListItem extends BoardListItem {
  readonly inferredBoard: BoardIdentifier;
  readonly type: Extract<InferenceType, 'board-select'>;
}

interface BoardOverriddenBoardListItem extends BoardListItem {
  readonly board: BoardIdentifier;
  readonly inferredBoard: BoardIdentifier;
  readonly type: Extract<InferenceType, 'board-overridden'>;
}

export type InferredBoardListItem =
  | BoardSelectedBoardListItem
  | BoardOverriddenBoardListItem;

export function isInferredBoardListItem(
  arg: unknown
): arg is InferredBoardListItem {
  return (
    isBoardListItem(arg) &&
    (<InferredBoardListItem>arg).type !== undefined &&
    isInferenceType((<InferredBoardListItem>arg).type) &&
    (<InferredBoardListItem>arg).inferredBoard !== undefined &&
    isBoardIdentifier((<InferredBoardListItem>arg).inferredBoard)
  );
}

/**
 * Stores historical info about boards manually specified for detected boards. The key are generated with `Port#keyOf`.
 */
export type BoardListHistory = Readonly<Record<string, BoardIdentifier>>;

export function isBoardListHistory(arg: unknown): arg is BoardListHistory {
  return (
    Boolean(arg) &&
    typeof arg === 'object' &&
    Object.entries(<object>arg).every(([, value]) => isBoardIdentifier(value))
  );
}

const inferenceTypeLiterals = [
  /**
   * The user has manually selected the board (FQBN) for the detected port of a 3rd party board (no matching boards were detected by the CLI for the port)
   */
  'board-select',
  /**
   * The user has manually edited the detected FQBN of a recognized board from a detected port (there are matching boards for a detected port, but the user decided to use another FQBN)
   */
  'board-overridden',
] as const;
type InferenceType = (typeof inferenceTypeLiterals)[number];
function isInferenceType(arg: unknown): arg is InferenceType {
  return (
    typeof arg === 'string' &&
    inferenceTypeLiterals.includes(<InferenceType>arg)
  );
}

/**
 * Compare precedence:
 *  1. `BoardListItem#port#protocol`: `'serial'`, `'network'`, then natural compare of the `protocol` string.
 *  1. `BoardListItem`s with a `board` comes before items without a `board`.
 *  1. `BoardListItem#board`:
 *     1. Items with `'arduino'` vendor ID in the `fqbn` come before other vendors.
 *     1. Natural compare of the `name`.
 *  1. If the `BoardListItem`s do not have a `board` property, `BoardListItem#port#address` natural compare is the fallback.
 */
function boardListItemComparator(
  left: BoardListItem,
  right: BoardListItem
): number {
  // sort by port protocol
  let result = portProtocolComparator(left.port, right.port);
  if (result) {
    return result;
  }

  // compare by board
  result = boardIdentifierComparator(
    getBoardOrInferredBoard(left),
    getBoardOrInferredBoard(right)
  );
  if (result) {
    return result;
  }

  // fallback compare based on the address
  return naturalCompare(left.port.address, right.port.address);
}

/**
 * A list of boards discovered by the Arduino CLI. With the `board list --watch` gRPC equivalent command,
 * the CLI provides a `1..*` mapping between a port and the matching boards list. This type inverts the mapping
 * and makes a `1..1` association between a board identifier and the port it belongs to.
 */
export type BoardList<T extends BoardListItem = BoardListItem> =
  readonly T[] & {
    /**
     * A snapshot of the board and port configuration this board list has been initialized with.
     */
    readonly boardsConfig: Readonly<BoardsConfig>;

    /**
     * Index of the board+port item that is currently "selected". A board list item is selected, if matches the board+port combination of `boardsConfig`.
     */
    get selectedIndex(): number;

    /**
     * Contains all boards recognized from the detected port, and an optional unrecognized one that is derived from the detected port and the `initParam#selectedBoard`.
     */
    get boards(): readonly (BoardListItemWithBoard | InferredBoardListItem)[];

    /**
     * If `predicate` is not defined, no ports are filtered.
     */
    ports(
      predicate?: (detectedPort: DetectedPort) => boolean
    ): readonly DetectedPort[] & Readonly<{ matchingIndex: number }>;

    portsGroupedByProtocol(): Readonly<
      Record<'serial' | 'network' | string, ReturnType<BoardList['ports']>>
    >;

    toString(): string;
  };

export function createBoardList(
  detectedPorts: DetectedPorts,
  boardsConfig: Readonly<BoardsConfig> = emptyBoardsConfig(),
  boardListHistory: BoardListHistory = {}
): BoardList {
  const items: BoardListItem[] = [];
  for (const detectedPort of Object.values(detectedPorts)) {
    const { port, boards } = detectedPort;
    const portKey = Port.keyOf(port);
    const inferredBoard = boardListHistory[portKey];
    if (!boards?.length) {
      // Infer unrecognized boards from the history
      if (inferredBoard) {
        const item: InferredBoardListItem = {
          port,
          inferredBoard,
          type: 'board-select',
        };
        items.push(item);
      } else {
        items.push({ port });
      }
    } else {
      // Otherwise, include the port for each board.
      for (const board of boards) {
        const { fqbn, name } = board;
        if (
          isBoardIdentifier(board) &&
          isBoardIdentifier(inferredBoard) &&
          !boardIdentifierEquals(board, inferredBoard)
        ) {
          const inferredItem: InferredBoardListItem = {
            inferredBoard,
            port,
            type: 'board-overridden',
            board,
          };
          items.push(inferredItem);
        } else {
          items.push({ port, board: { fqbn, name } });
        }
      }
    }
  }
  items.sort(boardListItemComparator);
  const length = items.length;
  const findSelectedIndex = (): number => {
    if (!isDefinedBoardsConfig(boardsConfig)) {
      return -1;
    }
    const { selectedPort, selectedBoard } = boardsConfig;
    const portKey = Port.keyOf(selectedPort);
    // find the exact match of the board and port combination
    for (let index = 0; index < length; index++) {
      const item = items[index];
      const { board, port } = item;
      if (!board) {
        continue;
      }
      if (
        Port.keyOf(port) === portKey &&
        boardIdentifierEquals(board, selectedBoard)
      ) {
        return index;
      }
    }
    // find match from inferred board
    for (let index = 0; index < length; index++) {
      const item = items[index];
      if (!isInferredBoardListItem(item)) {
        continue;
      }
      const { inferredBoard, port } = item;
      if (
        Port.keyOf(port) === portKey &&
        boardIdentifierEquals(inferredBoard, boardsConfig.selectedBoard)
      ) {
        return index;
      }
    }
    return -1;
  };

  let _selectedIndex: number | undefined;
  let _allPorts: DetectedPort[] | undefined;
  const ports = (
    predicate: (detectedPort: DetectedPort) => boolean = () => true
  ) => {
    if (!_allPorts) {
      _allPorts = [];
      // to keep the order or the detected ports
      const visitedPortKeys = new Set<string>();
      for (let i = 0; i < length; i++) {
        const { port } = items[i];
        const portKey = Port.keyOf(port);
        if (!visitedPortKeys.has(portKey)) {
          visitedPortKeys.add(portKey);
          const detectedPort = detectedPorts[portKey];
          if (detectedPort) {
            _allPorts.push(detectedPort);
          }
        }
      }
    }
    const ports = _allPorts.filter(predicate);
    const matchingIndex = findMatchingPortIndex(
      boardsConfig.selectedPort,
      ports
    );
    return Object.assign(ports, { matchingIndex });
  };
  const selectedIndexMemoized = () => {
    if (typeof _selectedIndex !== 'number') {
      _selectedIndex = findSelectedIndex();
    }
    return _selectedIndex;
  };

  let _boards: (BoardListItemWithBoard | InferredBoardListItem)[] | undefined;
  const boardList: BoardList = Object.assign(items, {
    boardsConfig,
    get selectedIndex() {
      return selectedIndexMemoized();
    },
    get boards() {
      if (!_boards) {
        _boards = [];
        for (let i = 0; i < length; i++) {
          const item = items[i];
          if (isInferredBoardListItem(item)) {
            _boards.push(item);
          } else if (item.board?.fqbn) {
            _boards.push(<Required<BoardListItem>>item);
          }
        }
      }
      return _boards;
    },
    ports(predicate?: (detectedPort: DetectedPort) => boolean) {
      return ports(predicate);
    },
    portsGroupedByProtocol() {
      const result: Record<string, DetectedPort[] & { matchingIndex: number }> =
        {};
      const allPorts = ports();
      for (const detectedPort of allPorts) {
        const protocol = detectedPort.port.protocol;
        if (!result[protocol]) {
          result[protocol] = Object.assign([], {
            matchingIndex: -1,
          });
        }
        const portsOnProtocol = result[protocol];
        portsOnProtocol.push(detectedPort);
      }
      const matchItem = allPorts[allPorts.matchingIndex];
      // match index is per all ports, IDE2 needs to adjust it per protocol
      if (matchItem) {
        const matchProtocol = matchItem.port.protocol;
        const matchPorts = result[matchProtocol];
        matchPorts.matchingIndex = matchPorts.indexOf(matchItem);
      }
      return result;
    },
    toString() {
      const selectedIndex = selectedIndexMemoized();
      return JSON.stringify(
        {
          detectedPorts,
          boardsConfig,
          items,
          selectedIndex,
          boardListHistory,
        },
        null,
        2
      );
    },
  });
  return boardList;
}
