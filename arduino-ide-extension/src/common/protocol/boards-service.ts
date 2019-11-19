import { isWindows, isOSX } from '@theia/core/lib/common/os';
import { JsonRpcServer } from '@theia/core/lib/common/messaging/proxy-factory';
import { Searchable } from './searchable';
import { Installable } from './installable';
import { Detailable } from './detailable';
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
        const diff = <T>(left: T[], right: T[]) => {
            return left.filter(item => right.indexOf(item) === -1);
        }
        const { boards: newBoards } = event.newState;
        const { boards: oldBoards } = event.oldState;
        const { ports: newPorts } = event.newState;
        const { ports: oldPorts } = event.oldState;
        return {
            detached: {
                boards: diff(oldBoards, newBoards),
                ports: diff(oldPorts, newPorts)
            },
            attached: {
                boards: diff(newBoards, oldBoards),
                ports: diff(newPorts, oldPorts)
            }
        };
    }

}

export interface BoardInstalledEvent {
    readonly pkg: Readonly<BoardPackage>;
}

export interface BoardUninstalledEvent {
    readonly pkg: Readonly<BoardPackage>;
}

export const BoardsServiceClient = Symbol('BoardsServiceClient');
export interface BoardsServiceClient {
    notifyAttachedBoardsChanged(event: AttachedBoardsChangeEvent): void;
    notifyBoardInstalled(event: BoardInstalledEvent): void
    notifyBoardUninstalled(event: BoardUninstalledEvent): void
}

export const BoardsServicePath = '/services/boards-service';
export const BoardsService = Symbol('BoardsService');
export interface BoardsService extends Installable<BoardPackage>, Searchable<BoardPackage>, Detailable<BoardDetails>, JsonRpcServer<BoardsServiceClient> {
    getAttachedBoards(): Promise<{ boards: Board[] }>;
    getAvailablePorts(): Promise<{ ports: Port[] }>;
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

    export function sameAs(left: Port | undefined, right: string | undefined) {
        if (left && right) {
            if (left.protocol !== 'serial') {
                console.log(`Unexpected protocol for port: ${JSON.stringify(left)}. Ignoring protocol, comparing addresses with ${right}.`);
            }
            return left.address === right;
        }
        return false;
    }

}

export interface BoardPackage extends ArduinoComponent {
    id: string;
    boards: Board[];
}

export interface Board {
    name: string
    fqbn?: string
}

export interface BoardDetails extends Board {
    fqbn: string;

    requiredTools: Tool[];
    locations?: BoardDetailLocations;
}

export interface BoardDetailLocations {
    debugScript: string;
}

export interface Tool {
    readonly packager: string;
    readonly name: string;
    readonly version: string;
    readonly locations?: ToolLocations;
}
export interface ToolLocations {
    main: string
    [key: string]: string
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

}

export interface AttachedSerialBoard extends Board {
    port: string;
}

export namespace AttachedSerialBoard {
    export function is(b: Board | any): b is AttachedSerialBoard {
        return !!b && 'port' in b;
    }
}

export interface AttachedNetworkBoard extends Board {
    address: string;
    port: string;
}

export namespace AttachedNetworkBoard {
    export function is(b: Board): b is AttachedNetworkBoard {
        return 'address' in b && 'port' in b;
    }
}
