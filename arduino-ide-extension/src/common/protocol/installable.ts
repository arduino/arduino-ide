import { naturalCompare } from './../utils';
import { ArduinoComponent } from './arduino-component';

export interface InstalledEvent<T extends ArduinoComponent> {
    readonly item: Readonly<T>;
}
export interface UninstalledEvent<T extends ArduinoComponent> {
    readonly item: Readonly<T>;
}
export interface InstallableClient<T extends ArduinoComponent> {
    notifyInstalled(event: InstalledEvent<T>): void
    notifyUninstalled(event: UninstalledEvent<T>): void
}

export interface Installable<T extends ArduinoComponent> {
    /**
     * If `options.version` is specified, that will be installed. Otherwise, `item.availableVersions[0]`.
     */
    install(options: { item: T, version?: Installable.Version }): Promise<void>;

    /**
     * Uninstalls the given component. It is a NOOP if not installed.
     */
    uninstall(options: { item: T }): Promise<void>;
}
export namespace Installable {
    export type Version = string;
    export namespace Version {
        /**
         * Most recent version comes first, then the previous versions. (`1.8.1`, `1.6.3`, `1.6.2`, `1.6.1` and so on.)
         */
        export const COMPARATOR = (left: Version, right: Version) => naturalCompare(right, left);
    }
}
