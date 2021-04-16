import { JsonRpcServer } from '@theia/core/lib/common/messaging/proxy-factory';
import { AuthOptions } from '../../node/auth/types';

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
    setOptions(authOptions: AuthOptions): void;
}

export interface AuthenticationServiceClient {
    notifySessionDidChange(session?: AuthenticationSession | undefined): void;
}
