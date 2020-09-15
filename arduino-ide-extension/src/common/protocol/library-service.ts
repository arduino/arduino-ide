import { Searchable } from './searchable';
import { Installable } from './installable';
import { ArduinoComponent } from './arduino-component';

export const LibraryServicePath = '/services/library-service';
export const LibraryService = Symbol('LibraryService');
export interface LibraryService extends Installable<LibraryPackage>, Searchable<LibraryPackage> {
    list(options: LibraryService.List.Options): Promise<LibraryPackage[]>;
}

export namespace LibraryService {
    export namespace List {
        export interface Options {
            readonly fqbn?: string | undefined;
        }
    }
}

export enum LibraryLocation {

    /**
     * In the `libraries` subdirectory of the Arduino IDE installation.
     */
    IDE_BUILTIN = 0,

    /**
     * In the `libraries` subdirectory of the user directory (sketchbook).
     */
    USER = 1,

    /**
     * In the `libraries` subdirectory of a platform.
     */
    PLATFORM_BUILTIN = 2,

    /**
     * When `LibraryLocation` is used in a context where a board is specified, this indicates the library is in the `libraries`
     * subdirectory of a platform referenced by the board's platform.
     */
    REFERENCED_PLATFORM_BUILTIN = 3

}

export interface LibraryPackage extends ArduinoComponent {

    /**
     * Same as [`Library#real_name`](https://arduino.github.io/arduino-cli/latest/rpc/commands/#library).
     * Should be used for the UI, and `name` is used to uniquely identify a library. It does not have an ID.
     */
    readonly label: string;

    /**
     * An array of string that should be included into the `ino` file if this library is used.
     * For example, including `SD` will prepend `#include <SD.h>` to the `ino` file. While including `Bridge`
     * requires multiple `#include` declarations: `YunClient`, `YunServer`, `Bridge`, etc.
     */
    readonly includes: string[];
    readonly exampleUris: string[];
    readonly location: LibraryLocation;
    readonly installDirUri?: string;
}
export namespace LibraryPackage {

    export function is(arg: any): arg is LibraryPackage {
        return ArduinoComponent.is(arg) && 'includes' in arg && Array.isArray(arg['includes']);
    }

    export function equals(left: LibraryPackage, right: LibraryPackage): boolean {
        return left.name === right.name && left.author === right.author;
    }

}
