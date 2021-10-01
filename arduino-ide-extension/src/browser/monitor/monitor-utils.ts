import { Line, SerialMonitorOutput } from './serial-monitor-send-output';

export function messageToLines(
  messages: string[],
  prevLines: Line[],
  separator = '\n'
): [Line[], number] {
  const linesToAdd: Line[] = prevLines.length
    ? [prevLines[prevLines.length - 1]]
    : [{ message: '' }];
  let charCount = 0;

  for (const message of messages) {
    charCount += message.length;
    const lastLine = linesToAdd[linesToAdd.length - 1];

    if (lastLine.message.charAt(lastLine.message.length - 1) === separator) {
      linesToAdd.push({ message, timestamp: new Date() });
    } else {
      linesToAdd[linesToAdd.length - 1].message += message;
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
  charCount: number
): [Line[], number] {
  let charsToDelete = charCount - SerialMonitorOutput.MAX_CHARACTERS;
  while (charsToDelete > 0) {
    const firstLineLength = lines[0]?.message?.length;
    const newFirstLine = lines[0]?.message?.substring(charsToDelete);
    const deletedCharsCount = firstLineLength - newFirstLine.length;
    charCount -= deletedCharsCount;
    charsToDelete -= deletedCharsCount;
    lines[0].message = newFirstLine;
    if (!newFirstLine?.length) {
      lines.shift();
    }
  }
  return [lines, charCount];
}
