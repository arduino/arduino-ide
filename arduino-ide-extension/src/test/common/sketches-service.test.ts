import { expect } from 'chai';
import { Sketch } from '../../common/protocol';

const windowsReservedFileNames = [
  'CON',
  'PRN',
  'AUX',
  'NUL',
  'COM1',
  'COM2',
  'COM3',
  'COM4',
  'COM5',
  'COM6',
  'COM7',
  'COM8',
  'COM9',
  'LPT1',
  'LPT2',
  'LPT3',
  'LPT4',
  'LPT5',
  'LPT6',
  'LPT7',
  'LPT8',
  'LPT9',
];
const windowsInvalidFilenames = ['trailingPeriod.', 'trailingSpace '];
const invalidFilenames = [
  ...windowsInvalidFilenames,
  ...windowsReservedFileNames,
].map((name) => <[string, boolean]>[name, false]);

describe('sketch', () => {
  describe('validateSketchFolderName', () => {
    (
      [
        ...invalidFilenames,
        ['com1', false], // Do not assume case sensitivity. (https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file#naming-conventions)
        ['sketch', true],
        ['can-contain-slash-and-dot.ino', true],
        ['regex++', false],
        ['trailing.dots...', false],
        ['no.trailing.dots.._', true],
        ['No Spaces', false],
        ['_validToStartWithUnderscore', true],
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
        ...invalidFilenames,
        ['sketch', true],
        ['can-contain-dashes', true],
        ['can.contain.dots', true],
        ['-cannot-start-with-dash', false],
        ['.cannot.start.with.dash', false],
        ['_can_start_with_underscore', true],
        ['No Spaces', false],
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

  describe('toValidSketchFolderName', () => {
    [
      ['', Sketch.defaultSketchFolderName],
      [' ', Sketch.defaultFallbackChar],
      ['  ', Sketch.defaultFallbackChar + Sketch.defaultFallbackChar],
      [
        '0123456789012345678901234567890123456789012345678901234567890123',
        '012345678901234567890123456789012345678901234567890123456789012',
      ],
      ['foo bar', 'foo_bar'],
      ['-foobar', '_foobar'],
      ['vAlid', 'vAlid'],
      ['COM1', Sketch.defaultSketchFolderName],
      ['COM1.', 'COM1_'],
      ['period.', 'period_'],
    ].map(([input, expected]) =>
      toMapIt(input, expected, Sketch.toValidSketchFolderName)
    );
  });

  describe('toValidSketchFolderName with timestamp suffix', () => {
    const epoch = new Date(0);
    const epochSuffix = Sketch.timestampSuffix(epoch);
    [
      ['', Sketch.defaultSketchFolderName + epochSuffix],
      [' ', Sketch.defaultFallbackChar + epochSuffix],
      [
        '  ',
        Sketch.defaultFallbackChar + Sketch.defaultFallbackChar + epochSuffix,
      ],
      [
        '0123456789012345678901234567890123456789012345678901234567890123',
        '0123456789012345678901234567890123456789012' + epochSuffix,
      ],
      ['foo bar', 'foo_bar' + epochSuffix],
      ['.foobar', '_foobar' + epochSuffix],
      ['-fooBar', '_fooBar' + epochSuffix],
      ['foobar.', 'foobar_' + epochSuffix],
      ['fooBar-', 'fooBar_' + epochSuffix],
      ['fooBar+', 'fooBar_' + epochSuffix],
      ['vAlid', 'vAlid' + epochSuffix],
      ['COM1', 'COM1' + epochSuffix],
      ['COM1.', 'COM1_' + epochSuffix],
      ['period.', 'period_' + epochSuffix],
    ].map(([input, expected]) =>
      toMapIt(input, expected, (input: string) =>
        Sketch.toValidSketchFolderName(input, epoch)
      )
    );
  });

  describe('toValidCloudSketchFolderName', () => {
    [
      ['sketch', 'sketch'],
      ['only_underscore-is+ok.ino', 'only_underscore_is_ok_ino'],
      ['regex++', 'regex__'],
      ['dots...', 'dots___'],
      ['.dots...', '_dots___'],
      ['-dashes---', '_dashes___'],
      ['No Spaces', 'No_Spaces'],
      ['Invalid+Char.ino', 'Invalid_Char_ino'],
      ['', 'sketch'],
      ['/', '_'],
      [
        '/-1////////////////////+//////////////-/',
        '__1_________________________________',
      ],
      ['//trash/', '__trash_'],
      [
        '63Length_012345678901234567890123456789012345678901234567890123',
        '63Length_012345678901234567890123456',
      ],
    ].map(([input, expected]) =>
      toMapIt(input, expected, Sketch.toValidCloudSketchFolderName, true)
    );
  });
});

function toMapIt(
  input: string,
  expected: string,
  testMe: (input: string) => string,
  cloud = false
): Mocha.Test {
  return it(`should map the '${input}' ${
    cloud ? 'cloud ' : ''
  }sketch folder name to '${expected}'`, () => {
    const actual = testMe(input);
    expect(actual).to.be.equal(expected);
    const errorMessage = Sketch.validateSketchFolderName(actual);
    try {
      expect(errorMessage).to.be.undefined;
    } catch (err) {
      console.log('HELLO', actual, errorMessage);
      throw err;
    }
  });
}
