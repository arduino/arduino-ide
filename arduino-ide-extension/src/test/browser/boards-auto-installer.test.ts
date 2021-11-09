import { enableJSDOM } from '@theia/core/lib/browser/test/jsdom';
const disableJSDOM = enableJSDOM();

import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import { ApplicationProps } from '@theia/application-package/lib/application-props';
FrontendApplicationConfigProvider.set({
  ...ApplicationProps.DEFAULT.frontend.config,
});

import { MessageService } from '@theia/core';
import { BoardsServiceProvider } from '../../browser/boards/boards-service-provider';
import { BoardsListWidgetFrontendContribution } from '../../browser/boards/boards-widget-frontend-contribution';
import {
  BoardsPackage,
  BoardsService,
  ResponseServiceArduino,
} from '../../common/protocol';
import { IMock, It, Mock, Times } from 'typemoq';
import { Container, ContainerModule } from 'inversify';
import { BoardsAutoInstaller } from '../../browser/boards/boards-auto-installer';
import { tick } from '../utils';
import { ListWidget } from '../../browser/widgets/component-list/list-widget';
import { aBoardConfig, anInstalledPackage, aPackage } from './fixtures/boards';

disableJSDOM();

describe('BoardsAutoInstaller', () => {
  let subject: BoardsAutoInstaller;
  let messageService: IMock<MessageService>;
  let boardsService: IMock<BoardsService>;
  let boardsServiceClient: IMock<BoardsServiceProvider>;
  let responseService: IMock<ResponseServiceArduino>;
  let boardsManagerFrontendContribution: IMock<BoardsListWidgetFrontendContribution>;
  let boardsManagerWidget: IMock<ListWidget<BoardsPackage>>;

  let testContainer: Container;

  beforeEach(() => {
    testContainer = new Container();
    messageService = Mock.ofType<MessageService>();
    boardsService = Mock.ofType<BoardsService>();
    boardsServiceClient = Mock.ofType<BoardsServiceProvider>();
    responseService = Mock.ofType<ResponseServiceArduino>();
    boardsManagerFrontendContribution =
      Mock.ofType<BoardsListWidgetFrontendContribution>();
    boardsManagerWidget = Mock.ofType<ListWidget<BoardsPackage>>();

    boardsManagerWidget.setup((b) =>
      b.refresh(aPackage.name.toLocaleLowerCase())
    );

    boardsManagerFrontendContribution
      .setup((b) => b.openView({ reveal: true }))
      .returns(async () => boardsManagerWidget.object);

    messageService
      .setup((m) => m.showProgress(It.isAny(), It.isAny()))
      .returns(async () => ({
        cancel: () => null,
        id: '',
        report: () => null,
        result: Promise.resolve(''),
      }));

    responseService
      .setup((r) => r.onProgressDidChange(It.isAny()))
      .returns(() => ({ dispose: () => null }));

    const module = new ContainerModule((bind) => {
      bind(BoardsAutoInstaller).toSelf();
      bind(MessageService).toConstantValue(messageService.object);
      bind(BoardsService).toConstantValue(boardsService.object);
      bind(BoardsServiceProvider).toConstantValue(boardsServiceClient.object);
      bind(ResponseServiceArduino).toConstantValue(responseService.object);
      bind(BoardsListWidgetFrontendContribution).toConstantValue(
        boardsManagerFrontendContribution.object
      );
    });

    testContainer.load(module);
    subject = testContainer.get(BoardsAutoInstaller);
  });

  context('when it starts', () => {
    it('should register to the BoardsServiceClient in order to check the packages every a new board is plugged in', () => {
      subject.onStart();
      boardsServiceClient.verify(
        (b) => b.onBoardsConfigChanged(It.isAny()),
        Times.once()
      );
    });

    context('and it checks the installable packages', () => {
      context(`and a port and a board a selected`, () => {
        beforeEach(() => {
          boardsServiceClient
            .setup((b) => b.boardsConfig)
            .returns(() => aBoardConfig);
        });
        context('if no package for the board is already installed', () => {
          context('if a candidate package for the board is found', () => {
            beforeEach(() => {
              boardsService
                .setup((b) => b.search(It.isValue({})))
                .returns(async () => [aPackage]);
            });
            it('should show a notification suggesting to install that package', async () => {
              messageService
                .setup((m) =>
                  m.info(It.isAnyString(), It.isAnyString(), It.isAnyString())
                )
                .returns(() => Promise.resolve('Install Manually'));
              subject.onStart();
              await tick();
              messageService.verify(
                (m) =>
                  m.info(It.isAnyString(), It.isAnyString(), It.isAnyString()),
                Times.once()
              );
            });
            context(`if the answer to the message is 'Yes'`, () => {
              beforeEach(() => {
                messageService
                  .setup((m) =>
                    m.info(It.isAnyString(), It.isAnyString(), It.isAnyString())
                  )
                  .returns(() => Promise.resolve('Yes'));
              });
              it('should install the package', async () => {
                subject.onStart();

                await tick();

                messageService.verify(
                  (m) => m.showProgress(It.isAny(), It.isAny()),
                  Times.once()
                );
              });
            });
            context(
              `if the answer to the message is 'Install Manually'`,
              () => {
                beforeEach(() => {
                  messageService
                    .setup((m) =>
                      m.info(
                        It.isAnyString(),
                        It.isAnyString(),
                        It.isAnyString()
                      )
                    )
                    .returns(() => Promise.resolve('Install Manually'));
                });
                it('should open the boards manager widget', () => {
                  subject.onStart();
                });
              }
            );
          });
          context('if a candidate package for the board is not found', () => {
            beforeEach(() => {
              boardsService
                .setup((b) => b.search(It.isValue({})))
                .returns(async () => []);
            });
            it('should do nothing', async () => {
              subject.onStart();
              await tick();
              messageService.verify(
                (m) =>
                  m.info(It.isAnyString(), It.isAnyString(), It.isAnyString()),
                Times.never()
              );
            });
          });
        });
        context(
          'if one of the packages for the board is already installed',
          () => {
            beforeEach(() => {
              boardsService
                .setup((b) => b.search(It.isValue({})))
                .returns(async () => [aPackage, anInstalledPackage]);
              messageService
                .setup((m) =>
                  m.info(It.isAnyString(), It.isAnyString(), It.isAnyString())
                )
                .returns(() => Promise.resolve('Yes'));
            });
            it('should do nothing', async () => {
              subject.onStart();
              await tick();
              messageService.verify(
                (m) =>
                  m.info(It.isAnyString(), It.isAnyString(), It.isAnyString()),
                Times.never()
              );
            });
          }
        );
      });
      context('and there is no selected board or port', () => {
        it('should do nothing', async () => {
          subject.onStart();
          await tick();
          messageService.verify(
            (m) => m.info(It.isAnyString(), It.isAnyString(), It.isAnyString()),
            Times.never()
          );
        });
      });
    });
  });
});
