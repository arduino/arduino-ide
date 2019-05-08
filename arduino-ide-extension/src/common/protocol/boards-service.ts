import { ArduinoComponent } from "./arduino-component";

export const BoardsServicePath = '/services/boards-service';
export const BoardsService = Symbol('BoardsService');
export interface BoardsService {
    getAttachedBoards(): Promise<{ boards: Board[] }>;
    selectBoard(board: Board): Promise<void>;
    getSelectBoard(): Promise<Board | undefined>;

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
    serialNumber: string;
    productID: string;
    vendorID: string;
}

export namespace AttachedSerialBoard {
    export function is(b: Board): b is AttachedSerialBoard {
        return 'port' in b
        && 'serialNumber' in b
        && 'productID' in b
        && 'vendorID' in b;
    }
}

export interface AttachedNetworkBoard extends Board {
    info: string;
    address: string;
    port: number;
}

export namespace AttachedNetworkBoard {
    export function is(b: Board): b is AttachedNetworkBoard {
        return 'name' in b
        && 'info' in b
        && 'address' in b
        && 'port' in b;
    }
}
