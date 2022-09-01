import { DialogError, DialogProps } from '@theia/core/lib/browser/dialogs';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { Emitter } from '@theia/core/lib/common/event';
import { nls } from '@theia/core/lib/common/nls';
import { deepClone } from '@theia/core/lib/common/objects';
import type { Message } from '@theia/core/shared/@phosphor/messaging';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import React from '@theia/core/shared/react';
import type { ReactNode } from '@theia/core/shared/react/index';
import { EditBoardsConfigActionParams } from '../../common/protocol/board-list';
import {
  BoardIdentifier,
  BoardsConfig,
  BoardWithPackage,
  DetectedPort,
  emptyBoardsConfig,
  PortIdentifier,
} from '../../common/protocol/boards-service';
import { Defined } from '../../common/types';
import { NotificationCenter } from '../notification-center';
import { ReactDialog } from '../theia/dialogs/dialogs';
import { BoardsConfigComponent } from './boards-config-component';
import { BoardsServiceProvider } from './boards-service-provider';

@injectable()
export class BoardsConfigDialogProps extends DialogProps {}

export type BoardsConfigDialogState = Omit<BoardsConfig, 'selectedBoard'> & {
  selectedBoard: BoardsConfig['selectedBoard'] | BoardWithPackage;
};

@injectable()
export class BoardsConfigDialog extends ReactDialog<BoardsConfigDialogState> {
  @inject(BoardsServiceProvider)
  private readonly boardsServiceProvider: BoardsServiceProvider;
  @inject(NotificationCenter)
  private readonly notificationCenter: NotificationCenter;
  @inject(FrontendApplicationStateService)
  private readonly appStateService: FrontendApplicationStateService;

  private readonly onFilterTextDidChangeEmitter: Emitter<
    Defined<EditBoardsConfigActionParams['query']>
  >;
  private readonly onBoardSelected = (board: BoardWithPackage): void => {
    this._boardsConfig.selectedBoard = board;
    this.update();
  };
  private readonly onPortSelected = (port: PortIdentifier): void => {
    this._boardsConfig.selectedPort = port;
    this.update();
  };
  private readonly setFocusNode = (element: HTMLElement | undefined): void => {
    this.focusNode = element;
  };
  private readonly searchBoards = (options: {
    query?: string;
  }): Promise<BoardWithPackage[]> => {
    return this.boardsServiceProvider.searchBoards(options);
  };
  private readonly ports = (
    predicate?: (port: DetectedPort) => boolean
  ): readonly DetectedPort[] => {
    return this.boardsServiceProvider.boardList.ports(predicate);
  };
  private _boardsConfig: BoardsConfigDialogState;
  /**
   * When the dialog's boards result set is limited to a subset of boards when searching, this field is set.
   */
  private _searchSet: BoardIdentifier[] | undefined;
  private focusNode: HTMLElement | undefined;

  constructor(
    @inject(BoardsConfigDialogProps)
    protected override readonly props: BoardsConfigDialogProps
  ) {
    super({ ...props, maxWidth: 500 });
    this.node.id = 'select-board-dialog-container';
    this.contentNode.classList.add('select-board-dialog');
    this.appendCloseButton(
      nls.localize('vscode/issueMainService/cancel', 'Cancel')
    );
    this.appendAcceptButton(nls.localize('vscode/issueMainService/ok', 'OK'));
    this._boardsConfig = emptyBoardsConfig();
    this.onFilterTextDidChangeEmitter = new Emitter();
  }

  @postConstruct()
  protected init(): void {
    this.boardsServiceProvider.onBoardListDidChange(() => {
      this._boardsConfig = deepClone(this.boardsServiceProvider.boardsConfig);
      this.update();
    });
    this._boardsConfig = deepClone(this.boardsServiceProvider.boardsConfig);
  }

  override async open(
    params?: EditBoardsConfigActionParams
  ): Promise<BoardsConfig | undefined> {
    this._searchSet = undefined;
    this._boardsConfig.selectedBoard =
      this.boardsServiceProvider.boardsConfig.selectedBoard;
    this._boardsConfig.selectedPort =
      this.boardsServiceProvider.boardsConfig.selectedPort;
    if (params) {
      if (typeof params.query === 'string') {
        this.onFilterTextDidChangeEmitter.fire(params.query);
      }
      if (params.portToSelect) {
        this._boardsConfig.selectedPort = params.portToSelect;
      }
      if (params.boardToSelect) {
        this._boardsConfig.selectedBoard = params.boardToSelect;
      }
      if (params.searchSet) {
        this._searchSet = params.searchSet.slice();
      }
    }
    return super.open();
  }

  protected override onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.update();
  }

  protected override render(): ReactNode {
    return (
      <>
        <div className="head">
          <div className="text">
            <div>
              {nls.localize(
                'arduino/board/configDialog1',
                'Select both a Board and a Port if you want to upload a sketch.'
              )}
            </div>
            <div>
              {nls.localize(
                'arduino/board/configDialog2',
                'If you only select a Board you will be able to compile, but not to upload your sketch.'
              )}
            </div>
          </div>
        </div>
        <div id="select-board-dialog" className="p-Widget ps">
          <div className="selectBoardContainer">
            <BoardsConfigComponent
              boardsConfig={this._boardsConfig}
              searchSet={this._searchSet}
              onBoardSelected={this.onBoardSelected}
              onPortSelected={this.onPortSelected}
              notificationCenter={this.notificationCenter}
              onFocusNodeSet={this.setFocusNode}
              onFilteredTextDidChangeEvent={
                this.onFilterTextDidChangeEmitter.event
              }
              appState={this.appStateService.state}
              onAppStateDidChange={this.notificationCenter.onAppStateDidChange}
              searchBoards={this.searchBoards}
              ports={this.ports}
            />
          </div>
        </div>
      </>
    );
  }

  protected override onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    if (this.focusNode instanceof HTMLInputElement) {
      this.focusNode.select();
    }
    (this.focusNode || this.node).focus();
  }

  protected override handleEnter(event: KeyboardEvent): boolean | void {
    if (event.target instanceof HTMLTextAreaElement) {
      return false;
    }
  }

  protected override isValid(value: BoardsConfig): DialogError {
    if (!value.selectedBoard) {
      if (value.selectedPort) {
        return nls.localize(
          'arduino/board/pleasePickBoard',
          'Please pick a board connected to the port you have selected.'
        );
      }
      return false;
    }
    return '';
  }

  get value(): BoardsConfigDialogState {
    return this._boardsConfig;
  }
}
