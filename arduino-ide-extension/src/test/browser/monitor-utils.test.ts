import { expect } from 'chai';
import {
  messagesToLines,
  truncateLines,
  joinLines,
  linesToPlainText,
} from '../../browser/serial/monitor/monitor-utils';
import {
  Line,
  SerialMonitorOutput,
} from '../../browser/serial/monitor/serial-monitor-send-output';
import { set, reset } from 'mockdate';

type TestLine = {
  messages: string[];
  prevLines?: { lines: Line[]; charCount: number };
  expected: { lines: Line[]; charCount: number };
  expectedTruncated?: {
    lines: Line[];
    charCount: number;
    maxCharacters?: number;
  };
  expectedJoined?: string;
};

const date = new Date();
const testLines: TestLine[] = [
  {
    messages: ['Hello'],
    expected: { lines: [{ message: 'Hello', lineLen: 5 }], charCount: 5 },
    expectedJoined: 'Hello',
  },
  {
    messages: ['Hello', 'Dog!'],
    expected: { lines: [{ message: 'HelloDog!', lineLen: 9 }], charCount: 9 },
  },
  {
    messages: ['Hello\n', 'Dog!'],
    expected: {
      lines: [
        { message: 'Hello\n', lineLen: 6 },
        { message: 'Dog!', lineLen: 4 },
      ],
      charCount: 10,
    },
    expectedJoined: 'Hello\nDog!',
  },
  {
    messages: ['Dog!'],
    prevLines: { lines: [{ message: 'Hello\n', lineLen: 6 }], charCount: 6 },
    expected: {
      lines: [
        { message: 'Hello\n', lineLen: 6 },
        { message: 'Dog!', lineLen: 4 },
      ],
      charCount: 10,
    },
  },
  {
    messages: [' Dog!\n', " Who's a good ", 'boy?\n', "You're a good boy!"],
    prevLines: { lines: [{ message: 'Hello', lineLen: 5 }], charCount: 5 },
    expected: {
      lines: [
        { message: 'Hello Dog!\n', lineLen: 11 },
        { message: " Who's a good boy?\n", lineLen: 19 },
        { message: "You're a good boy!", lineLen: 18 },
      ],
      charCount: 48,
    },
    expectedTruncated: {
      maxCharacters: 20,
      charCount: 20,
      lines: [
        { message: '?\n', lineLen: 2 },
        { message: "You're a good boy!", lineLen: 18 },
      ],
    },
    expectedJoined: "Hello Dog!\n Who's a good boy?\nYou're a good boy!",
  },
  {
    messages: ['boy?\n', "You're a good boy!"],
    prevLines: {
      lines: [
        { message: 'Hello Dog!\n', lineLen: 11 },
        { message: " Who's a good ", lineLen: 14 },
      ],
      charCount: 25,
    },
    expected: {
      lines: [
        { message: 'Hello Dog!\n', lineLen: 11 },
        { message: " Who's a good boy?\n", lineLen: 19 },
        { message: "You're a good boy!", lineLen: 18 },
      ],
      charCount: 48,
    },
    expectedTruncated: {
      maxCharacters: 20,
      charCount: 20,
      lines: [
        { message: '?\n', lineLen: 2 },
        { message: "You're a good boy!", lineLen: 18 },
      ],
    },
  },
  {
    messages: ["Who's a good boy?\n", 'Yo'],
    prevLines: {
      lines: [{ message: 'Hello Dog!\n', lineLen: 11 }],
      charCount: 11,
    },
    expected: {
      lines: [
        { message: 'Hello Dog!\n', lineLen: 11 },
        { message: "Who's a good boy?\n", lineLen: 18 },
        { message: 'Yo', lineLen: 2 },
      ],
      charCount: 31,
    },
    expectedTruncated: {
      maxCharacters: 20,
      charCount: 20,
      lines: [
        { message: "Who's a good boy?\n", lineLen: 18 },
        { message: 'Yo', lineLen: 2 },
      ],
    },
    expectedJoined: "Hello Dog!\nWho's a good boy?\nYo",
  },
];

testLines.forEach((t) =>
  [...t.expected.lines, ...(t.prevLines?.lines || [])].forEach(
    (l) => (l.timestamp = date)
  )
);

