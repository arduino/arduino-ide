import { Emitter, Event } from '@theia/core/lib/common/event';

const neverEmitter = new Emitter<unknown>();
export function never<T = void>(): Event<T> {
  return neverEmitter.event as Event<T>;
}
