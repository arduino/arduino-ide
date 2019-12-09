import { Installable } from './installable';

export interface ArduinoComponent {
    readonly name: string;
    readonly author: string;
    readonly summary: string;
    readonly description: string;
    readonly moreInfoLink?: string;

    readonly availableVersions: Installable.Version[];
    readonly installable: boolean;

    readonly installedVersion?: Installable.Version;
}
