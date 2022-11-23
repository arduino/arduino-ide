import type { ContextKey } from '@theia/core/lib/browser/context-key-service';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import {
  DebugSession,
  DebugState,
} from '@theia/debug/lib/browser/debug-session';
import { DebugSessionManager as TheiaDebugSessionManager } from '@theia/debug/lib/browser/debug-session-manager';
import type { DebugConfigurationSessionOptions } from '@theia/debug/lib/browser/debug-session-options';

function debugStateLabel(state: DebugState): string {
  switch (state) {
    case DebugState.Initializing:
      return 'initializing';
    case DebugState.Stopped:
      return 'stopped';
    case DebugState.Running:
      return 'running';
    default:
      return 'inactive';
  }
}

@injectable()
export class DebugSessionManager extends TheiaDebugSessionManager {
  protected debugStateKey: ContextKey<string>;

  @postConstruct()
  protected override init(): void {
    this.debugStateKey = this.contextKeyService.createKey<string>(
      'debugState',
      debugStateLabel(this.state)
    );
    super.init();
  }

  protected override fireDidChange(current: DebugSession | undefined): void {
    this.debugTypeKey.set(current?.configuration.type);
    this.inDebugModeKey.set(this.inDebugMode);
    this.debugStateKey.set(debugStateLabel(this.state));
    this.onDidChangeEmitter.fire(current);
  }

  protected override async doStart(
    sessionId: string,
    options: DebugConfigurationSessionOptions
  ): Promise<DebugSession> {
    const parentSession =
      options.configuration.parentSession &&
      this._sessions.get(options.configuration.parentSession.id);
    const contrib = this.sessionContributionRegistry.get(
      options.configuration.type
    );
    const sessionFactory = contrib
      ? contrib.debugSessionFactory()
      : this.debugSessionFactory;
    const session = sessionFactory.get(sessionId, options, parentSession);
    this._sessions.set(sessionId, session);

    this.debugTypeKey.set(session.configuration.type);
    // this.onDidCreateDebugSessionEmitter.fire(session); // defer the didCreate event after start https://github.com/eclipse-theia/theia/issues/11916

    let state = DebugState.Inactive;
    session.onDidChange(() => {
      if (state !== session.state) {
        state = session.state;
        if (state === DebugState.Stopped) {
          this.onDidStopDebugSessionEmitter.fire(session);
        }
      }
      this.updateCurrentSession(session);
    });
    session.onDidChangeBreakpoints((uri) =>
      this.fireDidChangeBreakpoints({ session, uri })
    );
    session.on('terminated', async (event) => {
      const restart = event.body && event.body.restart;
      if (restart) {
        // postDebugTask isn't run in case of auto restart as well as preLaunchTask
        this.doRestart(session, !!restart);
      } else {
        await session.disconnect(false, () =>
          this.debug.terminateDebugSession(session.id)
        );
        await this.runTask(
          session.options.workspaceFolderUri,
          session.configuration.postDebugTask
        );
      }
    });

    // eslint-disable-next-line unused-imports/no-unused-vars, @typescript-eslint/no-unused-vars
    session.on('exited', async (event) => {
      await session.disconnect(false, () =>
        this.debug.terminateDebugSession(session.id)
      );
    });

    session.onDispose(() => this.cleanup(session));
    session
      .start()
      .then(() => {
        this.onDidCreateDebugSessionEmitter.fire(session); // now fire the didCreate event
        this.onDidStartDebugSessionEmitter.fire(session);
      })
      // eslint-disable-next-line unused-imports/no-unused-vars, @typescript-eslint/no-unused-vars
      .catch((e) => {
        session.stop(false, () => {
          this.debug.terminateDebugSession(session.id);
        });
      });
    session.onDidCustomEvent(({ event, body }) =>
      this.onDidReceiveDebugSessionCustomEventEmitter.fire({
        event,
        body,
        session,
      })
    );
    return session;
  }
}
