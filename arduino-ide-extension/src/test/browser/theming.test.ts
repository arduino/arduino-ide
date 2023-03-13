import { enableJSDOM } from '@theia/core/lib/browser/test/jsdom';
const disableJSDOM = enableJSDOM();

import { BuiltinThemeProvider } from '@theia/core/lib/browser/theming';
import { Theme } from '@theia/core/lib/common/theme';
import { expect } from 'chai';
import {
  ArduinoThemeType,
  ArduinoThemes,
  arduinoThemeTypeOf,
  darkThemeLabel,
  deprecatedThemeLabel,
  hcLightThemeLabel,
  hcThemeLabel,
  lightThemeLabel,
  themeLabelForSettings,
  userConfigurableThemes,
  userThemeLabel,
} from '../../browser/theia/core/theming';

disableJSDOM();

const testTheme: Theme = {
  id: 'testTheme',
  label: 'Test Theme',
  type: 'light',
};
const anotherTestTheme: Theme = {
  id: 'anotherTestTheme',
  label: 'Another Test Theme',
  type: 'light',
};
const darkTestTheme: Theme = {
  id: 'darkTestTheme',
  label: 'Dark Test Theme',
  type: 'dark',
};
const anotherDarkTestTheme: Theme = {
  id: 'anotherTestTheme',
  label: 'AAAnother Dark Test Theme',
  type: 'dark',
};

