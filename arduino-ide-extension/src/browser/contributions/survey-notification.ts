import { MessageService } from '@theia/core';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { shell } from '@theia/electron/shared/electron';
import { LocalStorageService } from '@theia/core/lib/browser';
import { SurveyRetriever } from '../survey/survey-retriever';
import { nls } from '@theia/core/lib/common';

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

@injectable()
export class SurveyNotification implements FrontendApplicationContribution {
  @inject(MessageService)
  protected readonly messageService: MessageService;

  @inject(LocalStorageService)
  protected readonly localStorageService: LocalStorageService;

  @inject(SurveyRetriever)
  protected readonly surveyRetriever: SurveyRetriever;

  async onStart(): Promise<void> {
    const survey = await this.surveyRetriever.getSurvey();
    const surveyAnswered = await this.localStorageService.getData(
      this.surveyKey(survey.id),
      'notAnswered'
    );

    if (surveyAnswered !== 'notAnswered') {
      return;
    }

    this.messageService
      .info(SURVEY_MESSAGE, DO_NOT_SHOW_AGAIN, GO_TO_SURVEY)
      .then(async (answer) => {
        switch (answer) {
          case GO_TO_SURVEY:
            shell.openExternal(survey.url.href);
            this.localStorageService.setData(this.surveyKey(survey.id), true);
            break;
          case DO_NOT_SHOW_AGAIN:
            this.localStorageService.setData(this.surveyKey(survey.id), false);
            break;
        }
      });
  }

  private surveyKey(id: string): string {
    return `answered_survey:${id}`;
  }
}
