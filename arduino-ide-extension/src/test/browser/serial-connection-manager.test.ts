import { enableJSDOM } from '@theia/core/lib/browser/test/jsdom';
const disableJSDOM = enableJSDOM();

import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import { ApplicationProps } from '@theia/application-package/lib/application-props';
FrontendApplicationConfigProvider.set({
  ...ApplicationProps.DEFAULT.frontend.config,
});

import { MessageService } from '@theia/core';
import { BoardsServiceProvider } from '../../browser/boards/boards-service-provider';
import {
  BoardsService,
  CoreService,
  SerialService,
  SerialServiceClient,
  Status,
} from '../../common/protocol';
import { IMock, It, Mock, Times } from 'typemoq';
import {
  Serial,
  SerialConnectionManager,
} from '../../browser/serial/serial-connection-manager';
import { ThemeService } from '@theia/core/lib/browser/theming';
import { SerialModel } from '../../browser/serial/serial-model';
import {
  aBoardConfig,
  anotherBoardConfig,
  anotherPort,
  aPort,
} from './fixtures/boards';
import { BoardsConfig } from '../../browser/boards/boards-config';
import {
  anotherSerialConfig,
  aSerialConfig,
  WebSocketMock,
} from './fixtures/serial';
import { expect } from 'chai';
import { tick } from '../utils';

disableJSDOM();

global.WebSocket = WebSocketMock as any;

