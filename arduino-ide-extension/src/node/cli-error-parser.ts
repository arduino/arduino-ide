import { notEmpty } from '@theia/core/lib/common/objects';
import { nls } from '@theia/core/lib/common/nls';
import { FileUri } from '@theia/core/lib/node/file-uri';
import {
  Range,
  Position,
} from '@theia/core/shared/vscode-languageserver-protocol';
import { CoreError } from '../common/protocol';
import { Sketch } from '../common/protocol/sketches-service';

export interface OutputSource {
  readonly content: string | ReadonlyArray<Uint8Array>;
  readonly sketch?: Sketch;
}
export namespace OutputSource {
  export function content(source: OutputSource): string {
    const { content } = source;
    return typeof content === 'string'
      ? content
      : Buffer.concat(content).toString('utf8');
  }
}

export function tryParseError(source: OutputSource): CoreError.ErrorLocation[] {
  const { sketch } = source;
  const content = OutputSource.content(source);
  if (sketch) {
    return tryParse(content)
      .map(remapErrorMessages)
      .filter(isLocationInSketch(sketch))
      .map(toErrorInfo)
      .reduce((acc, curr) => {
        const existingRef = acc.find((candidate) =>
          CoreError.ErrorLocationRef.equals(candidate, curr)
        );
        if (existingRef) {
          existingRef.rangesInOutput.push(...curr.rangesInOutput);
        } else {
          acc.push(curr);
        }
        return acc;
      }, [] as CoreError.ErrorLocation[]);
  }
  return [];
}

interface ParseResult {
  readonly path: string;
  readonly line: number;
  readonly column?: number;
  readonly errorPrefix: string;
  readonly error: string;
  readonly message?: string;
  readonly rangeInOutput?: Range | undefined;
}
namespace ParseResult {
  export function keyOf(result: ParseResult): string {
    /**
     * The CLI compiler might return with the same error multiple times. This is the key function for the distinct set calculation.
     */
    return JSON.stringify(result);
  }
}

function isLocationInSketch(sketch: Sketch): (result: ParseResult) => boolean {
  return (result) => {
    const uri = FileUri.create(result.path).toString();
    if (!Sketch.isInSketch(uri, sketch)) {
      console.warn(
        `URI <${uri}> is not contained in sketch: <${JSON.stringify(sketch)}>`
      );
      return false;
    }
    return true;
  };
}

function toErrorInfo({
  error,
  message,
  path,
  line,
  column,
  rangeInOutput,
}: ParseResult): CoreError.ErrorLocation {
  return {
    message: error,
    details: message,
    location: {
      uri: FileUri.create(path).toString(),
      range: range(line, column),
    },
    rangesInOutput: rangeInOutput ? [rangeInOutput] : [],
  };
}

function range(line: number, column?: number): Range {
  const start = Position.create(
    line - 1,
    typeof column === 'number' ? column - 1 : 0
  );
  return {
    start,
    end: start,
  };
}

function tryParse(content: string): ParseResult[] {
  // Shamelessly stolen from the Java IDE: https://github.com/arduino/Arduino/blob/43b0818f7fa8073301db1b80ac832b7b7596b828/arduino-core/src/cc/arduino/Compiler.java#L137
  const re = new RegExp(
    '(.+\\.\\w+):(\\d+)(:\\d+)*:\\s*((fatal)?\\s*error:\\s*)(.*)\\s*',
    'gm'
  );
  return Array.from(content.matchAll(re) ?? [])
    .map((match) => {
      const { index: start } = match;
      const [, path, rawLine, rawColumn, errorPrefix, , error] = match.map(
        (match) => (match ? match.trim() : match)
      );
      const line = Number.parseInt(rawLine, 10);
      if (!Number.isInteger(line)) {
        console.warn(
          `Could not parse line number. Raw input: <${rawLine}>, parsed integer: <${line}>.`
        );
        return undefined;
      }
      let column: number | undefined = undefined;
      if (rawColumn) {
        const normalizedRawColumn = rawColumn.slice(-1); // trims the leading colon => `:3` will be `3`
        column = Number.parseInt(normalizedRawColumn, 10);
        if (!Number.isInteger(column)) {
          console.warn(
            `Could not parse column number. Raw input: <${normalizedRawColumn}>, parsed integer: <${column}>.`
          );
        }
      }
      const rangeInOutput = findRangeInOutput(
        start,
        { path, rawLine, rawColumn },
        content
      );
      return {
        path,
        line,
        column,
        errorPrefix,
        error,
        rangeInOutput,
      };
    })
    .filter(notEmpty);
}

/**
 * Converts cryptic and legacy error messages to nice ones. Taken from the Java IDE.
 */
function remapErrorMessages(result: ParseResult): ParseResult {
  const knownError = KnownErrors[result.error];
  if (!knownError) {
    return result;
  }
  const { message, error } = knownError;
  return {
    ...result,
    ...(message && { message }),
    ...(error && { error }),
  };
}

// Based on the Java IDE: https://github.com/arduino/Arduino/blob/43b0818f7fa8073301db1b80ac832b7b7596b828/arduino-core/src/cc/arduino/Compiler.java#L528-L578
const KnownErrors: Record<string, { error: string; message?: string }> = {
  "'Mouse' was not declared in this scope": {
    error: nls.localize(
      'arduino/cli-error-parser/mouseError',
      "'Mouse' not found. Does your sketch include the line '#include <Mouse.h>'?"
    ),
  },
  "'Keyboard' was not declared in this scope": {
    error: nls.localize(
      'arduino/cli-error-parser/keyboardError',
      "'Keyboard' not found. Does your sketch include the line '#include <Keyboard.h>'?"
    ),
  },
};

function findRangeInOutput(
  startIndex: number | undefined,
  groups: { path: string; rawLine: string; rawColumn: string | null },
  content: string // TODO? lines: string[]? can this code break line on `\n`? const lines = content.split(/\r?\n/) ?? [];
): Range | undefined {
  if (startIndex === undefined) {
    return undefined;
  }
  // /path/to/location/Sketch/Sketch.ino:36:42
  const offset =
    groups.path.length +
    ':'.length +
    groups.rawLine.length +
    (groups.rawColumn ? groups.rawColumn.length : 0);
  const start = toPosition(startIndex, content);
  if (!start) {
    return undefined;
  }
  const end = toPosition(startIndex + offset, content);
  if (!end) {
    return undefined;
  }
  return { start, end };
}

function toPosition(offset: number, content: string): Position | undefined {
  let line = 0;
  let character = 0;
  const length = content.length;
  for (let i = 0; i < length; i++) {
    const c = content.charAt(i);
    if (i === offset) {
      return { line, character };
    }
    if (c === '\n') {
      line++;
      character = 0;
    } else {
      character++;
    }
  }
  return undefined;
}
