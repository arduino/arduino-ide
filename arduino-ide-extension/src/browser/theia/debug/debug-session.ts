import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { Mutable } from '@theia/core/lib/common/types';
import { URI } from '@theia/core/lib/common/uri';
import { DebugSession as TheiaDebugSession } from '@theia/debug/lib/browser/debug-session';
import { DebugFunctionBreakpoint } from '@theia/debug/lib/browser/model/debug-function-breakpoint';
import { DebugSourceBreakpoint } from '@theia/debug/lib/browser/model/debug-source-breakpoint';
import {
  DebugThreadData,
  StoppedDetails,
} from '@theia/debug/lib/browser/model/debug-thread';
import { DebugProtocol } from '@vscode/debugprotocol';
import { DebugThread } from './debug-thread';

export class DebugSession extends TheiaDebugSession {
  /**
   * The `send('initialize')` request resolves later than `on('initialized')` emits the event.
   * Hence, the `configure` would use the empty object `capabilities`.
   * Using the empty `capabilities` could result in missing exception breakpoint filters, as
   * always `capabilities.exceptionBreakpointFilters` is falsy. This deferred promise works
   * around this timing issue.
   * See: https://github.com/eclipse-theia/theia/issues/11886.
   */
  protected didReceiveCapabilities = new Deferred();

  protected override async initialize(): Promise<void> {
    const clientName = FrontendApplicationConfigProvider.get().applicationName;
    try {
      const response = await this.connection.sendRequest('initialize', {
        clientID: clientName.toLocaleLowerCase().replace(/ /g, '_'),
        clientName,
        adapterID: this.configuration.type,
        locale: 'en-US',
        linesStartAt1: true,
        columnsStartAt1: true,
        pathFormat: 'path',
        supportsVariableType: false,
        supportsVariablePaging: false,
        supportsRunInTerminalRequest: true,
      });
      this.updateCapabilities(response?.body || {});
      this.didReceiveCapabilities.resolve();
    } catch (err) {
      this.didReceiveCapabilities.reject(err);
      throw err;
    }
  }

  protected override async configure(): Promise<void> {
    await this.didReceiveCapabilities.promise;
    return super.configure();
  }

