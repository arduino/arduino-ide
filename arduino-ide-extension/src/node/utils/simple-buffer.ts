import { Disposable } from '@theia/core/shared/vscode-languageserver-protocol';
import { OutputMessage } from '../../common/protocol';

const DEFAULT_FLUS_TIMEOUT_MS = 32;

export class SimpleBuffer implements Disposable {
  private readonly flush: () => void;
  private readonly chunks = Chunks.create();
  private flushInterval?: NodeJS.Timeout;

  constructor(onFlush: (chunk: string) => void, flushTimeout: number) {
    const flush = () => {
      if (this.chunks.length > 0) {
        const chunkString = Buffer.concat(this.chunks).toString();
        this.clearChunks();
        onFlush(chunks);
      }
    };

    this.flush = flush;
    this.flushInterval = setInterval(flush, flushTimeout);
  }

  public addChunk(
    chunk: Uint8Array,
    severity: OutputMessage.Severity = OutputMessage.Severity.Info
  ): void {
    this.chunks.get(severity)?.push(chunk);
  }

  private clearChunks(): void {
    Chunks.clear(this.chunks);
  }

  public clearFlushInterval(): void {
    this.flush();
    this.clearChunks();

    clearInterval(this.flushInterval);
    this.clearChunks();
    this.flushInterval = undefined;
  }
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
