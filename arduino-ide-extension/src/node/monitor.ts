import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { Emitter, Event } from '@theia/core/lib/common/event';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { isAbortError } from 'abort-controller-x';
import type { PortIdentifier } from '../common/protocol';
import type {
  ArduinoCoreServiceClient,
  MonitorPortConfiguration,
  MonitorPortSetting,
  MonitorRequest,
} from './cli-api';

export interface Streamable<T = void> extends Disposable {
  readonly onDidReceiveMessage: Event<string>;
  /**
   * The error event usually wraps an error message (`string`) received from the Arduino CLI, but can be an `Error` instance, a gRPC `Status` object, or an unknown throwable.
   */
  readonly onDidReceiveError: Event<unknown>;
  readonly onDidComplete: Event<T | undefined>;
}

export interface Monitor extends Streamable {
  readonly port: PortIdentifier;
  /**
   * When not set, it's still possible to connect to the monitor, but default values (for example, DTR) will be used.
   * ```sh
   * $ arduino-cli monitor -p /dev/ttyS0 --describe | grep dtr
   * dtr       DTR          on          on, off
   * $ arduino-cli monitor -p /dev/ttyS0 --describe -b esp32:esp32:esp32 | grep dtr
   * dtr       DTR          off         on, off
   * ```
   */
  readonly fqbn?: string | undefined;
  sendMessage(message: string): void;
  updateConfiguration(settings: MonitorPortConfiguration): void;
  readonly onDidStart: Event<void>;
  readonly onDidChangeSettings: Event<MonitorPortSetting[]>;
}

export function createMonitor(
  client: ArduinoCoreServiceClient,
  req: MonitorRequest
): Monitor {
  if (!req.port) {
    throw new Error("Missing 'MonitorRequest#port'");
  }
  const abortController = new AbortController();
  const signal = abortController.signal;
  const onDidStartEmitter = new Emitter<void>();
  const onDidCompleteEmitter = new Emitter<void>();
  const fqbn = req.fqbn;
  const port = { protocol: req.port.protocol, address: req.port.address };
  const instance = req.instance;
  const monitorController = new MonitorPtyController(fqbn, port);
  const onDidReceiveErrorEmitter = new Emitter<unknown>();
  const onDidChangeSettingsEmitter = new Emitter<MonitorPortSetting[]>();
  const toDispose = new DisposableCollection(
    Disposable.create(() => abortController.abort()),
    onDidStartEmitter,
    onDidCompleteEmitter,
    monitorController,
    onDidReceiveErrorEmitter,
    onDidChangeSettingsEmitter
  );
  const encoder = new TextEncoder();
  let nextMessage = new Deferred<string>();
  let nextConfiguration = new Deferred<MonitorPortConfiguration>();
  const monitorRequest: AsyncIterable<MonitorRequest> = {
    [Symbol.asyncIterator]: async function* (): AsyncGenerator<
      MonitorRequest,
      void,
      unknown
    > {
      yield <MonitorRequest>{ ...req, instance };
      for (;;) {
        const next = await Promise.race([
          nextMessage.promise,
          nextConfiguration.promise,
        ]);
        nextMessage = new Deferred<string>();
        nextConfiguration = new Deferred<MonitorPortConfiguration>();
        if (typeof next === 'string') {
          const txData = encoder.encode(next);
          yield <MonitorRequest>{ txData, instance };
        } else {
          const portConfiguration = next;
          yield <MonitorRequest>{ portConfiguration, instance };
        }
      }
    },
  };
  const start = async (): Promise<void> => {
    try {
      for await (const resp of client.monitor(monitorRequest, {
        signal,
      })) {
        if (resp.error) {
          onDidReceiveErrorEmitter.fire(new Error(resp.error));
        }
        if (resp.success) {
          onDidStartEmitter.fire();
        }
        if (resp.appliedSettings && resp.appliedSettings.length) {
          onDidChangeSettingsEmitter.fire(resp.appliedSettings);
        }
        if (resp.rxData) {
          monitorController.scheduleFire(resp.rxData);
        }
      }
    } catch (err) {
      if (!isAbortError(err)) {
        onDidReceiveErrorEmitter.fire(err);
      } else {
        onDidReceiveErrorEmitter.fire(err.message + '\n');
      }
    } finally {
      onDidCompleteEmitter.fire();
      toDispose.dispose();
    }
  };
  const sendMessage = (message: string): void => nextMessage.resolve(message);
  const monitor = {
    port,
    fqbn,
    sendMessage,
    updateConfiguration(settings: MonitorPortConfiguration): void {
      nextConfiguration.resolve(settings);
    },
    onDidStart: onDidStartEmitter.event,
    onDidComplete: onDidCompleteEmitter.event,
    onDidReceiveMessage: monitorController.event,
    onDidReceiveError: onDidReceiveErrorEmitter.event,
    onDidChangeSettings: onDidChangeSettingsEmitter.event,
    dispose(): void {
      abortController.abort();
    },
  };
  toDispose.pushAll([
    monitor.onDidReceiveError((error) => {
      console.error(error); // TODO: wire out?
      monitor.dispose();
    }),
    monitor.onDidStart(() => monitorController.handleMonitorDidStart()),
    monitorController.onDidSendMessage(sendMessage),
    monitorController.onDidRequestTerminate(() => monitor.dispose()),
  ]);
  start();
  return monitor;
}

