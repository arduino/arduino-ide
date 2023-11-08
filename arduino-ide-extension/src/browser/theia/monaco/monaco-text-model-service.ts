import { inject, injectable } from '@theia/core/shared/inversify';
import { Resource } from '@theia/core/lib/common/resource';
import { ILogger, Log, Loggable } from '@theia/core/lib/common/logger';
import { MonacoEditorModel } from '@theia/monaco/lib/browser/monaco-editor-model';
import { EditorPreferences } from '@theia/editor/lib/browser/editor-preferences';
import { MonacoToProtocolConverter } from '@theia/monaco/lib/browser/monaco-to-protocol-converter';
import { ProtocolToMonacoConverter } from '@theia/monaco/lib/browser/protocol-to-monaco-converter';
import { MonacoTextModelService as TheiaMonacoTextModelService } from '@theia/monaco/lib/browser/monaco-text-model-service';
import { SketchesServiceClientImpl } from '../../sketches-service-client-impl';

@injectable()
export class MonacoTextModelService extends TheiaMonacoTextModelService {
  @inject(SketchesServiceClientImpl)
  protected readonly sketchesServiceClient: SketchesServiceClientImpl;

  protected override async createModel(
    resource: Resource
  ): Promise<MonacoEditorModel> {
    const factory = this.factories
      .getContributions()
      .find(({ scheme }) => resource.uri.scheme === scheme);
    const readOnly =
      Boolean(resource.isReadonly) ||
      this.sketchesServiceClient.isReadOnly(resource.uri);
    return factory
      ? factory.createModel(resource)
      : new MaybeReadonlyMonacoEditorModel(
          resource,
          this.m2p,
          this.p2m,
          this.logger,
          undefined,
          readOnly
        );
  }
}

// https://github.com/eclipse-theia/theia/pull/8491
class SilentMonacoEditorModel extends MonacoEditorModel {
  protected override trace(loggable: Loggable): void {
    if (this.logger) {
      this.logger.trace((log: Log) =>
        loggable((message, ...params) =>
          log(message, ...params, this.resource.uri.toString(true))
        )
      );
    }
  }
}

class MaybeReadonlyMonacoEditorModel extends SilentMonacoEditorModel {
  constructor(
    protected override readonly resource: Resource,
    protected override readonly m2p: MonacoToProtocolConverter,
    protected override readonly p2m: ProtocolToMonacoConverter,
    protected override readonly logger?: ILogger,
    protected override readonly editorPreferences?: EditorPreferences,
    protected readonly _readOnly?: boolean
  ) {
    super(resource, m2p, p2m, logger, editorPreferences);
  }

  override get readOnly(): boolean {
    if (typeof this._readOnly === 'boolean') {
      return this._readOnly;
    }
    return this.resource.saveContents === undefined;
  }

  protected override setDirty(dirty: boolean): void {
    if (this._readOnly === true) {
      // NOOP
      return;
    }
    if (dirty === this._dirty) {
      return;
    }
    this._dirty = dirty;
    if (dirty === false) {
      this['updateSavedVersionId']();
    }
    this.onDirtyChangedEmitter.fire(undefined);
  }
}
