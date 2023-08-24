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
  @inject(CloudSketchbookCompositeWidget)
  protected readonly widget: CloudSketchbookCompositeWidget;

  @inject(ArduinoPreferences)
  protected readonly arduinoPreferences: ArduinoPreferences;

  @postConstruct()
  protected override init(): void {
    super.init();
  }

  override getTreeWidget(): any {
    const widget: any = this.sketchbookTreesContainer.selectedWidgets().next();

    if (widget instanceof BaseSketchbookCompositeWidget) {
      return widget.treeWidget;
    }
    return widget;
  }

  checkCloudEnabled() {
    if (this.arduinoPreferences['arduino.cloud.enabled']) {
      this.sketchbookTreesContainer.activateWidget(this.widget);
    } else {
      this.sketchbookTreesContainer.activateWidget(
        this.sketchbookCompositeWidget
      );
    }
    this.setDocumentMode();
  }

  setDocumentMode(): void {
    if (this.arduinoPreferences['arduino.cloud.enabled']) {
      this.sketchbookTreesContainer.mode = 'multiple-document';
    } else {
      this.sketchbookTreesContainer.mode = 'single-document';
    }
  }

  protected override onAfterAttach(msg: any): void {
    this.sketchbookTreesContainer.addWidget(this.widget);
    this.setDocumentMode();
    this.arduinoPreferences.onPreferenceChanged((event) => {
      if (event.preferenceName === 'arduino.cloud.enabled') {
        this.checkCloudEnabled();
      }
    });
    super.onAfterAttach(msg);
  }
}
