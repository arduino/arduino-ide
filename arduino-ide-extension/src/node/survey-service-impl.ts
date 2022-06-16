import { injectable } from '@theia/core/shared/inversify';
import { SurveyNotificationService } from '../common/protocol/survey-service';

@injectable()
export class SurveyNotificationServiceImpl
  implements SurveyNotificationService
{
  private isSurveyShown = false;
  async isFirstInstance(): Promise<boolean> {
    if (this.isSurveyShown) {
      return false;
    }
    return (this.isSurveyShown = true);
  }
}
