import { ArduinoComponent } from "./arduino-component";

export const LibraryServicePath = '/services/library-service';
export const LibraryService = Symbol('LibraryService');
export interface LibraryService {
    search(options: { query?: string, props?: LibraryService.Search.Props }): Promise<{ items: Library[] }>;
    install(library: Library): Promise<void>;
}

export namespace LibraryService {
    export namespace Search {
        export interface Props {
            [key: string]: string | undefined;
        }
    }
}

export interface Library extends ArduinoComponent {
    readonly builtIn?: boolean;
}

export namespace Library {
    // TODO: figure out whether we need a dedicated `version` type.
    export type Version = string;
}