  override async stop(isRestart: boolean, callback: () => void): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _this = this as any;
    if (!_this.isStopping) {
      _this.isStopping = true;
      if (this.configuration.lifecycleManagedByParent && this.parentSession) {
        await this.parentSession.stop(isRestart, callback);
      } else {
        if (this.canTerminate()) {
          const terminated = this.waitFor('terminated', 5000);
          try {
            await this.connection.sendRequest(
              'terminate',
              { restart: isRestart },
              5000
            );
            await terminated;
          } catch (e) {
            console.error('Did not receive terminated event in time', e);
          }
        } else {
          const terminateDebuggee =
            this.initialized && this.capabilities.supportTerminateDebuggee;
          // Related https://github.com/microsoft/vscode/issues/165138
          try {
            await this.sendRequest(
              'disconnect',
              { restart: isRestart, terminateDebuggee },
              2000
            );
          } catch (err) {
            if (
              'message' in err &&
              typeof err.message === 'string' &&
              err.message.test(err.message)
            ) {
              // VS Code ignores errors when sending the `disconnect` request.
              // Debug adapter might not send the `disconnected` event as a response.
            } else {
              throw err;
            }
          }
        }
        callback();
      }
    }
  }

  protected override async sendFunctionBreakpoints(
    affectedUri: URI
  ): Promise<void> {
    const all = this.breakpoints
      .getFunctionBreakpoints()
      .map(
        (origin) =>
          new DebugFunctionBreakpoint(origin, this.asDebugBreakpointOptions())
      );
    const enabled = all.filter((b) => b.enabled);
    if (this.capabilities.supportsFunctionBreakpoints) {
      try {
        const response = await this.sendRequest('setFunctionBreakpoints', {
          breakpoints: enabled.map((b) => b.origin.raw),
        });
        // Apparently, `body` and `breakpoints` can be missing.
        // https://github.com/eclipse-theia/theia/issues/11885
        // https://github.com/microsoft/vscode/blob/80004351ccf0884b58359f7c8c801c91bb827d83/src/vs/workbench/contrib/debug/browser/debugSession.ts#L448-L449
        if (response && response.body) {
          response.body.breakpoints.forEach((raw, index) => {
            // node debug adapter returns more breakpoints sometimes
            if (enabled[index]) {
              enabled[index].update({ raw });
            }
          });
        }
      } catch (error) {
        // could be error or promise rejection of DebugProtocol.SetFunctionBreakpoints
        if (error instanceof Error) {
          console.error(`Error setting breakpoints: ${error.message}`);
        } else {
          // handle adapters that send failed DebugProtocol.SetFunctionBreakpoints for invalid breakpoints
          const genericMessage =
            'Function breakpoint not valid for current debug session';
          const message = error.message ? `${error.message}` : genericMessage;
          console.warn(
            `Could not handle function breakpoints: ${message}, disabling...`
          );
          enabled.forEach((b) =>
            b.update({
              raw: {
                verified: false,
                message,
              },
            })
          );
        }
      }
    }
    this.setBreakpoints(affectedUri, all);
  }

  protected override async sendSourceBreakpoints(
    affectedUri: URI,
    sourceModified?: boolean
  ): Promise<void> {
    const source = await this.toSource(affectedUri);
    const all = this.breakpoints
      .findMarkers({ uri: affectedUri })
      .map(
        ({ data }) =>
          new DebugSourceBreakpoint(data, this.asDebugBreakpointOptions())
      );
    const enabled = all.filter((b) => b.enabled);
    try {
      const breakpoints = enabled.map(({ origin }) => origin.raw);
      const response = await this.sendRequest('setBreakpoints', {
        source: source.raw,
        sourceModified,
        breakpoints,
        lines: breakpoints.map(({ line }) => line),
      });
      response.body.breakpoints.forEach((raw, index) => {
        // node debug adapter returns more breakpoints sometimes
        if (enabled[index]) {
          enabled[index].update({ raw });
        }
      });
    } catch (error) {
      // could be error or promise rejection of DebugProtocol.SetBreakpointsResponse
      if (error instanceof Error) {
        console.error(`Error setting breakpoints: ${error.message}`);
      } else {
        // handle adapters that send failed DebugProtocol.SetBreakpointsResponse for invalid breakpoints
        const genericMessage = 'Breakpoint not valid for current debug session';
        const message = error.message ? `${error.message}` : genericMessage;
        console.warn(
          `Could not handle breakpoints for ${affectedUri}: ${message}, disabling...`
        );
        enabled.forEach((b) =>
          b.update({
            raw: {
              verified: false,
              message,
            },
          })
        );
      }
    }
    this.setSourceBreakpoints(affectedUri, all);
  }

  protected override doUpdateThreads(
    threads: DebugProtocol.Thread[],
    stoppedDetails?: StoppedDetails
  ): void {
    const existing = this._threads;
    this._threads = new Map();
    for (const raw of threads) {
      const id = raw.id;
      const thread = existing.get(id) || new DebugThread(this); // patched debug thread
      this._threads.set(id, thread);
      const data: Partial<Mutable<DebugThreadData>> = { raw };
      if (stoppedDetails) {
        if (stoppedDetails.threadId === id) {
          data.stoppedDetails = stoppedDetails;
        } else if (stoppedDetails.allThreadsStopped) {
          data.stoppedDetails = {
            // When a debug adapter notifies us that all threads are stopped,
            // we do not know why the others are stopped, so we should default
            // to something generic.
            reason: '',
          };
        }
      }
      thread.update(data);
    }
    this.updateCurrentThread(stoppedDetails);
  }
}
