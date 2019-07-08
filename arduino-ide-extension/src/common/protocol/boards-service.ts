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
    type: 'serial';
    serialNumber?: string;
    productID?: string;
    vendorID?: string;
}

export namespace AttachedSerialBoard {
    export function is(b: Board): b is AttachedSerialBoard {
        return 'type' in b && (b as Board & { type: any }).type === 'serial' &&
            'port' in b && !!(b as Board & { port: any }).port && typeof (b as Board & { port: any }).port === 'string';
    }
}

export interface AttachedNetworkBoard extends Board {
    info?: string;
    address?: string;
    port: number;
    type: 'network';
}

export namespace AttachedNetworkBoard {
    export function is(b: Board): b is AttachedNetworkBoard {
        return 'type' in b && (b as Board & { type: any }).type === 'network' &&
            'port' in b && !!(b as Board & { port: any }).port && typeof (b as Board & { port: any }).port === 'number';
    }
}