describe.only('SerialConnectionManager', () => {
  let subject: SerialConnectionManager;

  let serialModel: IMock<SerialModel>;
  let serialService: IMock<SerialService>;
  let serialServiceClient: IMock<SerialServiceClient>;
  let boardsService: IMock<BoardsService>;
  let boardsServiceProvider: IMock<BoardsServiceProvider>;
  let messageService: IMock<MessageService>;
  let themeService: IMock<ThemeService>;
  let core: IMock<CoreService>;

  let handleBoardConfigChange: (
    boardsConfig: BoardsConfig.Config
  ) => Promise<void>;
  let handleWebSocketChanged: (wsPort: number) => void;
  const wsPort = 1234;

  beforeEach(() => {
    serialModel = Mock.ofType<SerialModel>();
    serialService = Mock.ofType<SerialService>();
    serialServiceClient = Mock.ofType<SerialServiceClient>();
    boardsService = Mock.ofType<BoardsService>();
    boardsServiceProvider = Mock.ofType<BoardsServiceProvider>();
    messageService = Mock.ofType<MessageService>();
    themeService = Mock.ofType<ThemeService>();
    core = Mock.ofType<CoreService>();

    boardsServiceProvider
      .setup((b) => b.boardsConfig)
      .returns(() => aBoardConfig);

    boardsServiceProvider
      .setup((b) => b.onBoardsConfigChanged(It.isAny()))
      .returns((h) => {
        handleBoardConfigChange = h;
        return { dispose: () => {} };
      });

    boardsServiceProvider
      .setup((b) => b.canUploadTo(It.isAny(), It.isValue({ silent: false })))
      .returns(() => true);

    boardsService
      .setup((b) => b.getAvailablePorts())
      .returns(() => Promise.resolve([aPort, anotherPort]));

    serialModel
      .setup((m) => m.baudRate)
      .returns(() => aSerialConfig.baudRate || 9600);

    serialServiceClient
      .setup((m) => m.onWebSocketChanged(It.isAny()))
      .returns((h) => {
        handleWebSocketChanged = h;
        return { dispose: () => {} };
      });

    serialService
      .setup((m) => m.disconnect())
      .returns(() => Promise.resolve(Status.OK));

    core.setup((u) => u.isUploading()).returns(() => Promise.resolve(false));

    subject = new SerialConnectionManager(
      serialModel.object,
      serialService.object,
      serialServiceClient.object,
      boardsService.object,
      boardsServiceProvider.object,
      messageService.object,
      themeService.object,
      core.object
    );
  });

  context('when no serial config is set', () => {
    context('and the serial is NOT open', () => {
      context('and it tries to open the serial plotter', () => {
        it('should not try to connect and show an error', async () => {
          await subject.openSerial(Serial.Type.Plotter);
          messageService.verify((m) => m.error(It.isAnyString()), Times.once());
          serialService.verify((m) => m.disconnect(), Times.never());
          serialService.verify((m) => m.connect(It.isAny()), Times.never());
        });
      });
      context('and a serial config is set', () => {
        it('should not try to reconnect', async () => {
          await handleBoardConfigChange(aBoardConfig);
          serialService.verify((m) => m.disconnect(), Times.never());
          serialService.verify((m) => m.connect(It.isAny()), Times.never());
          expect(subject.getConfig()).to.deep.equal(aSerialConfig);
        });
      });
    });
  });
  context('when a serial config is set', () => {
    beforeEach(() => {
      subject.setConfig(aSerialConfig);
    });
    context('and the serial is NOT open', () => {
      context('and it tries to disconnect', () => {
        it('should do nothing', async () => {
          const status = await subject.disconnect();
          expect(status).to.be.ok;
          expect(await subject.isBESerialConnected()).to.be.false;
        });
      });
      context('and the config changes', () => {
        beforeEach(() => {
          subject.setConfig(anotherSerialConfig);
        });
        it('should not try to reconnect', async () => {
          await tick();
          messageService.verify(
            (m) => m.error(It.isAnyString()),
            Times.never()
          );
          serialService.verify((m) => m.disconnect(), Times.never());
          serialService.verify((m) => m.connect(It.isAny()), Times.never());
        });
      });
      context(
        'and the connection to the serial succeeds with the config',
        () => {
          beforeEach(() => {
            serialService
              .setup((m) => m.connect(It.isValue(aSerialConfig)))
              .returns(() => {
                handleWebSocketChanged(wsPort);
                return Promise.resolve(Status.OK);
              });
          });
          context('and it tries to open the serial plotter', () => {
            let status: Status;
            beforeEach(async () => {
              status = await subject.openSerial(Serial.Type.Plotter);
            });
            it('should successfully connect to the serial', async () => {
              messageService.verify(
                (m) => m.error(It.isAnyString()),
                Times.never()
              );
              serialService.verify((m) => m.disconnect(), Times.never());
              serialService.verify((m) => m.connect(It.isAny()), Times.once());
              expect(status).to.be.ok;
              expect(await subject.isBESerialConnected()).to.be.true;
              expect(subject.getWsPort()).to.equal(wsPort);
              expect(subject.widgetsAttached()).to.be.true;
              expect(subject.isWebSocketConnected()).to.be.false;
            });
            context('and it tries to open the serial monitor', () => {
              let status: Status;
              beforeEach(async () => {
                status = await subject.openSerial(Serial.Type.Monitor);
              });
              it('should open it using the same serial connection', async () => {
                messageService.verify(
                  (m) => m.error(It.isAnyString()),
                  Times.never()
                );
                serialService.verify((m) => m.disconnect(), Times.never());
                serialService.verify(
                  (m) => m.connect(It.isAny()),
                  Times.once()
                );
                expect(status).to.be.ok;
                expect(await subject.isBESerialConnected()).to.be.true;
                expect(subject.widgetsAttached()).to.be.true;
              });
              it('should create a websocket connection', () => {
                expect(subject.getWsPort()).to.equal(wsPort);
                expect(subject.isWebSocketConnected()).to.be.true;
              });
              context('and then it closes the serial plotter', () => {
                beforeEach(async () => {
                  status = await subject.closeSerial(Serial.Type.Plotter);
                });
                it('should close the plotter without disconnecting from the serial', async () => {
                  messageService.verify(
                    (m) => m.error(It.isAnyString()),
                    Times.never()
                  );
                  serialService.verify((m) => m.disconnect(), Times.never());
                  serialService.verify(
                    (m) => m.connect(It.isAny()),
                    Times.once()
                  );
                  expect(status).to.be.ok;
                  expect(await subject.isBESerialConnected()).to.be.true;
                  expect(subject.widgetsAttached()).to.be.true;
                  expect(subject.getWsPort()).to.equal(wsPort);
                });
                it('should not close the websocket connection', () => {
                  expect(subject.isWebSocketConnected()).to.be.true;
                });
              });
              context('and then it closes the serial monitor', () => {
                beforeEach(async () => {
                  status = await subject.closeSerial(Serial.Type.Monitor);
                });
                it('should close the monitor without disconnecting from the serial', async () => {
                  messageService.verify(
                    (m) => m.error(It.isAnyString()),
                    Times.never()
                  );
                  serialService.verify((m) => m.disconnect(), Times.never());
                  serialService.verify(
                    (m) => m.connect(It.isAny()),
                    Times.once()
                  );
                  expect(status).to.be.ok;
                  expect(await subject.isBESerialConnected()).to.be.true;
                  expect(subject.getWsPort()).to.equal(wsPort);
                  expect(subject.widgetsAttached()).to.be.true;
                });
                it('should close the websocket connection', () => {
                  expect(subject.isWebSocketConnected()).to.be.false;
                });
              });
            });
            context('and then it closes the serial plotter', () => {
              beforeEach(async () => {
                status = await subject.closeSerial(Serial.Type.Plotter);
              });
              it('should successfully disconnect from the serial', async () => {
                messageService.verify(
                  (m) => m.error(It.isAnyString()),
                  Times.never()
                );
                serialService.verify((m) => m.disconnect(), Times.once());
                serialService.verify(
                  (m) => m.connect(It.isAny()),
                  Times.once()
                );
                expect(status).to.be.ok;
                expect(await subject.isBESerialConnected()).to.be.false;
                expect(subject.getWsPort()).to.be.undefined;
                expect(subject.widgetsAttached()).to.be.false;
                expect(subject.isWebSocketConnected()).to.be.false;
              });
            });
            context('and the config changes', () => {
              beforeEach(() => {
                subject.setConfig(anotherSerialConfig);
              });
              it('should try to reconnect', async () => {
                await tick();
                messageService.verify(
                  (m) => m.error(It.isAnyString()),
                  Times.never()
                );
                serialService.verify((m) => m.disconnect(), Times.once());
                serialService.verify(
                  (m) => m.connect(It.isAny()),
                  Times.exactly(2)
                );
              });
            });
          });
        }
      );
      context(
        'and the connection to the serial does NOT succeed with the config',
        () => {
          beforeEach(() => {
            serialService
              .setup((m) => m.connect(It.isValue(aSerialConfig)))
              .returns(() => {
                return Promise.resolve(Status.NOT_CONNECTED);
              });
            serialService
              .setup((m) => m.connect(It.isValue(anotherSerialConfig)))
              .returns(() => {
                handleWebSocketChanged(wsPort);
                return Promise.resolve(Status.OK);
              });
          });
          context('and it tries to open the serial plotter', () => {
            let status: Status;
            beforeEach(async () => {
              status = await subject.openSerial(Serial.Type.Plotter);
            });

            it('should fail to connect to the serial', async () => {
              messageService.verify(
                (m) => m.error(It.isAnyString()),
                Times.never()
              );
              serialService.verify((m) => m.disconnect(), Times.never());
              serialService.verify(
                (m) => m.connect(It.isValue(aSerialConfig)),
                Times.once()
              );
              expect(status).to.be.false;
              expect(await subject.isBESerialConnected()).to.be.false;
              expect(subject.getWsPort()).to.be.undefined;
              expect(subject.widgetsAttached()).to.be.true;
            });

            context(
              'and the board config changes with an acceptable one',
              () => {
                beforeEach(async () => {
                  await handleBoardConfigChange(anotherBoardConfig);
                });

                it('should successfully connect to the serial', async () => {
                  await tick();
                  messageService.verify(
                    (m) => m.error(It.isAnyString()),
                    Times.never()
                  );
                  serialService.verify((m) => m.disconnect(), Times.never());
                  serialService.verify(
                    (m) => m.connect(It.isValue(anotherSerialConfig)),
                    Times.once()
                  );
                  expect(await subject.isBESerialConnected()).to.be.true;
                  expect(subject.getWsPort()).to.equal(wsPort);
                  expect(subject.widgetsAttached()).to.be.true;
                  expect(subject.isWebSocketConnected()).to.be.false;
                });
              }
            );
          });
        }
      );
    });
  });
});
