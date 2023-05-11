import { splitByBoldTag } from '../../browser/utils/dom';
import { expect } from 'chai';

describe('dom', () => {
  describe('splitByBoldTag', () => {
    it('should split by bold tags', () => {
      const actual = splitByBoldTag('one<b>matchOne</b>two');
      const expected = ['one', { textContent: 'matchOne', bold: true }, 'two'];
      expect(actual).to.be.deep.equal(expected);
    });

    it('should handle starting bold tags', () => {
      const actual = splitByBoldTag(
        '<b>matchOne</b>one<b>matchTwo</b> two <b>matchThree</b> three'
      );
      const expected = [
        { textContent: 'matchOne', bold: true },
        'one',
        { textContent: 'matchTwo', bold: true },
        ' two ',
        { textContent: 'matchThree', bold: true },
        ' three',
      ];
      expect(actual).to.be.deep.equal(expected);
    });

    it('should handle unclosed bold tags', () => {
      const actual = splitByBoldTag(
        '<b>matchOne</b>one<b>matchTwo</b> two <b>matchThree</b> three <b> '
      );
      const expected = [
        { textContent: 'matchOne', bold: true },
        'one',
        { textContent: 'matchTwo', bold: true },
        ' two ',
        { textContent: 'matchThree', bold: true },
        ' three <b> ',
      ];
      expect(actual).to.be.deep.equal(expected);
    });

    it('should handle no matches', () => {
      const actual = splitByBoldTag('<b>alma');
      expect(actual).to.be.undefined;
    });

    it('should handle empty strings', () => {
      const actual = splitByBoldTag('');
      expect(actual).to.be.undefined;
    });
  });
});
