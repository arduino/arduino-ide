import {Line, SerialMonitorOutput} from './serial-monitor-send-output';

function writeOverLine(line: Line, insert: string, cursorPosition: number, charCount: number): [number, number] {
  const lenBefore = line.message.length;
  line.message = line.message.substring(0, cursorPosition) + insert + line.message.substring(cursorPosition + insert.length)
  cursorPosition = cursorPosition + insert.length;
  line.lineLen = line.message.length;
  return [charCount + (line.lineLen - lenBefore), cursorPosition];
}

const escape = '\x1B';
const escapeSequenceGoHome = escape+'[H';
const escapeSequenceClearScreen = escape+'[2J';

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

  let goHomeSequenceIndex = allMessages.indexOf(escapeSequenceGoHome);
  let clearScreenSequenceIndex = allMessages.indexOf(escapeSequenceClearScreen);
  let lastEscapeIndex = allMessages.lastIndexOf(escape);

  if (goHomeSequenceIndex >= 0) {
    const before = allMessages.substring(0, goHomeSequenceIndex);
    const after = allMessages.substring(goHomeSequenceIndex + escapeSequenceGoHome.length);
    const [updatedLines, updatedCharCount] = messagesToLines([before], prevLines, charCount, currentLineIndex, currentCursorPosition, separator);
    return messagesToLines([after], updatedLines, updatedCharCount, 0, 0, separator);
  } else if (clearScreenSequenceIndex >= 0) {
    const after = allMessages.substring(allMessages.lastIndexOf(escapeSequenceClearScreen) + escapeSequenceClearScreen.length);
    return messagesToLines([after], [], 0, 0, 0, separator);
  } else if (lastEscapeIndex >= 0) {
    overflow = allMessages.substring(lastEscapeIndex);
    const result = messagesToLines([allMessages.substring(0, lastEscapeIndex)], prevLines, charCount, currentLineIndex, currentCursorPosition, separator);
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
      [charCount, currentCursorPosition] = writeOverLine(prevLines[currentLineIndex], chunk, currentCursorPosition, charCount)
    }

    if (i < chunks.length - 1) {
      [charCount, currentCursorPosition] = writeOverLine(prevLines[currentLineIndex], separator, currentCursorPosition, charCount)
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
