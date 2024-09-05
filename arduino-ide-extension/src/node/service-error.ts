import { Metadata, StatusObject } from '@grpc/grpc-js';
import { Status } from './cli-protocol/google/rpc/status_pb';
import { stringToUint8Array } from '../common/utils';
import { ProgrammerIsRequiredForUploadError } from './cli-protocol/cc/arduino/cli/commands/v1/upload_pb';

type ProtoError = typeof ProgrammerIsRequiredForUploadError;
const protoErrorsMap = new Map<string, ProtoError>([
  [
    'type.googleapis.com/cc.arduino.cli.commands.v1.ProgrammerIsRequiredForUploadError',
    ProgrammerIsRequiredForUploadError,
  ],
  // handle other cli defined errors here
]);

export type ServiceError = StatusObject & Error;
export namespace ServiceError {
  export function isCancel(arg: unknown): arg is ServiceError & { code: 1 } {
    return is(arg) && arg.code === 1; // https://grpc.github.io/grpc/core/md_doc_statuscodes.html
  }

  export function is(arg: unknown): arg is ServiceError {
    return arg instanceof Error && isStatusObject(arg);
  }

  export function isInstanceOf(arg: unknown, type: unknown): boolean {
    if (!isStatusObject(arg)) {
      return false;
    }

    const bin = arg.metadata.get('grpc-status-details-bin')[0];

    const uint8Array =
      typeof bin === 'string'
        ? stringToUint8Array(bin)
        : new Uint8Array(bin.buffer, bin.byteOffset, bin.byteLength);

    const errors = Status.deserializeBinary(uint8Array)
      .getDetailsList()
      .map((details) => {
        const typeUrl = details.getTypeUrl();
        const ErrorType = protoErrorsMap.get(typeUrl);
        return ErrorType?.deserializeBinary(details.getValue_asU8());
      });

    return !!errors.find((error) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return error && error instanceof <any>type;
    });
  }

  function isStatusObject(arg: unknown): arg is StatusObject {
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
