/* eslint-disable */
import { enableJSDOM } from '@theia/core/lib/browser/test/jsdom';
enableJSDOM();

import { Container, ContainerModule } from '@theia/core/shared/inversify';
import { IMock, Mock, It } from 'typemoq';
import { BoardsServiceProvider } from '../../browser/boards/boards-service-provider';
import { ILogger, MessageService } from '@theia/core';
import { BoardsService } from '../../common/protocol';
import { NotificationCenter } from '../../browser/notification-center';
import { CommandService } from '@theia/core/lib/common/command';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { expect } from 'chai';
import { tick } from '../utils';
import { aPort } from './fixtures/boards';

describe.only('BoardsServiceProvider', () => {
  let subject: BoardsServiceProvider;

  let logger: IMock<ILogger>;
  let messageService: IMock<MessageService>;
  let boardsService: IMock<BoardsService>;
  let commandService: IMock<CommandService>;
  let notificationCenter: IMock<NotificationCenter>;
  let frontendApplicationStateService: IMock<FrontendApplicationStateService>;

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
      .returns(() => ({ dispose: () => null }));

    notificationCenter
      .setup((n) => n.onPlatformDidInstall(It.isAny()))
      .returns(() => ({ dispose: () => null }));

    notificationCenter
      .setup((n) => n.onPlatformDidUninstall(It.isAny()))
      .returns(() => ({ dispose: () => null }));

    frontendApplicationStateService
      .setup((f) => f.reachedState('ready'))
      .returns(() => Promise.resolve());

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
  context('and there is one recognized board attached', () => {});
  context('and there are two recognized boards attached', () => {});
  // context('when there is a stored board config', () => {
  //   beforeEach(() => {
  //     commandService.setup((c) =>
  //       c.executeCommand<RecursiveRequired<BoardsConfig.Config>>(
  //         StorageWrapper.Commands.GET_DATA.id,
  //         LATEST_VALID_BOARDS_CONFIG
  //       )
  //     ).returns(async () => {});
  //   });
  // });
});
