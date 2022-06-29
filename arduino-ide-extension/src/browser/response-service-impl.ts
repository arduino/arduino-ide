import { inject, injectable } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/lib/common/event';
import {
  OutputChannelManager,
  OutputChannelSeverity,
} from '@theia/output/lib/browser/output-channel';
import {
  OutputMessage,
  ProgressMessage,
  ResponseServiceClient,
} from '../common/protocol/response-service';

@injectable()
export class ResponseServiceImpl implements ResponseServiceClient {
  @inject(OutputChannelManager)
  private readonly outputChannelManager: OutputChannelManager;

  private readonly progressDidChangeEmitter = new Emitter<ProgressMessage>();

  readonly onProgressDidChange = this.progressDidChangeEmitter.event;

  clearOutput(): void {
    this.outputChannelManager.getChannel('Arduino').clear();
  }

  appendToOutput(message: OutputMessage): void {
    const { chunk, severity } = message;
    const channel = this.outputChannelManager.getChannel('Arduino');
    channel.show({ preserveFocus: true });
    channel.append(chunk, mapSeverity(severity));
  }

  reportProgress(progress: ProgressMessage): void {
    this.progressDidChangeEmitter.fire(progress);
  }
}

function mapSeverity(severity?: OutputMessage.Severity): OutputChannelSeverity {
  if (severity === OutputMessage.Severity.Error) {
    return OutputChannelSeverity.Error;
  } else if (severity === OutputMessage.Severity.Warning) {
    return OutputChannelSeverity.Warning;
  }
  return OutputChannelSeverity.Info;
}
