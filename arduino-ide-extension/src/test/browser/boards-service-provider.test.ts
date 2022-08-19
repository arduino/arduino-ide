import { enableJSDOM } from '@theia/core/lib/browser/test/jsdom';
enableJSDOM();

import { Container, ContainerModule } from '@theia/core/shared/inversify';
import { IMock, Mock, It, Times } from 'typemoq';
import {
  BoardsServiceProvider,
  getLastSelectedBoardOnPortKey,
  LATEST_BOARDS_CONFIG,
  LATEST_VALID_BOARDS_CONFIG,
} from '../../browser/boards/boards-service-provider';
import { ILogger, MessageService } from '@theia/core';
import {
  AttachedBoardsChangeEvent,
  BoardsService,
} from '../../common/protocol';
import { NotificationCenter } from '../../browser/notification-center';
import { CommandService } from '@theia/core/lib/common/command';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { expect } from 'chai';
import { tick } from '../utils';
import { aBoard, anotherPort, aPort } from './fixtures/boards';
import { RecursiveRequired } from '../../common/types';
import { BoardsConfig } from '../../browser/boards/boards-config';
import { StorageWrapper } from '../../browser/storage-wrapper';

interface AttachedBoardsChangeEventCaller {
  (event: AttachedBoardsChangeEvent): void;
}

