import { Metadata, StatusObject } from '@grpc/grpc-js';
import { Status } from './cli-protocol/google/rpc/status_pb';
import { stringToUint8Array } from '../common/utils';
import { Status as StatusCode } from '@grpc/grpc-js/build/src/constants';
import { ProgrammerIsRequiredForUploadError } from './cli-protocol/cc/arduino/cli/commands/v1/upload_pb';
import { InstanceNeedsReinitializationError } from './cli-protocol/cc/arduino/cli/commands/v1/compile_pb';

type ProtoError = typeof ProgrammerIsRequiredForUploadError;
const protoErrorsMap = new Map<string, ProtoError>([
  [
    'cc.arduino.cli.commands.v1.ProgrammerIsRequiredForUploadError',
    ProgrammerIsRequiredForUploadError,
  ],
  [
    'cc.arduino.cli.commands.v1.InstanceNeedsReinitializationError',
    InstanceNeedsReinitializationError,
  ],
  // handle other cli defined errors here
]);

export type ServiceError = StatusObject & Error;
export namespace ServiceError {
  export function isCancel(
    arg: unknown
  ): arg is ServiceError & { code: StatusCode.CANCELLED } {
    return is(arg) && arg.code === 1; // https://grpc.github.io/grpc/core/md_doc_statuscodes.html
  }

  export function isInvalidArgument(
    arg: unknown
  ): arg is ServiceError & { code: StatusCode.INVALID_ARGUMENT } {
    return is(arg) && arg.code === 3; // https://grpc.github.io/grpc/core/md_doc_statuscodes.html
  }

  export function is(arg: unknown): arg is ServiceError {
    return arg instanceof Error && isStatusObject(arg);
  }

  export function isInstanceOf<ProtoError>(
    arg: unknown,
    type: new (...args: unknown[]) => ProtoError
  ): arg is ProtoError {
    if (!isStatusObject(arg)) {
      return false;
    }

    try {
      const bin = arg.metadata.get('grpc-status-details-bin')[0];
      const uint8Array =
        typeof bin === 'string'
          ? stringToUint8Array(bin)
          : new Uint8Array(bin.buffer, bin.byteOffset, bin.byteLength);

      const errors = Status.deserializeBinary(uint8Array)
        .getDetailsList()
        .map((details) => {
          const typeName = details.getTypeName();
          const ErrorType = protoErrorsMap.get(typeName);
          return ErrorType?.deserializeBinary(details.getValue_asU8());
        });

      return !!errors.find((error) => error && error instanceof type);
    } catch {
      return false;
    }
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
