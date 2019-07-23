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
            const sketchFolderPath = await this.filesystem.getFsPath(uri.toString());
            if (sketchFolderPath) {
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
        }
        return sketches;
    }

    /**
     * Return all allowed files.
     * File extensions: "c", "cpp", "h", "hh", "hpp", "s", "pde", "ino"
     */
    async getSketchFiles(sketchFileStat: FileStat): Promise<FileStat[]> {
        const files: FileStat[] = [];
        const sketchUri = new URI(sketchFileStat.uri);
        const sketchPath = await this.filesystem.getFsPath(sketchUri.toString());
        if (sketchPath) {
            if (sketchFileStat.isDirectory && this.isSketchFolder(sketchPath, sketchUri.displayName)) {
                const sketchDirContents = fs.readdirSync(sketchPath);
                for (const i in sketchDirContents) {
                    const fileName = sketchDirContents[i];
                    const filePath = path.join(sketchPath, fileName);
                    if (fs.existsSync(filePath) &&
                        fs.lstatSync(filePath).isFile() &&
                        ALLOWED_FILE_EXTENSIONS.indexOf(path.extname(filePath)) !== -1) {
                        const fileStat = await this.filesystem.getFileStat(filePath);
                        if (fileStat) {
                            console.log("111111111111", fileStat);
                            files.push(fileStat);
                            console.log("222222222222222", files);
                        }
                    }
                }
            } else {
                const sketchDir = path.dirname(sketchPath);
                if (sketchDir && this.isSketchFolder(sketchDir, sketchUri.path.dir.name)) {
                    const sketchFolderStat = await this.filesystem.getFileStat(sketchUri.path.dir.toString());
                    if (sketchFolderStat) {
                        const sketchDirContents = await this.getSketchFiles(sketchFolderStat);
                        files.push(...sketchDirContents);
                    }
                }
            }
        }
        console.log("###FILEPATH###", files);
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