export class OutputPanelBufferProvider {
  chunks: Uint8Array[] = [];

  private flushInterval?: NodeJS.Timeout;

  constructor(onFlush: (chunk: string) => void, flushTimeout: number) {
    this.flushInterval = setInterval(() => {
      const chunkString = Buffer.concat(this.chunks).toString();
      onFlush(chunkString);
      this.clearChunks();
    }, flushTimeout);
  }

  public addChunk(chunk: Uint8Array): void {
    this.chunks.push(chunk);
  }

  private clearChunks() {
    this.chunks = [];
  }

  public clearFlushInterval(): void {
    this.clearChunks();

    clearInterval(this.flushInterval);
    this.flushInterval = undefined;
  }
}
