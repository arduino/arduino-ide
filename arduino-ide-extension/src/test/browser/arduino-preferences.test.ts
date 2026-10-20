import { PreferenceScope } from '@theia/core/lib/browser/preferences';
import { expect } from 'chai';
import { ArduinoConfigSchema } from '../../browser/arduino-preferences';

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
});
