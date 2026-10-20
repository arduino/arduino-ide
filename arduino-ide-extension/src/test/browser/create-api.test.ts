import { expect } from 'chai';
import { isTrustedCloudUrl } from '../../browser/create/create-api';

describe('create-api', () => {
  describe('isTrustedCloudUrl', () => {
    [
      'https://api2.arduino.cc/create/v2/sketches',
      'https://api2.arduino.cc:443/create/v2/sketches',
      'https://API2.ARDUINO.CC/create/v2/sketches',
    ].forEach((url) =>
      it(`should trust '${url}'`, () =>
        expect(isTrustedCloudUrl(new URL(url))).to.be.true)
    );

    [
      'http://api2.arduino.cc/create/v2/sketches',
      'https://api2.arduino.cc:8443/create/v2/sketches',
      'https://api2.arduino.cc.example.com/create/v2/sketches',
      'https://evil-api2.arduino.cc/create/v2/sketches',
      'https://arduino.cc/create/v2/sketches',
      'https://user:pass@api2.arduino.cc/create/v2/sketches',
      'https://user@api2.arduino.cc/create/v2/sketches',
      'https://example.com/create/v2/sketches',
    ].forEach((url) =>
      it(`should not trust '${url}'`, () =>
        expect(isTrustedCloudUrl(new URL(url))).to.be.false)
    );
  });
});
