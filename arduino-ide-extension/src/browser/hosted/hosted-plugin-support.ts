import type { Event } from '@theia/core/lib/common/event';

/*
This implementation hides the default HostedPluginSupport implementation from Theia to be able to test it.
Otherwise, the default implementation fails at require time due to the `import.meta` in the Theia plugin worker code.
https://github.com/eclipse-theia/theia/blob/964f69ca3b3a5fb87ffa0177fb300b74ba0ca39f/packages/plugin-ext/src/hosted/browser/plugin-worker.ts#L30-L32
*/

export const HostedPluginSupport = Symbol('HostedPluginSupport');
export interface HostedPluginSupport {
  readonly didStart: Promise<void>;
  readonly onDidLoad: Event<void>;
  readonly onDidCloseConnection: Event<void>;
}
