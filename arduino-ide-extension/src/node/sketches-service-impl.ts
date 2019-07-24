import { injectable, inject } from "inversify";
import { SketchesService, Sketch } from "../common/protocol/sketches-service";
import URI from "@theia/core/lib/common/uri";
import { FileStat, FileSystem } from "@theia/filesystem/lib/common";
import * as fs from 'fs';
import * as path from 'path';
import { FileUri } from "@theia/core/lib/node";

export const ALLOWED_FILE_EXTENSIONS = [".c", ".cpp", ".h", ".hh", ".hpp", ".s", ".pde", ".ino"];

@injectable()
export class SketchesServiceImpl implements SketchesService {

    @inject(FileSystem)
    protected readonly filesystem: FileSystem;

    async getSketches(fileStat?: FileStat): Promise<Sketch[]> {
        const sketches: Sketch[] = [];
        if (fileStat && fileStat.isDirectory) {
            const uri = new URI(fileStat.uri);
            const sketchFolderPath = await this.filesystem.getFsPath(uri.toString());
            if (sketchFolderPath) {
                const fileNames = fs.readdirSync(sketchFolderPath);
                for (const fileName of fileNames) {
                    const filePath = path.join(sketchFolderPath, fileName);
                    if (this.isSketchFolder(filePath, fileName)) {
                        sketches.push({
                            name: fileName,
                            uri: FileUri.create(filePath).toString()
                        });
                    }
                }
            }
        }
        return sketches;
    }

    /**
     * Return all allowed files.
     * File extensions: "c", "cpp", "h", "hh", "hpp", "s", "pde", "ino"
     */
    async getSketchFiles(sketchFileStat: FileStat): Promise<string[]> {
        const uris: string[] = [];
        const sketchUri = new URI(sketchFileStat.uri);
        const sketchPath = await this.filesystem.getFsPath(sketchUri.toString());
        if (sketchPath) {
            if (sketchFileStat.isDirectory && this.isSketchFolder(sketchPath, sketchUri.displayName)) {
                const fileNames = fs.readdirSync(sketchPath);
                for (const fileName of fileNames) {
                    const filePath = path.join(sketchPath, fileName);
                    if (ALLOWED_FILE_EXTENSIONS.indexOf(path.extname(filePath)) !== -1
                        && fs.existsSync(filePath)
                        && fs.lstatSync(filePath).isFile()) {
                            uris.push(FileUri.create(filePath).toString())
                    }
                }
            } else {
                const sketchDir = path.dirname(sketchPath);
                if (sketchDir && this.isSketchFolder(sketchDir, sketchUri.path.dir.name)) {
                    const sketchFolderStat = await this.filesystem.getFileStat(sketchUri.path.dir.toString());
                    if (sketchFolderStat) {
                        const sketchDirContents = await this.getSketchFiles(sketchFolderStat);
                        uris.push(...sketchDirContents);
                    }
                }
            }
        }
        return uris;
    }

    protected isSketchFolder(path: string, name: string): boolean {
        if (fs.existsSync(path) && fs.lstatSync(path).isDirectory()) {
            const files = fs.readdirSync(path);
            for (let i = 0; i < files.length; i++) {
                if (files[i] === name + '.ino') {
                    return true;
                }
            }
        }
        return false;
    }
}