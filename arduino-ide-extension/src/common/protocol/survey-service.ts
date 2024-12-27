export const SurveyNotificationServicePath =
  '/services/survey-notification-service';
export const SurveyNotificationService = Symbol('SurveyNotificationService');

export interface SurveyNotificationService {
  isFirstInstance(): Promise<boolean>;
}
