import {
  ApplicationShell as TheiaApplicationShell,
  DockPanel,
  DockPanelRenderer as TheiaDockPanelRenderer,
  SHELL_TABBAR_CONTEXT_MENU,
  TabBar,
  Widget,
  SplitPanel,
  Layout,
  BaseWidget,
  Panel,
  SaveOptions,
  StatusBarAlignment,
  StatusBarEntry,
} from '@theia/core/lib/browser';
import { MessageService } from '@theia/core/lib/common/message-service';
import { inject, injectable, interfaces } from '@theia/core/shared/inversify';
import { ApplicationConnectionStatusContribution } from './connection-status-service';
import { ToolbarAwareTabBar } from './tab-bars';
import { CommandRegistry, CommandService, nls } from '@theia/core';
import { BoardsService } from '../../../common/protocol/boards-service';
import { BoardsServiceProvider } from '../../boards/boards-service-provider';
import { UpdateIndexes } from '../../contributions/update-indexes';
import { CoreService, ResponseService } from '../../../common/protocol';

@injectable()
export class ApplicationShell extends TheiaApplicationShell {
  @inject(MessageService)
  private readonly messageService: MessageService;

  @inject(ApplicationConnectionStatusContribution)
  private readonly connectionStatusService: ApplicationConnectionStatusContribution;

  @inject(BoardsService) private readonly boardsService: BoardsService;

  @inject(CommandService) private commandService: CommandService;

  @inject(BoardsServiceProvider)
  private readonly boardsServiceProvider: BoardsServiceProvider;

  @inject(UpdateIndexes)
  private readonly updateIndexes: UpdateIndexes;
  @inject(CoreService)
  protected readonly coreService: CoreService;
  @inject(ResponseService)
  private readonly responseService: ResponseService;
  @inject(CommandRegistry)
  protected readonly commandRegistry: CommandRegistry;

  public rightPanelCustom: Widget;
  public mainContainer: SplitPanel;
  // 声明一个私有成员变量用于存储滚动容器
  private scrollContainer: HTMLDivElement;
  private boardImg = new BaseWidget();

  protected override createLayout(): Layout {
    const bottomSplitLayout = this.createSplitLayout(
      [this.mainPanel, this.bottomPanel],
      [1, 0],
      { orientation: 'vertical', spacing: 0 }
    );
    const panelForBottomArea = new SplitPanel({ layout: bottomSplitLayout });
    this.mainContainer = panelForBottomArea;
    panelForBottomArea.id = 'theia-bottom-split-panel';

    this.boardImg.node.style.backgroundColor = '#f0f0f0';
    this.boardImg.node.style.maxWidth = '170px';
    this.boardImg.node.style.minWidth = '170px';

    this.selectExamples(false);

    // 添加一个包含滚动条的容器元素到小部件的节点中
    this.scrollContainer = document.createElement('div');
    this.scrollContainer.style.overflowY = 'auto';
    this.scrollContainer.style.display = 'flex';
    this.scrollContainer.style.alignItems = 'center';
    this.scrollContainer.style.justifyContent = 'center';
    this.scrollContainer.style.height = `calc(100% - 120px)`;
    this.scrollContainer.style.borderTop = '1px solid #dae3e3';

    this.boardImg.node.appendChild(this.scrollContainer);

    this.officialWebsiteInformation();

    this.rightPanelCustom = this.boardImg;

    const leftRightSplitLayout = this.createSplitLayout(
      [this.leftPanelHandler.container, panelForBottomArea, this.boardImg],
      [0, 1, 0],
      { orientation: 'horizontal', spacing: 0 }
    );
    const panelForSideAreas = new SplitPanel({ layout: leftRightSplitLayout });
    panelForSideAreas.id = 'theia-left-right-split-panel';

    return this.createBoxLayout(
      [this.topPanel, panelForSideAreas, this.statusBar],
      [0, 1, 0],
      { direction: 'top-to-bottom', spacing: 0 }
    );
  }

