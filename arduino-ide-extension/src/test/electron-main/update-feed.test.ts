import { expect } from 'chai';
import { parseUpdateBaseUrl } from '../../electron-main/ide-updater/update-feed';

describe('update-feed', () => {
  describe('parseUpdateBaseUrl', () => {
    [
      'https://downloads.arduino.cc/arduino-ide',
      'https://example.com/feed',
      'http://localhost:8000',
      'http://127.0.0.1:8000',
      'http://[::1]:8000',
    ].forEach((url) =>
      it(`should accept '${url}'`, () =>
        expect(parseUpdateBaseUrl(url)).to.be.not.undefined)
    );

    [
      '',
      'downloads.arduino.cc/arduino-ide',
      'http://downloads.arduino.cc/arduino-ide',
      'http://localhost.example.com',
      'http://192.168.1.1:8000',
      'http://0.0.0.0:8000',
      'https://user:pass@downloads.arduino.cc/arduino-ide',
      'https://user@downloads.arduino.cc/arduino-ide',
      'https://downloads.arduino.cc/arduino-ide?channel=beta',
      'https://downloads.arduino.cc/arduino-ide#beta',
      'file:///tmp/feed',
      'ftp://localhost/feed',
    ].forEach((url) =>
      it(`should reject '${url}'`, () =>
        expect(parseUpdateBaseUrl(url)).to.be.undefined)
    );

    it('should normalize the URL', () =>
      expect(
        parseUpdateBaseUrl(' HTTPS://Example.COM/feed/ ')?.href
      ).to.be.equal('https://example.com/feed/'));
  });
});
