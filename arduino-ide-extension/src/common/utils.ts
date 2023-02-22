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

// Text encoder can crash in electron browser: https://github.com/arduino/arduino-ide/issues/634#issuecomment-1440039171
export function unit8ArrayToString(uint8Array: Uint8Array): string {
  return uint8Array.reduce(
    (text, byte) => text + String.fromCharCode(byte),
    ''
  );
}
export function stringToUint8Array(text: string): Uint8Array {
  return Uint8Array.from(text, (char) => char.charCodeAt(0));
}
