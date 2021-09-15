export function tick(): Promise<void> {
  return new Promise((res) => setTimeout(res, 1));
}
