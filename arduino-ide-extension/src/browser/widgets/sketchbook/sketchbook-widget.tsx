import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { toArray } from '@theia/core/shared/@phosphor/algorithm';
import { IDragEvent } from '@theia/core/shared/@phosphor/dragdrop';
import { DockPanel, Widget } from '@theia/core/shared/@phosphor/widgets';
import { Message, MessageLoop } from '@theia/core/shared/@phosphor/messaging';
import { Disposable } from '@theia/core/lib/common/disposable';
import { BaseWidget } from '@theia/core/lib/browser/widgets/widget';
import { SketchbookTreeWidget } from './sketchbook-tree-widget';
import { URI } from '../../contributions/contribution';
import {
  BaseSketchbookCompositeWidget,
  SketchbookCompositeWidget,
} from './sketchbook-composite-widget';
import {
  CurrentSketch,
  SketchesServiceClientImpl,
} from '../../sketches-service-client-impl';
import { OpenerService } from '@theia/core/lib/browser/opener-service';
import { open } from '../../contributions/contribution';
import { SketchControl } from '../../contributions/sketch-control';
import { CommandService, MAIN_MENU_BAR, nls } from '@theia/core/lib/common';
import { AsyncLocalizationProvider } from '@theia/core/lib/common/i18n/localization';
import { ElectronCommands } from '@theia/core/lib/electron-browser/menu/electron-menu-contribution';
import { SidebarBottomMenuWidget } from '../../theia/core/sidebar-bottom-menu-widget';
import {
  MyWidgetCommandHome,
  MyWidgetCommandOther,
} from '../../boardImg/boardImg-widget-contribution';
import { LINGZHI_OPEN_SKETCHBOOK_WIDGET } from './sketchbook-widget-contribution';
import { LocalStorageService } from '@theia/core/lib/browser/storage-service';

// 可注入的 SketchbookWidget 类
@injectable()
export class SketchbookWidget extends BaseWidget {
  // 静态常量，用于本地化 Sketchbook 的标签
  static readonly LABEL = nls.localize('arduino/sketch/sketchbook', '代码');
  // 声明一个私有成员变量用于存储滚动容器
  private scrollContainer: HTMLDivElement;
  private originalBackgroundColor = 'rgb(240, 240, 240)';
  private clickedBackgroundColor = 'rgb(235, 246, 255)';
  private determiningButtonCollapse = true;

  // 注入 SketchbookCompositeWidget
  @inject(SketchbookCompositeWidget)
  protected readonly sketchbookCompositeWidget: SketchbookCompositeWidget;

  // 用于容纳 Sketchbook 树容器的 DockPanel
  protected readonly sketchbookTreesContainer: DockPanel;

  constructor(
    @inject(OpenerService)
    protected readonly openerService: OpenerService,
    @inject(SketchesServiceClientImpl)
    protected readonly sketchServiceClient: SketchesServiceClientImpl,
    @inject(SketchControl)
    protected readonly sketchControl: SketchControl,
    @inject(CommandService) private commandService: CommandService,
    @inject(AsyncLocalizationProvider)
    protected readonly localizationProvider: AsyncLocalizationProvider,
    @inject(SidebarBottomMenuWidget)
    protected readonly sidebarBottomMenuWidget: SidebarBottomMenuWidget,
    @inject(LocalStorageService)
    private readonly localStorageService: LocalStorageService
  ) {
    // 调用父类构造函数
    super();
    // 设置 SketchbookWidget 的标识符
    this.id = 'arduino-sketchbook-widget';
    // 设置标题的 caption、label 和 iconClass，并设置可关闭
    this.title.caption = SketchbookWidget.LABEL;
    this.title.label = SketchbookWidget.LABEL;
    this.title.iconClass = 'fa lingzhi-coding-left';
    this.title.closable = true;
    // 设置节点的 tabIndex
    this.node.tabIndex = 0;
    // 创建 Sketchbook 树容器
    this.sketchbookTreesContainer = this.createTreesContainer();
    this.defaultPage();
    this.topName();
    // this.setCurrentTheme();
    // this.setLanguage();

    // 添加一个包含滚动条的容器元素到小部件的节点中
    this.node.className = 'p-Widget p-DockPanel-widget lingzhi-daima';
    this.scrollContainer = document.createElement('div');
    this.scrollContainer.style.overflowY = 'auto';
    // 设置高度为小部件的高度减去一个固定值，以适应面板
    this.scrollContainer.style.height = `calc(100% - 20px)`;
    this.scrollContainer.style.borderTop = '1px solid #d0d0d0';
    this.node.appendChild(this.scrollContainer);

    this.listeningForData();
  }

