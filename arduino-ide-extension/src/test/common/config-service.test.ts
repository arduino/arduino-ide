import { expect } from 'chai';
import { AdditionalUrls } from '../../common/protocol';

describe('config-service', () => {
  describe('additionalUrls', () => {
    it('should consider additional URLs same as if they differ in case', () => {
      expect(AdditionalUrls.sameAs(['aaaa'], ['AAAA'])).to.be.true;
    });
    it('should consider additional URLs same as if they have a different order', () => {
      expect(AdditionalUrls.sameAs(['bbbb', 'aaaa'], ['aaaa', 'bbbb'])).to.be
        .true;
    });
    it('should parse an empty string as an empty array', () => {
      expect(AdditionalUrls.parse('', ',')).to.be.empty;
    });
    it('should parse a blank string as an empty array', () => {
      expect(AdditionalUrls.parse('   ', ',')).to.be.empty;
    });
    it('should parse urls with commas', () => {
      expect(AdditionalUrls.parse('  ,a  , b , c,   ', ',')).to.be.deep.equal([
        'a',
        'b',
        'c',
      ]);
    });
    it("should parse urls with both '\\n' and '\\r\\n' line endings", () => {
      expect(
        AdditionalUrls.parse(
          'a ' + '\r\n' + '   b ' + '\n' + '   c ' + '\r\n' + '  ' + '\n' + '',
          'newline'
        )
      ).to.be.deep.equal(['a', 'b', 'c']);
    });
  });
});
