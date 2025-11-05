import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application-contribution';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { Emitter, Event } from '@theia/core/lib/common/event';
import { MessageService } from '@theia/core/lib/common/message-service';
import { deepClone } from '@theia/core/lib/common/objects';
import URI from '@theia/core/lib/common/uri';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { ConfigService, ConfigState } from '../../common/protocol';
import { NotificationCenter } from '../notification-center';

@injectable()
export class ConfigServiceClient implements FrontendApplicationContribution {
  @inject(ConfigService)
  private readonly delegate: ConfigService;
  @inject(NotificationCenter)
  private readonly notificationCenter: NotificationCenter;
  @inject(FrontendApplicationStateService)
  private readonly appStateService: FrontendApplicationStateService;
  @inject(MessageService)
  private readonly messageService: MessageService;

  private readonly didChangeSketchDirUriEmitter = new Emitter<
    URI | undefined
  >();
  private readonly didChangeDataDirUriEmitter = new Emitter<URI | undefined>();
  private readonly toDispose = new DisposableCollection(
    this.didChangeSketchDirUriEmitter,
    this.didChangeDataDirUriEmitter
  );

  private config: ConfigState | undefined;

  @postConstruct()
  protected init(): void {
    this.appStateService.reachedState('ready').then(async () => {
      const config = await this.delegate.getConfiguration();
      this.use(config);
    });
  }

  onStart(): void {
    console.log('just a test');
    this.notificationCenter.onConfigDidChange((config) => this.use(config));
  }

  onStop(): void {
    this.toDispose.dispose();
  }

  get onDidChangeSketchDirUri(): Event<URI | undefined> {
    return this.didChangeSketchDirUriEmitter.event;
  }

  get onDidChangeDataDirUri(): Event<URI | undefined> {
    return this.didChangeDataDirUriEmitter.event;
  }

  /**
   * CLI config related error messages if any.
   */
  tryGetMessages(): string[] | undefined {
    return this.config?.messages;
  }

  /**
   * `directories.user`
   */
  tryGetSketchDirUri(): URI | undefined {
    return this.config?.config?.sketchDirUri
      ? new URI(this.config?.config?.sketchDirUri)
      : undefined;
  }

  /**
   * `directories.data`
   */
  tryGetDataDirUri(): URI | undefined {
    return this.config?.config?.dataDirUri
      ? new URI(this.config?.config?.dataDirUri)
      : undefined;
  }

  private use(config: ConfigState): void {
    const oldConfig = deepClone(this.config);
    this.config = config;
    if (oldConfig?.config?.sketchDirUri !== this.config?.config?.sketchDirUri) {
      this.didChangeSketchDirUriEmitter.fire(this.tryGetSketchDirUri());
    }
    if (oldConfig?.config?.dataDirUri !== this.config?.config?.dataDirUri) {
      this.didChangeDataDirUriEmitter.fire(this.tryGetDataDirUri());
    }
    if (this.config.messages?.length) {
      const message = this.config.messages.join(' ');
      // toast the error later otherwise it might not show up in IDE2
      setTimeout(() => this.messageService.error(message), 1_000);
    }
  }
}
