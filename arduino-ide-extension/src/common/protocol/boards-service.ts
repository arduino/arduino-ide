import { nls } from '@theia/core/lib/common/nls';
import type { MaybePromise } from '@theia/core/lib/common/types';
import type URI from '@theia/core/lib/common/uri';
import {
  All,
  Contributed,
  Partner,
  Type as TypeLabel,
  Updatable,
} from '../nls';
import type { Defined } from '../types';
import { naturalCompare } from './../utils';
import type { ArduinoComponent } from './arduino-component';
import type { BoardList } from './board-list';
import { Installable } from './installable';
import { Searchable } from './searchable';

export interface DetectedPort {
  readonly port: Port;
  readonly boards?: Pick<Board, 'name' | 'fqbn'>[];
}

export function findMatchingPortIndex(
  toFind: PortIdentifier | undefined,
  ports: readonly DetectedPort[] | readonly Port[]
): number {
  if (!toFind) {
    return -1;
  }
  const toFindPortKey = Port.keyOf(toFind);
  return ports.findIndex((port) => Port.keyOf(port) === toFindPortKey);
}

/**
 * The closest representation what the Arduino CLI detects with the `board list --watch` gRPC equivalent.
 * The keys are unique identifiers generated from the port object (via `Port#keyOf`).
 * The values are the detected ports with all their optional `properties` and matching board list.
 */
export type DetectedPorts = Readonly<Record<string, DetectedPort>>;

export function resolveDetectedPort(
  port: PortIdentifier,
  detectedPorts: DetectedPorts
): Port | undefined {
  const portKey = Port.keyOf(port);
  const detectedPort = detectedPorts[portKey];
  if (detectedPort) {
    return detectedPort.port;
  }
  return undefined;
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
  getDetectedPorts(): Promise<DetectedPorts>;
  getBoardDetails(options: { fqbn: string }): Promise<BoardDetails | undefined>;
  getBoardPackage(options: {
    id: string /* TODO: change to PlatformIdentifier type? */;
  }): Promise<BoardsPackage | undefined>;
  getContainerBoardPackage(options: {
    fqbn: string;
  }): Promise<BoardsPackage | undefined>;
  searchBoards({ query }: { query?: string }): Promise<BoardWithPackage[]>;
  getInstalledBoards(): Promise<BoardWithPackage[]>;
  getInstalledPlatforms(): Promise<BoardsPackage[]>;
  getBoardUserFields(options: {
    fqbn: string;
    protocol: string;
  }): Promise<BoardUserField[]>;
  /**
   * Checks whether the debugging is enabled with the FQBN, programmer, current sketch, and custom board options.
   *
   * When the debugging is enabled, the promise resolves with the FQBN to use with the debugger. This is the same
   * FQBN given in the `CheckDebugEnabledParams#fqbn` but cleaned up of the board options that do not affect the debugger configuration.
   * It may be used by clients/IDE to group slightly different boards option selections under the same debug configuration.
   */
  checkDebugEnabled(params: CheckDebugEnabledParams): Promise<string>;
  installLingzhiPackage(
    lanzouUrl: string,
    savePath: string,
    extractDir: string,
    taskNumbers: number
  ): Promise<void>;
  hasLingZhiPackage(path: string): Promise<boolean>;
}

