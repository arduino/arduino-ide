import { CancellationToken } from '@theia/core/lib/common/cancellation';
import { default as stringifySafe } from 'fast-safe-stringify';

export interface DurationOptions {
  /**
   * If not specified, falls back to the `String()` value of the `PropertyKey`.
   */
  name?: string;

  /**
   * If the duration exceeds this timeout (in millis), then the duration will be logged as an error.
   */
  timeout?: number;
}

export function duration(options?: DurationOptions) {
  return (
    _target: unknown,
    key: PropertyKey,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor => {
    const original = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      const input = args
        .filter((arg) => !Boolean(isCancellationToken(arg)))
        .map(stringify)
        .join(',');
      const start = performance.now();
      const result = await original.apply(this, args);
      const end = performance.now();
      const duration = end - start;
      // `×` is the multiplication sign (`&#215;`) and not `x` (`&#120;`), so that we will find it in the logs.
      const message = `××× Calling '${
        options?.name ?? String(key)
      }' took ${duration} ms. Args => ${input} ×××`;
      if (duration > (options?.timeout ?? 100)) {
        console.error(message);
      } else {
        console.info(message);
      }
      return result;
    };
    return descriptor;
  };
}

function stringify(arg: unknown): string {
  try {
    return JSON.stringify(arg);
  } catch {
    return stringifySafe(arg);
  }
}

// The cancellation token is implicitly the last arg of the JSON-RPC invocation. We want to filter it out from the logs.
// See: https://github.com/eclipse-theia/theia/issues/10129
function isCancellationToken(arg: unknown): arg is CancellationToken {
  return (
    typeof arg === 'object' &&
    arg !== null &&
    'onCancellationRequested' in arg &&
    'isCancellationRequested' in arg
  );
}
