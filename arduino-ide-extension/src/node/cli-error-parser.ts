import { notEmpty } from '@theia/core';
import { nls } from '@theia/core/lib/common/nls';
import { FileUri } from '@theia/core/lib/node/file-uri';
import {
  Location,
  Range,
  Position,
} from '@theia/core/shared/vscode-languageserver-protocol';
import { Sketch } from '../common/protocol';

export interface ErrorInfo {
  readonly message?: string;
  readonly location?: Location;
  readonly details?: string;
}
export interface ErrorSource {
  readonly content: string | ReadonlyArray<Uint8Array>;
  readonly sketch?: Sketch;
}

export function tryParseError(source: ErrorSource): ErrorInfo[] {
  const { content, sketch } = source;
  const err =
    typeof content === 'string'
      ? content
      : Buffer.concat(content).toString('utf8');
  if (sketch) {
    return tryParse(err)
      .map(remapErrorMessages)
      .filter(isLocationInSketch(sketch))
      .map(errorInfo());
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
}
namespace ParseResult {
  export function keyOf(result: ParseResult): string {
    /**
     * The CLI compiler might return with the same error multiple times. This is the key function for the distinct set calculation.
     */
    return JSON.stringify(result);
  }
}

function isLocationInSketch(
  sketch: Sketch
): (value: ParseResult, index: number, array: ParseResult[]) => unknown {
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

function errorInfo(): (value: ParseResult) => ErrorInfo {
  return ({ error, message, path, line, column }) => ({
    message: error,
    details: message,
    location: {
      uri: FileUri.create(path).toString(),
      range: range(line, column),
    },
  });
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

export function tryParse(raw: string): ParseResult[] {
  // Shamelessly stolen from the Java IDE: https://github.com/arduino/Arduino/blob/43b0818f7fa8073301db1b80ac832b7b7596b828/arduino-core/src/cc/arduino/Compiler.java#L137
  const re = new RegExp(
    '(.+\\.\\w+):(\\d+)(:\\d+)*:\\s*((fatal)?\\s*error:\\s*)(.*)\\s*',
    'gm'
  );
  return [
    ...new Map(
      Array.from(raw.matchAll(re) ?? [])
        .map((match) => {
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
          return {
            path,
            line,
            column,
            errorPrefix,
            error,
          };
        })
        .filter(notEmpty)
        .map((result) => [ParseResult.keyOf(result), result])
    ).values(),
  ];
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
