import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { Emitter, Event } from '@theia/core/lib/common/event';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { Sketch } from '../../common/protocol';
import { AuthenticationSession } from '../../node/auth/types';
import { ArduinoPreferences } from '../arduino-preferences';
import { AuthenticationClientService } from '../auth/authentication-client-service';
import { LocalCacheFsProvider } from '../local-cache/local-cache-fs-provider';

@injectable()
export class CreateFeatures implements FrontendApplicationContribution {
  @inject(ArduinoPreferences)
  private readonly preferences: ArduinoPreferences;
  @inject(AuthenticationClientService)
  private readonly authenticationService: AuthenticationClientService;
  @inject(LocalCacheFsProvider)
  private readonly localCacheFsProvider: LocalCacheFsProvider;

  private readonly onDidChangeSessionEmitter = new Emitter<
    AuthenticationSession | undefined
  >();
  private readonly onDidChangeEnabledEmitter = new Emitter<boolean>();
  private readonly toDispose = new DisposableCollection(
    this.onDidChangeSessionEmitter,
    this.onDidChangeEnabledEmitter
  );
  private _enabled: boolean;
  private _session: AuthenticationSession | undefined;

  onStart(): void {
    this.toDispose.pushAll([
      this.authenticationService.onSessionDidChange((session) => {
        const oldSession = this._session;
        this._session = session;
        if (!!oldSession !== !!this._session) {
          this.onDidChangeSessionEmitter.fire(this._session);
        }
      }),
      this.preferences.onPreferenceChanged(({ preferenceName, newValue }) => {
        if (preferenceName === 'arduino.cloud.enabled') {
          const oldEnabled = this._enabled;
          this._enabled = Boolean(newValue);
          if (this._enabled !== oldEnabled) {
            this.onDidChangeEnabledEmitter.fire(this._enabled);
          }
        }
      }),
    ]);
    this._enabled = this.preferences['arduino.cloud.enabled'];
    this._session = this.authenticationService.session;
  }

  onStop(): void {
    this.toDispose.dispose();
  }

  get onDidChangeSession(): Event<AuthenticationSession | undefined> {
    return this.onDidChangeSessionEmitter.event;
  }

  get onDidChangeEnabled(): Event<boolean> {
    return this.onDidChangeEnabledEmitter.event;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get session(): AuthenticationSession | undefined {
    return this._session;
  }

  /**
   * `true` if the sketch is under `directories.data/RemoteSketchbook`. Otherwise, `false`.
   * Returns with `undefined` if `dataDirUri` is `undefined`.
   */
  isCloud(sketch: Sketch, dataDirUri: URI | undefined): boolean | undefined {
    if (!dataDirUri) {
      console.warn(
        `Could not decide whether the sketch ${sketch.uri} is cloud or local. The 'directories.data' location was not available from the CLI config.`
      );
      return undefined;
    }
    return dataDirUri.isEqualOrParent(new URI(sketch.uri));
  }

  cloudUri(sketch: Sketch): URI | undefined {
    if (!this.session) {
      return undefined;
    }
    return this.localCacheFsProvider.from(new URI(sketch.uri));
  }
}
