export const SketchesServicePath = '/services/sketches-service';
export const SketchesService = Symbol('SketchesService');
export interface SketchesService {

    /**
     * Returns with the direct sketch folders from the location of the `fileStat`.
     * The sketches returns with inverse-chronological order, the first item is the most recent one.
     */
    getSketches(uri?: string): Promise<Sketch[]>;

    getSketchFiles(uri: string): Promise<string[]>;

    /**
     * Creates a new sketch folder in the temp location.
     */
    createNewSketch(): Promise<Sketch>;

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

}

export interface Sketch {
    readonly name: string;
    readonly uri: string;
}
