import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { CloudSketchbookCompositeWidget } from './cloud-sketchbook-composite-widget';
import { SketchbookWidget } from '../sketchbook/sketchbook-widget';
import { ArduinoPreferences } from '../../arduino-preferences';
import { CommandContribution, CommandRegistry } from '@theia/core';
import { ApplicationShell } from '@theia/core/lib/browser';
import { CloudSketchbookCommands } from './cloud-sketchbook-contributions';
import { EditorManager } from '@theia/editor/lib/browser';
import { SketchbookWidgetContribution } from '../sketchbook/sketchbook-widget-contribution';

@injectable()
export class CloudSketchbookWidget
  extends SketchbookWidget
  implements CommandContribution
{
  @inject(CloudSketchbookCompositeWidget)
  private readonly cloudSketchbookCompositeWidget: CloudSketchbookCompositeWidget;

  @inject(ArduinoPreferences)
  private readonly arduinoPreferences: ArduinoPreferences;

  @inject(ApplicationShell)
  private readonly shell: ApplicationShell;

  @inject(SketchbookWidgetContribution)
  private readonly sketchbookWidgetContribution: SketchbookWidgetContribution;

  @inject(EditorManager)
  private readonly editorManager: EditorManager;

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

  checkCloudEnabled() {
    if (this.arduinoPreferences['arduino.cloud.enabled']) {
      this.sketchbookTreesContainer.activateWidget(
        this.cloudSketchbookCompositeWidget
      );
    } else {
      this.sketchbookTreesContainer.activateWidget(
        this.localSketchbookTreeWidget
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
    this.sketchbookTreesContainer.addWidget(
      this.cloudSketchbookCompositeWidget
    );
    this.setDocumentMode();
    this.arduinoPreferences.onPreferenceChanged((event) => {
      if (event.preferenceName === 'arduino.cloud.enabled') {
        this.checkCloudEnabled();
      }
    });
    super.onAfterAttach(msg);
  }

  registerCommands(registry: CommandRegistry): void {
    this.sketchbookTreesContainer.addWidget(
      this.cloudSketchbookCompositeWidget
    );
    registry.registerCommand(
      CloudSketchbookCommands.SHOW_CLOUD_SKETCHBOOK_WIDGET,
      {
        execute: () => this.showCloudSketchbookWidget(),
      }
    );
  }

  showCloudSketchbookWidget(): void {
    if (this.arduinoPreferences['arduino.cloud.enabled']) {
      this.shell.activateWidget(this.id).then((widget) => {
        if (widget instanceof CloudSketchbookWidget) {
          widget.activateTreeWidget(this.cloudSketchbookCompositeWidget.id);
        }
        this.sketchbookWidgetContribution.selectWidgetFileNode(
          this.editorManager.currentEditor
        );
      });
    }
  }
}
