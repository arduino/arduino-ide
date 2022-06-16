import { MessageService } from '@theia/core';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { LocalStorageService } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { ArduinoPreferences } from '../arduino-preferences';
import { SurveyNotificationService } from '../../common/protocol/survey-service';

const SURVEY_MESSAGE = nls.localize(
  'arduino/survey/surveyMessage',
  'Please help us improve by answering this super short survey. We value our community and would like to get to know our supporters a little better.'
);
const DO_NOT_SHOW_AGAIN = nls.localize(
  'arduino/survey/dismissSurvey',
  "Don't show again"
);
const GO_TO_SURVEY = nls.localize(
  'arduino/survey/answerSurvey',
  'Answer survey'
);

const SURVEY_BASE_URL = 'https://surveys.hotjar.com/';
const surveyId = '17887b40-e1f0-4bd6-b9f0-a37f229ccd8b';

@injectable()
export class SurveyNotification implements FrontendApplicationContribution {
  @inject(MessageService)
  private readonly messageService: MessageService;

  @inject(LocalStorageService)
  private readonly localStorageService: LocalStorageService;

  @inject(WindowService)
  private readonly windowService: WindowService;

  @inject(ArduinoPreferences)
  private readonly arduinoPreferences: ArduinoPreferences;

  @inject(SurveyNotificationService)
  private readonly surveyNotificationService: SurveyNotificationService;

  onStart(): void {
    this.arduinoPreferences.ready.then(async () => {
      if (
        (await this.surveyNotificationService.isFirstInstance()) &&
        this.arduinoPreferences.get('arduino.survey.notification')
      ) {
        const surveyAnswered = await this.localStorageService.getData(
          this.surveyKey(surveyId)
        );
        if (surveyAnswered !== undefined) {
          return;
        }
        const answer = await this.messageService.info(
          SURVEY_MESSAGE,
          DO_NOT_SHOW_AGAIN,
          GO_TO_SURVEY
        );
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
      }
    });
  }

  private surveyKey(id: string): string {
    return `answered_survey:${id}`;
  }
}
