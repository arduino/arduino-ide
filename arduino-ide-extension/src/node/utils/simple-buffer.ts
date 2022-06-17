export class SimpleBuffer {
  private chunks: Uint8Array[] = [];

  private flushInterval?: NodeJS.Timeout;

  private flush: () => void;

  constructor(onFlush: (chunk: string) => void, flushTimeout: number) {
    const flush = () => {
      if (this.chunks.length > 0) {
        const chunkString = Buffer.concat(this.chunks).toString();
        this.clearChunks();

        onFlush(chunkString);
      }
    };

    this.flush = flush;
    this.flushInterval = setInterval(flush, flushTimeout);
  }

  public addChunk(chunk: Uint8Array): void {
    this.chunks.push(chunk);
  }

  private clearChunks(): void {
    this.chunks = [];
  }

  public clearFlushInterval(): void {
    this.flush();
    this.clearChunks();

    clearInterval(this.flushInterval);
    this.flushInterval = undefined;
  }
}