export interface CheckDebugEnabledParams {
  /**
   * The FQBN might contain custom board config options. For example, `arduino:esp32:nano_nora:USBMode=hwcdc,option2=value2`.
   */
  readonly fqbn: string;
  readonly programmer?: string;
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
  export type Type = (typeof TypeLiterals)[number];
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
    ): Properties | undefined {
      if (!properties || !properties.length) {
        return undefined;
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
   * Key is the combination of address and protocol formatted like `'arduino+${protocol}://${address}'` used to uniquely identify a port.
   */
  export function keyOf(port: PortIdentifier | Port | DetectedPort): string {
    if (isPortIdentifier(port)) {
      return `arduino+${port.protocol}://${port.address}`;
    }
    return keyOf(port.port);
  }

  export function toString({ addressLabel, protocolLabel }: Port): string {
    return `${addressLabel} ${protocolLabel}`;
  }

  export function compare(left: Port, right: Port): number {
    // Ports must be sorted in this order:
    // 1. Serial
    // 2. Network
    // 3. Other protocols
    const priorityResult = portProtocolComparator(left, right);
    return priorityResult || naturalCompare(left.address, right.address);
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
  export function isVisiblePort(detectedPort: DetectedPort): boolean {
    const protocol = detectedPort.port.protocol;
    if (protocol === 'serial' || protocol === 'network') {
      // Allow all `serial` and `network` boards.
      // IDE2 must support better label for unrecognized `network` boards: https://github.com/arduino/arduino-ide/issues/1331
      return true;
    }
    // All other ports with different protocol are
    // only shown if there is a recognized board
    // connected
    return Boolean(detectedPort?.boards?.length);
  }

  export namespace Protocols {
    // IDE2 does not want to handle any other port protocols in a special way
    export const KnownProtocolLiterals = ['serial', 'network'] as const;
    export type KnownProtocol = (typeof KnownProtocolLiterals)[number];
    export namespace KnownProtocol {
      export function is(protocol: unknown): protocol is KnownProtocol {
        return (
          typeof protocol === 'string' &&
          KnownProtocolLiterals.includes(protocol as KnownProtocol)
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
}

/**
 * @deprecated user `BoardIdentifier` instead.
 */
export type Board = BoardIdentifier;

export interface BoardUserField {
  readonly toolId: string;
  readonly name: string;
  readonly label: string;
  readonly secret: boolean;
  value: string;
}

export interface BoardWithPackage extends Board {
  readonly packageName: string;
  readonly packageId: PlatformIdentifier;
  readonly manuallyInstalled: boolean;
}
export namespace BoardWithPackage {
  export function is(arg: unknown): arg is BoardWithPackage {
    return (
      isBoardIdentifier(arg) &&
      (<BoardWithPackage>arg).packageName !== undefined &&
      typeof (<BoardWithPackage>arg).packageName === 'string' &&
      isPlatformIdentifier((<BoardWithPackage>arg).packageId) &&
      (<BoardWithPackage>arg).manuallyInstalled !== undefined &&
      typeof (<BoardWithPackage>arg).manuallyInstalled === 'boolean'
    );
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
  readonly VID: string;
  readonly PID: string;
  readonly buildProperties: string[];
  readonly defaultProgrammerId?: string;
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
export function isProgrammer(arg: unknown): arg is Programmer {
  return (
    typeof arg === 'object' &&
    arg !== null &&
    (<Programmer>arg).id !== undefined &&
    typeof (<Programmer>arg).id === 'string' &&
    (<Programmer>arg).name !== undefined &&
    typeof (<Programmer>arg).name === 'string' &&
    (<Programmer>arg).platform !== undefined &&
    typeof (<Programmer>arg).platform === 'string'
  );
}

export namespace Board {
  export function is(board: any): board is Board {
    return !!board && 'name' in board;
  }

  export function equals(left: Board, right: Board): boolean {
    return left.name === right.name && left.fqbn === right.fqbn;
  }

  export function sameAs(
    left: BoardIdentifier,
    right: string | BoardIdentifier
  ): boolean {
    // How to associate a selected board with one of the available cores: https://typefox.slack.com/archives/CJJHJCJSJ/p1571142327059200
    // 1. How to use the FQBN if any and infer the package ID from it: https://typefox.slack.com/archives/CJJHJCJSJ/p1571147549069100
    // 2. How to trim the `/Genuino` from the name: https://arduino.slack.com/archives/CJJHJCJSJ/p1571146951066800?thread_ts=1571142327.059200&cid=CJJHJCJSJ
    const other: BoardIdentifier =
      typeof right === 'string' ? { name: right, fqbn: undefined } : right;
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
    board: BoardIdentifier,
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
      packageId: PlatformIdentifier;
      details?: string;
      manuallyInstalled: boolean;
    }>;
  export function decorateBoards(
    selectedBoard: BoardIdentifier | BoardWithPackage | undefined,
    boards: Array<BoardWithPackage>
  ): Array<Detailed> {
    let foundSelected = false;
    // Board names are not unique. We show the corresponding core name as a detail.
    // https://github.com/arduino/arduino-cli/pull/294#issuecomment-513764948
    const distinctBoardNames = new Map<string, number>();
    for (const { name } of boards) {
      const counter = distinctBoardNames.get(name) || 0;
      distinctBoardNames.set(name, counter + 1);
    }
    const selectedBoardPackageId = selectedBoard
      ? createPlatformIdentifier(selectedBoard)
      : undefined;
    const selectedBoardFqbn = selectedBoard?.fqbn;
    // Due to the non-unique board names, IDE2 has to check the package name when boards are not installed and the FQBN is absent.
    const isSelected = (board: BoardWithPackage) => {
      if (!selectedBoard) {
        return false;
      }
      if (foundSelected) {
        return false;
      }
      let selected = false;
      if (board.fqbn && selectedBoardFqbn) {
        if (boardIdentifierEquals(board, selectedBoard)) {
          selected = true;
        }
      }
      if (!selected) {
        if (board.name === selectedBoard.name) {
          if (selectedBoardPackageId) {
            const boardPackageId = createPlatformIdentifier(board);
            if (boardPackageId) {
              if (
                platformIdentifierEquals(boardPackageId, selectedBoardPackageId)
              ) {
                selected = true;
              }
            }
          }
        }
      }
      if (selected) {
        foundSelected = true;
      }
      return selected;
    };
    return boards.map((board) => ({
      ...board,
      details:
        (distinctBoardNames.get(board.name) || 0) > 1
          ? ` - ${board.packageName}`
          : undefined,
      selected: isSelected(board),
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

export type PlatformIdentifier = Readonly<{ vendorId: string; arch: string }>;
export function createPlatformIdentifier(
  board: BoardWithPackage
): PlatformIdentifier;
export function createPlatformIdentifier(
  board: BoardIdentifier
): PlatformIdentifier | undefined;
export function createPlatformIdentifier(
  fqbn: string
): PlatformIdentifier | undefined;
export function createPlatformIdentifier(
  arg: BoardIdentifier | BoardWithPackage | string
): PlatformIdentifier | undefined {
  if (BoardWithPackage.is(arg)) {
    return arg.packageId;
  }
  const toSplit = typeof arg === 'string' ? arg : arg.fqbn;
  if (toSplit) {
    const [vendorId, arch] = toSplit.split(':');
    if (vendorId && arch) {
      return { vendorId, arch };
    }
  }
  return undefined;
}

export function isPlatformIdentifier(arg: unknown): arg is PlatformIdentifier {
  return (
    Boolean(arg) &&
    typeof arg === 'object' &&
    (<PlatformIdentifier>arg).vendorId !== undefined &&
    typeof (<PlatformIdentifier>arg).vendorId === 'string' &&
    (<PlatformIdentifier>arg).arch !== undefined &&
    typeof (<PlatformIdentifier>arg).arch === 'string'
  );
}

export function serializePlatformIdentifier({
  vendorId,
  arch,
}: PlatformIdentifier): string {
  return `${vendorId}:${arch}`;
}

export function platformIdentifierEquals(
  left: PlatformIdentifier,
  right: PlatformIdentifier
) {
  return left.vendorId === right.vendorId && left.arch === right.arch;
}

/**
 * Bare minimum information to identify port.
 */
export type PortIdentifier = Readonly<Pick<Port, 'protocol' | 'address'>>;

export function portIdentifierEquals(
  left: PortIdentifier | undefined,
  right: PortIdentifier | undefined
): boolean {
  if (!left) {
    return !right;
  }
  if (!right) {
    return !left;
  }
  return left.protocol === right.protocol && left.address === right.address;
}

export function isPortIdentifier(arg: unknown): arg is PortIdentifier {
  return (
    Boolean(arg) &&
    typeof arg === 'object' &&
    (<PortIdentifier>arg).protocol !== undefined &&
    typeof (<PortIdentifier>arg).protocol === 'string' &&
    (<PortIdentifier>arg).address !== undefined &&
    typeof (<PortIdentifier>arg).address === 'string'
  );
}

// the smaller the number, the higher the priority
const portProtocolPriorities: Record<string, number> = {
  serial: 0,
  network: 1,
} as const;

/**
 * See `boardListItemComparator`.
 */
export function portProtocolComparator(
  left: PortIdentifier,
  right: PortIdentifier
): number {
  const leftPriority =
    portProtocolPriorities[left.protocol] ?? Number.MAX_SAFE_INTEGER;
  const rightPriority =
    portProtocolPriorities[right.protocol] ?? Number.MAX_SAFE_INTEGER;
  return leftPriority - rightPriority;
}

/**
 * Lightweight information to identify a board.\
 * \
 * Note: the `name` property of the board identifier must never participate in the board's identification.
 * Hence, it should only be used as the final fallback for the UI when the board's platform is not installed and only the board's name is available.
 */
export interface BoardIdentifier {
  /**
   * The name of the board. It's only purpose is to provide a fallback for the UI. Preferably do not use this property for any sophisticated logic. When
   */
  readonly name: string;
  /**
   * The FQBN might contain boards config options if selected from the discovered ports (see [arduino/arduino-ide#1588](https://github.com/arduino/arduino-ide/issues/1588)).
   */
  // TODO: decide whether to persist the boards config if any
  readonly fqbn: string | undefined;
}

export function isBoardIdentifier(arg: unknown): arg is BoardIdentifier {
  return (
    Boolean(arg) &&
    typeof arg === 'object' &&
    (<BoardIdentifier>arg).name !== undefined &&
    typeof (<BoardIdentifier>arg).name === 'string' &&
    ((<BoardIdentifier>arg).fqbn === undefined ||
      ((<BoardIdentifier>arg).fqbn !== undefined &&
        typeof (<BoardIdentifier>arg).fqbn === 'string'))
  );
}

/**
 * @param options if `looseFqbn` is `true`, FQBN config options are ignored. Hence, `{ name: 'x', fqbn: 'a:b:c:o1=v1 }` equals `{ name: 'y', fqbn: 'a:b:c' }`. It's `true` by default.
 */
export function boardIdentifierEquals(
  left: BoardIdentifier | undefined,
  right: BoardIdentifier | undefined,
  options: { looseFqbn: boolean } = { looseFqbn: true }
): boolean {
  if (!left) {
    return !right;
  }
  if (!right) {
    return !left;
  }
  if ((left.fqbn && !right.fqbn) || (!left.fqbn && right.fqbn)) {
    // This can be very tricky when comparing boards
    // the CLI's board search returns with falsy FQBN when the platform is not installed
    // the CLI's board list returns with the full FQBN (for detected boards) even if the platform is not installed
    // when there are multiple boards with the same name (Arduino Nano RP2040) from different platforms (Mbed Nano OS vs. the deprecated global Mbed OS)
    // maybe add some 3rd party platform overhead (https://github.com/earlephilhower/arduino-pico/releases/download/global/package_rp2040_index.json)
    // and it will get very tricky when comparing a board which has a FQBN and which does not.
    return false; // TODO: This a strict now. Maybe compare name in the future.
  }
  if (left.fqbn && right.fqbn) {
    const leftFqbn = options.looseFqbn ? sanitizeFqbn(left.fqbn) : left.fqbn;
    const rightFqbn = options.looseFqbn ? sanitizeFqbn(right.fqbn) : right.fqbn;
    return leftFqbn === rightFqbn;
  }
  // No more Genuino hack.
  // https://github.com/arduino/arduino-ide/blob/f6a43254f5c416a2e4fa888875358336b42dd4d5/arduino-ide-extension/src/common/protocol/boards-service.ts#L572-L581
  return left.name === right.name;
}

/**
 * See `boardListItemComparator`.
 */
export function boardIdentifierComparator(
  left: BoardIdentifier | undefined,
  right: BoardIdentifier | undefined
): number {
  if (!left) {
    return right ? 1 : 0;
  }
  if (!right) {
    return left ? -1 : 0;
  }
  let leftVendor: string | undefined = undefined;
  let rightVendor: string | undefined = undefined;
  if (left.fqbn) {
    const [vendor] = left.fqbn.split(':');
    leftVendor = vendor;
  }
  if (right.fqbn) {
    const [vendor] = right.fqbn.split(':');
    rightVendor = vendor;
  }
  if (leftVendor === 'arduino' && rightVendor !== 'arduino') {
    return -1;
  }
  if (leftVendor !== 'arduino' && rightVendor === 'arduino') {
    return 1;
  }
  return naturalCompare(left.name, right.name);
}

export function boardIdentifierLabel(
  board: BoardIdentifier,
  showFqbn = true
): string {
  const { name, fqbn } = board;
  let label = name;
  if (fqbn && showFqbn) {
    label += ` (${fqbn})`;
  }
  return label;
}

export interface BoardsConfig {
  selectedBoard: BoardIdentifier | undefined;
  selectedPort: PortIdentifier | undefined;
}

/**
 * Creates a new board config object with `undefined` properties.
 */
export function emptyBoardsConfig(): BoardsConfig {
  return {
    selectedBoard: undefined,
    selectedPort: undefined,
  };
}

export function isDefinedBoardsConfig(
  boardsConfig: BoardsConfig | undefined
): boardsConfig is Defined<BoardsConfig> {
  if (!boardsConfig) {
    return false;
  }
  return (
    boardsConfig.selectedBoard !== undefined &&
    boardsConfig.selectedPort !== undefined
  );
}

export interface BoardIdentifierChangeEvent {
  readonly previousSelectedBoard: BoardIdentifier | undefined;
  readonly selectedBoard: BoardIdentifier | undefined;
}

export function isBoardIdentifierChangeEvent(
  event: BoardsConfigChangeEvent
): event is BoardIdentifierChangeEvent {
  return 'previousSelectedBoard' in event && 'selectedBoard' in event;
}

export interface PortIdentifierChangeEvent {
  readonly previousSelectedPort: PortIdentifier | undefined;
  readonly selectedPort: PortIdentifier | undefined;
}

export function isPortIdentifierChangeEvent(
  event: BoardsConfigChangeEvent
): event is PortIdentifierChangeEvent {
  return 'previousSelectedPort' in event && 'selectedPort' in event;
}

export type BoardsConfigChangeEvent =
  | BoardIdentifierChangeEvent
  | PortIdentifierChangeEvent
  | (BoardIdentifierChangeEvent & PortIdentifierChangeEvent);

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
export const unconfirmedBoard = nls.localize(
  'arduino/board/unconfirmedBoard',
  'Unconfirmed board'
);
export const selectBoard = nls.localize(
  'arduino/board/selectBoard',
  'Select Board'
);
export const notConnected = nls.localize(
  'arduino/common/notConnected',
  '[not connected]'
);

/**
 * The returned promise resolves to a `BoardInfo` if available to show in the UI or an info message explaining why showing the board info is not possible.
 */
export async function getBoardInfo(
  boardListProvider: MaybePromise<BoardList>
): Promise<BoardInfo | string> {
  const boardList = await boardListProvider;
  const ports = boardList.ports();
  const detectedPort = ports[ports.matchingIndex];
  if (!detectedPort) {
    return selectPortForInfo;
  }
  const { port: selectedPort, boards } = detectedPort;
  // IDE2 must show the board info based on the selected port.
  // https://github.com/arduino/arduino-ide/issues/1489
  // IDE 1.x supports only serial port protocol
  if (selectedPort.protocol !== 'serial') {
    return nonSerialPort;
  }
  if (!isNonNativeSerial(selectedPort)) {
    return noNativeSerialPort;
  }

  if (boards && boards.length > 1) {
    console.warn(
      `Detected more than one available boards on the selected port : ${JSON.stringify(
        detectedPort
      )}. Detected boards were: ${JSON.stringify(
        boards
      )}. Using the first one: ${JSON.stringify(boards[0])}`
    );
  }

  const board = boards ? boards[0] : undefined;
  const BN = board?.name ?? unknownBoard;
  const VID = readProperty('vid', selectedPort);
  const PID = readProperty('pid', selectedPort);
  const SN = readProperty('serialNumber', selectedPort);
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
