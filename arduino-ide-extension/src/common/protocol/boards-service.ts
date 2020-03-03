import { isWindows, isOSX } from '@theia/core/lib/common/os';
import { JsonRpcServer } from '@theia/core/lib/common/messaging/proxy-factory';
import { Searchable } from './searchable';
import { Installable } from './installable';
import { ArduinoComponent } from './arduino-component';
const naturalCompare: (left: string, right: string) => number = require('string-natural-compare').caseInsensitive;

export interface AttachedBoardsChangeEvent {
    readonly oldState: Readonly<{ boards: Board[], ports: Port[] }>;
    readonly newState: Readonly<{ boards: Board[], ports: Port[] }>;
}
export namespace AttachedBoardsChangeEvent {

    export function diff(event: AttachedBoardsChangeEvent): Readonly<{
        attached: {
            boards: Board[],
            ports: Port[]
        },
        detached: {
            boards: Board[],
            ports: Port[]
        }
    }> {
        // In `lefts` AND not in `rights`.
        const diff = <T>(lefts: T[], rights: T[], sameAs: (left: T, right: T) => boolean) => {
            return lefts.filter(left => rights.findIndex(right => sameAs(left, right)) === -1);
        }
        const { boards: newBoards } = event.newState;
        const { boards: oldBoards } = event.oldState;
        const { ports: newPorts } = event.newState;
        const { ports: oldPorts } = event.oldState;
        const boardSameAs = (left: Board, right: Board) => Board.sameAs(left, right);
        const portSameAs = (left: Port, right: Port) => Port.sameAs(left, right);
        return {
            detached: {
                boards: diff(oldBoards, newBoards, boardSameAs),
                ports: diff(oldPorts, newPorts, portSameAs)
            },
            attached: {
                boards: diff(newBoards, oldBoards, boardSameAs),
                ports: diff(newPorts, oldPorts, portSameAs)
            }
        };
    }

}

export interface BoardInstalledEvent {
    readonly pkg: Readonly<BoardsPackage>;
}

export interface BoardUninstalledEvent {
    readonly pkg: Readonly<BoardsPackage>;
}

export const BoardsServiceClient = Symbol('BoardsServiceClient');
export interface BoardsServiceClient {
    notifyAttachedBoardsChanged(event: AttachedBoardsChangeEvent): void;
    notifyBoardInstalled(event: BoardInstalledEvent): void
    notifyBoardUninstalled(event: BoardUninstalledEvent): void
}

export const BoardsServicePath = '/services/boards-service';
export const BoardsService = Symbol('BoardsService');
export interface BoardsService extends Installable<BoardsPackage>, Searchable<BoardsPackage>, JsonRpcServer<BoardsServiceClient> {
    getAttachedBoards(): Promise<Board[]>;
    getAvailablePorts(): Promise<Port[]>;
    getBoardDetails(options: { fqbn: string }): Promise<BoardDetails>;
    getBoardPackage(options: { id: string }): Promise<BoardsPackage | undefined>;
    getContainerBoardPackage(options: { fqbn: string }): Promise<BoardsPackage | undefined>;
    searchBoards(options: { query?: string }): Promise<Array<Board & { packageName: string }>>;
}

export interface Port {
    readonly address: string;
    readonly protocol: Port.Protocol;
    /**
     * Optional label for the protocol. For example: `Serial Port (USB)`.
     */
    readonly label?: string;
}
export namespace Port {

    export type Protocol = 'serial' | 'network' | 'unknown';
    export namespace Protocol {
        export function toProtocol(protocol: string | undefined): Protocol {
            if (protocol === 'serial') {
                return 'serial';
            } else if (protocol === 'network') {
                return 'network';
            } else {
                return 'unknown';
            }
        }
    }

    export function toString(port: Port, options: { useLabel: boolean } = { useLabel: false }): string {
        if (options.useLabel && port.label) {
            return `${port.address} ${port.label}`
        }
        return port.address;
    }

    export function compare(left: Port, right: Port): number {
        // Board ports have higher priorities, they come first.
        if (isBoardPort(left) && !isBoardPort(right)) {
            return -1;
        }
        if (!isBoardPort(left) && isBoardPort(right)) {
            return 1;
        }
        let result = left.protocol.toLocaleLowerCase().localeCompare(right.protocol.toLocaleLowerCase());
        if (result !== 0) {
            return result;
        }
        result = naturalCompare(left.address, right.address);
        if (result !== 0) {
            return result;
        }
        return (left.label || '').localeCompare(right.label || '');
    }

    export function equals(left: Port | undefined, right: Port | undefined): boolean {
        if (left && right) {
            return left.address === right.address
                && left.protocol === right.protocol
                && (left.label || '') === (right.label || '');
        }
        return left === right;
    }

