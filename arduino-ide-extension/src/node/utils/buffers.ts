import { DisposableCollection } from '@theia/core';
import { Disposable } from '@theia/core/shared/vscode-languageserver-protocol';
import { OutputMessage } from '../../common/protocol';

export class AutoFlushingBuffer implements Disposable {
  private readonly chunks = Chunks.create();
  private readonly toDispose;
  private timer?: NodeJS.Timeout;
  private disposed = false;

  constructor(
    onFlush: (chunks: Map<OutputMessage.Severity, string | undefined>) => void,
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
    this.chunks.get(severity)?.push(chunk);
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

type Chunks = Map<OutputMessage.Severity, Uint8Array[]>;
namespace Chunks {
  export function create(): Chunks {
    return new Map([
      [OutputMessage.Severity.Error, []],
      [OutputMessage.Severity.Warning, []],
      [OutputMessage.Severity.Info, []],
    ]);
  }
  export function clear(chunks: Chunks): Chunks {
    for (const chunk of chunks.values()) {
      chunk.length = 0;
    }
    return chunks;
  }
  export function isEmpty(chunks: Chunks): boolean {
    return ![...chunks.values()].some((chunk) => Boolean(chunk.length));
  }
  export function toString(
    chunks: Chunks
  ): Map<OutputMessage.Severity, string | undefined> {
    return new Map(
      Array.from(chunks.entries()).map(([severity, buffers]) => [
        severity,
        buffers.length ? Buffer.concat(buffers).toString() : undefined,
      ])
    );
  }
}