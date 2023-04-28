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
import {
  ARDUINO_CLOUD_FOLDER,
  REMOTE_SKETCHBOOK_FOLDER,
} from '../utils/constants';
import { CreateUri } from './create-uri';

export type CloudSketchState = 'push' | 'pull';

@injectable()
export class CreateFeatures implements FrontendApplicationContribution {
  @inject(ArduinoPreferences)
  private readonly preferences: ArduinoPreferences;
  @inject(AuthenticationClientService)
  private readonly authenticationService: AuthenticationClientService;
  @inject(LocalCacheFsProvider)
  private readonly localCacheFsProvider: LocalCacheFsProvider;

  /**
   * The keys are the Create URI of the sketches.
   */
  private readonly _cloudSketchStates = new Map<string, CloudSketchState>();
  private readonly onDidChangeSessionEmitter = new Emitter<
    AuthenticationSession | undefined
  >();
  private readonly onDidChangeEnabledEmitter = new Emitter<boolean>();
  private readonly onDidChangeCloudSketchStateEmitter = new Emitter<{
    uri: URI;
    state: CloudSketchState | undefined;
  }>();
  private readonly toDispose = new DisposableCollection(
    this.onDidChangeSessionEmitter,
    this.onDidChangeEnabledEmitter,
    this.onDidChangeCloudSketchStateEmitter
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

  get onDidChangeCloudSketchState(): Event<{
    uri: URI;
    state: CloudSketchState | undefined;
  }> {
    return this.onDidChangeCloudSketchStateEmitter.event;
  }

  get session(): AuthenticationSession | undefined {
    return this._session;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  cloudSketchState(uri: URI): CloudSketchState | undefined {
    return this._cloudSketchStates.get(uri.toString());
  }

  setCloudSketchState(uri: URI, state: CloudSketchState | undefined): void {
    if (uri.scheme !== CreateUri.scheme) {
      throw new Error(
        `Expected a URI with '${uri.scheme}' scheme. Got: ${uri.toString()}`
      );
    }
    const key = uri.toString();
    if (!state) {
      if (!this._cloudSketchStates.delete(key)) {
        console.warn(
          `Could not reset the cloud sketch state of ${key}. No state existed for the the cloud sketch.`
        );
      } else {
        this.onDidChangeCloudSketchStateEmitter.fire({ uri, state: undefined });
      }
    } else {
      this._cloudSketchStates.set(key, state);
      this.onDidChangeCloudSketchStateEmitter.fire({ uri, state });
    }
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
    return dataDirUri
      .resolve(REMOTE_SKETCHBOOK_FOLDER)
      .resolve(ARDUINO_CLOUD_FOLDER)
      .isEqualOrParent(new URI(sketch.uri));
  }

  cloudUri(sketch: Sketch): URI | undefined {
    if (!this.session) {
      return undefined;
    }
    return this.localCacheFsProvider.from(new URI(sketch.uri));
  }
}