describe('theming', () => {
  describe('userConfigurableThemes', () => {
    it('should show only built-in and user installed themes but not deprecated (Theia) ones if current theme is a built-in', () => {
      const actual = userConfigurableThemes({
        themes: () => [
          BuiltinThemeProvider.darkTheme,
          BuiltinThemeProvider.lightTheme,
          ArduinoThemes.dark,
          ArduinoThemes.light,
          testTheme,
          BuiltinThemeProvider.hcTheme,
          anotherTestTheme,
          BuiltinThemeProvider.hcLightTheme,
        ],
        currentTheme: () => BuiltinThemeProvider.hcTheme,
      }).reduce((acc, curr) => acc.concat(curr), []);
      expect(actual.length).to.be.equal(6);
      expect(actual[0].id).to.be.equal(ArduinoThemes.light.id);
      expect(actual[1].id).to.be.equal(ArduinoThemes.dark.id);
      expect(actual[2].id).to.be.equal(BuiltinThemeProvider.hcLightTheme.id);
      expect(actual[3].id).to.be.equal(BuiltinThemeProvider.hcTheme.id);
      expect(actual[4].id).to.be.equal(anotherTestTheme.id);
      expect(actual[5].id).to.be.equal(testTheme.id);
    });

    it('should show only built-in and user installed themes but not deprecated (Theia) ones if current theme is a user', () => {
      const actual = userConfigurableThemes({
        themes: () => [
          BuiltinThemeProvider.hcTheme,
          BuiltinThemeProvider.lightTheme,
          BuiltinThemeProvider.darkTheme,
          BuiltinThemeProvider.hcLightTheme,
          ArduinoThemes.dark,
          testTheme,
          anotherTestTheme,
          ArduinoThemes.light,
        ],
        currentTheme: () => testTheme,
      }).reduce((acc, curr) => acc.concat(curr), []);
      expect(actual.length).to.be.equal(6);
      expect(actual[0].id).to.be.equal(ArduinoThemes.light.id);
      expect(actual[1].id).to.be.equal(ArduinoThemes.dark.id);
      expect(actual[2].id).to.be.equal(BuiltinThemeProvider.hcLightTheme.id);
      expect(actual[3].id).to.be.equal(BuiltinThemeProvider.hcTheme.id);
      expect(actual[4].id).to.be.equal(anotherTestTheme.id);
      expect(actual[5].id).to.be.equal(testTheme.id);
    });

    it('should show built-in, user installed, and deprecated (Theia) themes if current theme is a deprecated (Theia)', () => {
      const actual = userConfigurableThemes({
        themes: () => [
          ArduinoThemes.dark,
          BuiltinThemeProvider.hcLightTheme,
          ArduinoThemes.light,
          testTheme,
          BuiltinThemeProvider.hcTheme,
          anotherTestTheme,
          darkTestTheme,
          anotherDarkTestTheme,
          BuiltinThemeProvider.lightTheme,
          BuiltinThemeProvider.darkTheme,
        ],
        currentTheme: () => BuiltinThemeProvider.lightTheme,
      }).reduce((acc, curr) => acc.concat(curr), []);
      expect(actual.length).to.be.equal(9);
      expect(actual[0].id).to.be.equal(ArduinoThemes.light.id);
      expect(actual[1].id).to.be.equal(ArduinoThemes.dark.id);
      expect(actual[2].id).to.be.equal(BuiltinThemeProvider.hcLightTheme.id);
      expect(actual[3].id).to.be.equal(BuiltinThemeProvider.hcTheme.id);
      expect(actual[4].id).to.be.equal(anotherTestTheme.id);
      expect(actual[5].id).to.be.equal(testTheme.id);
      expect(actual[6].id).to.be.equal(anotherDarkTestTheme.id);
      expect(actual[7].id).to.be.equal(darkTestTheme.id);
      expect(actual[8].id).to.be.equal(BuiltinThemeProvider.lightTheme.id);
    });

    it('should group the themes by arduino theme types', () => {
      const actual = userConfigurableThemes({
        themes: () => [
          ArduinoThemes.dark,
          ArduinoThemes.light,
          BuiltinThemeProvider.hcLightTheme,
          testTheme,
          BuiltinThemeProvider.hcTheme,
          anotherTestTheme,
          darkTestTheme,
          anotherDarkTestTheme,
          BuiltinThemeProvider.lightTheme,
          BuiltinThemeProvider.darkTheme,
        ],
        currentTheme: () => BuiltinThemeProvider.lightTheme,
      });
      expect(actual.length).to.be.equal(3);
      expect(actual[0].length).to.be.equal(4);
      expect(actual[1].length).to.be.equal(4);
      expect(actual[2].length).to.be.equal(1);
    });
  });

  describe('arduinoThemeTypeOf', () => {
    (
      [
        [BuiltinThemeProvider.lightTheme, 'deprecated'],
        [BuiltinThemeProvider.darkTheme, 'deprecated'],
        [BuiltinThemeProvider.hcLightTheme, 'built-in'],
        [BuiltinThemeProvider.hcTheme, 'built-in'],
        [ArduinoThemes.light, 'built-in'],
        [ArduinoThemes.dark, 'built-in'],
        [testTheme, 'user'],
        [anotherTestTheme, 'user'],
        [darkTestTheme, 'user'],
        [anotherDarkTestTheme, 'user'],
      ] as [Theme, ArduinoThemeType][]
    ).map(([theme, expected]) =>
      it(`should detect the '${theme.label}' theme as a '${expected}' theme`, () =>
        expect(arduinoThemeTypeOf(theme)).to.be.equal(expected))
    );
  });

  describe('themeLabelForSettings', () => {
    (
      [
        [
          BuiltinThemeProvider.lightTheme,
          deprecatedThemeLabel(BuiltinThemeProvider.lightTheme),
        ],
        [
          BuiltinThemeProvider.darkTheme,
          deprecatedThemeLabel(BuiltinThemeProvider.darkTheme),
        ],
        [BuiltinThemeProvider.hcTheme, hcThemeLabel],
        [BuiltinThemeProvider.hcLightTheme, hcLightThemeLabel],
        [ArduinoThemes.light, lightThemeLabel],
        [ArduinoThemes.dark, darkThemeLabel],
        [testTheme, userThemeLabel(testTheme)],
        [anotherTestTheme, userThemeLabel(anotherTestTheme)],
        [darkTestTheme, userThemeLabel(darkTestTheme)],
        [anotherDarkTestTheme, userThemeLabel(anotherDarkTestTheme)],
      ] as [Theme, string][]
    ).map(([theme, expected]) => {
      it(`should map the theme with ID '${theme.id}' to ${expected} in the settings UI`, () => {
        expect(themeLabelForSettings(theme)).to.be.equal(expected);
      });
    });
  });
});
