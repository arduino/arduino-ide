import debounce = require('p-debounce');
import { inject, injectable, postConstruct } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { Event, Emitter } from '@theia/core/lib/common/event';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { DebugConfiguration } from '@theia/debug/lib/common/debug-common';
import { DebugConfigurationModel as TheiaDebugConfigurationModel } from '@theia/debug/lib/browser/debug-configuration-model';
import { DebugConfigurationManager as TheiaDebugConfigurationManager } from '@theia/debug/lib/browser/debug-configuration-manager';
import { SketchesService } from '../../../common/protocol';
import { SketchesServiceClientImpl } from '../../../common/protocol/sketches-service-client-impl';
import { DebugConfigurationModel } from './debug-configuration-model';
import { FileOperationError, FileOperationResult } from '@theia/filesystem/lib/common/files';

@injectable()
export class DebugConfigurationManager extends TheiaDebugConfigurationManager {

    @inject(SketchesService)
    protected readonly sketchesService: SketchesService;

    @inject(SketchesServiceClientImpl)
    protected readonly sketchesServiceClient: SketchesServiceClientImpl;

    @inject(FrontendApplicationStateService)
    protected readonly appStateService: FrontendApplicationStateService;

    protected onTempContentDidChangeEmitter = new Emitter<TheiaDebugConfigurationModel.JsonContent>();
    get onTempContentDidChange(): Event<TheiaDebugConfigurationModel.JsonContent> {
        return this.onTempContentDidChangeEmitter.event;
    }

    @postConstruct()
    protected async init(): Promise<void> {
        super.init();
        this.appStateService.reachedState('ready').then(async () => {
            const tempContent = await this.getTempLaunchJsonContent();
            if (!tempContent) {
                // No active sketch.
                return;
            }
            // Watch the file of the container folder.
            this.fileService.watch(tempContent instanceof URI ? tempContent : tempContent.uri);
            // Use the normalized temp folder name. We cannot compare Theia URIs here.
            // /var/folders/k3/d2fkvv1j16v3_rz93k7f74180000gn/T/arduino-ide2-a0337d47f86b24a51df3dbcf2cc17925/launch.json
            // /private/var/folders/k3/d2fkvv1j16v3_rz93k7f74180000gn/T/arduino-ide2-A0337D47F86B24A51DF3DBCF2CC17925/launch.json
            const tempFolderName = (tempContent instanceof URI ? tempContent : tempContent.uri.parent).path.base.toLowerCase();
            this.fileService.onDidFilesChange(event => {
                for (const { resource } of event.changes) {
                    if (resource.path.base === 'launch.json' && resource.parent.path.base.toLowerCase() === tempFolderName) {
                        this.getTempLaunchJsonContent().then(config => {
                            if (config && !(config instanceof URI)) {
                                this.onTempContentDidChangeEmitter.fire(config);
                            }
                        });
                        break;
                    }
                }
            });
            this.updateModels();
        });
    }

    protected updateModels = debounce(async () => {
        await this.appStateService.reachedState('ready');
        const roots = await this.workspaceService.roots;
        const toDelete = new Set(this.models.keys());
        for (const rootStat of roots) {
            const key = rootStat.resource.toString();
            toDelete.delete(key);
            if (!this.models.has(key)) {
                const tempContent = await this.getTempLaunchJsonContent();
                if (!tempContent) {
                    continue;
                }
                const configurations: DebugConfiguration[] = tempContent instanceof URI ? [] : tempContent.configurations;
                const uri = tempContent instanceof URI ? undefined : tempContent.uri;
                const model = new DebugConfigurationModel(key, this.preferences, configurations, uri, this.onTempContentDidChange);
                model.onDidChange(() => this.updateCurrent());
                model.onDispose(() => this.models.delete(key));
                this.models.set(key, model);
            }
        }
        for (const uri of toDelete) {
            const model = this.models.get(uri);
            if (model) {
                model.dispose();
            }
        }
        this.updateCurrent();
    }, 500);

    protected async getTempLaunchJsonContent(): Promise<TheiaDebugConfigurationModel.JsonContent & { uri: URI } | URI | undefined> {
        const sketch = await this.sketchesServiceClient.currentSketch();
        if (!sketch) {
            return undefined;
        }
        const uri = await this.sketchesService.getIdeTempFolderUri(sketch);
        const tempFolderUri = new URI(uri);
        await this.fileService.createFolder(tempFolderUri);
        try {
            const uri = tempFolderUri.resolve('launch.json');
            const { value } = await this.fileService.read(uri);
            const configurations = DebugConfigurationModel.parse(JSON.parse(value));
            return { uri, configurations };
        } catch (err) {
            if (err instanceof FileOperationError && err.fileOperationResult === FileOperationResult.FILE_NOT_FOUND) {
                return tempFolderUri;
            }
            console.error('Could not load debug configuration from IDE2 temp folder.', err);
            throw err;
        }
    }

}
