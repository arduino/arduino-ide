import { DisposableCollection } from '@theia/core';
import { Disposable } from '@theia/core/shared/vscode-languageserver-protocol';
import { OutputMessage } from '../../common/protocol';

export class AutoFlushingBuffer implements Disposable {
  private readonly chunks: Array<[OutputMessage.Severity, Uint8Array]> = [];
  private readonly toDispose;
  private timer?: NodeJS.Timeout;
  private disposed = false;

  constructor(
    onFlush: (chunks: Array<[OutputMessage.Severity, string]>) => void,
    taskTimeout: number = AutoFlushingBuffer.DEFAULT_FLUSH_TIMEOUT_MS
  ) {
    const task = () => {
      if (!Chunks.isEmpty(this.chunks)) {
        const chunks = Chunks.toString(this.chunks);
        Chunks.clear(this.chunks);
        onFlush(chunks);
      }
      if (!this.disposed) {
        this.timer = setTimeout(task, taskTimeout);
      }
    };
    this.timer = setTimeout(task, taskTimeout);
    this.toDispose = new DisposableCollection(
      Disposable.create(() => (this.disposed = true)),
      Disposable.create(() => clearTimeout(this.timer)),
      Disposable.create(() => task())
    );
  }

  addChunk(
    chunk: Uint8Array,
    severity: OutputMessage.Severity = OutputMessage.Severity.Info
  ): void {
    if (chunk.length) {
      this.chunks.push([severity, chunk]);
    }
  }

  dispose(): void {
    this.toDispose.dispose();
  }
}
export namespace AutoFlushingBuffer {
  /**
   * _"chunking and sending every 16ms (60hz) is the best for small amount of data
   * To be able to crunch more data without the cpu going to high, I opted for a 30fps refresh rate, hence the 32msec"_
   */
  export const DEFAULT_FLUSH_TIMEOUT_MS = 32;
}

type Chunks = Array<[OutputMessage.Severity, Uint8Array]>;
namespace Chunks {
  export function clear(chunks: Chunks): Chunks {
    chunks.length = 0;
    return chunks;
  }
  export function isEmpty(chunks: Chunks): boolean {
    return ![...chunks.values()].some((chunk) => Boolean(chunk.length));
  }
  export function toString(
    chunks: Chunks
  ): Array<[OutputMessage.Severity, string]> {
    const result: Array<[OutputMessage.Severity, string]> = [];
    let current:
      | { severity: OutputMessage.Severity; buffers: Uint8Array[] }
      | undefined = undefined;
    const appendToResult = () => {
      if (current && current.buffers) {
        result.push([
          current.severity,
          Buffer.concat(current.buffers).toString('utf-8'),
        ]);
      }
    };
    for (const [severity, buffer] of chunks) {
      if (!buffer.length) {
        continue;
      }
      if (!current) {
        current = { severity, buffers: [buffer] };
      } else {
        if (current.severity === severity) {
          current.buffers.push(buffer);
        } else {
          appendToResult();
          current = { severity, buffers: [buffer] };
        }
      }
    }
    appendToResult();
    return result;
  }
}
