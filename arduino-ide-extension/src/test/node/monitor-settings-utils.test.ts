import { expect } from 'chai';
import {
  longestPrefixMatch,
  reconcileSettings,
} from '../../node/monitor-settings/monitor-settings-utils';
import { PluggableMonitorSettings } from '../../common/protocol';

type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> };

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

describe('longestPrefixMatch token boundaries', () => {
  const board = 'arduino:avr:uno';
  const settingsWithBaudrate = (
    selectedValue: string
  ): PluggableMonitorSettings => ({
    baudrate: {
      id: 'baudrate',
      label: 'Baud rate',
      type: 'enum',
      values: ['9600', '115200'],
      selectedValue,
    },
  });
  const firstSettings = settingsWithBaudrate('115200');
  const secondSettings = settingsWithBaudrate('9600');

  for (const port of ['COM1', '/dev/ttyACM1']) {
    for (const reversed of [false, true]) {
      it(`should prefer the complete ${port} port match regardless of insertion order (${reversed})`, () => {
        const entries: [string, PluggableMonitorSettings][] = [
          [`${board}-${port}0-serial`, firstSettings],
          [`${board}-${port}-network`, secondSettings],
        ];
        if (reversed) {
          entries.reverse();
        }

        const { matchingPrefix, matchingSettings } = longestPrefixMatch(
          `${board}-${port}-serial`,
          Object.fromEntries(entries)
        );

        expect(matchingPrefix).to.equal(`${board}-${port}`);
        expect(matchingSettings).to.equal(secondSettings);
      });
    }
  }

  it('should retain an exact identifier match when a longer port name appears first', () => {
    const id = `${board}-COM1-serial`;
    const { matchingPrefix, matchingSettings } = longestPrefixMatch(id, {
      [`${board}-COM10-serial`]: firstSettings,
      [id]: secondSettings,
    });

    expect(matchingPrefix).to.equal(id);
    expect(matchingSettings).to.equal(secondSettings);
  });

  it('should use board-level fallback instead of treating COM10 as a COM1 match', () => {
    const { matchingPrefix, matchingSettings } = longestPrefixMatch(
      `${board}-COM1-serial`,
      { [`${board}-COM10-serial`]: firstSettings }
    );

    expect(matchingPrefix).to.equal(board);
    expect(matchingSettings).to.equal(firstSettings);
  });

  it('should not match a different board whose name starts with the requested name', () => {
    const { matchingPrefix, matchingSettings } = longestPrefixMatch(
      `${board}-COM1-serial`,
      { 'arduino:avr:unowifi-COM1-serial': firstSettings }
    );

    expect(matchingPrefix).to.equal('');
    expect(matchingSettings).to.be.empty;
  });

  it('should use port-level fallback instead of matching only part of a protocol name', () => {
    const { matchingPrefix, matchingSettings } = longestPrefixMatch(
      `${board}-COM1-serial`,
      { [`${board}-COM1-serial2`]: firstSettings }
    );

    expect(matchingPrefix).to.equal(`${board}-COM1`);
    expect(matchingSettings).to.equal(firstSettings);
  });

  it('should preserve the first matching entry when falling back to board settings', () => {
    const { matchingPrefix, matchingSettings } = longestPrefixMatch(
      `${board}-COM1-serial`,
      {
        [`${board}-COM2-serial`]: firstSettings,
        [`${board}-COM3-serial`]: secondSettings,
      }
    );

    expect(matchingPrefix).to.equal(board);
    expect(matchingSettings).to.equal(firstSettings);
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
  it('should reset non-value fields to those defined in the default settings', async () => {
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
