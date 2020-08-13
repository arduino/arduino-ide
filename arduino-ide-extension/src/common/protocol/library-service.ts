import { JsonRpcServer } from '@theia/core/lib/common/messaging/proxy-factory';
import { Searchable } from './searchable';
import { ArduinoComponent } from './arduino-component';
import { Installable, InstallableClient } from './installable';

export interface LibraryService extends Installable<LibraryPackage>, Searchable<LibraryPackage> {
    install(options: { item: LibraryPackage, version?: Installable.Version }): Promise<void>;
    list(options: LibraryService.List.Options): Promise<LibraryPackage[]>;
}

export const LibraryServiceClient = Symbol('LibraryServiceClient');
export interface LibraryServiceClient extends InstallableClient<LibraryPackage> {
}

export const LibraryServiceServerPath = '/services/library-service-server';
export const LibraryServiceServer = Symbol('LibraryServiceServer');
export interface LibraryServiceServer extends LibraryService, JsonRpcServer<LibraryServiceClient> {
}

export namespace LibraryService {
    export namespace List {
        export interface Options {
            readonly fqbn?: string | undefined;
        }
    }
}

export interface LibraryPackage extends ArduinoComponent {
    /**
     * An array of string that should be included into the `ino` file if this library is used.
     * For example, including `SD` will prepend `#include <SD.h>` to the `ino` file. While including `Bridge`
     * requires multiple `#include` declarations: `YunClient`, `YunServer`, `Bridge`, etc.
     */
    readonly includes: string[];
}
export namespace LibraryPackage {

    export function is(arg: any): arg is LibraryPackage {
        return ArduinoComponent.is(arg) && 'includes' in arg && Array.isArray(arg['includes']);
    }

    export function equals(left: LibraryPackage, right: LibraryPackage): boolean {
        return left.name === right.name && left.author === right.author;
    }

}
