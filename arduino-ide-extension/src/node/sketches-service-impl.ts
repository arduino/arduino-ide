import { injectable, inject } from 'inversify';
import * as path from 'path';
import * as fs from './fs-extra';
import { FileUri } from '@theia/core/lib/node';
import { ConfigService } from '../common/protocol/config-service';
import { SketchesService, Sketch } from '../common/protocol/sketches-service';

export const ALLOWED_FILE_EXTENSIONS = ['.c', '.cpp', '.h', '.hh', '.hpp', '.s', '.pde', '.ino'];

// TODO: `fs`: use async API 
@injectable()
export class SketchesServiceImpl implements SketchesService {

    @inject(ConfigService)
    protected readonly configService: ConfigService;

    async getSketches(uri?: string): Promise<Sketch[]> {
        const sketches: Array<Sketch & { mtimeMs: number }> = [];
        let fsPath: undefined | string;
        if (!uri) {
            const { sketchDirUri } = await this.configService.getConfiguration();
            fsPath = FileUri.fsPath(sketchDirUri);
            if (!fs.existsSync(fsPath)) {
                await fs.mkdirp(fsPath);
            }
        } else {
            fsPath = FileUri.fsPath(uri);
        }
        if (!fs.existsSync(fsPath)) {
            return [];
        }
        const fileNames = await fs.readdir(fsPath);
        for (const fileName of fileNames) {
            const filePath = path.join(fsPath, fileName);
            if (await this.isSketchFolder(FileUri.create(filePath).toString())) {
                const stat = await fs.stat(filePath);
                sketches.push({
                    mtimeMs: stat.mtimeMs,
                    name: fileName,
                    uri: FileUri.create(filePath).toString()
                });
            }
        }
        return sketches.sort((left, right) => right.mtimeMs - left.mtimeMs);
    }

    /**
     * Return all allowed files.
     * File extensions: 'c', 'cpp', 'h', 'hh', 'hpp', 's', 'pde', 'ino'
     */
    async getSketchFiles(uri: string): Promise<string[]> {
        const uris: string[] = [];
        const fsPath = FileUri.fsPath(uri);
        if (fs.lstatSync(fsPath).isDirectory()) {
            if (await this.isSketchFolder(uri)) {
                const fileNames = await fs.readdir(fsPath);
                for (const fileName of fileNames) {
                    const filePath = path.join(fsPath, fileName);
                    if (ALLOWED_FILE_EXTENSIONS.indexOf(path.extname(filePath)) !== -1
                        && fs.existsSync(filePath)
                        && fs.lstatSync(filePath).isFile()) {
                        uris.push(FileUri.create(filePath).toString())
                    }
                }
            }
            return uris;
        }
        const sketchDir = path.dirname(fsPath);
        return this.getSketchFiles(FileUri.create(sketchDir).toString());
    }

    async createNewSketch(parentUri?: string): Promise<Sketch> {
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ];
        const today = new Date();
        const uri = !!parentUri ? parentUri : (await this.configService.getConfiguration()).sketchDirUri;
        const parent = FileUri.fsPath(uri);

        const sketchBaseName = `sketch_${monthNames[today.getMonth()]}${today.getDate()}`;
        let sketchName: string | undefined;
        for (let i = 97; i < 97 + 26; i++) {
            let sketchNameCandidate = `${sketchBaseName}${String.fromCharCode(i)}`;
            if (fs.existsSync(path.join(parent, sketchNameCandidate))) {
                continue;
            }

            sketchName = sketchNameCandidate;
            break;
        }

        if (!sketchName) {
            throw new Error('Cannot create a unique sketch name');
        }

        const sketchDir = path.join(parent, sketchName)
        const sketchFile = path.join(sketchDir, `${sketchName}.ino`);
        await fs.mkdirp(sketchDir);
        await fs.writeFile(sketchFile, `
void setup() {
// put your setup code here, to run once:

}

void loop() {
// put your main code here, to run repeatedly:

}
`, { encoding: 'utf8' });
        return {
            name: sketchName,
            uri: FileUri.create(sketchDir).toString()
        }
    }

    async isSketchFolder(uri: string): Promise<boolean> {
        const fsPath = FileUri.fsPath(uri);
        if (fs.existsSync(fsPath) && fs.lstatSync(fsPath).isDirectory()) {
            const basename = path.basename(fsPath);
            const files = await fs.readdir(fsPath);
            for (let i = 0; i < files.length; i++) {
                if (files[i] === basename + '.ino') {
                    return true;
                }
            }
        }
        return false;
    }
}
