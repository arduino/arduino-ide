import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { CloudSketchbookCompositeWidget } from './cloud-sketchbook-composite-widget';
import { SketchbookWidget } from '../sketchbook/sketchbook-widget';
import { ArduinoPreferences } from '../../arduino-preferences';
import { BaseSketchbookCompositeWidget } from '../sketchbook/sketchbook-composite-widget';

@injectable()
export class CloudSketchbookWidget extends SketchbookWidget {
  // 注入 CloudSketchbookCompositeWidget 实例
  @inject(CloudSketchbookCompositeWidget)
  protected readonly widget: CloudSketchbookCompositeWidget;

  // 注入 ArduinoPreferences 实例
  @inject(ArduinoPreferences)
  protected readonly arduinoPreferences: ArduinoPreferences;

  @postConstruct()
  protected override init(): void {
    // 调用父类的初始化方法
    super.init();
  }

  // 获取树状部件，如果当前选中的部件是 BaseSketchbookCompositeWidget 的实例，则返回其树状部件，否则直接返回选中的部件
  override getTreeWidget(): any {
    const widget: any = this.sketchbookTreesContainer.selectedWidgets().next();
    if (widget instanceof BaseSketchbookCompositeWidget) {
      return widget.treeWidget;
    }
    return widget;
  }

  // 检查云端功能是否启用
  checkCloudEnabled() {
    // 如果云端功能启用（根据 ArduinoPreferences 中的设置判断）
    if (this.arduinoPreferences['arduino.cloud.enabled']) {
      // 激活 CloudSketchbookCompositeWidget
      this.sketchbookTreesContainer.activateWidget(this.widget);
    } else {
      // 否则激活普通的 sketchbookCompositeWidget
      this.sketchbookTreesContainer.activateWidget(
        this.sketchbookCompositeWidget
      );
    }
    // 设置文档模式
    this.setDocumentMode();
  }

  // 设置文档模式，如果云端功能启用则设置为多文档模式，否则设置为单文档模式
  setDocumentMode(): void {
    if (this.arduinoPreferences['arduino.cloud.enabled']) {
      this.sketchbookTreesContainer.mode = 'multiple-document';
    } else {
      this.sketchbookTreesContainer.mode = 'single-document';
    }
  }

  // 在部件附加到父容器后执行的方法
  protected override onAfterAttach(msg: any): void {
    // 将 CloudSketchbookCompositeWidget 添加到 sketchbookTreesContainer 中
    // this.sketchbookTreesContainer.addWidget(this.widget);
    // 设置文档模式
    this.setDocumentMode();
    // 监听 ArduinoPreferences 中 'arduino.cloud.enabled' 属性的变化，当变化时调用 checkCloudEnabled 方法
    this.arduinoPreferences.onPreferenceChanged((event) => {
      if (event.preferenceName === 'arduino.cloud.enabled') {
        this.checkCloudEnabled();
      }
    });
    // 调用父类的 onAfterAttach 方法
    super.onAfterAttach(msg);
  }
}