  private async defaultPage() {
    // function isTimePast10Seconds(timeStr: string | null): boolean {
    //   if (timeStr !== null) {
    //     const currentTime = new Date();
    //     const inputTime = new Date(timeStr);
    //     const timeDifferenceInMilliseconds =
    //       currentTime.getTime() - inputTime.getTime();
    //     const thirtySecondsInMilliseconds = 10000;
    //     return timeDifferenceInMilliseconds > thirtySecondsInMilliseconds;
    //   }
    //   return false;
    // }

    // const timeStr = localStorage.getItem('lingzhi-open-sketch-view');
    // if (!timeStr || isTimePast10Seconds(timeStr)) {
    //   this.commandService.executeCommand(MyWidgetCommandHome.id);
    // } else {
    //   this.commandService.executeCommand(MyWidgetCommandHome.id);
    //   // this.commandService.executeCommand(MyWidgetCommandOther.id);
    //   this.commandService.executeCommand(LINGZHI_OPEN_SKETCHBOOK_WIDGET.id);
    // }
    const isFirstStartup = !(await this.localStorageService.getData(
      'initializedLibsAndPackages'
    ));
    if (isFirstStartup) {
      this.commandService.executeCommand(MyWidgetCommandHome.id);
    } else {
      this.commandService.executeCommand(MyWidgetCommandHome.id);
      this.commandService.executeCommand(LINGZHI_OPEN_SKETCHBOOK_WIDGET.id);
    }
  }

  private topName() {
    const top = document.createElement('div');
    top.style.height = '20px';
    top.style.width = '100%';

    const name = document.createElement('div');
    name.innerText = '项目';
    name.style.marginLeft = '10px';
    top.appendChild(name);
    this.node.appendChild(top);
  }

  // private setCurrentTheme() {
  //   console.log('a');
  //   // const themeId = BuiltinThemeProvider.darkTheme.id;

  //   // if (this.themeService.getCurrentTheme().id !== themeId) {
  //   //   this.themeService.setCurrentTheme(themeId);
  //   // }
  // }

  private async setLanguage() {
    const language = 'zh-cn';
    if (language !== (await this.localizationProvider.getCurrentLanguage())) {
      // 将当前语言设置为本地化提供程序
      await this.localizationProvider.setCurrentLanguage(language);
      // 将当前语言标识存储到本地存储中
      window.localStorage.setItem(nls.localeId, language);
      // 执行命令，重新加载Electron应用程序
      this.commandService.executeCommand(ElectronCommands.RELOAD.id);
    }
  }

  public async listeningForData() {
    const sketchOne = await this.sketchServiceClient.currentSketch();
    this.sketchButton(sketchOne);

    if (!CurrentSketch.isValid(sketchOne)) {
      return;
    }
    let rootFolderFileUrisOne = sketchOne.rootFolderFileUris;
    let mainFileUriOne = sketchOne.mainFileUri;

    let index = true;
    let statusBar = true;
    const myFunction = async () => {
      if (index) {
        const menus = document.getElementById('lingzhi-menus-id');
        if (menus) {
          menus.addEventListener('click', async (e) => {
            this.sidebarBottomMenuWidget.tooberOnClick(
              e as unknown as React.MouseEvent<HTMLElement, MouseEvent>,
              MAIN_MENU_BAR
            );
          });
          index = false;
        }
      }

      if (statusBar) {
        const editor = document.getElementById(
          'status-bar-editor-status-cursor-position'
        );
        if (editor) {
          editor.onclick = function (event) {
            event.cancelBubble = true;
          };
          statusBar = false;
        }
      }

      const sketchTwo = await this.sketchServiceClient.currentSketch();
      if (!CurrentSketch.isValid(sketchTwo)) {
        return;
      }
      const rootFolderFileUrisTwo = sketchTwo.rootFolderFileUris;
      const mainFileUriTwo = sketchTwo.mainFileUri;

      if (
        rootFolderFileUrisOne.length !== rootFolderFileUrisTwo.length ||
        mainFileUriOne !== mainFileUriTwo
      ) {
        mainFileUriOne = mainFileUriTwo;
        rootFolderFileUrisOne = rootFolderFileUrisTwo;
        this.scrollContainer.innerHTML = '';
        this.sketchButton(sketchTwo);
      } else {
        for (let i = 0; i < rootFolderFileUrisTwo.length; i++) {
          const oneName = rootFolderFileUrisOne[i]
            .toString()
            .substring(
              rootFolderFileUrisOne[i].toString().lastIndexOf('/') + 1
            );
          const twoName = rootFolderFileUrisTwo[i]
            .toString()
            .substring(
              rootFolderFileUrisTwo[i].toString().lastIndexOf('/') + 1
            );
          if (oneName !== twoName) {
            rootFolderFileUrisOne = rootFolderFileUrisTwo;
            this.scrollContainer.innerHTML = '';
            this.sketchButton(sketchTwo);
            break;
          }
        }
      }
    };

    setInterval(myFunction, 0);
  }

