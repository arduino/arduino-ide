import { PluggableMonitorSettings } from '../../common/protocol';

export function longestPrefixMatch(
  id: string,
  monitorSettings: Record<string, PluggableMonitorSettings>
): {
  matchingPrefix: string;
  matchingSettings: PluggableMonitorSettings;
} {
  const separator = '-';
  const idTokens = id.split(separator);

  let matchingPrefix = '';
  let matchingSettings: PluggableMonitorSettings = {};

  const monitorSettingsKeys = Object.keys(monitorSettings);

  for (let i = idTokens.length - 1; i >= 0; i--) {
    const prefix = idTokens.slice(0, i + 1).join(separator);

    for (let k = 0; k < monitorSettingsKeys.length; k++) {
      if (monitorSettingsKeys[k].startsWith(prefix)) {
        matchingPrefix = prefix;
        matchingSettings = monitorSettings[monitorSettingsKeys[k]];
        break;
      }
    }

    if (matchingPrefix.length) {
      break;
    }
  }

  return { matchingPrefix, matchingSettings };
}

export function reconcileSettings(
  newSettings: PluggableMonitorSettings,
  defaultSettings: PluggableMonitorSettings
): PluggableMonitorSettings {
  // create a map with all the keys, merged together
  const mergedSettingsKeys = Object.keys({
    ...defaultSettings,
    ...newSettings,
  });

  // for every key in the settings, we need to check if it exist in the default
  for (const key of mergedSettingsKeys) {
    // remove from the newSettings if it was not found in the default
    if (defaultSettings[key] === undefined) {
      delete newSettings[key];
    }
    // add to the newSettings if it was missing
    else if (newSettings[key] === undefined) {
      newSettings[key] = defaultSettings[key];
    }
    // if the key is found in both, reconcile the settings
    else {
      // save the value set by the user
      const value = newSettings[key].selectedValue;

      // settings needs to be overwritten with the defaults
      newSettings[key] = defaultSettings[key];

      // if there are no valid values defined, assume the one selected by the user is valid
      // also use the value if it is a valid setting defined in the values
      if (
        !Array.isArray(newSettings[key].values) ||
        newSettings[key].values.length === 0 ||
        newSettings[key].values.includes(value)
      ) {
        newSettings[key].selectedValue = value;
      } else {
        // if there are valid values but the user selected one that is not valid, fallback to the first valid one
        newSettings[key].selectedValue = newSettings[key].values[0];
      }
    }
  }

  return newSettings;
}
