import { Metadata, StatusObject } from '@grpc/grpc-js';

export type ServiceError = StatusObject & Error;
export namespace ServiceError {
  export function isCancel(arg: unknown): arg is ServiceError & { code: 1 } {
    return is(arg) && arg.code === 1; // https://grpc.github.io/grpc/core/md_doc_statuscodes.html
  }
  export function is(arg: unknown): arg is ServiceError {
    return arg instanceof Error && isStatusObjet(arg);
  }
  function isStatusObjet(arg: unknown): arg is StatusObject {
    if (typeof arg === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const any = arg as any;
      return (
        !!arg &&
        'code' in arg &&
        'details' in arg &&
        typeof any.details === 'string' &&
        'metadata' in arg &&
        any.metadata instanceof Metadata
      );
    }
    return false;
  }
}