  public async sketchButton(sketch: CurrentSketch) {
    if (!CurrentSketch.isValid(sketch)) {
      return;
    }
    const { mainFileUri, rootFolderFileUris } = sketch;
    const uris = [mainFileUri, ...rootFolderFileUris];

    const mainButton = document.createElement('button');
    const lastSlashIndex = mainFileUri.lastIndexOf('/');
    const fileName = mainFileUri.substring(lastSlashIndex + 1);
    const mainName = fileName.replace('.ino', '');

    mainButton.style.border = 'none';
    mainButton.style.width = '100%';
    mainButton.style.backgroundColor = 'rgb(240, 240, 240)';
    mainButton.style.textAlign = 'left';
    mainButton.style.color = 'rgb(0, 0, 0)';
    mainButton.style.cursor = 'pointer'; // 设置鼠标悬停时为小手样式
    mainButton.style.whiteSpace = 'nowrap';
    mainButton.style.display = 'flex';
    mainButton.style.alignItems = 'center';

    this.buttonColor(mainButton);

    const directionIcon = document.createElement('i');
    directionIcon.style.marginRight = '5px';

    const updateDirectionIcon = () => {
      if (!this.determiningButtonCollapse) {
        directionIcon.classList.remove('fa', 'lingzhi-below');
        directionIcon.classList.add('fa', 'lingzhi-right');
      } else {
        directionIcon.classList.remove('fa', 'lingzhi-right');
        directionIcon.classList.add('fa', 'lingzhi-below');
      }
    };

    directionIcon.addEventListener('click', () => {
      const doubleClickEvent = new MouseEvent('dblclick', {
        bubbles: true,
        cancelable: true,
      });
      mainButton.dispatchEvent(doubleClickEvent);
    });

    updateDirectionIcon();

    const icon = document.createElement('img');
    icon.src = './icon/file_pro.png';
    icon.style.width = '16px';
    icon.style.height = '15px';
    icon.style.marginRight = '5px';
    mainButton.appendChild(directionIcon);
    mainButton.appendChild(icon);
    mainButton.appendChild(document.createTextNode(mainName));
    this.scrollContainer.appendChild(mainButton);

    let buttonRows: HTMLDivElement[] = [];
    if (this.determiningButtonCollapse) {
      this.createButton(uris, buttonRows);
    }

    mainButton.addEventListener('dblclick', () => {
      this.determiningButtonCollapse = !this.determiningButtonCollapse;
      updateDirectionIcon();

      if (buttonRows.length > 0) {
        buttonRows.forEach((row) => row.remove());
        buttonRows = [];
      } else {
        this.createButton(uris, buttonRows);
      }
    });
  }

