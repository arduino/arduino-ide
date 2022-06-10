import { injectable } from '@theia/core/shared/inversify';

export type Survey = {
  url: URL;
  id: string;
};

const SURVEY_BASE_URL = 'https://surveys.hotjar.com/';
const surveyId = '17887b40-e1f0-4bd6-b9f0-a37f229ccd8b';

@injectable()
export class SurveyRetriever {
  public async getSurvey(): Promise<Survey> {
    const survey: Survey = {
      url: new URL(SURVEY_BASE_URL + surveyId),
      id: surveyId,
    };
    return new Promise((resolve) => setTimeout(() => resolve(survey), 1000));
  }
}
