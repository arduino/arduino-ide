export const naturalCompare: (left: string, right: string) => number =
  require('string-natural-compare').caseInsensitive;

export function notEmpty(arg: string | undefined | null): arg is string {
  return !!arg;
}

export function firstToLowerCase(what: string): string {
  return what.charAt(0).toLowerCase() + what.slice(1);
}

export function firstToUpperCase(what: string): string {
  return what.charAt(0).toUpperCase() + what.slice(1);
}

export function startsWithUpperCase(what: string): boolean {
  return !!what && what.charAt(0) === firstToUpperCase(what.charAt(0));
}

export function isNullOrUndefined(what: unknown): what is undefined | null {
  return what === undefined || what === null;
}

// Use it for and exhaustive `switch` statements
// https://stackoverflow.com/a/39419171/5529090
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function assertUnreachable(_: never): never {
  throw new Error();
}

// Text encoder can crash in electron browser: https://github.com/arduino/arduino-ide/issues/634#issuecomment-1440039171
export function uint8ArrayToString(uint8Array: Uint8Array): string {
  return uint8Array.reduce(
    (text, byte) => text + String.fromCharCode(byte),
    ''
  );
}
export function stringToUint8Array(text: string): Uint8Array {
  return Uint8Array.from(text, (char) => char.charCodeAt(0));
}
