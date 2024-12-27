import { JsonRpcServer } from '@theia/core/lib/common/messaging/proxy-factory';
export const authServerPort = 9876;

export interface AuthOptions {
  redirectUri: string;
  responseType: string;
  clientID: string;
  domain: string;
  audience: string;
  registerUri: string;
  scopes: string[];
}

export interface AuthenticationSession {
  readonly id: string;
  readonly accessToken: string;
  readonly account: AuthenticationSessionAccountInformation;
  readonly scopes: ReadonlyArray<string>;
}
export interface AuthenticationSessionAccountInformation {
  readonly id: string;
  readonly email: string;
  readonly label: string;
  readonly picture: string;
}

export const AuthenticationServicePath = '/services/authentication-service';
export const AuthenticationService = Symbol('AuthenticationService');
export interface AuthenticationService
  extends JsonRpcServer<AuthenticationServiceClient> {
  login(): Promise<AuthenticationSession>;
  logout(): Promise<void>;
  session(): Promise<AuthenticationSession | undefined>;
  disposeClient(client: AuthenticationServiceClient): void;
  setOptions(authOptions: AuthOptions): Promise<void>;
  initAuthSession(): Promise<void>;
}

export interface AuthenticationServiceClient {
  notifySessionDidChange(session?: AuthenticationSession | undefined): void;
}
