import { JsonRpcServer } from '@theia/core';
import { Searchable } from './searchable';
import { Installable } from './installable';
import { ArduinoComponent } from './arduino-component';

export interface AttachedBoardsChangeEvent {
    readonly oldState: Readonly<{ boards: Board[] }>;
    readonly newState: Readonly<{ boards: Board[] }>;
}
export namespace AttachedBoardsChangeEvent {

    export function diff(event: AttachedBoardsChangeEvent): Readonly<{ attached: Board[], detached: Board[] }> {
        const diff = <T>(left: T[], right: T[]) => {
            return left.filter(item => right.indexOf(item) === -1);
        }
        const { boards: newBoards } = event.newState;
        const { boards: oldBoards } = event.oldState;
        return {
            detached: diff(oldBoards, newBoards),
            attached: diff(newBoards, oldBoards)
        };
    }

}

export interface BoardInstalledEvent {
    readonly pkg: Readonly<BoardPackage>;
}

export const BoardsServiceClient = Symbol('BoardsServiceClient');
export interface BoardsServiceClient {
    notifyAttachedBoardsChanged(event: AttachedBoardsChangeEvent): void;
    notifyBoardInstalled(event: BoardInstalledEvent): void
}

export const BoardsServicePath = '/services/boards-service';
export const BoardsService = Symbol('BoardsService');
export interface BoardsService extends Installable<BoardPackage>, Searchable<BoardPackage>, JsonRpcServer<BoardsServiceClient> {
    getAttachedBoards(): Promise<{ boards: Board[] }>;
}

export interface BoardPackage extends ArduinoComponent {
    id: string;
    boards: Board[];
}

export interface Board {
    name: string
    fqbn?: string
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
