import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { CloudSketchbookCompositeWidget } from './cloud-sketchbook-composite-widget';
import { SketchbookWidget } from '../sketchbook/sketchbook-widget';
import { ArduinoPreferences } from '../../arduino-preferences';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { SketchesServiceClientImpl } from '../../../common/protocol/sketches-service-client-impl';
import { SketchControl } from '../../contributions/sketch-control';
import { LocalCacheFsProvider } from '../../local-cache/local-cache-fs-provider';
import {
  ARDUINO_CLOUD_FOLDER,
  REMOTE_SKETCHBOOK_FOLDER,
} from '../../utils/constants';
import * as path from 'path';
@injectable()
export class CloudSketchbookWidget extends SketchbookWidget {
  @inject(CloudSketchbookCompositeWidget)
  protected readonly widget: CloudSketchbookCompositeWidget;

  @inject(ArduinoPreferences)
  protected readonly arduinoPreferences: ArduinoPreferences;

  @inject(SketchControl)
  protected readonly sketchControl: SketchControl;

  @inject(SketchesServiceClientImpl)
  protected readonly sketchesServiceClient: SketchesServiceClientImpl;

  @inject(LocalCacheFsProvider)
  protected readonly localCacheFsProvider: LocalCacheFsProvider;

  @postConstruct()
  protected override init(): void {
    super.init();
  }

  override getTreeWidget(): any {
    const widget: any = this.sketchbookTreesContainer.selectedWidgets().next();

    if (widget && typeof widget.getTreeWidget !== 'undefined') {
      return (widget as CloudSketchbookCompositeWidget).getTreeWidget();
    }
    return widget;
  }

  protected override onAfterShow(msg: Message): void {
    this.checkCloudEnabled();
    super.onAfterShow(msg);
  }

  async checkCloudEnabled(): Promise<void> {
    const currentSketch = await this.sketchesServiceClient.currentSketch();
    const isCloudSketch =
      currentSketch &&
      currentSketch !== 'invalid' &&
      currentSketch.uri.includes(
        path.join(REMOTE_SKETCHBOOK_FOLDER, ARDUINO_CLOUD_FOLDER)
      );

    if (this.arduinoPreferences['arduino.cloud.enabled']) {
      this.sketchbookTreesContainer.mode = 'multiple-document';
      if (isCloudSketch) {
        this.sketchbookTreesContainer.activateWidget(this.widget);
      }
    } else {
      this.sketchbookTreesContainer.mode = 'single-document';
    }

    if (!isCloudSketch || !this.arduinoPreferences['arduino.cloud.enabled']) {
      this.sketchbookTreesContainer.activateWidget(
        this.localSketchbookTreeWidget
      );
    }
  }

  protected override onAfterAttach(msg: any): void {
    this.sketchbookTreesContainer.addWidget(this.widget);
    this.sketchbookTreesContainer.mode = 'single-document';
    this.arduinoPreferences.onPreferenceChanged((event) => {
      if (event.preferenceName === 'arduino.cloud.enabled') {
        this.checkCloudEnabled();
      }
    });
    this.checkCloudEnabled();
    super.onAfterAttach(msg);
  }
}
