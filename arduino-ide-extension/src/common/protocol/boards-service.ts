import { ArduinoComponent } from "./arduino-component";

export const BoardsServicePath = '/services/boards-service';
export const BoardsService = Symbol('BoardsService');
export interface BoardsService {
    connectedBoards(): Promise<{ boards: Board[], current?: Board }>;
    search(options: { query?: string }): Promise<{ items: Board[] }>;
    install(board: Board): Promise<void>;
}

export interface Board extends ArduinoComponent {
    id: string;
}
