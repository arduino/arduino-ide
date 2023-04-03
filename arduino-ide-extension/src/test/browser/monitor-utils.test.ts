import { expect } from 'chai';
import {
  messagesToLines,
  truncateLines,
} from '../../browser/serial/monitor/monitor-utils';
import { Line } from '../../browser/serial/monitor/serial-monitor-send-output';
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
  lineIndex?: number;
  cursorPosition?: number;
  overflow?: string;
};

const date = new Date();
const testLines: TestLine[] = [
  {
    messages: ['Hello'],
    expected: { lines: [{ message: 'Hello', lineLen: 5 }], charCount: 5 }
  },
  {
    messages: ['Hello', 'Dog!'],
    expected: { lines: [{ message: 'HelloDog!', lineLen: 9 }], charCount: 9 }
  },
  {
    messages: ['Hello\n', 'Dog!'],
    expected: {
      lines: [
        { message: 'Hello\n', lineLen: 6 },
        { message: 'Dog!', lineLen: 4 },
      ],
      charCount: 10,
    }
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
    }
  },
  {
    messages: [' Dog!\n', " Who's a good ", 'boy?\n', "You're a good boy!"],
    prevLines: { lines: [{ message: 'Hello', lineLen: 5 }], charCount: 5 },
    expected: {
      lines: [
        { message: 'Hello Dog!\n', lineLen: 11 },
        { message: " Who's a good boy?\n", lineLen: 19 },
        { message: "You're a good boy!", lineLen: 8 },
      ],
      charCount: 48,
    },
    expectedTruncated: {
      maxCharacters: 20,
      charCount: 20,
      lines: [
        { message: '?\n', lineLen: 2 },
        { message: "You're a good boy!", lineLen: 8 },
      ],
    }
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
        { message: "You're a good boy!", lineLen: 8 },
      ],
      charCount: 48,
    },
    expectedTruncated: {
      maxCharacters: 20,
      charCount: 20,
      lines: [
        { message: '?\n', lineLen: 2 },
        { message: "You're a good boy!", lineLen: 8 },
      ],
    }
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
    }
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
    }
  },
  {
    messages: ['\n'],
    prevLines: { lines: [
        { message: 'Hello', lineLen: 5 },
      ], charCount: 5 },
    expected: {
      lines: [
        { message: 'Hello\n', lineLen: 6 },
      ],
      charCount: 6,
    }
  },
  {
    messages: ['\n', '\x1B[H', 'Are', '\nYou'],
    prevLines: { lines: [
        { message: 'Hello\n', lineLen: 6 },
        { message: 'Dog!\n', lineLen: 5 },
        { message: 'How', lineLen: 3 },
    ], charCount: 14 },
    expected: {
      lines: [
        { message: 'Are\no\n', lineLen: 6 },
        { message: 'You!\n', lineLen: 5 },
        { message: 'How\n', lineLen: 4 },
      ],
      charCount: 15,
    }
  },
  {
    messages: ['Yes\x1B[HNo'],
    prevLines: { lines: [
        { message: 'Hello\n', lineLen: 6 },
        { message: 'Dog!\n', lineLen: 5 },
        { message: 'How', lineLen: 3 },
      ], charCount: 14 },
    cursorPosition: 1,
    lineIndex: 2,
    expected: {
      lines: [
        { message: 'Nollo\n', lineLen: 6 },
        { message: 'Dog!\n', lineLen: 5 },
        { message: 'HYes', lineLen: 4 },
      ],
      charCount: 15,
    }
  },
  {
    messages: ['dy', '\x1B', '[H', 'Reset'],
    prevLines: { lines: [
        { message: 'Hello\n', lineLen: 6 },
        { message: 'Dog!\n', lineLen: 5 },
        { message: 'How', lineLen: 3 },
      ], charCount: 14 },
    expected: {
      lines: [
        { message: 'Reset\n', lineLen: 6 },
        { message: 'Dog!\n', lineLen: 5 },
        { message: 'Howdy', lineLen: 5 },
      ],
      charCount: 16,
    }
  },
  {
    messages: ['HReset'],
    prevLines: { lines: [
        { message: 'Hello\n', lineLen: 6 },
        { message: 'Dog!\n', lineLen: 5 },
        { message: 'How', lineLen: 3 },
      ], charCount: 14 },
    overflow: '\x1B[',
    expected: {
      lines: [
        { message: 'Reset\n', lineLen: 6 },
        { message: 'Dog!\n', lineLen: 5 },
        { message: 'How', lineLen: 3 },
      ],
      charCount: 14,
    }
  },
  {
    messages: ['\x1B[H', 'Reset', '\x1B[H', 'Me', '\x1B'],
    prevLines: { lines: [
        { message: 'Hello', lineLen: 6 },
      ], charCount: 6 },
    expected: {
      lines: [
        { message: 'Meset', lineLen: 6 },
      ],
      charCount: 6,
    }
  },
  {
    messages: ['HReset', 'Clear \x1B[2J', 'Me'],
    prevLines: { lines: [
        { message: 'Hello\n', lineLen: 6 },
        { message: 'Dog!\n', lineLen: 5 },
        { message: 'How', lineLen: 3 },
      ], charCount: 14 },
    overflow: '\x1B[',
    expected: {
      lines: [
        { message: 'Me', lineLen: 2 },
      ],
      charCount: 2,
    }
  },
  {
    messages: ['2JReset'],
    prevLines: { lines: [
        { message: 'How', lineLen: 3 },
      ], charCount: 3 },
    overflow: '\x1B[',
    expected: {
      lines: [
        { message: 'Reset', lineLen: 5 },
      ],
      charCount: 5,
    }
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
        const lineIndex = testLine.lineIndex || testLine.prevLines ? testLine.prevLines!.lines.length - 1 : null
        const cursorPosition = testLine.cursorPosition || testLine.prevLines?.lines[testLine.prevLines?.lines.length - 1].message.length || 0;

        if (testLine.overflow) {
          testLine.messages[0] = testLine.overflow + testLine.messages[0]
        }
        const [newLines, addedCharCount, cLineIndex, cCursorPosition] = messagesToLines(
          testLine.messages,
          testLine.prevLines?.lines,
          testLine.prevLines?.charCount,
            lineIndex,
            cursorPosition
        );
        newLines.forEach((line, index) => {
          expect(line.message).to.equal(testLine.expected.lines[index].message);
          expect(line.timestamp).to.deep.equal(
            testLine.expected.lines[index].timestamp
          );
        });
        expect(addedCharCount).to.equal(testLine.expected.charCount);

        const [truncatedLines, totalCharCount] = truncateLines(
          newLines,
          addedCharCount,
          cLineIndex,
          cCursorPosition,
          testLine.expectedTruncated?.maxCharacters
        );
        let charCount = 0;
        if (testLine.expectedTruncated) {
          truncatedLines.forEach((line, index) => {
            expect(line.message).to.equal(
              testLine.expectedTruncated?.lines[index].message
            );
            charCount += line.message.length;
          });
          expect(totalCharCount).to.equal(charCount);
        }
      });
    });
  });
});