  private officialWebsiteInformation() {
    const container1 = document.createElement('div');
    container1.style.display = 'flex';
    container1.style.alignItems = 'center';
    container1.style.margin = '5px 10px ';

    // 创建文字
    const name = document.createElement('span');
    name.textContent = '名称:';
    name.style.marginRight = '15px';
    name.style.whiteSpace = 'nowrap';

    const name1 = document.createElement('span');
    this.boardsServiceProvider.onBoardListDidChange((boardList) => {
      if (boardList.boardsConfig.selectedBoard?.fqbn) {
        const fqbn = boardList.boardsConfig.selectedBoard.fqbn;
        const lastColonIndex = fqbn.lastIndexOf(':');
        const valueAfterLastColon = fqbn.slice(lastColonIndex + 1);
        switch (valueAfterLastColon) {
          case 'lzesp32':
            name1.textContent = '零知-ESP32';
            break;
          case 'lzesp8266':
            name1.textContent = '零知-ESP8266';
            break;
          case 'lingzhistandard':
            name1.textContent = '零知-标准板';
            break;
          case 'lingzhiMini':
            name1.textContent = '零知-迷你板';
            break;
          case 'lingzhiM4':
            name1.textContent = '零知-增强板';
            break;
          case 'lz_ble52':
            name1.textContent = '零知-BLE52';
            break;
          default:
            if (boardList.boardsConfig.selectedBoard?.name) {
              name1.textContent = boardList.boardsConfig.selectedBoard.name;
            }
            break;
        }
      }
    });
    name1.style.marginRight = '15px';
    name1.style.whiteSpace = 'nowrap';
    name1.style.color = '#5500ff';
    name1.style.whiteSpace = 'nowrap';

    container1.appendChild(name);
    container1.appendChild(name1);
    this.boardImg.node.appendChild(container1);

    const container2 = document.createElement('div');
    container2.style.display = 'flex';
    container2.style.alignItems = 'center';
    container2.style.margin = '5px 10px ';

    // 创建文字
    const brand = document.createElement('span');
    brand.textContent = '品牌:';
    brand.style.marginRight = '15px';
    brand.style.whiteSpace = 'nowrap';

    const brand1 = document.createElement('span');
    brand1.textContent = '零知实验室';
    brand1.style.marginRight = '15px';
    brand1.style.color = '#5500ff';
    brand1.style.whiteSpace = 'nowrap';

    container2.appendChild(brand);
    container2.appendChild(brand1);
    this.boardImg.node.appendChild(container2);

    const container3 = document.createElement('div');
    container3.style.display = 'flex';
    container3.style.alignItems = 'center';
    container3.style.margin = '5px 10px ';

    // 创建文字
    const officialWebsite = document.createElement('span');
    officialWebsite.textContent = '官网:';
    officialWebsite.style.marginRight = '15px';
    officialWebsite.style.whiteSpace = 'nowrap';

    const officialWebsite1 = document.createElement('a');
    officialWebsite1.textContent = 'www.lingzhilab.com';
    officialWebsite1.style.textDecoration = 'underline';
    officialWebsite1.style.marginRight = '15px';
    officialWebsite1.style.cursor = 'pointer';
    officialWebsite1.style.color = '#5500ff';
    officialWebsite1.style.whiteSpace = 'nowrap';

    officialWebsite1.addEventListener('click', () => {
      this.commandService.executeCommand('arduino-visit-arduino');
    });

    container3.appendChild(officialWebsite);
    container3.appendChild(officialWebsite1);
    this.boardImg.node.appendChild(container3);
  }

  private imgDisplay(imgName = '') {
    // 先清除之前的图片
    while (this.scrollContainer.firstChild) {
      this.scrollContainer.removeChild(this.scrollContainer.firstChild);
    }

    const img = new Image();
    let absolutePath = `./icon/${imgName}.svg`;
    if (imgName === 'lzesp8266') {
      absolutePath = `./icon/${imgName}.png`;
    }
    img.src = absolutePath;
    const resizeObserver = new ResizeObserver(() => {
      if (this.scrollContainer.clientWidth === 170) {
        img.style.width = '75%';
      } else {
        img.style.width = '100%';
      }
    });
    resizeObserver.observe(this.scrollContainer);

    img.style.margin = 'auto';
    img.style.position = 'relative';
    if (imgName !== '') {
      this.scrollContainer.appendChild(img);
    }
  }

