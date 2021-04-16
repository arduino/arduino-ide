import { inject, injectable, postConstruct } from 'inversify';
import { CloudSketchbookCompositeWidget } from './cloud-sketchbook-composite-widget';
import { SketchbookWidget } from '../sketchbook/sketchbook-widget';
import { ArduinoPreferences } from '../../arduino-preferences';

@injectable()
export class CloudSketchbookWidget extends SketchbookWidget {
    @inject(CloudSketchbookCompositeWidget)
    protected readonly widget: CloudSketchbookCompositeWidget;

    @inject(ArduinoPreferences)
    protected readonly arduinoPreferences: ArduinoPreferences;

    @postConstruct()
    protected init(): void {
        super.init();
    }

    checkCloudEnabled() {
        if (this.arduinoPreferences['arduino.cloud.enabled']) {
            this.sketchbookTreesContainer.activateWidget(this.widget);
        } else {
            this.sketchbookTreesContainer.activateWidget(
                this.localSketchbookTreeWidget
            );
        }
        this.setDocumentMode();
    }

    setDocumentMode() {
        if (this.arduinoPreferences['arduino.cloud.enabled']) {
            this.sketchbookTreesContainer.mode = 'multiple-document';
        } else {
            this.sketchbookTreesContainer.mode = 'single-document';
        }
    }

    protected onAfterAttach(msg: any) {
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
