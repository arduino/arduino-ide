import { injectable } from 'inversify';
import { Resource } from '@theia/core/lib/common/resource';
import { MaybePromise } from '@theia/core/lib/common/types';
import { Log, Loggable } from '@theia/core/lib/common/logger';
import { MonacoEditorModel } from '@theia/monaco/lib/browser/monaco-editor-model';
import { MonacoTextModelService as TheiaMonacoTextModelService } from '@theia/monaco/lib/browser/monaco-text-model-service';

@injectable()
export class MonacoTextModelService extends TheiaMonacoTextModelService {

    protected createModel(resource: Resource): MaybePromise<MonacoEditorModel> {
        const factory = this.factories.getContributions().find(({ scheme }) => resource.uri.scheme === scheme);
        return factory ? factory.createModel(resource) : new SilentMonacoEditorModel(resource, this.m2p, this.p2m, this.logger);
    }

}

// https://github.com/eclipse-theia/theia/pull/8491
export class SilentMonacoEditorModel extends MonacoEditorModel {

    protected trace(loggable: Loggable): void {
        if (this.logger) {
            this.logger.trace((log: Log) =>
                loggable((message, ...params) => log(message, ...params, this.resource.uri.toString(true)))
            );
        }
    }

}
