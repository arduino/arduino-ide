export type ErrnoException = Error & { code: string; errno: number };
export namespace ErrnoException {
  export function is(arg: unknown): arg is ErrnoException {
    if (arg instanceof Error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = arg as any;
      return (
        'code' in error &&
        'errno' in error &&
        typeof error['code'] === 'string' &&
        typeof error['errno'] === 'number'
      );
    }
    return false;
  }

  /**
   *  (No such file or directory): Commonly raised by `fs` operations to indicate that a component of the specified pathname does not exist — no entity (file or directory) could be found by the given path.
   */
  export function isENOENT(
    arg: unknown
  ): arg is ErrnoException & { code: 'ENOENT' } {
    return is(arg) && arg.code === 'ENOENT';
  }

  /**
   * (Not a directory): A component of the given pathname existed, but was not a directory as expected. Commonly raised by `fs.readdir`.
   */
  export function isENOTDIR(
    arg: unknown
  ): arg is ErrnoException & { code: 'ENOTDIR' } {
    return is(arg) && arg.code === 'ENOTDIR';
  }
}
