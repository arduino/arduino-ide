export class SimpleBuffer {
  private chunks: Uint8Array[] = [];

  private flushInterval?: NodeJS.Timeout;

  constructor(onFlush: (chunk: string) => void, flushTimeout: number) {
    this.flushInterval = setInterval(() => {
      if (this.chunks.length > 0) {
        const chunkString = Buffer.concat(this.chunks).toString();
        this.clearChunks();

        onFlush(chunkString);
      }
    }, flushTimeout);
  }

  public addChunk(chunk: Uint8Array): void {
    this.chunks.push(chunk);
  }

  private clearChunks(): void {
    this.chunks = [];
  }

  public clearFlushInterval(): void {
    this.clearChunks();

    clearInterval(this.flushInterval);
    this.flushInterval = undefined;
  }
}
