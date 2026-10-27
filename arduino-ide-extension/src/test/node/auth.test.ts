import { expect } from 'chai';
import { AuthOptions } from '../../common/protocol/authentication-service';
import { ArduinoAuthenticationProvider } from '../../node/auth/arduino-auth-provider';
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

  describe('ArduinoAuthenticationProvider', () => {
    it('should not use an untrusted OAuth2 domain', async () => {
      const provider = new TestArduinoAuthenticationProvider();
      await provider.setOptions(<AuthOptions>{
        domain: 'example.com',
        registerUri: 'https://auth.arduino.cc/login#/register',
      });
      expect(provider.options.domain).to.be.equal('login.arduino.cc');
    });

    it('should not open a sign-up URI that is not a web page', async () => {
      const provider = new TestArduinoAuthenticationProvider();
      await provider.setOptions(<AuthOptions>{
        domain: 'login.arduino.cc',
        registerUri: 'file:///Applications/Calculator.app',
      });
      expect(provider.options.registerUri).to.be.equal(
        'https://auth.arduino.cc/login#/register'
      );
    });
  });
});

class TestArduinoAuthenticationProvider extends ArduinoAuthenticationProvider {
  get options(): AuthOptions {
    return this.authOptions;
  }
}
