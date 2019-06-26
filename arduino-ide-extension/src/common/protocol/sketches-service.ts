import { FileStat } from "@theia/filesystem/lib/common";

export const SketchesServicePath = '/services/sketches-service';
export const SketchesService = Symbol('SketchesService');
export interface SketchesService {
    getSketches(fileStat?: FileStat): Promise<Sketch[]>
    getSketchFiles(fileStat: FileStat): Promise<string[]>
}

export interface Sketch {
    name: string;
    uri: string
}