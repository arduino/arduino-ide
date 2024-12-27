import { injectable } from '@theia/core/shared/inversify';
import { LibraryPackage, LibrarySearch } from '../../common/protocol';
import { URI } from '../contributions/contribution';
import { ListWidgetFrontendContribution } from '../widgets/component-list/list-widget-frontend-contribution';
import { LibraryListWidget } from './library-list-widget';

// 可注入的 LibraryListWidgetFrontendContribution 类
@injectable()
export class LibraryListWidgetFrontendContribution extends ListWidgetFrontendContribution<
  LibraryPackage,
  LibrarySearch
> {
  constructor() {
    // 调用父类构造函数，配置 LibraryListWidget 的前端贡献参数
    super({
      widgetId: LibraryListWidget.WIDGET_ID,
      widgetName: LibraryListWidget.WIDGET_LABEL,
      defaultWidgetOptions: {
        area: 'left',
        rank: 4,
      },
      toggleCommandId: `${LibraryListWidget.WIDGET_ID}:toggle`,
      toggleKeybinding: 'CtrlCmd+Shift+I',
    });
  }

  // 重写注册菜单的方法
  // override registerMenus(menus: MenuModelRegistry): void {
  //   if (this.toggleCommand) {
  //     // 在特定菜单中注册切换命令的菜单项
  //     menus.registerMenuAction(ArduinoMenus.TOOLS__MAIN_GROUP, {
  //       commandId: this.toggleCommand.id,
  //       label: nls.localize(
  //         'arduino/library/manageLibraries',
  //         'Manage Libraries...'
  //       ),
  //       order: '3',
  //     });
  //   }
  // }

  // 判断给定的 URI 是否可以被解析为 LibrarySearch 对象
  protected canParse(uri: URI): boolean {
    try {
      LibrarySearch.UriParser.parse(uri);
      return true;
    } catch {
      return false;
    }
  }

  // 解析给定的 URI 为 LibrarySearch 对象，如果可以解析的话
  protected parse(uri: URI): LibrarySearch | undefined {
    return LibrarySearch.UriParser.parse(uri);
  }
}
