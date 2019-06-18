import { injectable } from "inversify";
import { SketchesService, Sketch } from "../common/protocol/sketches-service";
import URI from "@theia/core/lib/common/uri";
import { FileStat } from "@theia/filesystem/lib/common";
import * as fs from 'fs';
import * as path from 'path';

export const ALLOWED_FILE_EXTENSIONS = [".c", ".cpp", ".h", ".hh", ".hpp", ".s", ".pde", ".ino"];

@injectable()
export class SketchesServiceImpl implements SketchesService {

    async getSketches(fileStat?: FileStat): Promise<Sketch[]> {
        const sketches: Sketch[] = [];
        if (fileStat && fileStat.isDirectory) {
            const sketchFolderPath = this.getPath(fileStat);
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
    async getSketchFiles(sketchDir: FileStat): Promise<string[]> {
        const files: string[] = [];
        const sketchDirPath = this.getPath(sketchDir);
        const sketchDirContents = fs.readdirSync(sketchDirPath);
        sketchDirContents.forEach(fileName => {
            const filePath = path.join(sketchDirPath, fileName);
            if (fs.existsSync(filePath) &&
                fs.lstatSync(filePath).isFile() &&
                ALLOWED_FILE_EXTENSIONS.indexOf(path.extname(filePath)) !== -1) {
                    files.push(filePath);
            }
        });
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

    protected getPath(fileStat: FileStat) {
        const fileStatUri = fileStat.uri;
        const uri = new URI(fileStatUri);
        return uri.path.toString();
    }
}