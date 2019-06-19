import { injectable, inject } from "inversify";
import { SketchesService, Sketch } from "../common/protocol/sketches-service";
import URI from "@theia/core/lib/common/uri";
import { FileStat, FileSystem } from "@theia/filesystem/lib/common";
import * as fs from 'fs';
import * as path from 'path';

export const ALLOWED_FILE_EXTENSIONS = [".c", ".cpp", ".h", ".hh", ".hpp", ".s", ".pde", ".ino"];

@injectable()
export class SketchesServiceImpl implements SketchesService {

    @inject(FileSystem)
    protected readonly filesystem: FileSystem;

    async getSketches(fileStat?: FileStat): Promise<Sketch[]> {
        const sketches: Sketch[] = [];
        if (fileStat && fileStat.isDirectory) {
            const uri = new URI(fileStat.uri);
            const sketchFolderPath = uri.path.toString()
            const files = fs.readdirSync(sketchFolderPath);
            files.forEach(file => {
                const filePath = path.join(sketchFolderPath, file);
                if (this.isSketchFolder(filePath, file)) {
                    sketches.push({
                        name: file,
                        uri: filePath
                    });
                }
            });
        }
        return sketches;
    }

    /**
     * Return all allowed files.
     * File extensions: "c", "cpp", "h", "hh", "hpp", "s", "pde", "ino"
     */
    async getSketchFiles(sketchFileStat: FileStat): Promise<string[]> {
        const files: string[] = [];
        const sketchUri = new URI(sketchFileStat.uri);
        const sketchPath = sketchUri.path.toString();
        if (sketchFileStat.isDirectory && this.isSketchFolder(sketchPath, sketchUri.displayName)) {
            const sketchDirContents = fs.readdirSync(sketchPath);
            sketchDirContents.forEach(fileName => {
                const filePath = path.join(sketchPath, fileName);
                if (fs.existsSync(filePath) &&
                    fs.lstatSync(filePath).isFile() &&
                    ALLOWED_FILE_EXTENSIONS.indexOf(path.extname(filePath)) !== -1) {
                    files.push(filePath);
                }
            });
        } else {
            const sketchDir = sketchUri.path.dir;
            if (this.isSketchFolder(sketchDir.toString(), sketchDir.name)) {
                const sketchFolderStat = await this.filesystem.getFileStat(sketchDir.toString());
                if (sketchFolderStat) {
                    const sketchDirContents = await this.getSketchFiles(sketchFolderStat);
                    files.push(...sketchDirContents);
                }
            }
        }
        return files;
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