  private async selectExamples(isRefresh: boolean) {
    // 创建包含文字和下拉框的容器
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'left';
    container.style.margin = '5px 10px ';
    container.style.whiteSpace = 'nowrap';
    container.style.flexDirection = 'column';
    container.className = 'boardSelect';

    // 创建文字
    const label = document.createElement('span');
    label.textContent = '开发板';
    label.style.marginBottom = '7px';
    label.style.marginRight = '15px';

    // 创建下拉框
    const dropdown = document.createElement('select');
    this.updateIndexes.updateIndexes(['platform', 'library']);
    if (isRefresh) {
      //重新刷新Arduino CLI，不然会有缓存，会刷新开发板所有数据
      await this.coreService.refresh();
    }
    const allBoards = await this.boardsService.getInstalledBoards();

    this.boardsServiceProvider.onBoardListDidChange((boardList) => {
      dropdown.value = boardList.boardsConfig.selectedBoard?.fqbn as string;
      const parts = dropdown.value.split(':');
      const imgName = parts[parts.length - 1];
      this.imgDisplay(imgName);
    });

    this.boardsServiceProvider.onBoardsConfigDidChange(() => {
      this.boardsServiceProvider.ready.then(() => {
        const { selectedBoard } = this.boardsServiceProvider.boardsConfig;
        const name = selectedBoard?.fqbn;
        dropdown.value = name as string;
      });
    });

    allBoards.forEach((board) => {
      const option = document.createElement('option');
      const fqbn = board.fqbn as string;
      if (isRefresh) {
        const id = `arduino-select-board--${fqbn}`;
        const command = { id };
        const handler = {
          execute: () =>
            this.boardsServiceProvider.updateConfig({
              name: board.name,
              fqbn: fqbn,
            }),
        };
        this.commandRegistry.registerCommand(command, handler);
        if (board.fqbn === 'lingzhi:STM32F1:lingzhistandard') {
          this.boardsServiceProvider.updateConfig({
            name: board.name,
            fqbn: fqbn,
          });
        }
      }
      option.value = fqbn;
      const lastColonIndex = fqbn.lastIndexOf(':');
      const valueAfterLastColon = fqbn.slice(lastColonIndex + 1);
      switch (valueAfterLastColon) {
        case 'lzesp32':
          option.textContent = '零知-ESP32';
          break;
        case 'lzesp8266':
          option.textContent = '零知-ESP8266';
          break;
        case 'lingzhistandard':
          option.textContent = '零知-标准板';
          break;
        case 'lingzhiMini':
          option.textContent = '零知-迷你板';
          break;
        case 'lingzhiM4':
          option.textContent = '零知-增强板';
          break;
        case 'lz_ble52':
          option.textContent = '零知-BLE52';
          break;
        default:
          if (board.name) {
            option.textContent = board.name;
          }
          break;
      }
      dropdown.appendChild(option);
    });
    dropdown.style.borderColor = 'rgb(172, 172, 172)';
    dropdown.style.color = 'rgb(0, 0, 0)';
    dropdown.style.backgroundImage =
      'linear-gradient(to bottom, rgb(254, 254, 254) 0%, rgb(241, 241, 241) 100%)';
    dropdown.style.width = '125px';
    dropdown.style.whiteSpace = 'nowrap';
    dropdown.addEventListener('change', () => {
      const commandId = `arduino-select-board--${dropdown.value}`;
      this.commandService
        .executeCommand(commandId)
        .then(() => {
          console.log(`Executed command: ${commandId}`);
        })
        .catch((error) => {
          console.error(`Failed to execute command ${commandId}: ${error}`);
        });
    });

    // 将文字和下拉框添加到容器中
    container.appendChild(label);
    container.appendChild(dropdown);

    // 将容器添加到节点中
    this.boardImg.node.insertBefore(container, this.scrollContainer);
    if (isRefresh) {
      dropdown.value = 'lingzhi:STM32F1:lingzhistandard';
      const parts = dropdown.value.split(':');
      const imgName = parts[parts.length - 1];
      this.imgDisplay(imgName);
    }
  }

