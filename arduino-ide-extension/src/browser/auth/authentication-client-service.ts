import { inject, injectable } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/lib/common/event';
import { JsonRpcProxy } from '@theia/core/lib/common/messaging/proxy-factory';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application-contribution';
import {
  CommandRegistry,
  CommandContribution,
} from '@theia/core/lib/common/command';
import {
  AuthOptions,
  AuthenticationService,
  AuthenticationServiceClient,
  AuthenticationSession,
  authServerPort,
} from '../../common/protocol/authentication-service';
import { CloudUserCommands } from './cloud-user-commands';
import { ArduinoPreferences } from '../arduino-preferences';

@injectable()
export class AuthenticationClientService
  implements
    FrontendApplicationContribution,
    CommandContribution,
    AuthenticationServiceClient
{
  @inject(AuthenticationService)
  protected readonly service: JsonRpcProxy<AuthenticationService>;

  @inject(WindowService)
  protected readonly windowService: WindowService;

  @inject(ArduinoPreferences)
  protected readonly arduinoPreferences: ArduinoPreferences;

  protected authOptions: AuthOptions;
  protected _session: AuthenticationSession | undefined;
  protected readonly toDispose = new DisposableCollection();
  protected readonly onSessionDidChangeEmitter = new Emitter<
    AuthenticationSession | undefined
  >();

  readonly onSessionDidChange = this.onSessionDidChangeEmitter.event;

  async onStart(): Promise<void> {
    this.toDispose.push(this.onSessionDidChangeEmitter);
    this.service.setClient(this);
    this.service
      .session()
      .then((session) => this.notifySessionDidChange(session));

    this.setOptions().then(() => this.service.initAuthSession());

    this.arduinoPreferences.onPreferenceChanged((event) => {
      if (event.preferenceName.startsWith('arduino.auth.')) {
        this.setOptions();
      }
    });
  }

  setOptions(): Promise<void> {
    return this.service.setOptions({
      redirectUri: `http://localhost:${authServerPort}/callback`,
      responseType: 'code',
      clientID: this.arduinoPreferences['arduino.auth.clientID'],
      domain: this.arduinoPreferences['arduino.auth.domain'],
      audience: this.arduinoPreferences['arduino.auth.audience'],
      registerUri: this.arduinoPreferences['arduino.auth.registerUri'],
      scopes: ['openid', 'profile', 'email', 'offline_access'],
    });
  }

  protected updateSession(session?: AuthenticationSession | undefined) {
    this._session = session;
    this.onSessionDidChangeEmitter.fire(this._session);
  }

  get session(): AuthenticationSession | undefined {
    return this._session;
  }

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(CloudUserCommands.LOGIN, {
      execute: () => this.service.login(),
      isEnabled: () => !this._session,
      isVisible: () => !this._session,
    });
    registry.registerCommand(CloudUserCommands.LOGOUT, {
      execute: () => this.service.logout(),
      isEnabled: () => !!this._session,
      isVisible: () => !!this._session,
    });
  }

  notifySessionDidChange(session: AuthenticationSession | undefined): void {
    this.updateSession(session);
  }
}
