
export interface ArduinoComponent {
    readonly name: string;
    readonly author: string;
    readonly summary: string;
    readonly description: string;
    readonly moreInfoLink?: string;

    readonly availableVersions: string[];
    readonly installable: boolean;

    readonly installedVersion?: string;
}
