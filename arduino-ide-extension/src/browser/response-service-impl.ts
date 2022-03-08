import { inject, injectable } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/lib/common/event';
import { OutputContribution } from '@theia/output/lib/browser/output-contribution';
import { OutputChannelManager } from '@theia/output/lib/browser/output-channel';
import {
  OutputMessage,
  ProgressMessage,
  ResponseServiceArduino,
} from '../common/protocol/response-service';

@injectable()
export class ResponseServiceImpl implements ResponseServiceArduino {
  @inject(OutputContribution)
  protected outputContribution: OutputContribution;

  @inject(OutputChannelManager)
  protected outputChannelManager: OutputChannelManager;

  protected readonly progressDidChangeEmitter = new Emitter<ProgressMessage>();

  readonly onProgressDidChange = this.progressDidChangeEmitter.event;

  clearArduinoChannel(): void {
    this.outputChannelManager.getChannel('Arduino').clear();
  }

  appendToOutput(message: OutputMessage): void {
    const { chunk } = message;
    const channel = this.outputChannelManager.getChannel('Arduino');
    channel.show({ preserveFocus: true });
    channel.append(chunk);
  }

  reportProgress(progress: ProgressMessage): void {
    this.progressDidChangeEmitter.fire(progress);
  }
}
