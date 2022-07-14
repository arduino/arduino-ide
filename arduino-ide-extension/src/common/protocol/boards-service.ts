import { naturalCompare } from './../utils';
import { Searchable } from './searchable';
import { Installable } from './installable';
import { ArduinoComponent } from './arduino-component';

export type AvailablePorts = Record<string, [Port, Array<Board>]>;
export namespace AvailablePorts {
  export function byProtocol(
    availablePorts: AvailablePorts
  ): Map<string, AvailablePorts> {
    const grouped = new Map<string, AvailablePorts>();
    for (const portID of Object.keys(availablePorts)) {
      const [port, boards] = availablePorts[portID];
      let ports = grouped.get(port.protocol);
      if (!ports) {
        ports = {} as AvailablePorts;
      }
      ports[portID] = [port, boards];
      grouped.set(port.protocol, ports);
    }
    return grouped;
  }
}

export interface AttachedBoardsChangeEvent {
  readonly oldState: Readonly<{ boards: Board[]; ports: Port[] }>;
  readonly newState: Readonly<{ boards: Board[]; ports: Port[] }>;
}
export namespace AttachedBoardsChangeEvent {
  export function isEmpty(event: AttachedBoardsChangeEvent): boolean {
    const { detached, attached } = diff(event);
    return (
      !!detached.boards.length &&
      !!detached.ports.length &&
      !!attached.boards.length &&
      !!attached.ports.length
    );
  }

  export function toString(event: AttachedBoardsChangeEvent): string {
    const rows: string[] = [];
    if (!isEmpty(event)) {
      const { attached, detached } = diff(event);
      const visitedAttachedPorts: Port[] = [];
      const visitedDetachedPorts: Port[] = [];
      for (const board of attached.boards) {
        const port = board.port ? ` on ${Port.toString(board.port)}` : '';
        rows.push(` - Attached board: ${Board.toString(board)}${port}`);
        if (board.port) {
          visitedAttachedPorts.push(board.port);
        }
      }
      for (const board of detached.boards) {
        const port = board.port ? ` from ${Port.toString(board.port)}` : '';
        rows.push(` - Detached board: ${Board.toString(board)}${port}`);
        if (board.port) {
          visitedDetachedPorts.push(board.port);
        }
      }
      for (const port of attached.ports) {
        if (!visitedAttachedPorts.find((p) => Port.sameAs(port, p))) {
          rows.push(` - New port is available on ${Port.toString(port)}`);
        }
      }
      for (const port of detached.ports) {
        if (!visitedDetachedPorts.find((p) => Port.sameAs(port, p))) {
          rows.push(` - Port is no longer available on ${Port.toString(port)}`);
        }
      }
    }
    return rows.length ? rows.join('\n') : 'No changes.';
  }

  export function diff(event: AttachedBoardsChangeEvent): Readonly<{
    attached: {
      boards: Board[];
      ports: Port[];
    };
    detached: {
      boards: Board[];
      ports: Port[];
    };
  }> {
    // In `lefts` AND not in `rights`.
    const diff = <T>(
      lefts: T[],
      rights: T[],
      sameAs: (left: T, right: T) => boolean
    ) => {
      return lefts.filter(
        (left) => rights.findIndex((right) => sameAs(left, right)) === -1
      );
    };
    const { boards: newBoards } = event.newState;
    const { boards: oldBoards } = event.oldState;
    const { ports: newPorts } = event.newState;
    const { ports: oldPorts } = event.oldState;
    const boardSameAs = (left: Board, right: Board) =>
      Board.sameAs(left, right);
    const portSameAs = (left: Port, right: Port) => Port.sameAs(left, right);
    return {
      detached: {
        boards: diff(oldBoards, newBoards, boardSameAs),
        ports: diff(oldPorts, newPorts, portSameAs),
      },
      attached: {
        boards: diff(newBoards, oldBoards, boardSameAs),
        ports: diff(newPorts, oldPorts, portSameAs),
      },
    };
  }
}

export const BoardsServicePath = '/services/boards-service';
export const BoardsService = Symbol('BoardsService');
export interface BoardsService
  extends Installable<BoardsPackage>,
    Searchable<BoardsPackage> {
  /**
   * Deprecated. `getState` should be used to correctly map a board with a port.
   * @deprecated
   */
  getAttachedBoards(): Promise<Board[]>;
  /**
   * Deprecated. `getState` should be used to correctly map a board with a port.
   * @deprecated
   */
  getAvailablePorts(): Promise<Port[]>;
  getState(): Promise<AvailablePorts>;
  getBoardDetails(options: { fqbn: string }): Promise<BoardDetails | undefined>;
  getBoardPackage(options: { id: string }): Promise<BoardsPackage | undefined>;
  getContainerBoardPackage(options: {
    fqbn: string;
  }): Promise<BoardsPackage | undefined>;
  searchBoards({ query }: { query?: string }): Promise<BoardWithPackage[]>;
  getBoardUserFields(options: {
    fqbn: string;
    protocol: string;
  }): Promise<BoardUserField[]>;
}

