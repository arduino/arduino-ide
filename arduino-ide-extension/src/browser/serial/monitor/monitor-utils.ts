import { Line, SerialMonitorOutput } from './serial-monitor-send-output';

export function messagesToLines(
  messages: string[],
  prevLines: Line[] = [],
  charCount = 0,
  separator = '\n'
): [Line[], number] {
  const linesToAdd: Line[] = prevLines.length
    ? [prevLines[prevLines.length - 1]]
    : [{ message: '', lineLen: 0 }];
  if (!(Symbol.iterator in Object(messages))) return [prevLines, charCount];

  for (const message of messages) {
    const messageLen = message.length;
    charCount += messageLen;
    const lastLine = linesToAdd[linesToAdd.length - 1];

    // if the previous messages ends with "separator" add a new line
    if (lastLine.message.charAt(lastLine.message.length - 1) === separator) {
      linesToAdd.push({
        message,
        timestamp: new Date(),
        lineLen: messageLen,
      });
    } else {
      // concatenate to the last line
      linesToAdd[linesToAdd.length - 1].message += message;
      linesToAdd[linesToAdd.length - 1].lineLen += messageLen;
      if (!linesToAdd[linesToAdd.length - 1].timestamp) {
        linesToAdd[linesToAdd.length - 1].timestamp = new Date();
      }
    }
  }

  prevLines.splice(prevLines.length - 1, 1, ...linesToAdd);
  return [prevLines, charCount];
}

export function truncateLines(
  lines: Line[],
  charCount: number,
  maxCharacters: number = SerialMonitorOutput.MAX_CHARACTERS
): [Line[], number] {
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
  return [lines, charCount];
}
