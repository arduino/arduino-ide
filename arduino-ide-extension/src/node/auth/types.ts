import { AuthenticationSession } from '../../common/protocol/authentication-service';
export { AuthenticationSession };

export type AuthOptions = {
    redirectUri: string;
    responseType: string;
    clientID: string;
    domain: string;
    audience: string;
    registerUri: string;
    scopes: string[];
};

export interface AuthenticationProviderAuthenticationSessionsChangeEvent {
    readonly added?: ReadonlyArray<AuthenticationSession>;
    readonly removed?: ReadonlyArray<AuthenticationSession>;
    readonly changed?: ReadonlyArray<AuthenticationSession>;
}

export interface AuthenticationProvider {
    readonly onDidChangeSessions: any; // Event<AuthenticationProviderAuthenticationSessionsChangeEvent>;
    getSessions(): Promise<ReadonlyArray<AuthenticationSession>>;
    createSession(): Promise<AuthenticationSession>;
    removeSession(sessionId: string): Promise<void>;
    setOptions(authOptions: AuthOptions): void;
}
