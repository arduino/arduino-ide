export const SketchesServicePath = '/services/sketches-service';
export const SketchesService = Symbol('SketchesService');
export interface SketchesService {
    /**
     * Returns with the direct sketch folders from the location of the `fileStat`.
     * The sketches returns with inverchronological order, the first item is the most recent one.
     */
    getSketches(uri?: string): Promise<Sketch[]>
    getSketchFiles(uri: string): Promise<string[]>
    createNewSketch(parentUri: string): Promise<Sketch>
    isSketchFolder(uri: string): Promise<boolean>
}

export interface Sketch {
    readonly name: string;
    readonly uri: string
}