describe.only('BoardsServiceProvider', () => {
  let subject: BoardsServiceProvider;

  let logger: IMock<ILogger>;
  let messageService: IMock<MessageService>;
  let boardsService: IMock<BoardsService>;
  let commandService: IMock<CommandService>;
  let notificationCenter: IMock<NotificationCenter>;
  let frontendApplicationStateService: IMock<FrontendApplicationStateService>;

  let attachedBoardsChange: AttachedBoardsChangeEventCaller;

  let testContainer: Container;

  beforeEach(() => {
    testContainer = new Container();

    logger = Mock.ofType<ILogger>();
    messageService = Mock.ofType<MessageService>();
    boardsService = Mock.ofType<BoardsService>();
    commandService = Mock.ofType<CommandService>();
    notificationCenter = Mock.ofType<NotificationCenter>();
    frontendApplicationStateService =
      Mock.ofType<FrontendApplicationStateService>();

    notificationCenter
      .setup((n) => n.onAttachedBoardsDidChange(It.isAny()))
      .returns((f: AttachedBoardsChangeEventCaller) => {
        attachedBoardsChange = f;
        return { dispose: () => null };
      });

    notificationCenter
      .setup((n) => n.onPlatformDidInstall(It.isAny()))
      .returns(() => ({ dispose: () => null }));

    notificationCenter
      .setup((n) => n.onPlatformDidUninstall(It.isAny()))
      .returns(() => ({ dispose: () => null }));

    frontendApplicationStateService
      .setup((f) => f.reachedState('ready'))
      .returns(() => Promise.resolve());

    commandService
      .setup((c) =>
        c.executeCommand<RecursiveRequired<BoardsConfig.Config>>(
          StorageWrapper.Commands.SET_DATA.id,
          It.isAny()
        )
      )
      .returns(async () => undefined);

    const module = new ContainerModule((bind) => {
      bind(BoardsServiceProvider).toSelf();
      bind(ILogger).toConstantValue(logger.object);
      bind(MessageService).toConstantValue(messageService.object);
      bind(BoardsService).toConstantValue(boardsService.object);
      bind(CommandService).toConstantValue(commandService.object);
      bind(NotificationCenter).toConstantValue(notificationCenter.object);
      bind(FrontendApplicationStateService).toConstantValue(
        frontendApplicationStateService.object
      );
    });

    testContainer.load(module);
    subject = testContainer.get(BoardsServiceProvider);
  });

  context('When there are no recognized boards attached', () => {
    beforeEach(() => {
      boardsService.setup((b) => b.getAttachedBoards()).returns(async () => []);
    });
    context('and there are no available ports', () => {
      beforeEach(() => {
        boardsService
          .setup((b) => b.getAvailablePorts())
          .returns(async () => []);
      });
      it('should emit a onAvailablePortsChanged event', async () => {
        subject.onAvailablePortsChanged(() => {
          expect(true).to.be.ok;
        });
        subject.onStart();
        await tick();
      });
      it('should have no selected board or port', async () => {
        subject.onStart();
        await tick();
        expect(subject.boardsConfig).to.be.empty;
      });

      context('and a valid board gets connected to a port', () => {
        beforeEach(async () => {
          subject.onStart();
          await tick();
          attachedBoardsChange({
            newState: {
              boards: [aBoard],
              ports: [aPort],
            },
            oldState: {
              boards: [],
              ports: [],
            },
            uploadInProgress: false,
          });
        });

        it('should emit a onAvailablePortsChanged event', async () => {
          subject.onAvailablePortsChanged(() => {
            expect(true).to.be.ok;
          });
          await tick();
        });

        context('and that board gets selected', () => {
          beforeEach(() => {
            subject.boardsConfig = {
              selectedBoard: aBoard,
              selectedPort: aPort,
            };
          });

          it('should save it as latest valid board', async () => {
            await tick();
            expect(subject.latestValidBoardsConfig).to.equal(
              subject.boardsConfig
            );
          });

          it('should store the board data', async () => {
            await tick();

            commandService.verify(
              (c) =>
                c.executeCommand(
                  StorageWrapper.Commands.SET_DATA.id,
                  getLastSelectedBoardOnPortKey(aPort),
                  aBoard
                ),
              Times.atLeastOnce()
            );
            commandService.verify(
              (c) =>
                c.executeCommand(
                  StorageWrapper.Commands.SET_DATA.id,
                  LATEST_VALID_BOARDS_CONFIG,
                  subject.latestValidBoardsConfig
                ),
              Times.atLeastOnce()
            );
            commandService.verify(
              (c) =>
                c.executeCommand(
                  StorageWrapper.Commands.SET_DATA.id,
                  LATEST_BOARDS_CONFIG,
                  subject.latestBoardsConfig
                ),
              Times.atLeastOnce()
            );
          });
        });
      });
    });

    context('and there is one available port', () => {
      beforeEach(() => {
        boardsService
          .setup((b) => b.getAvailablePorts())
          .returns(async () => [aPort]);
      });
      it('should have no selected board or port', async () => {
        subject.onStart();
        await tick();
        expect(subject.boardsConfig).to.be.empty;
      });
    });
  });
  context('When there is one recognized boards attached', () => {
    beforeEach(() => {
      boardsService
        .setup((b) => b.getAttachedBoards())
        .returns(async () => [aBoard]);
    });
    context('and there is one unrecognized devicec available on a port', () => {
      beforeEach(async () => {
        boardsService
          .setup((b) => b.getAvailablePorts())
          .returns(async () => [aPort, anotherPort]);
        subject.onStart();
        await tick();
      });
      context('and the port with the recognized board gets selected', () => {
        beforeEach(async () => {
          subject.boardsConfig = {
            selectedBoard: aBoard,
            selectedPort: aPort,
          };
          await tick();
        });
        context(
          'and then the port with the unrecognized board gets selected',
          () => {
            beforeEach(async () => {
              subject.boardsConfig = {
                selectedBoard: { ...aBoard, port: anotherPort },
                selectedPort: anotherPort,
              };
              await tick();
            });
            context(
              'and then the port with the recognized board gets selected again',
              () => {
                beforeEach(async () => {
                  subject.boardsConfig = {
                    selectedBoard: { ...aBoard, port: anotherPort },
                    selectedPort: anotherPort,
                  };
                  await tick();
                });
                context(
                  'and the recognized board gets unplugged because of an upload in progress',
                  () => {
                    beforeEach(async () => {
                      attachedBoardsChange({
                        newState: {
                          boards: [],
                          ports: [anotherPort],
                        },
                        oldState: {
                          boards: [aBoard],
                          ports: [aPort, anotherPort],
                        },
                        uploadInProgress: true,
                      });
                      await tick();
                    });

                    it('board should remain selected with NO port selected', async () => {
                      expect(subject.boardsConfig).to.equal({
                        selectedBoard: aBoard,
                        selectedPort: undefined,
                      });
                    });
                    context(
                      'and the recognized board gets plugged in again into the same port',
                      () => {
                        beforeEach(async () => {
                          attachedBoardsChange({
                            newState: {
                              boards: [aBoard],
                              ports: [aPort, anotherPort],
                            },
                            oldState: {
                              boards: [],
                              ports: [anotherPort],
                            },
                            uploadInProgress: true,
                          });
                          await tick();
                        });

                        it('board should remain selected with NO port selected', async () => {
                          expect(subject.boardsConfig).to.equal({
                            selectedBoard: aBoard,
                            selectedPort: aPort,
                          });
                        });
                      }
                    );
                  }
                );
              }
            );
          }
        );
      });
    });
  });
});
