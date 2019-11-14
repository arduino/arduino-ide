import { ArduinoComponent } from './arduino-component';

export interface Installable<T extends ArduinoComponent> {
    /**
     * If `options.version` is specified, that will be installed. Otherwise, `item.availableVersions[0]`.
     */
    install(options: { item: T, version?: Installable.Version }): Promise<void>;
}
export namespace Installable {
    export type Version = string;
}