describe('Monitor Utils', () => {
  beforeEach(() => {
    set(date);
  });

  afterEach(() => {
    reset();
  });

  testLines.forEach((testLine) => {
    context('when converting messages', () => {
      it('should give the right result', () => {
        const [newLines, addedCharCount] = messagesToLines(
          testLine.messages,
          testLine.prevLines?.lines,
          testLine.prevLines?.charCount
        );
        newLines.forEach((line, index) => {
          expect(line.message).to.equal(testLine.expected.lines[index].message);
          expect(line.lineLen).to.equal(testLine.expected.lines[index].lineLen);
          expect(line.timestamp).to.deep.equal(
            testLine.expected.lines[index].timestamp
          );
        });
        expect(addedCharCount).to.equal(testLine.expected.charCount);

        const [truncatedLines, totalCharCount] = truncateLines(
          newLines,
          addedCharCount,
          testLine.expectedTruncated?.maxCharacters
        );
        let charCount = 0;
        if (testLine.expectedTruncated) {
          truncatedLines.forEach((line, index) => {
            expect(line.message).to.equal(
              testLine.expectedTruncated?.lines[index].message
            );
            expect(line.lineLen).to.equal(
              testLine.expectedTruncated?.lines[index].lineLen
            );
            charCount += line.message.length;
          });
          expect(totalCharCount).to.equal(charCount);
        }
        if (testLine.expectedJoined) {
          const joined_str = joinLines(testLine.expected.lines);
          expect(joined_str).to.equal(testLine.expectedJoined);
        }
      });
    });
  });

  context('when truncating lines', () => {
    it('should update the retained line length and preserve its timestamp', () => {
      const [lines, charCount] = truncateLines(
        [{ message: 'abcdefghij', lineLen: 10, timestamp: date }],
        10,
        5
      );

      expect(lines).to.deep.equal([
        { message: 'fghij', lineLen: 5, timestamp: date },
      ]);
      expect(charCount).to.equal(5);
    });

    for (const { chunks, maxCharacters } of [
      {
        chunks: ['abcdefghij', 'k', 'lm', 'nopqrst', 'uvwxyz'],
        maxCharacters: 5,
      },
      {
        chunks: ['abc\n', 'def\n', 'ghi\n', 'jkl\n', 'mnop\n', 'q\n'],
        maxCharacters: 6,
      },
    ]) {
      it(`should retain the latest ${maxCharacters} characters across repeated updates`, () => {
        let lines: Line[] = [];
        let charCount = 0;
        let expected = '';

        for (const chunk of chunks) {
          expected = (expected + chunk).slice(-maxCharacters);
          [lines, charCount] = messagesToLines([chunk], lines, charCount);
          [lines, charCount] = truncateLines(lines, charCount, maxCharacters);

          expect(joinLines(lines)).to.equal(expected);
          expect(charCount).to.equal(expected.length);
        }
        lines.forEach((line) =>
          expect(line.lineLen).to.equal(line.message.length)
        );
      });
    }

    it('should remove complete lines without shortening the retained lines', () => {
      const [lines, charCount] = truncateLines(
        [
          { message: 'ab\n', lineLen: 3, timestamp: date },
          { message: 'c\n', lineLen: 2, timestamp: date },
          { message: 'de', lineLen: 2, timestamp: date },
        ],
        7,
        4
      );

      expect(lines).to.deep.equal([
        { message: 'c\n', lineLen: 2, timestamp: date },
        { message: 'de', lineLen: 2, timestamp: date },
      ]);
      expect(charCount).to.equal(4);
    });

    it('should leave lines at the character limit unchanged', () => {
      const original: Line[] = [
        { message: 'abc\n', lineLen: 4, timestamp: date },
        { message: 'de', lineLen: 2, timestamp: date },
      ];
      const [lines, charCount] = truncateLines(original, 6, 6);

      expect(lines).to.equal(original);
      expect(lines).to.deep.equal([
        { message: 'abc\n', lineLen: 4, timestamp: date },
        { message: 'de', lineLen: 2, timestamp: date },
      ]);
      expect(charCount).to.equal(6);
    });

    it('should keep the default character limit after appending to a truncated line', () => {
      const limit = SerialMonitorOutput.MAX_CHARACTERS;
      let [lines, charCount] = messagesToLines(['a'.repeat(limit + 10)]);
      [lines, charCount] = truncateLines(lines, charCount);
      [lines, charCount] = messagesToLines(['b'], lines, charCount);
      [lines, charCount] = truncateLines(lines, charCount);

      expect(joinLines(lines)).to.equal('a'.repeat(limit - 1) + 'b');
      expect(charCount).to.equal(limit);
      expect(lines).to.have.lengthOf(1);
      expect(lines[0].lineLen).to.equal(limit);
    });
  });

  context('when converting lines to plain text', () => {
    it('should join the lines', () => {
      const lines: Line[] = [
        { message: 'Hello\n', lineLen: 6 },
        { message: 'Dog!', lineLen: 4 },
      ];
      expect(linesToPlainText(lines)).to.equal('Hello\nDog!');
    });

    it('should replace null characters with a visible symbol', () => {
      const lines: Line[] = [
        { message: 'He', lineLen: 2 },
        { message: '\u0000llo!', lineLen: 5 },
      ];
      expect(linesToPlainText(lines)).to.equal('He\u25A1llo!');
    });

    it('should prefix the lines with the timestamp when enabled', () => {
      const timestamp = new Date(2026, 9, 16, 14, 16, 22, 101);
      const lines: Line[] = [
        { message: 'Hello\n', lineLen: 6, timestamp },
        { message: 'Dog!', lineLen: 4, timestamp },
      ];
      expect(linesToPlainText(lines, true)).to.equal(
        '14:16:22.101 -> Hello\n14:16:22.101 -> Dog!'
      );
      expect(linesToPlainText(lines, false)).to.equal('Hello\nDog!');
    });
  });
});
