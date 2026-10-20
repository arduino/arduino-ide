import { enableJSDOM } from '@theia/core/lib/browser/test/jsdom';
const disableJSDOM = enableJSDOM();

import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
FrontendApplicationConfigProvider.set({});

import { bindPreferenceService } from '@theia/core/lib/browser/frontend-application-bindings';
import {
  PreferenceProvider,
  PreferenceScope,
  PreferenceService,
} from '@theia/core/lib/browser/preferences';
import {
  bindMockPreferenceProviders,
  MockPreferenceProvider,
} from '@theia/core/lib/browser/preferences/test';
import { Container } from '@theia/core/shared/inversify';
import { expect } from 'chai';
import {
  ArduinoConfigSchema,
  ArduinoConfiguration,
  ArduinoPreferences,
  bindArduinoPreferences,
  UpdateChannel,
} from '../../browser/arduino-preferences';

disableJSDOM();

// These preferences choose where the IDE downloads updates from, where it sends Arduino
// Cloud credentials to, and which certificates are flashed to boards.
// Only the user settings can set them.
const userScopedPreferences = [
  'arduino.ide.updateChannel',
  'arduino.ide.updateBaseUrl',
  'arduino.cloud.sketchSyncEndpoint',
  'arduino.cloud.sharedSpaceID',
  'arduino.board.certificates',
];
const userScopedPrefixes = ['arduino.auth.'];

describe('arduino-preferences', () => {
  const properties = ArduinoConfigSchema.properties;
  const preferenceNames = [
    ...userScopedPreferences,
    ...Object.keys(properties).filter((name) =>
      userScopedPrefixes.some((prefix) => name.startsWith(prefix))
    ),
  ];

  preferenceNames.forEach((name) =>
    it(`'${name}' should be user scoped`, () => {
      expect(properties[name]).to.be.not.undefined;
      expect(properties[name].scope).to.be.equal(PreferenceScope.User);
    })
  );

  describe('resolution', () => {
    let disableJSDOMAfter: () => void;
    let container: Container;
    let preferences: ArduinoPreferences;

    before(() => {
      disableJSDOMAfter = enableJSDOM();
      FrontendApplicationConfigProvider.set({});
    });

    after(() => disableJSDOMAfter());

    beforeEach(async () => {
      container = new Container();
      bindPreferenceService(container.bind.bind(container));
      bindMockPreferenceProviders(
        container.bind.bind(container),
        container.unbind.bind(container)
      );
      bindArduinoPreferences(container.bind.bind(container));
      [
        PreferenceScope.User,
        PreferenceScope.Workspace,
        PreferenceScope.Folder,
      ].forEach((scope) => provider(scope).markReady());
      await container.get<PreferenceService>(PreferenceService).ready;
      preferences = container.get<ArduinoPreferences>(ArduinoPreferences);
    });

    function provider(scope: PreferenceScope): MockPreferenceProvider {
      return container.getNamed(
        PreferenceProvider,
        scope
      ) as MockPreferenceProvider;
    }

    async function setWorkspacePreferences(): Promise<void> {
      const serverUrl = 'http://127.0.0.1:8000';
      const workspacePreferences: Partial<ArduinoConfiguration> = {
        'arduino.ide.updateChannel': UpdateChannel.Nightly,
        'arduino.ide.updateBaseUrl': serverUrl,
        'arduino.board.certificates': '127.0.0.1',
        'arduino.cloud.sketchSyncEndpoint': `${serverUrl}/create`,
        'arduino.cloud.sharedSpaceID': 'other',
        'arduino.auth.clientID': 'other',
        'arduino.auth.domain': '127.0.0.1:8000',
        'arduino.auth.audience': serverUrl,
        'arduino.auth.registerUri': serverUrl,
      };
      for (const scope of [PreferenceScope.Workspace, PreferenceScope.Folder]) {
        for (const [name, value] of Object.entries(workspacePreferences)) {
          await provider(scope).setPreference(name, value);
        }
      }
    }

    it('should use the user preferences', async () => {
      await provider(PreferenceScope.User).setPreference(
        'arduino.cloud.sharedSpaceID',
        'my-space'
      );
      await setWorkspacePreferences();
      expect(preferences['arduino.cloud.sharedSpaceID']).to.be.equal(
        'my-space'
      );
    });

    it('should use the workspace preferences that are not user scoped', async () => {
      await provider(PreferenceScope.Workspace).setPreference(
        'arduino.compile.verbose',
        true
      );
      expect(preferences['arduino.compile.verbose']).to.be.true;
    });

    it('should ignore the workspace and folder preferences', async () => {
      await setWorkspacePreferences();
      expect(preferences['arduino.ide.updateChannel']).to.be.equal(
        UpdateChannel.Stable
      );
      expect(preferences['arduino.ide.updateBaseUrl']).to.be.equal(
        'https://downloads.arduino.cc/arduino-ide'
      );
      expect(preferences['arduino.board.certificates']).to.be.equal('');
      expect(preferences['arduino.cloud.sketchSyncEndpoint']).to.be.equal(
        'https://api2.arduino.cc/create'
      );
      expect(preferences['arduino.cloud.sharedSpaceID']).to.be.equal('');
      expect(preferences['arduino.auth.clientID']).to.be.equal(
        'C34Ya6ex77jTNxyKWj01lCe1vAHIaPIo'
      );
      expect(preferences['arduino.auth.domain']).to.be.equal(
        'login.arduino.cc'
      );
      expect(preferences['arduino.auth.audience']).to.be.equal(
        'https://api.arduino.cc'
      );
      expect(preferences['arduino.auth.registerUri']).to.be.equal(
        'https://auth.arduino.cc/login#/register'
      );
    });
  });
});
