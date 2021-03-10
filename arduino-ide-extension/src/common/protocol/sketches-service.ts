import URI from '@theia/core/lib/common/uri';

export const SketchesServicePath = '/services/sketches-service';
export const SketchesService = Symbol('SketchesService');
export interface SketchesService {

    /**
     * Resolves to a sketch container representing the hierarchical structure of the sketches.
     * If `uri` is not given, `directories.user` will be user instead. Specify `exclude` global patterns to filter folders from the sketch container.
     * If `exclude` is not set `['**\/libraries\/**', '**\/hardware\/**']` will be used instead.
     */
    getSketches({ uri, exclude }: { uri?: string, exclude?: string[] }): Promise<SketchContainer>;

    /**
     * This is the TS implementation of `SketchLoad` from the CLI and should be replaced with a gRPC call eventually.
     * See: https://github.com/arduino/arduino-cli/issues/837
     * Based on: https://github.com/arduino/arduino-cli/blob/eef3705c4afcba4317ec38b803d9ffce5dd59a28/arduino/builder/sketch.go#L100-L215
     */
    loadSketch(uri: string): Promise<Sketch>;

    /**
     * Creates a new sketch folder in the temp location.
     */
    createNewSketch(): Promise<Sketch>;

    /**
     * Creates a new sketch with existing content. Rejects if `uri` is not pointing to a valid sketch folder.
     */
    cloneExample(uri: string): Promise<Sketch>;

    isSketchFolder(uri: string): Promise<boolean>;

    /**
     * Sketches are created to the temp location by default and will be moved under `directories.user` on save.
     * This method resolves to `true` if the `sketch` is still in the temp location. Otherwise, `false`.
     */
    isTemp(sketch: Sketch): Promise<boolean>;

    /**
     * If `isTemp` is `true` for the `sketch`, you can call this method to move the sketch from the temp
     * location to `directories.user`. Resolves with the URI of the sketch after the move. Rejects, when the sketch
     * was not in the temp folder. This method always overrides. It's the callers responsibility to ask the user whether
     * the files at the destination can be overwritten or not.
     */
    copy(sketch: Sketch, options: { destinationUri: string }): Promise<string>;

    /**
     * Returns with the container sketch for the input `uri`. If the `uri` is not in a sketch folder, resolved `undefined`.
     */
    getSketchFolder(uri: string): Promise<Sketch | undefined>;

    /**
     * Marks the sketch with the given URI as recently opened. It does nothing if the sketch is temp or not valid.
     */
    markAsRecentlyOpened(uri: string): Promise<void>;

    /**
     * Resolves to an array of sketches in inverse chronological order. The newest is the first.
     */
    recentlyOpenedSketches(): Promise<Sketch[]>;

    /**
     * Archives the sketch, resolves to the archive URI.
     */
    archive(sketch: Sketch, destinationUri: string): Promise<string>;

    /**
     * Counterpart of the CLI's `genBuildPath` functionality.
     * Based on https://github.com/arduino/arduino-cli/blob/550179eefd2d2bca299d50a4af9e9bfcfebec649/arduino/builder/builder.go#L30-L38
     */
    getIdeTempFolderUri(sketch: Sketch): Promise<string>;

}

export interface Sketch {
    readonly name: string;
    readonly uri: string; // `LocationPath`
    readonly mainFileUri: string; // `MainFile`
    readonly otherSketchFileUris: string[]; // `OtherSketchFiles`
    readonly additionalFileUris: string[]; // `AdditionalFiles`
    readonly rootFolderFileUris: string[]; // `RootFolderFiles` (does not include the main sketch file)
}
export namespace Sketch {
    export function is(arg: any): arg is Sketch {
        return !!arg && 'name' in arg && 'uri' in arg && typeof arg.name === 'string' && typeof arg.uri === 'string';
    }
    export namespace Extensions {
        export const MAIN = ['.ino', '.pde'];
        export const SOURCE = ['.c', '.cpp', '.s'];
        export const ADDITIONAL = ['.h', '.c', '.hpp', '.hh', '.cpp', '.s', '.json'];
        export const ALL = Array.from(new Set([...MAIN, ...SOURCE, ...ADDITIONAL]));
    }
    export function isInSketch(uri: string | URI, sketch: Sketch): boolean {
        const { mainFileUri, otherSketchFileUris, additionalFileUris } = sketch;
        return [mainFileUri, ...otherSketchFileUris, ...additionalFileUris].indexOf(uri.toString()) !== -1;
    }
    export function isSketchFile(arg: string | URI): boolean {
        if (arg instanceof URI) {
            return isSketchFile(arg.toString());
        }
        return Extensions.MAIN.some(ext => arg.endsWith(ext));
    }
}

export interface SketchContainer {
    readonly label: string;
    readonly children: SketchContainer[];
    readonly sketches: Sketch[];
}
export namespace SketchContainer {

    export function is(arg: any): arg is SketchContainer {
        return !!arg
            && 'label' in arg && typeof arg.label === 'string'
            && 'children' in arg && Array.isArray(arg.children)
            && 'sketches' in arg && Array.isArray(arg.sketches);
    }

    /**
     * `false` if the `container` recursively contains at least one sketch. Otherwise, `true`.
     */
    export function isEmpty(container: SketchContainer): boolean {
        const hasSketch = (parent: SketchContainer) => {
            if (parent.sketches.length || parent.children.some(child => hasSketch(child))) {
                return true;
            }
            return false;
        }
        return !hasSketch(container);
    }

    export function prune<T extends SketchContainer>(container: T): T {
        for (let i = container.children.length - 1; i >= 0; i--) {
            if (isEmpty(container.children[i])) {
                container.children.splice(i, 1);
            }
        }
        return container;
    }

    export function toArray(container: SketchContainer): Sketch[] {
        const visit = (parent: SketchContainer, toPushSketch: Sketch[]) => {
            toPushSketch.push(...parent.sketches);
            parent.children.map(child => visit(child, toPushSketch));
        }
        const sketches: Sketch[] = [];
        visit(container, sketches);
        return sketches;
    }

}
