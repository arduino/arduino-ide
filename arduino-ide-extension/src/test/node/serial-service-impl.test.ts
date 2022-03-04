import { SerialServiceImpl } from './../../node/serial/serial-service-impl';
import { IMock, It, Mock } from 'typemoq';
import { createSandbox } from 'sinon';
import * as sinonChai from 'sinon-chai';
import { expect, use } from 'chai';
use(sinonChai);

import { ILogger } from '@theia/core/lib/common/logger';
import { MonitorClientProvider } from '../../node/serial/monitor-client-provider';
import { WebSocketProvider } from '../../node/web-socket/web-socket-provider';
import { MonitorServiceClient } from '../../node/cli-protocol/cc/arduino/cli/monitor/v1/monitor_grpc_pb';
import { Status } from '../../common/protocol';

describe('SerialServiceImpl', () => {
  let subject: SerialServiceImpl;

  let logger: IMock<ILogger>;
  let serialClientProvider: IMock<MonitorClientProvider>;
  let webSocketService: IMock<WebSocketProvider>;

  beforeEach(() => {
    logger = Mock.ofType<ILogger>();
    logger.setup((b) => b.info(It.isAnyString()));
    logger.setup((b) => b.warn(It.isAnyString()));
    logger.setup((b) => b.error(It.isAnyString()));

    serialClientProvider = Mock.ofType<MonitorClientProvider>();
    webSocketService = Mock.ofType<WebSocketProvider>();

    subject = new SerialServiceImpl(
      logger.object,
      serialClientProvider.object,
      webSocketService.object
    );
  });

  context('when a serial connection is requested', () => {
    const sandbox = createSandbox();
    beforeEach(() => {
      subject.uploadInProgress = false;
      sandbox.spy(subject, 'disconnect');
      sandbox.spy(subject, 'updateWsConfigParam');
    });

    afterEach(function () {
      sandbox.restore();
    });

    context('and an upload is in progress', () => {
      beforeEach(async () => {
        subject.uploadInProgress = true;
      });

      it('should not change the connection status', async () => {
        await subject.connectSerialIfRequired();
        expect(subject.disconnect).to.have.callCount(0);
      });
    });

    context('and there is no upload in progress', () => {
      beforeEach(async () => {
        subject.uploadInProgress = false;
      });

      context('and there are 0 attached ws clients', () => {
        it('should disconnect', async () => {
          await subject.connectSerialIfRequired();
          expect(subject.disconnect).to.have.been.calledOnce;
        });
      });

      context('and there are > 0 attached ws clients', () => {
        beforeEach(() => {
          webSocketService
            .setup((b) => b.getConnectedClientsNumber())
            .returns(() => 1);
        });

        it('should not call the disconenct', async () => {
          await subject.connectSerialIfRequired();
          expect(subject.disconnect).to.have.callCount(0);
        });
      });
    });
  });

  context('when a disconnection is requested', () => {
    const sandbox = createSandbox();
    beforeEach(() => { });

    afterEach(function () {
      sandbox.restore();
    });

    context('and a serialConnection is not set', () => {
      it('should return a NOT_CONNECTED status', async () => {
        const status = await subject.disconnect();
        expect(status).to.be.equal(Status.NOT_CONNECTED);
      });
    });

    context('and a serialConnection is set', async () => {
      beforeEach(async () => {
        sandbox.spy(subject, 'updateWsConfigParam');
        await subject.disconnect();
      });

      it('should dispose the serialConnection', async () => {
        const serialConnectionOpen = await subject.isSerialPortOpen();
        expect(serialConnectionOpen).to.be.false;
      });

      it('should call updateWsConfigParam with disconnected status', async () => {
        expect(subject.updateWsConfigParam).to.be.calledWith({
          connected: false,
        });
      });
    });
  });

  context('when a new config is passed in', () => {
    const sandbox = createSandbox();
    beforeEach(async () => {
      subject.uploadInProgress = false;
      webSocketService
        .setup((b) => b.getConnectedClientsNumber())
        .returns(() => 1);

      serialClientProvider
        .setup((b) => b.client())
        .returns(async () => {
          return {
            streamingOpen: () => {
              return {
                on: (str: string, cb: any) => { },
                write: (chunk: any, cb: any) => {
                  cb();
                },
                cancel: () => { },
              };
            },
          } as MonitorServiceClient;
        });

      sandbox.spy(subject, 'disconnect');

      await subject.setSerialConfig({
        board: { name: 'test' },
        port: { id: 'test|test', address: 'test', addressLabel: 'test', protocol: 'test', protocolLabel: 'test' },
      });
    });

    afterEach(function () {
      sandbox.restore();
      subject.dispose();
    });

    it('should disconnect from previous connection', async () => {
      expect(subject.disconnect).to.be.called;
    });

    it('should create the serialConnection', async () => {
      const serialConnectionOpen = await subject.isSerialPortOpen();
      expect(serialConnectionOpen).to.be.true;
    });
  });
});