  public async refreshContainer() {
    let boardSelect = document.getElementsByClassName('boardSelect');
    if (boardSelect[0]) {
      let element = boardSelect[0];
      if (element instanceof HTMLElement) {
        element.style.display = 'none';
      }
    }
    await this.selectExamples(true);
  }

  override async addWidget(
    widget: Widget,
    options: Readonly<TheiaApplicationShell.WidgetOptions> = {}
  ): Promise<void> {
    // By default, Theia open a widget **next** to the currently active in the target area.
    // Instead of this logic, we want to open the new widget after the last of the target area.
    if (!widget.id) {
      console.error(
        'Widgets added to the application shell must have a unique id property.'
      );
      return;
    }
    let ref: Widget | undefined = options.ref;
    const area: TheiaApplicationShell.Area = options.area || 'main';
    if (!ref && (area === 'main' || area === 'bottom')) {
      const tabBar = this.getTabBarFor(area);
      if (tabBar) {
        const last = tabBar.titles[tabBar.titles.length - 1];
        if (last) {
          ref = last.owner;
        }
      }
    }
    return super.addWidget(widget, { ...options, ref });
  }

  override handleEvent(): boolean {
    // NOOP, dragging has been disabled
    return false;
  }

  // Avoid hiding top panel as we use it for arduino toolbar
  protected override createTopPanel(): Panel {
    const topPanel = super.createTopPanel();
    topPanel.show();
    return topPanel;
  }

  override async saveAll(options?: SaveOptions): Promise<void> {
    // When there is no connection between the IDE2 frontend and backend.
    if (this.connectionStatusService.offlineStatus === 'backend') {
      this.messageService.error(
        nls.localize(
          'theia/core/couldNotSave',
          '无法保存草图。请将未保存的工作复制到您最喜欢的文本编辑器中,然后重新启动IDE。'
        )
      );
      return; // Theia does not reject on failed save: https://github.com/eclipse-theia/theia/pull/8803
    }
    return super.saveAll(options);
  }

  protected override refreshBottomPanelToggleButton(): void {
    if (this.bottomPanel.isEmpty) {
      this.statusBar.removeElement('bottom-panel-toggle');
    } else {
      const label = '切换底部面板';
      const element: StatusBarEntry = {
        name: label,
        text: '$(codicon-window)',
        alignment: StatusBarAlignment.RIGHT,
        tooltip: label,
        command: 'core.toggle.bottom.panel',
        accessibilityInformation: {
          label: label,
          role: 'button',
        },
        priority: -1000,
      };
      this.statusBar.setElement('bottom-panel-toggle', element);
    }
  }
}

export class DockPanelRenderer extends TheiaDockPanelRenderer {
  override createTabBar(): TabBar<Widget> {
    const renderer = this.tabBarRendererFactory();
    // `ToolbarAwareTabBar` is from IDE2 and not from Theia. Check the imports.
    const tabBar = new ToolbarAwareTabBar(
      this.tabBarToolbarRegistry,
      this.tabBarToolbarFactory,
      this.breadcrumbsRendererFactory,
      {
        renderer,
        // Scroll bar options
        handlers: ['drag-thumb', 'keyboard', 'wheel', 'touch'],
        useBothWheelAxes: true,
        scrollXMarginOffset: 4,
        suppressScrollY: true,
      }
    );
    this.tabBarClasses.forEach((c) => tabBar.addClass(c));
    renderer.tabBar = tabBar;
    tabBar.disposed.connect(() => renderer.dispose());
    renderer.contextMenuPath = SHELL_TABBAR_CONTEXT_MENU;
    tabBar.currentChanged.connect(this.onCurrentTabChanged, this);
    return tabBar;
  }
}

const originalHandleEvent = DockPanel.prototype.handleEvent;

DockPanel.prototype.handleEvent = function (event) {
  switch (event.type) {
    case 'p-dragenter':
    case 'p-dragleave':
    case 'p-dragover':
    case 'p-drop':
      return;
  }
  originalHandleEvent.bind(this)(event);
};

export const bindToolbarApplicationShell = (
  bind: interfaces.Bind,
  rebind: interfaces.Rebind
): void => {
  bind(ApplicationShell).toSelf().inSingletonScope();
  rebind(TheiaApplicationShell).toService(ApplicationShell);
};
