import { expect } from 'chai';
import {
  longestPrefixMatch,
  reconcileSettings,
} from '../../node/monitor-settings/monitor-settings-utils';
import { PluggableMonitorSettings } from '../../node/monitor-settings/monitor-settings-provider';

type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> };

// use(require('chai-string'));

describe('longestPrefixMatch', () => {
  const settings = {
    'arduino:avr:uno-port1-protocol1': {
      name: 'Arduino Uno',
    },
    'arduino:avr:due-port1-protocol2': {
      name: 'Arduino Due',
    },
  };

  it('should return the exact prefix when found', async () => {
    const prefix = 'arduino:avr:uno-port1-protocol1';

    const { matchingPrefix } = longestPrefixMatch(
      prefix,
      settings as unknown as Record<string, PluggableMonitorSettings>
    );

    expect(matchingPrefix).to.equal(prefix);
  });

  it('should return the exact object when the prefix match', async () => {
    const prefix = 'arduino:avr:uno-port1-protocol1';

    const { matchingSettings } = longestPrefixMatch(
      prefix,
      settings as unknown as Record<string, PluggableMonitorSettings>
    );

    expect(matchingSettings).to.have.property('name').to.equal('Arduino Uno');
  });

  it('should return a partial matching prefix when a similar object is found', async () => {
    const prefix = 'arduino:avr:due-port2-protocol2';

    const { matchingPrefix } = longestPrefixMatch(
      prefix,
      settings as unknown as Record<string, PluggableMonitorSettings>
    );

    expect(matchingPrefix).to.equal('arduino:avr:due');
  });

  it('should return the closest object when the prefix partially match', async () => {
    const prefix = 'arduino:avr:uno-port1-protocol2';

    const { matchingSettings } = longestPrefixMatch(
      prefix,
      settings as unknown as Record<string, PluggableMonitorSettings>
    );

    expect(matchingSettings).to.have.property('name').to.equal('Arduino Uno');
  });

  it('should return an empty matching prefix when no similar object is found', async () => {
    const prefix = 'arduino:avr:tre-port2-protocol2';

    const { matchingPrefix } = longestPrefixMatch(
      prefix,
      settings as unknown as Record<string, PluggableMonitorSettings>
    );

    expect(matchingPrefix).to.equal('');
  });

  it('should return an empty object when no similar object is found', async () => {
    const prefix = 'arduino:avr:tre-port1-protocol2';

    const { matchingSettings } = longestPrefixMatch(
      prefix,
      settings as unknown as Record<string, PluggableMonitorSettings>
    );

    expect(matchingSettings).to.be.empty;
  });
});

describe('reconcileSettings', () => {
  const defaultSettings = {
    setting1: {
      id: 'setting1',
      label: 'Label setting1',
      type: 'enum',
      values: ['a', 'b', 'c'],
      selectedValue: 'b',
    },
    setting2: {
      id: 'setting2',
      label: 'Label setting2',
      type: 'enum',
      values: ['a', 'b', 'c'],
      selectedValue: 'b',
    },
    setting3: {
      id: 'setting3',
      label: 'Label setting3',
      type: 'enum',
      values: ['a', 'b', 'c'],
      selectedValue: 'b',
    },
  };

  it('should return default settings if new settings are missing', async () => {
    const newSettings: PluggableMonitorSettings = {};

    const reconciledSettings = reconcileSettings(newSettings, defaultSettings);

    expect(reconciledSettings).to.deep.equal(defaultSettings);
  });

  it('should add missing attributes copying it from the default settings', async () => {
    const newSettings: PluggableMonitorSettings = JSON.parse(
      JSON.stringify(defaultSettings)
    );
    delete newSettings.setting2;

    const reconciledSettings = reconcileSettings(newSettings, defaultSettings);

    expect(reconciledSettings).to.have.property('setting2');
  });
  it('should remove wrong settings attributes using the default settings as a reference', async () => {
    const newSettings: PluggableMonitorSettings = JSON.parse(
      JSON.stringify(defaultSettings)
    );
    newSettings['setting4'] = defaultSettings.setting3;

    const reconciledSettings = reconcileSettings(newSettings, defaultSettings);

    expect(reconciledSettings).not.to.have.property('setting4');
  });
  it('should reset non-value fields to those defiend in the default settings', async () => {
    const newSettings: DeepWriteable<PluggableMonitorSettings> = JSON.parse(
      JSON.stringify(defaultSettings)
    );
    newSettings['setting2'].id = 'fake id';

    const reconciledSettings = reconcileSettings(newSettings, defaultSettings);

    expect(reconciledSettings.setting2)
      .to.have.property('id')
      .equal('setting2');
  });
  it('should accept a selectedValue if it is a valid one', async () => {
    const newSettings: PluggableMonitorSettings = JSON.parse(
      JSON.stringify(defaultSettings)
    );
    newSettings.setting2.selectedValue = 'c';

    const reconciledSettings = reconcileSettings(newSettings, defaultSettings);

    expect(reconciledSettings.setting2)
      .to.have.property('selectedValue')
      .to.equal('c');
  });
  it('should fall a back to the first valid setting when the selectedValue is not valid', async () => {
    const newSettings: PluggableMonitorSettings = JSON.parse(
      JSON.stringify(defaultSettings)
    );
    newSettings.setting2.selectedValue = 'z';

    const reconciledSettings = reconcileSettings(newSettings, defaultSettings);

    expect(reconciledSettings.setting2)
      .to.have.property('selectedValue')
      .to.equal('a');
  });
  it('should accept any value if default values are not set', async () => {
    const wrongDefaults: DeepWriteable<PluggableMonitorSettings> = JSON.parse(
      JSON.stringify(defaultSettings)
    );
    wrongDefaults.setting2.values = [];

    const newSettings: PluggableMonitorSettings = JSON.parse(
      JSON.stringify(wrongDefaults)
    );
    newSettings.setting2.selectedValue = 'z';

    const reconciledSettings = reconcileSettings(newSettings, wrongDefaults);

    expect(reconciledSettings.setting2)
      .to.have.property('selectedValue')
      .to.equal('z');
  });
});
