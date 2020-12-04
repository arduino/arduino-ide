export const splashServicePath = '/services/splash-service';
export const SplashService = Symbol('SplashService');
export interface SplashService {
    requestClose(): Promise<void>;
}
