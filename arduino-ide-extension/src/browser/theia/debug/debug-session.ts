import { DebugSession as TheiaDebugSession } from '@theia/debug/lib/browser/debug-session';

export class DebugSession extends TheiaDebugSession {
  // eslint-disable-next-line unused-imports/no-unused-vars, @typescript-eslint/no-unused-vars
  protected override handleDisconnectError(err: unknown): void {
    // NOOP
  }
  // eslint-disable-next-line unused-imports/no-unused-vars, @typescript-eslint/no-unused-vars
  protected override handleTerminateError(err: unknown): void {
    // NOOP
  }
}
