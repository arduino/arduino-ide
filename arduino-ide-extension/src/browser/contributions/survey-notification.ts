import { MessageService } from '@theia/core';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { LocalStorageService } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { ArduinoPreferences } from '../arduino-preferences';

export type Survey = {
  url: URL;
  id: string;
};

const SURVEY_MESSAGE = nls.localize(
  'arduino/survey/surveyMessage',
  'Please help us improve by answering this super short survey. We value our community and would like to get to know our supporters a little better.'
);
const DO_NOT_SHOW_AGAIN = nls.localize(
  'arduino/survey/dismissSurvey',
  'DON’T SHOW ANYMORE'
);
const GO_TO_SURVEY = nls.localize(
  'arduino/survey/answerSurvey',
  'ANSWER SURVEY'
);

const SURVEY_BASE_URL = 'https://surveys.hotjar.com/';
const surveyId = '17887b40-e1f0-4bd6-b9f0-a37f229ccd8b';

@injectable()
export class SurveyNotification implements FrontendApplicationContribution {
  @inject(MessageService)
  protected readonly messageService: MessageService;

  @inject(LocalStorageService)
  protected readonly localStorageService: LocalStorageService;

  @inject(WindowService)
  protected readonly windowService: WindowService;

  @inject(ArduinoPreferences)
  protected readonly arduinoPreferences: ArduinoPreferences;

  async onStart(): Promise<void> {
    if (this.arduinoPreferences.get('arduino.survey.notification')) {
      this.localStorageService
        .getData(this.surveyKey(surveyId), undefined)
        .then((surveyAnswered) => {
          if (surveyAnswered !== undefined) {
            return;
          }
          return this.messageService.info(
            SURVEY_MESSAGE,
            DO_NOT_SHOW_AGAIN,
            GO_TO_SURVEY
          );
        })
        .then((answer) => {
          switch (answer) {
            case GO_TO_SURVEY:
              this.windowService.openNewWindow(SURVEY_BASE_URL + surveyId, {
                external: true,
              });
              this.localStorageService.setData(this.surveyKey(surveyId), true);
              break;
            case DO_NOT_SHOW_AGAIN:
              this.localStorageService.setData(this.surveyKey(surveyId), false);
              break;
          }
        });
    }
  }

  private surveyKey(id: string): string {
    return `answered_survey:${id}`;
  }
}
