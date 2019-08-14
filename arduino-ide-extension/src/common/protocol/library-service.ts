import { Searchable } from './searchable';
import { Installable } from './installable';
import { ArduinoComponent } from './arduino-component';

export const LibraryServicePath = '/services/library-service';
export const LibraryService = Symbol('LibraryService');
export interface LibraryService extends Installable<Library>, Searchable<Library> {
    install(library: Library): Promise<void>;
}

export interface Library extends ArduinoComponent {
    readonly builtIn?: boolean;
}

export namespace Library {
    // TODO: figure out whether we need a dedicated `version` type.
    export type Version = string;
}