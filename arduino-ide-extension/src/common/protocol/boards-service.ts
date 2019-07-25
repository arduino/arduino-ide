import { ArduinoComponent } from "./arduino-component";

export const BoardsServicePath = '/services/boards-service';
export const BoardsService = Symbol('BoardsService');
export interface BoardsService {
    getAttachedBoards(): Promise<{ boards: Board[] }>;
    selectBoard(board: Board | AttachedSerialBoard | AttachedNetworkBoard): Promise<void>;
    getSelectBoard(): Promise<Board | AttachedSerialBoard | AttachedNetworkBoard | undefined>;

    search(options: { query?: string }): Promise<{ items: BoardPackage[] }>;
    install(item: BoardPackage): Promise<void>;
}

export interface BoardPackage extends ArduinoComponent {
    id: string;
    boards: Board[];
}

export interface Board {
    name: string
    fqbn?: string
}

export interface AttachedSerialBoard extends Board {
    port: string;
}

export namespace AttachedSerialBoard {
    export function is(b: Board): b is AttachedSerialBoard {
        return 'port' in b;
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
