import { expect } from 'chai';
import { Sketch } from '../../common/protocol';

describe('sketch', () => {
  describe('validateSketchFolderName', () => {
    (
      [
        ['sketch', true],
        ['can-contain-slash-and-dot.ino', true],
        ['regex++', false],
        ['dots...', true],
        ['No Spaces', false],
        ['_invalidToStartWithUnderscore', false],
        ['Invalid+Char.ino', false],
        ['', false],
        ['/', false],
        ['//trash/', false],
        [
          '63Length_012345678901234567890123456789012345678901234567890123',
          true,
        ],
        [
          'TooLong__0123456789012345678901234567890123456789012345678901234',
          false,
        ],
      ] as [string, boolean][]
    ).map(([input, expected]) => {
      it(`'${input}' should ${
        !expected ? 'not ' : ''
      }be a valid sketch folder name`, () => {
        const actual = Sketch.validateSketchFolderName(input);
        if (expected) {
          expect(actual).to.be.undefined;
        } else {
          expect(actual).to.be.not.undefined;
          expect(actual?.length).to.be.greaterThan(0);
        }
      });
    });
  });

  describe('validateCloudSketchFolderName', () => {
    (
      [
        ['sketch', true],
        ['no-dashes', false],
        ['no-dots', false],
        ['No Spaces', false],
        ['_canStartWithUnderscore', true],
        ['Invalid+Char.ino', false],
        ['', false],
        ['/', false],
        ['//trash/', false],
        ['36Length_012345678901234567890123456', true],
        ['TooLong__0123456789012345678901234567', false],
      ] as [string, boolean][]
    ).map(([input, expected]) => {
      it(`'${input}' should ${
        !expected ? 'not ' : ''
      }be a valid cloud sketch folder name`, () => {
        const actual = Sketch.validateCloudSketchFolderName(input);
        if (expected) {
          expect(actual).to.be.undefined;
        } else {
          expect(actual).to.be.not.undefined;
          expect(actual?.length).to.be.greaterThan(0);
        }
      });
    });
  });

  describe('toValidCloudSketchFolderName', () => {
    (
      [
        ['sketch', 'sketch'],
        ['can-contain-slash-and-dot.ino', 'can_contain_slash_and_dot_ino'],
        ['regex++'],
        ['dots...', 'dots___'],
        ['No Spaces'],
        ['_invalidToStartWithUnderscore'],
        ['Invalid+Char.ino'],
        [''],
        ['/'],
        ['//trash/'],
        [
          '63Length_012345678901234567890123456789012345678901234567890123',
          '63Length_012345678901234567890123456',
        ],
        ['TooLong__0123456789012345678901234567890123456789012345678901234'],
      ] as [string, string?][]
    ).map(([input, expected]) => {
      it(`'${input}' should ${expected ? '' : 'not '}map the ${
        !expected ? 'invalid ' : ''
      }sketch folder name to a valid cloud sketch folder name${
        expected ? `: '${expected}'` : ''
      }`, () => {
        if (!expected) {
          try {
            Sketch.toValidCloudSketchFolderName(input);
            throw new Error(
              `Expected an error when mapping ${input} to a valid sketch folder name.`
            );
          } catch (err) {
            if (err instanceof Error) {
              expect(err.message).to.be.equal(
                Sketch.invalidSketchFolderNameMessage
              );
            } else {
              throw err;
            }
          }
        } else {
          const actual = Sketch.toValidCloudSketchFolderName(input);
          expect(actual).to.be.equal(expected);
        }
      });
    });
  });
});