export interface Port {
  // id is the combination of address and protocol
  // formatted like "<address>|<protocol>" used
  // to univocally recognize a port
  readonly id: string;
  readonly address: string;
  readonly addressLabel: string;
  readonly protocol: string;
  readonly protocolLabel: string;
}
export namespace Port {
  export function is(arg: any): arg is Port {
    return (
      !!arg &&
      'address' in arg &&
      typeof arg['address'] === 'string' &&
      'protocol' in arg &&
      typeof arg['protocol'] === 'string'
    );
  }

  export function toString(port: Port): string {
    return `${port.addressLabel} ${port.protocolLabel}`;
  }

  export function compare(left: Port, right: Port): number {
    // Ports must be sorted in this order:
    // 1. Serial
    // 2. Network
    // 3. Other protocols
    if (left.protocol === 'serial' && right.protocol !== 'serial') {
      return -1;
    } else if (left.protocol !== 'serial' && right.protocol === 'serial') {
      return 1;
    } else if (left.protocol === 'network' && right.protocol !== 'network') {
      return -1;
    } else if (left.protocol !== 'network' && right.protocol === 'network') {
      return 1;
    }
    return naturalCompare(left.address!, right.address!);
  }

  export function sameAs(
    left: Port | undefined,
    right: Port | undefined
  ): boolean {
    if (left && right) {
      return left.address === right.address && left.protocol === right.protocol;
    }
    return false;
  }
}

export interface BoardsPackage extends ArduinoComponent {
  readonly id: string;
  readonly boards: Board[];
}
export namespace BoardsPackage {
  export function equals(left: BoardsPackage, right: BoardsPackage): boolean {
    return left.id === right.id;
  }

  export function contains(
    selectedBoard: Board,
    { id, boards }: BoardsPackage
  ): boolean {
    if (boards.some((board) => Board.sameAs(board, selectedBoard))) {
      return true;
    }
    if (selectedBoard.fqbn) {
      const [platform, architecture] = selectedBoard.fqbn.split(':');
      if (platform && architecture) {
        return `${platform}:${architecture}` === id;
      }
    }
    return false;
  }
}

export interface Board {
  readonly name: string;
  readonly fqbn?: string;
  readonly port?: Port;
}

export interface BoardUserField {
  readonly toolId: string;
  readonly name: string;
  readonly label: string;
  readonly secret: boolean;
  value: string;
}

export interface BoardWithPackage extends Board {
  readonly packageName: string;
  readonly packageId: string;
  readonly manuallyInstalled: boolean;
}
export namespace BoardWithPackage {
  export function is(
    board: Board & Partial<{ packageName: string; packageId: string }>
  ): board is BoardWithPackage {
    return !!board.packageId && !!board.packageName;
  }
}

export interface InstalledBoardWithPackage extends BoardWithPackage {
  readonly fqbn: string;
}
export namespace InstalledBoardWithPackage {
  export function is(
    boardWithPackage: BoardWithPackage
  ): boardWithPackage is InstalledBoardWithPackage {
    return !!boardWithPackage.fqbn;
  }
}

export interface BoardDetails {
  readonly fqbn: string;
  readonly requiredTools: Tool[];
  readonly configOptions: ConfigOption[];
  readonly programmers: Programmer[];
  readonly debuggingSupported: boolean;
  readonly VID: string;
  readonly PID: string;
}

export interface Tool {
  readonly packager: string;
  readonly name: string;
  readonly version: Installable.Version;
}

export interface ConfigOption {
  readonly option: string;
  readonly label: string;
  readonly values: ConfigValue[];
}
export namespace ConfigOption {
  export function is(arg: any): arg is ConfigOption {
    return (
      !!arg &&
      'option' in arg &&
      'label' in arg &&
      'values' in arg &&
      typeof arg['option'] === 'string' &&
      typeof arg['label'] === 'string' &&
      Array.isArray(arg['values'])
    );
  }

