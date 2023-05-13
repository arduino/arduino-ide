import { naturalCompare } from './../utils';
import { Searchable } from './searchable';
import { Installable } from './installable';
import { ArduinoComponent } from './arduino-component';
import { nls } from '@theia/core/lib/common/nls';
import {
  All,
  Contributed,
  Partner,
  Type as TypeLabel,
  Updatable,
} from '../nls';
import URI from '@theia/core/lib/common/uri';
import { MaybePromise } from '@theia/core/lib/common/types';

export type AvailablePorts = Record<string, [Port, Array<Board>]>;
export namespace AvailablePorts {
  export function groupByProtocol(
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
  export function split(
    state: AvailablePorts
  ): Readonly<{ boards: Board[]; ports: Port[] }> {
    const availablePorts: Port[] = [];
    const attachedBoards: Board[] = [];
    for (const key of Object.keys(state)) {
      const [port, boards] = state[key];
      availablePorts.push(port);
      attachedBoards.push(...boards);
    }
    return {
      boards: attachedBoards,
      ports: availablePorts,
    };
  }
}

export interface AttachedBoardsChangeEvent {
  readonly oldState: Readonly<{ boards: Board[]; ports: Port[] }>;
  readonly newState: Readonly<{ boards: Board[]; ports: Port[] }>;
  readonly uploadInProgress: boolean;
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
    Searchable<BoardsPackage, BoardSearch> {
  install(options: {
    item: BoardsPackage;
    progressId?: string;
    version?: Installable.Version;
    noOverwrite?: boolean;
    /**
     * Only for testing to avoid confirmation dialogs from Windows User Access Control when installing a platform.
     */
    skipPostInstall?: boolean;
  }): Promise<void>;
  getState(): Promise<AvailablePorts>;
  getBoardDetails(options: { fqbn: string }): Promise<BoardDetails | undefined>;
  getBoardPackage(options: { id: string }): Promise<BoardsPackage | undefined>;
  getContainerBoardPackage(options: {
    fqbn: string;
  }): Promise<BoardsPackage | undefined>;
  searchBoards({ query }: { query?: string }): Promise<BoardWithPackage[]>;
  getInstalledBoards(): Promise<BoardWithPackage[]>;
  getBoardUserFields(options: {
    fqbn: string;
    protocol: string;
  }): Promise<BoardUserField[]>;
}

export interface BoardSearch extends Searchable.Options {
  readonly type?: BoardSearch.Type;
}
export namespace BoardSearch {
  export const Default: BoardSearch = { type: 'All' };
  export const TypeLiterals = [
    'All',
    'Updatable',
    'Arduino',
    'Contributed',
    'Arduino Certified',
    'Partner',
    'Arduino@Heart',
  ] as const;
  export type Type = typeof TypeLiterals[number];
  export namespace Type {
    export function is(arg: unknown): arg is Type {
      return typeof arg === 'string' && TypeLiterals.includes(arg as Type);
    }
  }
  export const TypeLabels: Record<Type, string> = {
    All: All,
    Updatable: Updatable,
    Arduino: 'Arduino',
    Contributed: Contributed,
    'Arduino Certified': nls.localize(
      'arduino/boardsType/arduinoCertified',
      'Arduino Certified'
    ),
    Partner: Partner,
    'Arduino@Heart': 'Arduino@Heart',
  };
  export const PropertyLabels: Record<
    keyof Omit<BoardSearch, 'query'>,
    string
  > = {
    type: TypeLabel,
  };
  export namespace UriParser {
    export const authority = 'boardsmanager';
    export function parse(uri: URI): BoardSearch | undefined {
      if (uri.scheme !== 'http') {
        throw new Error(
          `Invalid 'scheme'. Expected 'http'. URI was: ${uri.toString()}.`
        );
      }
      if (uri.authority !== authority) {
        throw new Error(
          `Invalid 'authority'. Expected: '${authority}'. URI was: ${uri.toString()}.`
        );
      }
      const segments = Searchable.UriParser.normalizedSegmentsOf(uri);
      if (segments.length !== 1) {
        return undefined;
      }
      let searchOptions: BoardSearch | undefined = undefined;
      const [type] = segments;
      if (!type) {
        searchOptions = BoardSearch.Default;
      } else if (BoardSearch.Type.is(type)) {
        searchOptions = { type };
      }
      if (searchOptions) {
        return {
          ...searchOptions,
          ...Searchable.UriParser.parseQuery(uri),
        };
      }
      return undefined;
    }
  }
}

export interface Port {
  readonly address: string;
  readonly addressLabel: string;
  readonly protocol: string;
  readonly protocolLabel: string;
  readonly properties?: Record<string, string>;
  readonly hardwareId?: string;
}
export namespace Port {
  export type Properties = Record<string, string>;
  export namespace Properties {
    export function create(
      properties: [string, string][] | undefined
    ): Properties {
      if (!properties) {
        return {};
      }
      return properties.reduce((acc, curr) => {
        const [key, value] = curr;
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
    }
  }
  export function is(arg: unknown): arg is Port {
    if (typeof arg === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const object = arg as any;
      return (
        'address' in object &&
        typeof object['address'] === 'string' &&
        'addressLabel' in object &&
        typeof object['addressLabel'] === 'string' &&
        'protocol' in object &&
        typeof object['protocol'] === 'string' &&
        'protocolLabel' in object &&
        typeof object['protocolLabel'] === 'string'
      );
    }
    return false;
  }

  /**
   * Key is the combination of address and protocol formatted like `'${address}|${protocol}'` used to uniquely identify a port.
   */
  export function keyOf({ address, protocol }: Port): string {
    return `${address}|${protocol}`;
  }

  export function toString({ addressLabel, protocolLabel }: Port): string {
    return `${addressLabel} ${protocolLabel}`;
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
  // See https://github.com/arduino/arduino-ide/commit/79ea0fa9a6ad2b01eaac22cef2f494d3b68284e6#diff-fb37f20bea00881acee3aafddb1ecefcecf41ce59845ca1510da79e918ee0837L338-L348
  // See https://github.com/arduino/arduino-ide/commit/79ea0fa9a6ad2b01eaac22cef2f494d3b68284e6#diff-e42c82bb67e277cfa4598239952afd65db44dba55dc7d68df619dfccfa648279L441-L455
  // See https://github.com/arduino/arduino-ide/commit/74bfdc4c56d7a1577a4e800a378c21b82c1da5f8#diff-e42c82bb67e277cfa4598239952afd65db44dba55dc7d68df619dfccfa648279L405-R424
  /**
   * All ports with `'serial'` or `'network'` `protocol`, or any other port `protocol` that has at least one recognized board connected to.
   */
  export function visiblePorts(
    boardsHaystack: ReadonlyArray<Board>
  ): (port: Port) => boolean {
    return (port: Port) => {
      if (port.protocol === 'serial' || port.protocol === 'network') {
        // Allow all `serial` and `network` boards.
        // IDE2 must support better label for unrecognized `network` boards: https://github.com/arduino/arduino-ide/issues/1331
        return true;
      }
      // All other ports with different protocol are
      // only shown if there is a recognized board
      // connected
      for (const board of boardsHaystack) {
        if (board.port?.address === port.address) {
          return true;
        }
      }
      return false;
    };
  }

  export namespace Protocols {
    export const KnownProtocolLiterals = ['serial', 'network'] as const;
    export type KnownProtocol = typeof KnownProtocolLiterals[number];
    export namespace KnownProtocol {
      export function is(protocol: unknown): protocol is KnownProtocol {
        return (
          typeof protocol === 'string' &&
          KnownProtocolLiterals.indexOf(protocol as KnownProtocol) >= 0
        );
      }
    }
    export const ProtocolLabels: Record<KnownProtocol, string> = {
      serial: nls.localize('arduino/portProtocol/serial', 'Serial'),
      network: nls.localize('arduino/portProtocol/network', 'Network'),
    };
    export function protocolLabel(protocol: string): string {
      if (KnownProtocol.is(protocol)) {
        return ProtocolLabels[protocol];
      }
      return protocol;
    }
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
  readonly buildProperties: string[];
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

  export function hardwareIdEquals(left: Board, right: Board): boolean {
    if (left.port && right.port) {
      const { hardwareId: leftHardwareId } = left.port;
      const { hardwareId: rightHardwareId } = right.port;

      if (leftHardwareId && rightHardwareId) {
        return leftHardwareId === rightHardwareId;
      }
    }

    return false;
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

/**
 * Throws an error if the `fqbn` argument is not sanitized. A sanitized FQBN has the `VENDOR:ARCHITECTURE:BOARD_ID` construct.
 */
export function assertSanitizedFqbn(fqbn: string): void {
  if (fqbn.split(':').length !== 3) {
    throw new Error(
      `Expected a sanitized FQBN with three segments in the following format: 'VENDOR:ARCHITECTURE:BOARD_ID'. Got ${fqbn} instead.`
    );
  }
}

/**
 * Converts the `VENDOR:ARCHITECTURE:BOARD_ID[:MENU_ID=OPTION_ID[,MENU2_ID=OPTION_ID ...]]` FQBN to
 * `VENDOR:ARCHITECTURE:BOARD_ID` format.
 * See the details of the `{build.fqbn}` entry in the [specs](https://arduino.github.io/arduino-cli/latest/platform-specification/#global-predefined-properties).
 */
export function sanitizeFqbn(fqbn: string | undefined): string | undefined {
  if (!fqbn) {
    return undefined;
  }
  const [vendor, arch, id] = fqbn.split(':');
  return `${vendor}:${arch}:${id}`;
}

export interface BoardConfig {
  selectedBoard?: Board;
  selectedPort?: Port;
}

export interface BoardInfo {
  /**
   * Board name. Could be `'Unknown board`'.
   */
  BN: string;
  /**
   * Vendor ID.
   */
  VID: string;
  /**
   * Product ID.
   */
  PID: string;
  /**
   * Serial number.
   */
  SN: string;
}

export const selectPortForInfo = nls.localize(
  'arduino/board/selectPortForInfo',
  'Please select a port to obtain board info.'
);
export const nonSerialPort = nls.localize(
  'arduino/board/nonSerialPort',
  "Non-serial port, can't obtain info."
);
export const noNativeSerialPort = nls.localize(
  'arduino/board/noNativeSerialPort',
  "Native serial port, can't obtain info."
);
export const unknownBoard = nls.localize(
  'arduino/board/unknownBoard',
  'Unknown board'
);

/**
 * The returned promise resolves to a `BoardInfo` if available to show in the UI or an info message explaining why showing the board info is not possible.
 */
export async function getBoardInfo(
  selectedPort: Port | undefined,
  availablePorts: MaybePromise<AvailablePorts>
): Promise<BoardInfo | string> {
  if (!selectedPort) {
    return selectPortForInfo;
  }
  // IDE2 must show the board info based on the selected port.
  // https://github.com/arduino/arduino-ide/issues/1489
  // IDE 1.x supports only serial port protocol
  if (selectedPort.protocol !== 'serial') {
    return nonSerialPort;
  }
  const selectedPortKey = Port.keyOf(selectedPort);
  const state = await availablePorts;
  const boardListOnSelectedPort = Object.entries(state).filter(
    ([portKey, [port]]) =>
      portKey === selectedPortKey && isNonNativeSerial(port)
  );

  if (!boardListOnSelectedPort.length) {
    return noNativeSerialPort;
  }

  const [, [port, boards]] = boardListOnSelectedPort[0];
  if (boardListOnSelectedPort.length > 1 || boards.length > 1) {
    console.warn(
      `Detected more than one available boards on the selected port : ${JSON.stringify(
        selectedPort
      )}. Detected boards were: ${JSON.stringify(
        boardListOnSelectedPort
      )}. Using the first one: ${JSON.stringify([port, boards])}`
    );
  }

  const board = boards[0];
  const BN = board?.name ?? unknownBoard;
  const VID = readProperty('vid', port);
  const PID = readProperty('pid', port);
  const SN = readProperty('serialNumber', port);
  return { VID, PID, SN, BN };
}

// serial protocol with one or many detected boards or available VID+PID properties from the port
function isNonNativeSerial(port: Port): boolean {
  return !!(
    port.protocol === 'serial' &&
    port.properties?.['vid'] &&
    port.properties?.['pid']
  );
}

function readProperty(property: string, port: Port): string {
  return falsyToNullString(port.properties?.[property]);
}

function falsyToNullString(s: string | undefined): string {
  return !!s ? s : '(null)';
}
