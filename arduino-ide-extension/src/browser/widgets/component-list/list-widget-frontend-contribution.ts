import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import {
  OpenerOptions,
  OpenHandler,
} from '@theia/core/lib/browser/opener-service';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { URI } from '@theia/core/lib/common/uri';
import { injectable } from '@theia/core/shared/inversify';
import { Searchable } from '../../../common/protocol';
import { ArduinoComponent } from '../../../common/protocol/arduino-component';
import { ListWidget } from './list-widget';

// 使用 injectable 装饰器将这个类标记为可注入的
@injectable()
// 定义一个抽象类 ListWidgetFrontendContribution，它继承了 AbstractViewContribution、实现了 FrontendApplicationContribution 和 OpenHandler 接口
export abstract class ListWidgetFrontendContribution<
  T extends ArduinoComponent,
  S extends Searchable.Options
>
  extends AbstractViewContribution<ListWidget<T, S>>
  implements FrontendApplicationContribution, OpenHandler {
  // 定义一个常量 id，用于标识这个贡献的 ID，格式为 'http-opener-视图 ID'
  readonly id: string = `http-opener-${this.viewId}`;

  // 初始化布局的异步方法，在其中调用 openView 方法打开视图
  async initializeLayout(): Promise<void> {
    this.openView();
  }

  // 重写 registerMenus 方法，但不执行任何操作（NOOP）
  override registerMenus(_: MenuModelRegistry): void {
    // NOOP
  }

  // 判断是否能够处理给定的 URI 的方法
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canHandle(uri: URI, _?: OpenerOptions): number {
    // 如果可以解析 URI，则返回优先级为 501，表示可以处理该 URI；否则返回 0，表示不能处理
    // `500` 是 Theia 中的默认 HTTP 打开器，这里 IDE2 有更高的优先级
    // https://github.com/eclipse-theia/theia/blob/b75b6144b0ffea06a549294903c374fa642135e4/packages/core/src/browser/http-open-handler.ts#L39
    return this.canParse(uri) ? 501 : 0;
  }

  // 打开给定 URI 的异步方法
  async open(
    uri: URI,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _?: OpenerOptions | undefined
  ): Promise<void> {
    // 尝试解析 URI 得到搜索选项
    const searchOptions = this.parse(uri);
    // 如果解析失败，则在控制台打印警告信息并返回
    if (!searchOptions) {
      console.warn(
        `Failed to parse URI into a search options. URI: ${uri.toString()}`
      );
      return;
    }
    // 打开视图并获取对应的小部件
    const widget = await this.openView({
      activate: true,
      reveal: true,
    });
    // 如果打开视图失败，则在控制台打印警告信息并返回
    if (!widget) {
      console.warn(`Failed to open view for URI: ${uri.toString()}`);
      return;
    }
    // 调用小部件的 refresh 方法，并传入搜索选项
    widget.refresh(searchOptions);
  }

  // 抽象方法，用于判断是否能够解析给定的 URI
  protected abstract canParse(uri: URI): boolean;
  // 抽象方法，用于解析给定的 URI 得到搜索选项
  protected abstract parse(uri: URI): S | undefined;
}
