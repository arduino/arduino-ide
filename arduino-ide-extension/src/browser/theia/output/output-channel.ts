import * as PQueue from 'p-queue';
import { injectable } from 'inversify';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { OutputUri } from '@theia/output/lib/common/output-uri';
import { IReference } from '@theia/monaco-editor-core/esm/vs/base/common/lifecycle';
import { MonacoEditorModel } from '@theia/monaco/lib/browser/monaco-editor-model';
import {
  OutputChannelManager as TheiaOutputChannelManager,
  OutputChannel as TheiaOutputChannel,
} from '@theia/output/lib/browser/output-channel';

@injectable()
export class OutputChannelManager extends TheiaOutputChannelManager {
  getChannel(name: string): TheiaOutputChannel {
    const existing = this.channels.get(name);
    if (existing) {
      return existing;
    }

    // We have to register the resource first, because `textModelService#createModelReference` will require it
    // right after creating the monaco.editor.ITextModel.
    // All `append` and `appendLine` will be deferred until the underlying text-model instantiation.
    let resource = this.resources.get(name);
    if (!resource) {
      const uri = OutputUri.create(name);
      const editorModelRef = new Deferred<IReference<MonacoEditorModel>>();
      resource = this.createResource({ uri, editorModelRef });
      this.resources.set(name, resource);
      this.textModelService
        .createModelReference(uri)
        .then((ref) => editorModelRef.resolve(ref));
    }

    const channel = new OutputChannel(resource, this.preferences);
    this.channels.set(name, channel);
    this.toDisposeOnChannelDeletion.set(name, this.registerListeners(channel));
    this.channelAddedEmitter.fire(channel);
    if (!this.selectedChannel) {
      this.selectedChannel = channel;
    }
    return channel;
  }
}

export class OutputChannel extends TheiaOutputChannel {
  dispose(): void {
    super.dispose();
    if ((this as any).disposed) {
      const textModifyQueue: PQueue = (this as any).textModifyQueue;
      textModifyQueue.pause();
      textModifyQueue.clear();
    }
  }
}
