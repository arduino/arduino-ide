import { expect } from 'chai';
import { parse } from '../../node/settings-reader';

describe('settings-reader', () => {
  describe('parse', () => {
    it('should handle comments', () => {
      const actual = parse(`
{
    "alma": "korte",
    // comment
    "szilva": false
}`);
      expect(actual).to.be.deep.equal({
        alma: 'korte',
        szilva: false,
      });
    });

    it('should handle trailing comma', () => {
      const actual = parse(`
{
    "alma": "korte",
    "szilva": 123,
}`);
      expect(actual).to.be.deep.equal({
        alma: 'korte',
        szilva: 123,
      });
    });

    it('should parse empty', () => {
      const actual = parse('');
      expect(actual).to.be.deep.equal({});
    });

    it('should parse to undefined when parse has failed', () => {
      const actual = parse(`
{
    alma:: 'korte'
    trash
}`);
      expect(actual).to.be.undefined;
    });
  });
});