  private createButton(uris: string[], buttonRows: HTMLDivElement[]) {
    for (let i = 0; i < uris.length; i++) {
      const uri = new URI(uris[i]);
      const sonName = uri
        .toString()
        .substring(uri.toString().lastIndexOf('/') + 1);

      const buttonRow = document.createElement('div');
      const button = document.createElement('button');
      button.id = 'lingzhi-daima-contextmenu-menu';
      button.style.border = 'none';
      button.style.width = '100%';
      button.style.backgroundColor = 'rgb(240, 240, 240)';
      button.style.paddingLeft = '41px';
      button.style.textAlign = 'left';
      button.style.color = 'rgb(0, 0, 0)';
      button.style.cursor = 'pointer'; // 设置鼠标悬停时为小手样式
      button.style.whiteSpace = 'nowrap';

      const icon = document.createElement('img');
      icon.src = './icon/file_code.png';
      icon.style.width = '15px';
      icon.style.height = '15px';
      icon.style.marginRight = '3px';
      button.appendChild(icon);
      button.appendChild(document.createTextNode(sonName));
      buttonRow.appendChild(button);
      this.scrollContainer.appendChild(buttonRow);

      this.buttonColor(button);

      button.addEventListener('click', () => {
        open(this.openerService, uri);
      });
      button.addEventListener('contextmenu', async () => {
        open(this.openerService, uri);
        this.sketchControl.determiningWhetherToExpand = false;
        await this.commandService.executeCommand(
          'lingzhi-open-sketch-control--toolbar',
          true
        );
        this.sketchControl.determiningWhetherToExpand = true;
      });
      buttonRows.push(buttonRow);
    }
  }

  private buttonColor(button: HTMLButtonElement) {
    button.addEventListener('mouseover', () => {
      if (button.style.backgroundColor === this.originalBackgroundColor) {
        button.style.backgroundColor = 'rgb(240, 240, 240)';
        button.style.borderColor = '1px solid rgb(240, 240, 240)';
      }
    });
    button.addEventListener('mouseout', () => {
      if (button.style.backgroundColor !== this.clickedBackgroundColor) {
        button.style.backgroundColor = this.originalBackgroundColor;
        button.style.borderColor = '1px solid rgb(240, 240, 240)';
      }
    });
    button.addEventListener('click', () => {
      button.style.backgroundColor = this.clickedBackgroundColor;
      button.style.borderColor = '1px solid rgb(175, 207, 232)';

      // 清除其他主按钮的点击颜色
      const allMainButtons = document.querySelectorAll('button');
      allMainButtons.forEach((b) => {
        if (b !== button) {
          b.style.backgroundColor = this.originalBackgroundColor;
        }
      });
    });
    button.addEventListener('contextmenu', () => {
      button.style.backgroundColor = this.clickedBackgroundColor;

      // 清除其他主按钮的点击颜色
      const allMainButtons = document.querySelectorAll('button');
      allMainButtons.forEach((b) => {
        if (b !== button) {
          b.style.backgroundColor = this.originalBackgroundColor;
        }
      });
    });
  }

  // 在构造函数之后初始化的方法
  @postConstruct()
  protected init(): void {
    // 将 SketchbookCompositeWidget 添加到 Sketchbook 树容器中
    // this.sketchbookTreesContainer.addWidget(this.sketchbookCompositeWidget);
  }

  // 重写 onAfterAttach 方法
  protected override onAfterAttach(message: Message): void {
    // 调用父类的 onAfterAttach 方法
    super.onAfterAttach(message);
    // 将 Sketchbook 树容器附加到当前节点
    Widget.attach(this.sketchbookTreesContainer, this.node);
    // 将分离 Sketchbook 树容器的操作添加到可清理对象集合中
    this.toDisposeOnDetach.push(
      Disposable.create(() => Widget.detach(this.sketchbookTreesContainer))
    );
  }

  /**
   * The currently selected sketchbook tree widget inside the view.
   * 获取当前视图中选中的 Sketchbook 树小部件。
   */
  getTreeWidget(): SketchbookTreeWidget {
    return this.sketchbookCompositeWidget.treeWidget;
  }

  /**
   * An array of all sketchbook tree widgets managed by the view.
   * 获取视图管理的所有 Sketchbook 树小部件的数组。
   */
  getTreeWidgets(): SketchbookTreeWidget[] {
    return toArray(this.sketchbookTreesContainer.widgets()).reduce(
      (acc, curr) => {
        // 如果当前小部件是 BaseSketchbookCompositeWidget 的实例，则将其树小部件添加到累加器中
        if (curr instanceof BaseSketchbookCompositeWidget) {
          acc.push(curr.treeWidget);
        }
        return acc;
      },
      [] as SketchbookTreeWidget[]
    );
  }

