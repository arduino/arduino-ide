import { Container, ContainerModule } from '@theia/core/shared/inversify';
import { IMock, Mock, It } from 'typemoq';
import { BoardsServiceProvider } from '../../browser/boards/boards-service-provider';
import { ILogger, MessageService } from '@theia/core';
import { BoardsService } from '../../common/protocol';
import { NotificationCenter } from '../../browser/notification-center';
import { CommandService } from '@theia/core/lib/common/command';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { expect } from 'chai';

describe('BoardsServiceProvider', () => {
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

  context('when it starts', () => {
    it('test', () => {
      console.log(subject);
      expect(true).to.equal(true);
    });
  });
});
