import { expect } from 'chai';
import { toApiBuildProperties } from '../../common/protocol/arduino-context-mapper';

describe('arduino-context-mapper', () => {
  describe('toApiBuildProperties', () => {
    it('should parse an array of build properties string into a record', () => {
      const expected = {
        foo: 'alma',
        bar: '36',
        baz: 'false',
      };
      const actual = toApiBuildProperties(['foo=alma', 'bar=36', 'baz=false']);
      expect(actual).to.be.deep.equal(expected);
    });

    it('should not skip build property key with empty value', () => {
      const expected = {
        foo: '',
      };
      const actual = toApiBuildProperties(['foo=']);
      expect(actual).to.be.deep.equal(expected);
    });

    it('should skip invalid entries', () => {
      const expected = {
        foo: 'alma',
        bar: '36',
        baz: '-DARDUINO_USB_CDC_ON_BOOT=0',
      };
      const actual = toApiBuildProperties([
        'foo=alma',
        'invalid',
        '=invalid2',
        '=invalid3=',
        '=',
        '==',
        'bar=36',
        'baz=-DARDUINO_USB_CDC_ON_BOOT=0',
      ]);
      expect(actual).to.be.deep.equal(expected);
    });
  });
});
