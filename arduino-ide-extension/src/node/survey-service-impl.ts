import { injectable } from '@theia/core/shared/inversify';
import { SurveyNotificationService } from '../common/protocol/survey-service';

/**
 * Service for checking if it is the first instance of the IDE, in this case it sets a flag to true.
 * This flag is used to prevent the survey notification from being visible in every open window. It must only be shown on one window.
 */
@injectable()
export class SurveyNotificationServiceImpl
  implements SurveyNotificationService
{
  private surveyDidShow = false;
  async isFirstInstance(): Promise<boolean> {
    if (this.surveyDidShow) {
      return false;
    }
    this.surveyDidShow = true;
    return this.surveyDidShow;
  }
}
