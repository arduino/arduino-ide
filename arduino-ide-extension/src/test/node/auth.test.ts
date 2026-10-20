import { expect } from 'chai';
import { isTrustedAuthDomain, isValidRegisterUri } from '../../node/auth/utils';

describe('auth', () => {
  describe('isTrustedAuthDomain', () => {
    ['login.arduino.cc'].forEach((domain) =>
      it(`should trust '${domain}'`, () =>
        expect(isTrustedAuthDomain(domain)).to.be.true)
    );

    [
      '',
      'example.com',
      'login.arduino.cc.example.com',
      'evil-login.arduino.cc',
      'login.arduino.cc:8443',
      'user@login.arduino.cc',
      'https://login.arduino.cc',
      'LOGIN.ARDUINO.CC',
    ].forEach((domain) =>
      it(`should not trust '${domain}'`, () =>
        expect(isTrustedAuthDomain(domain)).to.be.false)
    );
  });

  describe('isValidRegisterUri', () => {
    [
      'https://auth.arduino.cc/login#/register',
      'https://example.com/register',
    ].forEach((uri) =>
      it(`should accept '${uri}'`, () =>
        expect(isValidRegisterUri(uri)).to.be.true)
    );

    [
      '',
      'auth.arduino.cc/login#/register',
      'http://auth.arduino.cc/login#/register',
      'https://user:pass@auth.arduino.cc/login#/register',
      'file:///Applications/Calculator.app',
      '/Applications/Calculator.app',
      'C:\\Windows\\System32\\calc.exe',
      'vscode://file/tmp/sketch',
    ].forEach((uri) =>
      it(`should reject '${uri}'`, () =>
        expect(isValidRegisterUri(uri)).to.be.false)
    );
  });
});
