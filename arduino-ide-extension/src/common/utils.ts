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

export function isNullOrUndefined(what: any): what is undefined | null {
  return what === undefined || what === null;
}

export function measure<T>(
  what: string,
  task: () => Promise<T>,
  ...args: unknown[]
): Promise<T>;
export function measure<T>(what: string, task: () => T, ...args: unknown[]): T;
export function measure<T>(
  what: string,
  task: (() => Promise<T>) | (() => T),
  ...args: unknown[]
): Promise<T> | T {
  const start = performance.now();
  const result = task();
  if (typeof result === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const object = result as any;
    if ('then' in object) {
      return Promise.resolve(result).then((resolved) =>
        end(resolved, start, what, args)
      );
    }
  }
  return end(result, start, what, args);
}
function end<T>(object: T, start: number, what: string, args: unknown[]): T {
  console.log(
    `--- #1428 --- ${what} took ${performance.now() - start} ms.${
      args.length ? ` Args: ${tryStringify(args)}` : ''
    }`
  );
  return object;
}
function tryStringify(args: unknown[]): string {
  try {
    return JSON.stringify(args);
  } catch (err) {
    if (
      err instanceof TypeError &&
      err.message.toLowerCase().includes('circular structure to json')
    ) {
      return '<circular>';
    }
    throw err;
  }
}