  /**
   * Appends the configuration options to the `fqbn` argument.
   * Throws an error if the `fqbn` does not have the `segment(':'segment)*` format.
   * The provided output format is always segment(':'segment)*(':'option'='value(','option'='value)*)?
   */
  export function decorate(
    fqbn: string,
    configOptions: ConfigOption[]
  ): string {
    if (!configOptions.length) {
      return fqbn;
    }

    const toValue = (values: ConfigValue[]) => {
      const selectedValue = values.find(({ selected }) => selected);
      if (!selectedValue) {
        console.warn(
          `None of the config values was selected. Values were: ${JSON.stringify(
            values
          )}`
        );
        return undefined;
      }
      return selectedValue.value;
    };
    const options = configOptions
      .map(({ option, values }) => [option, toValue(values)])
      .filter(([, value]) => !!value)
      .map(([option, value]) => `${option}=${value}`)
      .join(',');

    return `${fqbn}:${options}`;
  }

  export class ConfigOptionError extends Error {
    constructor(message: string) {
      super(message);
      Object.setPrototypeOf(this, ConfigOptionError.prototype);
    }
  }

  export const LABEL_COMPARATOR = (left: ConfigOption, right: ConfigOption) =>
    naturalCompare(
      left.label.toLocaleLowerCase(),
      right.label.toLocaleLowerCase()
    );
}

export interface ConfigValue {
  readonly label: string;
  readonly value: string;
  readonly selected: boolean;
}

export interface Programmer {
  readonly name: string;
  readonly platform: string;
  readonly id: string;
}
export namespace Programmer {
  export function equals(
    left: Programmer | undefined,
    right: Programmer | undefined
  ): boolean {
    if (!left) {
      return !right;
    }
    if (!right) {
      return !left;
    }
    return (
      left.id === right.id &&
      left.name === right.name &&
      left.platform === right.platform
    );
  }
}

export namespace Board {
  export function is(board: any): board is Board {
    return !!board && 'name' in board;
  }

  export function equals(left: Board, right: Board): boolean {
    return left.name === right.name && left.fqbn === right.fqbn;
  }

  export function sameAs(left: Board, right: string | Board): boolean {
    // How to associate a selected board with one of the available cores: https://typefox.slack.com/archives/CJJHJCJSJ/p1571142327059200
    // 1. How to use the FQBN if any and infer the package ID from it: https://typefox.slack.com/archives/CJJHJCJSJ/p1571147549069100
    // 2. How to trim the `/Genuino` from the name: https://arduino.slack.com/archives/CJJHJCJSJ/p1571146951066800?thread_ts=1571142327.059200&cid=CJJHJCJSJ
    const other = typeof right === 'string' ? { name: right } : right;
    if (left.fqbn && other.fqbn) {
      return left.fqbn === other.fqbn;
    }
    return (
      left.name.replace('/Genuino', '') === other.name.replace('/Genuino', '')
    );
  }

  export function compare(left: Board, right: Board): number {
    let result = naturalCompare(left.name, right.name);
    if (result === 0) {
      result = naturalCompare(left.fqbn || '', right.fqbn || '');
    }
    return result;
  }

  export function installed(board: Board): boolean {
    return !!board.fqbn;
  }

  export function toString(
    board: Board,
    options: { useFqbn: boolean } = { useFqbn: true }
  ): string {
    const fqbn =
      options && options.useFqbn && board.fqbn ? ` [${board.fqbn}]` : '';
    return `${board.name}${fqbn}`;
  }

  export type Detailed = Board &
    Readonly<{
      selected: boolean;
      missing: boolean;
      packageName: string;
      packageId: string;
      details?: string;
      manuallyInstalled: boolean;
    }>;
  export function decorateBoards(
    selectedBoard: Board | undefined,
    boards: Array<BoardWithPackage>
  ): Array<Detailed> {
    // Board names are not unique. We show the corresponding core name as a detail.
    // https://github.com/arduino/arduino-cli/pull/294#issuecomment-513764948
    const distinctBoardNames = new Map<string, number>();
    for (const { name } of boards) {
      const counter = distinctBoardNames.get(name) || 0;
      distinctBoardNames.set(name, counter + 1);
    }

    // Due to the non-unique board names, we have to check the package name as well.
    const selected = (board: BoardWithPackage) => {
      if (!!selectedBoard) {
        if (Board.equals(board, selectedBoard)) {
          if ('packageName' in selectedBoard) {
            return board.packageName === (selectedBoard as any).packageName;
          }
          if ('packageId' in selectedBoard) {
            return board.packageId === (selectedBoard as any).packageId;
          }
          return true;
        }
      }
      return false;
    };
    return boards.map((board) => ({
      ...board,
      details:
        (distinctBoardNames.get(board.name) || 0) > 1
          ? ` - ${board.packageName}`
          : undefined,
      selected: selected(board),
      missing: !installed(board),
    }));
  }
}