    // Based on: https://github.com/arduino/Arduino/blob/93581b03d723e55c60caedb4729ffc6ea808fe78/arduino-core/src/processing/app/SerialPortList.java#L48-L74   
    export function isBoardPort(port: Port): boolean {
        const address = port.address.toLocaleLowerCase();
        if (isWindows) {
            // `COM1` seems to be the default serial port on Windows.
            return address !== 'COM1'.toLocaleLowerCase();
        }
        // On macOS and Linux, the port should start with `/dev/`.
        if (!address.startsWith('/dev/')) {
            return false
        }
        if (isOSX) {
            // Example: `/dev/cu.usbmodem14401`
            if (/(tty|cu)\..*/.test(address.substring('/dev/'.length))) {
                return [
                    '/dev/cu.MALS',
                    '/dev/cu.SOC',
                    '/dev/cu.Bluetooth-Incoming-Port'
                ].map(a => a.toLocaleLowerCase()).every(a => a !== address);
            }
        }

        // Example: `/dev/ttyACM0`
        if (/(ttyS|ttyUSB|ttyACM|ttyAMA|rfcomm|ttyO)[0-9]{1,3}/.test(address.substring('/dev/'.length))) {
            // Default ports were `/dev/ttyS0` -> `/dev/ttyS31` on Ubuntu 16.04.2.
            if (address.startsWith('/dev/ttyS')) {
                const index = Number.parseInt(address.substring('/dev/ttyS'.length), 10);
                if (!Number.isNaN(index) && 0 <= index && 31 >= index) {
                    return false;
                }
            }
            return true;
        }

        return false;
    }

    export function sameAs(left: Port | undefined, right: Port | string | undefined) {
        if (left && right) {
            if (left.protocol !== 'serial') {
                console.log(`Unexpected protocol for 'left' port: ${JSON.stringify(left)}. Ignoring 'protocol', comparing 'addresses' with ${JSON.stringify(right)}.`);
            }
            if (typeof right === 'string') {
                return left.address === right;
            }
            if (right.protocol !== 'serial') {
                console.log(`Unexpected protocol for 'right' port: ${JSON.stringify(right)}. Ignoring 'protocol', comparing 'addresses' with ${JSON.stringify(left)}.`);
            }
            return left.address === right.address;
        }
        return false;
    }

}

export interface BoardsPackage extends ArduinoComponent {
    readonly id: string;
    readonly boards: Board[];
}

export interface Board {
    readonly name: string;
    readonly fqbn?: string;
    readonly port?: Port;
}

export interface BoardDetails {
    readonly fqbn: string;
    readonly requiredTools: Tool[];
    readonly configOptions: ConfigOption[];
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
     * Validation can be disabled with the `{ validation: false }` option.
     */
    export function decorate(fqbn: string, configOptions: ConfigOption[], { validate } = { validate: true }): string {
        if (validate) {
            if (!isValidFqbn(fqbn)) {
                throw new ConfigOptionError(`${fqbn} is not a valid FQBN.`);
            }
            if (isValidFqbnWithOptions(fqbn)) {
                throw new ConfigOptionError(`${fqbn} is already decorated with the configuration options.`);
            }
        }

        if (!configOptions.length) {
            return fqbn;
        }

        const toValue = (values: ConfigValue[]) => {
            const selectedValue = values.find(({ selected }) => selected);
            if (!selectedValue) {
                console.warn(`None of the config values was selected. Values were: ${JSON.stringify(values)}`);
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

    export function isValidFqbn(fqbn: string): boolean {
        return /^\w+(:\w+)*$/.test(fqbn);
    }

    export function isValidFqbnWithOptions(fqbn: string): boolean {
        return /^\w+(:\w+)*(:\w+=\w+(,\w+=\w+)*)$/.test(fqbn);
    }

    export class ConfigOptionError extends Error {
        constructor(message: string) {
            super(message);
            Object.setPrototypeOf(this, ConfigOptionError.prototype);
        }
    }

    export const LABEL_COMPARATOR = (left: ConfigOption, right: ConfigOption) => left.label.toLocaleLowerCase().localeCompare(right.label.toLocaleLowerCase());

}

export interface ConfigValue {
    readonly label: string;
    readonly value: string;
    readonly selected: boolean;
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
        return left.name.replace('/Genuino', '') === other.name.replace('/Genuino', '');
    }

    export function compare(left: Board, right: Board): number {
        let result = left.name.localeCompare(right.name);
        if (result === 0) {
            result = (left.fqbn || '').localeCompare(right.fqbn || '');
        }
        return result;
    }

    export function installed(board: Board): boolean {
        return !!board.fqbn;
    }

    export function toString(board: Board, options: { useFqbn: boolean } = { useFqbn: true }): string {
        const fqbn = options && options.useFqbn && board.fqbn ? ` [${board.fqbn}]` : '';
        return `${board.name}${fqbn}`;
    }

    export function decorateBoards(
        selectedBoard: Board | undefined,
        searchResults: Array<Board & { packageName: string }>): Array<Board & { selected: boolean, missing: boolean, packageName: string, details?: string }> {
        // Board names are not unique. We show the corresponding core name as a detail.
        // https://github.com/arduino/arduino-cli/pull/294#issuecomment-513764948
        const distinctBoardNames = new Map<string, number>();
        for (const { name } of searchResults) {
            const counter = distinctBoardNames.get(name) || 0;
            distinctBoardNames.set(name, counter + 1);
        }

        // Due to the non-unique board names, we have to check the package name as well.
        const selected = (board: Board & { packageName: string }) => {
            if (!!selectedBoard) {
                if (Board.equals(board, selectedBoard)) {
                    if ('packageName' in selectedBoard) {
                        return board.packageName === (selectedBoard as any).packageName;
                    }
                    return true;
                }
            }
            return false;
        }
        return searchResults.map(board => ({
            ...board,
            details: (distinctBoardNames.get(board.name) || 0) > 1 ? ` - ${board.packageName}` : undefined,
            selected: selected(board),
            missing: !installed(board)
        }));
    }


}
