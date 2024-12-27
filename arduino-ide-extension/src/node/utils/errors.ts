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
   * _(Permission denied):_ An attempt was made to access a file in a way forbidden by its file access permissions.
   */
  export function isEACCES(
    arg: unknown
  ): arg is ErrnoException & { code: 'EACCES' } {
    return is(arg) && arg.code === 'EACCES';
  }

  /**
   * _(No such file or directory):_ Commonly raised by `fs` operations to indicate that a component of the specified pathname does not exist — no entity (file or directory) could be found by the given path.
   */
  export function isENOENT(
    arg: unknown
  ): arg is ErrnoException & { code: 'ENOENT' } {
    return is(arg) && arg.code === 'ENOENT';
  }

  /**
   * _(Not a directory):_ A component of the given pathname existed, but was not a directory as expected. Commonly raised by `fs.readdir`.
   */
  export function isENOTDIR(
    arg: unknown
  ): arg is ErrnoException & { code: 'ENOTDIR' } {
    return is(arg) && arg.code === 'ENOTDIR';
  }

  /**
   * _"That 4094 error code is a generic network-or-configuration error, Node.js just passes it on from the operating system."_
   *
   * See [nodejs/node#19965](https://github.com/nodejs/node/issues/19965#issuecomment-380750573) for more details.
   */
  export function isUNKNOWN(
    arg: unknown
  ): arg is ErrnoException & { code: 'UNKNOWN' } {
    return is(arg) && arg.code === 'UNKNOWN';
  }
}