  // 获取活动的树小部件的标识符
  activeTreeWidgetId(): string | undefined {
    const selectedTreeWidgets = toArray(
      this.sketchbookTreesContainer.selectedWidgets()
    ).map(({ id }) => id);
    if (selectedTreeWidgets.length > 1) {
      // 如果有多个选中的树小部件，则发出警告
      console.warn(
        `Found multiple selected tree widgets: ${JSON.stringify(
          selectedTreeWidgets
        )}. Expected only one.`
      );
    }
    // 返回第一个选中的树小部件的标识符或 undefined
    return selectedTreeWidgets.shift();
  }

  // 异步方法，用于揭示 Sketch 节点
  async revealSketchNode(treeWidgetId: string, nodeUri: string): Promise<void> {
    const widget = toArray(this.sketchbookTreesContainer.widgets())
      .filter(({ id }) => id === treeWidgetId)
      .shift();
    if (!widget) {
      // 如果找不到树小部件，则发出警告并返回
      console.warn(`Could not find tree widget with ID: ${widget}`);
      return;
    }
    // TODO: remove this when the remote/local sketchbooks and their widgets are cleaned up.
    const findTreeWidget = (
      widget: Widget | undefined
    ): SketchbookTreeWidget | undefined => {
      if (widget instanceof SketchbookTreeWidget) {
        return widget;
      }
      if (widget instanceof BaseSketchbookCompositeWidget) {
        return widget.treeWidget;
      }
      return undefined;
    };
    const treeWidget = findTreeWidget(
      toArray(this.sketchbookTreesContainer.widgets())
        .filter(({ id }) => id === treeWidgetId)
        .shift()
    );
    if (!treeWidget) {
      // 如果找不到树小部件，则发出警告并返回
      console.warn(`Could not find tree widget with ID: ${treeWidget}`);
      return;
    }
    // 激活 Sketchbook 树容器中的特定小部件
    this.sketchbookTreesContainer.activateWidget(widget);

    const treeNode = await treeWidget.model.revealFile(new URI(nodeUri));
    if (!treeNode) {
      // 如果找不到树节点，则发出警告
      console.warn(`Could not find tree node with URI: ${nodeUri}`);
    }
  }

  // 重写 onActivateRequest 方法
  protected override onActivateRequest(message: Message): void {
    super.onActivateRequest(message);
    this.commandService.executeCommand(MyWidgetCommandOther.id);

    this.sketchbookCompositeWidget.activate();
  }

  // 重写 onResize 方法
  protected override onResize(message: Widget.ResizeMessage): void {
    super.onResize(message);
    // 向 Sketchbook 树容器发送未知大小的调整消息
    MessageLoop.sendMessage(
      this.sketchbookTreesContainer,
      Widget.ResizeMessage.UnknownSize
    );
    for (const widget of toArray(this.sketchbookTreesContainer.widgets())) {
      // 向 Sketchbook 树容器中的每个小部件发送未知大小的调整消息
      MessageLoop.sendMessage(widget, Widget.ResizeMessage.UnknownSize);
    }
  }

  // 重写 onAfterShow 方法
  protected override onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
    // 在显示后调整大小
    this.onResize(Widget.ResizeMessage.UnknownSize);
  }

  // 创建 Sketchbook 树容器的方法
  protected createTreesContainer(): DockPanel {
    const panel = new NoopDragOverDockPanel({
      spacing: 0,
      mode: 'single-document',
    });
    // 为 Sketchbook 树容器添加 CSS 类名
    panel.addClass('sketchbook-trees-container');
    // 设置节点的 tabIndex
    panel.node.tabIndex = -1;
    return panel;
  }
}

// NoopDragOverDockPanel 类，继承自 DockPanel
export class NoopDragOverDockPanel extends DockPanel {
  constructor(options?: DockPanel.IOptions) {
    // 调用父类构造函数
    super(options);
    // 重写 _evtDragOver 方法，阻止拖放事件的默认行为、停止传播并设置 dropAction 为 'none'
    NoopDragOverDockPanel.prototype['_evtDragOver'] = (event: IDragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      event.dropAction = 'none';
    };
  }
}
