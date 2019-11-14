import { Searchable } from './searchable';
import { Installable } from './installable';
import { ArduinoComponent } from './arduino-component';

export const LibraryServicePath = '/services/library-service';
export const LibraryService = Symbol('LibraryService');
export interface LibraryService extends Installable<Library>, Searchable<Library> {
    install(options: { item: Library, version?: Installable.Version }): Promise<void>;
}

export interface Library extends ArduinoComponent {
    readonly builtIn?: boolean;
}
