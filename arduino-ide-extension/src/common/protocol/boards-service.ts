import { ArduinoComponent } from "./arduino-component";

export const BoardsServicePath = '/services/boards-service';
export const BoardsService = Symbol('BoardsService');
export interface BoardsService {
    getAttachedBoards(): Promise<{ boards: AttachedBoard[] }>;
    selectBoard(board: AttachedBoard): Promise<void>;
    getSelectBoard(): Promise<AttachedBoard | undefined>;

    search(options: { query?: string }): Promise<{ items: Board[] }>;
    install(board: Board): Promise<void>;
}

export interface Board extends ArduinoComponent {
    id: string;
}

export interface AttachedBoard {
    name: string
    fqbn?: string
}

export interface AttachedSerialBoard extends AttachedBoard {
    port: string;
    serialNumber: string;
    productID: string;
    vendorID: string;
}

export namespace AttachedSerialBoard {
    export function is(b: AttachedBoard): b is AttachedSerialBoard {
        return 'port' in b
        && 'serialNumber' in b
        && 'productID' in b
        && 'vendorID' in b;
    }
}

export interface AttachedNetworkBoard extends AttachedBoard {
    info: string;
    address: string;
    port: number;
}

export namespace AttachedNetworkBoard {
    export function is(b: AttachedBoard): b is AttachedNetworkBoard {
        return 'name' in b
        && 'info' in b
        && 'address' in b
        && 'port' in b;
    }
}
