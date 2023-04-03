import {Line, SerialMonitorOutput} from './serial-monitor-send-output';

function writeOverLine(line: Line, insert: string, cursorPosition: number): [number, number] {
  var lenBefore = line.message.length;
  line.message = line.message.substring(0, cursorPosition) + insert + line.message.substring(cursorPosition + insert.length)
  cursorPosition = cursorPosition + insert.length;
  line.lineLen = line.message.length;
  return [line.lineLen - lenBefore, cursorPosition];
}

const escapeSequenceGoHome = '\x1B[H';
const escapeSequenceClearScreen = '\x1B[2J';

export function messagesToLines(
  messages: string[],
  prevLines: Line[] = [],
  charCount = 0,
  currentLineIndex: number | null,
  currentCursorPosition: number,
  separator = '\n',
): [Line[], number, number | null, number, string | null] {
  if (!prevLines.length) {
    prevLines = [{message: '', lineLen: 0, timestamp: new Date()}];
  }

  currentLineIndex = currentLineIndex || 0;

  let allMessages = messages.join('');
  let overflow = null;

  if (allMessages.indexOf(escapeSequenceGoHome) >= 0) {
    const before = allMessages.substring(0, allMessages.indexOf(escapeSequenceGoHome));
    const after = allMessages.substring(allMessages.indexOf(escapeSequenceGoHome) + escapeSequenceGoHome.length);
    const [_lines, _charCount] = messagesToLines([before], prevLines, charCount, currentLineIndex, currentCursorPosition, separator);
    return messagesToLines([after], _lines, _charCount, 0, 0, separator);
  } else if (allMessages.indexOf(escapeSequenceClearScreen) >= 0) {
    const after = allMessages.substring(allMessages.lastIndexOf(escapeSequenceClearScreen) + escapeSequenceClearScreen.length);
    return messagesToLines([after], [], 0, 0, 0, separator);
  } else if (allMessages.lastIndexOf('\x1B') >= 0) {
    overflow = allMessages.substring(allMessages.lastIndexOf('\x1B'));
    const result = messagesToLines([allMessages.substring(0, allMessages.lastIndexOf('\x1B'))], prevLines, charCount, currentLineIndex, currentCursorPosition, separator);
    result[4] = overflow;
    return result;
  }

  const chunks = allMessages.split(separator);
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (chunk !== '') {
      if (prevLines[currentLineIndex].message[currentCursorPosition - 1] === '\n') {
        currentLineIndex++;
        currentCursorPosition = 0;
      }
      if (currentLineIndex > prevLines.length - 1) {
        prevLines.push({message: '', lineLen: 0, timestamp: new Date()});
      }
      let [_addedCharacters, _currentCursorPosition] = writeOverLine(prevLines[currentLineIndex], chunk, currentCursorPosition)
      charCount += _addedCharacters;
      currentCursorPosition = _currentCursorPosition;
    }

    if (i < chunks.length - 1) {
      let [_addedCharacters, _currentCursorPosition] = writeOverLine(prevLines[currentLineIndex], separator, currentCursorPosition)
      charCount += _addedCharacters;
      currentCursorPosition = _currentCursorPosition;
    }
  }

  return [prevLines, charCount, currentLineIndex, currentCursorPosition, overflow]
}

export function truncateLines(
  lines: Line[],
  charCount: number,
  currentLineIndex: number | null,
  currentCursorPosition: number,
  maxCharacters: number = SerialMonitorOutput.MAX_CHARACTERS
): [Line[], number, number | null, number] {
  let charsToDelete = charCount - maxCharacters;
  let lineIndex = 0;
  while (charsToDelete > 0 || lineIndex > 0) {
    const firstLineLength = lines[lineIndex]?.lineLen;

    if (charsToDelete >= firstLineLength) {
      // every time a full line to delete is found, move the index.
      lineIndex++;
      charsToDelete -= firstLineLength;
      charCount -= firstLineLength;
      continue;
    }

    // delete all previous lines
    lines.splice(0, lineIndex);
    lineIndex = 0;

    const newFirstLine = lines[0]?.message?.substring(charsToDelete);
    const deletedCharsCount = firstLineLength - newFirstLine.length;
    charCount -= deletedCharsCount;
    charsToDelete -= deletedCharsCount;
    lines[0].message = newFirstLine;
  }
  return [lines, charCount, currentLineIndex, currentCursorPosition];
}
