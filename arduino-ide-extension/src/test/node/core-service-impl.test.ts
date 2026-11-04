import { Metadata } from '@grpc/grpc-js';
import { Status as StatusCode } from '@grpc/grpc-js/build/src/constants';
import { CancellationTokenSource } from '@theia/core/lib/common/cancellation';
import { FileUri } from '@theia/core/lib/common/file-uri';
import { expect } from 'chai';
import { Any } from 'google-protobuf/google/protobuf/any_pb';
import { Readable } from 'node:stream';
import {
  PortIdentifier,
  portIdentifierEquals,
  Port,
} from '../../common/protocol/boards-service';
import { CoreError, CoreService } from '../../common/protocol/core-service';
import { UserAbortApplicationError } from '../../common/protocol/progressible';
import {
  BuilderResult,
  CompileResponse,
  InstanceNeedsReinitializationError,
} from '../../node/cli-protocol/cc/arduino/cli/commands/v1/compile_pb';
import { Port as RpcPort } from '../../node/cli-protocol/cc/arduino/cli/commands/v1/port_pb';
import { Status } from '../../node/cli-protocol/google/rpc/status_pb';
import { CoreServiceImpl } from '../../node/core-service-impl';

describe('core-service-impl', () => {
  describe('createPort', () => {
    it("should map the 'undefined' port object to an 'undefined' gRPC port value", () => {
      const actual = new CoreServiceImpl()['createPort'](undefined);
      expect(actual).to.be.undefined;
    });

    it('should map a port object to the appropriate gRPC port object', () => {
      const properties = {
        alma: 'false',
        korte: '36',
      };
      const port = {
        address: 'address',
        addressLabel: 'address label',
        hardwareId: '1730323',
        protocol: 'serial',
        protocolLabel: 'serial port',
        properties,
      } as const;
      const resolve = (toResolve: PortIdentifier): Port | undefined => {
        if (portIdentifierEquals(toResolve, port)) {
          return port;
        }
        return undefined;
      };
      const actual = new CoreServiceImpl()['createPort'](
        { protocol: port.protocol, address: port.address },
        resolve
      );
      expect(actual).to.be.not.undefined;
      const expected = new RpcPort()
        .setAddress(port.address)
        .setHardwareId(port.hardwareId)
        .setLabel(port.addressLabel)
        .setProtocol(port.protocol)
        .setProtocolLabel(port.protocolLabel);
      Object.entries(properties).forEach(([key, value]) =>
        expected.getPropertiesMap().set(key, value)
      );
      expect((<RpcPort>actual).toObject(false)).to.be.deep.equal(
        expected.toObject(false)
      );
    });
  });

  describe('compile', () => {
    const buildPath = '/path/to/build';
    const options: CoreService.Options.Compile = {
      sketch: {
        name: 'sketch',
        uri: FileUri.create('/path/to/sketch').toString(),
        mainFileUri: FileUri.create('/path/to/sketch/sketch.ino').toString(),
        otherSketchFileUris: [],
        additionalFileUris: [],
        rootFolderFileUris: [],
      },
      fqbn: 'a:b:c',
      verbose: false,
      optimizeForDebug: false,
      sourceOverride: {},
    };

    // Same order as grpc-js on a failed call: 'error', then 'end'.
    function failingStream(): Readable {
      const stream = createStream();
      setTimeout(() => {
        stream.push(null);
        stream.emit('error', instanceNeedsReinitializationError());
      });
      return stream;
    }

    function succeedingStream(): Readable {
      const stream = createStream();
      setTimeout(() => {
        stream.push(
          new CompileResponse().setResult(
            new BuilderResult().setBuildPath(buildPath)
          )
        );
        stream.push(null);
      });
      return stream;
    }

    function createStream(): Readable {
      const stream = new Readable({
        objectMode: true,
        read: () => {
          /* NOOP */
        },
      });
      return Object.assign(stream, { cancel: () => stream.destroy() });
    }

    function instanceNeedsReinitializationError(): Error {
      const details = new Any();
      details.pack(
        new InstanceNeedsReinitializationError().serializeBinary(),
        'cc.arduino.cli.commands.v1.InstanceNeedsReinitializationError'
      );
      const metadata = new Metadata();
      metadata.set(
        'grpc-status-details-bin',
        Buffer.from(new Status().setDetailsList([details]).serializeBinary())
      );
      return Object.assign(new Error('needs reinitialization'), {
        code: StatusCode.INVALID_ARGUMENT,
        details:
          'The instance is no longer valid and needs to be reinitialized',
        metadata,
      });
    }

    function emptyStream(): Readable {
      const stream = createStream();
      setTimeout(() => stream.push(null));
      return stream;
    }

    function createCoreService(
      streams: (() => Readable)[],
      refresh: () => Promise<void> = () => Promise.resolve()
    ): { coreService: CoreServiceImpl; events: string[] } {
      const events: string[] = [];
      const client = {
        compile: () => {
          events.push('compile');
          const stream = streams.shift();
          if (!stream) {
            throw new Error('Unexpected compile call');
          }
          return stream();
        },
      };
      const coreService = new CoreServiceImpl();
      Object.assign(coreService, {
        coreClientProvider: {
          client: Promise.resolve({ client, instance: undefined }),
          refresh: async () => {
            events.push('refresh');
            await refresh();
            events.push('refreshed');
          },
        },
        responseService: {
          appendToOutput: () => {
            /* NOOP */
          },
        },
        notificationService: {
          notifyDidReinitialize: () => events.push('notifyDidReinitialize'),
        },
      });
      return { coreService, events };
    }

    async function compileError(
      coreService: CoreServiceImpl,
      token?: CancellationTokenSource['token']
    ): Promise<Error> {
      try {
        await coreService.compile(options, token);
      } catch (err) {
        return <Error>err;
      }
      expect.fail('Expected the compilation to fail');
    }

    it('should wait for the retry when the instance needs reinitialization', async () => {
      const { coreService, events } = createCoreService(
        [failingStream, succeedingStream],
        () => new Promise((resolve) => setTimeout(resolve, 50))
      );

      const summary = await coreService.compile(options);
      events.push('compiled');

      expect(summary?.buildPath).to.be.equal(buildPath);
      expect(events).to.be.deep.equal([
        'compile',
        'refresh',
        'refreshed',
        'compile',
        'notifyDidReinitialize',
        'compiled',
      ]);
    });

    it('should fail when the instance still needs reinitialization after the retry', async () => {
      const { coreService, events } = createCoreService([
        failingStream,
        failingStream,
      ]);

      const err = await compileError(coreService);

      expect(CoreError.VerifyFailed.is(err)).to.be.true;
      expect(events).to.be.deep.equal([
        'compile',
        'refresh',
        'refreshed',
        'compile',
        'notifyDidReinitialize',
      ]);
    });

    it('should not retry when cancelled during the reinitialization', async () => {
      const source = new CancellationTokenSource();
      const { coreService, events } = createCoreService([failingStream], () => {
        source.cancel();
        return Promise.resolve();
      });

      const err = await compileError(coreService, source.token);

      expect(UserAbortApplicationError.is(err)).to.be.true;
      expect(events).to.be.deep.equal([
        'compile',
        'refresh',
        'refreshed',
        'notifyDidReinitialize',
      ]);
    });

    it('should reject when the reinitialization fails', async () => {
      const { coreService, events } = createCoreService([failingStream], () =>
        Promise.reject(new Error('init failed'))
      );

      const err = await compileError(coreService);

      expect(err.message).to.be.equal('init failed');
      expect(events).to.be.deep.equal(['compile', 'refresh']);
    });

    it('should resolve with undefined when the compilation does not return a result', async () => {
      const { coreService, events } = createCoreService([emptyStream]);

      const summary = await coreService.compile(options);

      expect(summary).to.be.undefined;
      expect(events).to.be.deep.equal(['compile']);
    });
  });
});