class BufferedEmitter extends Emitter<string> {
  private readonly decoder = new TextDecoder();
  private readonly buffer: Uint8Array[];
  private lastFlushTimestamp: number;
  private timer: NodeJS.Timer | undefined;

  /**
   * The default timeout is ~60Hz.
   */
  constructor(private readonly timeout = 50) {
    super();
    this.lastFlushTimestamp = -1;
    this.buffer = [];
    this.decoder = new TextDecoder();
  }

  scheduleFire(data: Uint8Array): void {
    if (!data.length) {
      return;
    }
    this.buffer.push(data);
    if (!this.timer) {
      this.timer = setInterval(() => this.flush(), this.timeout);
    }
  }

  private flush(force = false): void {
    const now = performance.now();
    if (
      this.buffer.length &&
      (force || now - this.lastFlushTimestamp >= this.timeout)
    ) {
      const message = this.buffer.reduce(
        (acc, curr) => (acc += this.decoder.decode(curr, { stream: true })),
        ''
      );
      this.lastFlushTimestamp = now;
      this.buffer.length = 0;
      this.fire(message);
    }
  }

  override dispose(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    super.dispose();
  }
}

class MonitorPtyController extends BufferedEmitter {
  private readonly onDidSendMessageEmitter: Emitter<string>;
  private readonly onDidRequestTerminateEmitter: Emitter<void>;
  // private readonly recentMessages: RecentItems<string>;
  private readonly toDispose: DisposableCollection;
  // private input: QuickPick<QuickPickItem> | undefined;

  constructor(
    private readonly fqbn: string,
    private readonly port: PortIdentifier
  ) {
    super();
    this.onDidSendMessageEmitter = new Emitter<string>();
    this.onDidRequestTerminateEmitter = new Emitter<void>();
    this.toDispose = new DisposableCollection(this.onDidSendMessageEmitter);
  }

  get onDidSendMessage(): Event<string> {
    return this.onDidSendMessageEmitter.event;
  }

  get onDidRequestTerminate(): Event<void> {
    return this.onDidRequestTerminateEmitter.event;
  }

  override dispose(): void {
    this.toDispose.dispose();
    super.dispose();
  }

  terminate(): void {
    this.fireTerminate();
  }

  sendMessage(message: string): void {
    this.onDidSendMessageEmitter.fire(message);
  }

  handleMonitorDidStart(): void {
    this.fire(`Connected to ${this.fqbn} on ${this.port}.\r\n`);
  }

  private fireTerminate(): void {
    this.onDidRequestTerminateEmitter.fire();
  }
}
