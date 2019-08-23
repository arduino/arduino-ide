import { injectable, inject } from "inversify";
import URI from "@theia/core/lib/common/uri";
import { FileSystem } from "@theia/filesystem/lib/common";
import { WindowService } from "@theia/core/lib/browser/window/window-service";

@injectable()
export class SketchFactory {

    @inject(FileSystem)
    protected readonly fileSystem: FileSystem;

    @inject(WindowService)
    protected readonly windowService: WindowService;

    public async createNewSketch(parent: URI): Promise<void> {
        const monthNames = ["january", "february", "march", "april", "may", "june",
            "july", "august", "september", "october", "november", "december"
        ];
        const today = new Date();

        const sketchBaseName = `sketch_${monthNames[today.getMonth()]}${today.getDay()}`;
        let sketchName: string | undefined;
        for (let i = 97; i < 97 + 26; i++) {
            let sketchNameCandidate = `${sketchBaseName}${String.fromCharCode(i)}`;
            if (await this.fileSystem.exists(parent.resolve(sketchNameCandidate).toString())) {
                continue;
            }

            sketchName = sketchNameCandidate;
            break;
        }

        if (!sketchName) {
            throw new Error("Cannot create a unique sketch name");
        }

        try {
            const sketchDir = parent.resolve(sketchName);
            const sketchFile = sketchDir.resolve(`${sketchName}.ino`);
            this.fileSystem.createFolder(sketchDir.toString());
            this.fileSystem.createFile(sketchFile.toString(), {
                content: `
void setup() {
    // put your setup code here, to run once:

}

void loop() {
    // put your main code here, to run repeatedly:

}
`                   });
            const location = new URL(window.location.href);
            location.searchParams.set('sketch', sketchFile.toString());
            const hash = await this.fileSystem.getFsPath(sketchDir.toString());
            if (hash) {
                location.hash = hash;
            }
            this.windowService.openNewWindow(location.toString());
        } catch (e) {
            throw new Error("Cannot create new sketch: " + e);
        }
    }

}