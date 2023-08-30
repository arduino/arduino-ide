import { ClientError } from 'nice-grpc';
export type ServiceError = ClientError & Error;
export namespace ServiceError {
  export function isCancel(arg: unknown): arg is ServiceError & { code: 1 } {
    return is(arg) && arg.code === 1; // https://grpc.github.io/grpc/core/md_doc_statuscodes.html
  }
  export function is(arg: unknown): arg is ServiceError {
    return arg instanceof ClientError;
  }
}
