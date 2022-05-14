import fetch from 'node-fetch';
import { injectable } from 'inversify';

import { createServer, startServer } from './authentication-server';
import { Keychain } from './keychain';
import {
  generateProofKeyPair,
  Token,
  IToken,
  IToken2Session,
  token2IToken,
  RefreshToken,
} from './utils';
import { Authentication } from 'auth0-js';
import {
  AuthenticationProviderAuthenticationSessionsChangeEvent,
  AuthenticationSession,
  AuthenticationProvider,
  AuthOptions,
} from './types';
import { Event, Emitter } from '@theia/core/lib/common/event';
import * as open from 'open';

const LOGIN_TIMEOUT = 30 * 1000;
const REFRESH_INTERVAL = 10 * 60 * 1000;

@injectable()
export class ArduinoAuthenticationProvider implements AuthenticationProvider {
  protected authOptions: AuthOptions;

  public readonly id: string = 'arduino-account-auth';
  public readonly label = 'Arduino';

  // create a keychain holding the keys
  private keychain = new Keychain({
    credentialsSection: this.id,
    account: this.label,
  });

  private _tokens: IToken[] = [];
  private _refreshTimeouts: Map<string, NodeJS.Timeout> = new Map<
    string,
    NodeJS.Timeout
  >();

  private _onDidChangeSessions =
    new Emitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();
  public get onDidChangeSessions(): Event<AuthenticationProviderAuthenticationSessionsChangeEvent> {
    return this._onDidChangeSessions.event;
  }

  private get sessions(): Promise<AuthenticationSession[]> {
    return Promise.resolve(this._tokens.map((token) => IToken2Session(token)));
  }

  public getSessions(): Promise<AuthenticationSession[]> {
    return Promise.resolve(this.sessions);
  }

  public async init(): Promise<void> {
    // restore previously stored sessions
    const stringTokens = await this.keychain.getStoredCredentials();

    // no valid token, nothing to do
    if (!stringTokens) {
      return;
    }

    const checkToken = async () => {
      // tokens exist, parse and refresh them
      try {
        const tokens: IToken[] = JSON.parse(stringTokens);
        // refresh the tokens when needed
        await Promise.all(
          tokens.map(async (token) => {
            // if refresh not needed, add the existing token
            if (!IToken.requiresRefresh(token, REFRESH_INTERVAL)) {
              return this.addToken(token);
            }
            const refreshedToken = await this.refreshToken(token);
            return this.addToken(refreshedToken);
          })
        );
      } catch {
        return;
      }
    };
    checkToken();
    setInterval(checkToken, REFRESH_INTERVAL);
  }

  public setOptions(authOptions: AuthOptions) {
    this.authOptions = authOptions;
    if (!this._tokens.length) {
      this.init();
    }
  }

  public dispose(): void {}

  public async refreshToken(token: IToken): Promise<IToken> {
    if (!token.refreshToken) {
      throw new Error('Unable to refresh a token without a refreshToken');
    }

    console.log(`Refreshing token ${token.sessionId}`);

    const response = await fetch(
      `https://${this.authOptions.domain}/oauth/token`,
      {
        method: 'POST',
        body: JSON.stringify({
          grant_type: 'refresh_token',
          client_id: this.authOptions.clientID,
          refresh_token: token.refreshToken,
        }),
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );
    if (response.ok) {
      const result: RefreshToken = await response.json();
      // add the refresh_token from the old token
      return token2IToken({
        ...result,
        refresh_token: token.refreshToken,
      });
    }
    throw new Error(`Failed to refresh a token: ${response.statusText}`);
  }

  private async exchangeCodeForToken(
    authCode: string,
    verifier: string
  ): Promise<Token> {
    const response = await fetch(
      `https://${this.authOptions.domain}/oauth/token`,
      {
        method: 'POST',
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: this.authOptions.clientID,
          code_verifier: verifier,
          code: authCode,
          redirect_uri: this.authOptions.redirectUri,
        }),
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );
    if (response.ok) {
      return await response.json();
    }
    throw new Error(`Failed to fetch a token: ${response.statusText}`);
  }

  public async createSession(): Promise<AuthenticationSession> {
    const token = await this.login();
    this.addToken(token);
    return IToken2Session(token);
  }

  private async login(): Promise<IToken> {
    return new Promise<IToken>(async (resolve, reject) => {
      const pkp = generateProofKeyPair();

      const server = createServer(async (req, res) => {
        const { url } = req;
        if (url && url.startsWith('/callback?code=')) {
          const code = url.slice('/callback?code='.length);
          const token = await this.exchangeCodeForToken(code, pkp.verifier);
          resolve(token2IToken(token));
        }

        // schedule server shutdown after 10 seconds
        setTimeout(() => {
          server.close();
        }, LOGIN_TIMEOUT);
      });

      try {
        const port = await startServer(server);
        console.log(`server listening on http://localhost:${port}`);

        const auth0 = new Authentication({
          clientID: this.authOptions.clientID,
          domain: this.authOptions.domain,
          audience: this.authOptions.audience,
          redirectUri: `http://localhost:${port}/callback`,
          scope: this.authOptions.scopes.join(' '),
          responseType: this.authOptions.responseType,
          code_challenge_method: 'S256',
          code_challenge: pkp.challenge,
        } as any);
        const authorizeUrl = auth0.buildAuthorizeUrl({
          redirectUri: `http://localhost:${port}/callback`,
          responseType: this.authOptions.responseType,
        });
        await open(authorizeUrl);

        // set a timeout if the authentication takes too long
        setTimeout(() => {
          server.close();
          reject(new Error('Login timeout.'));
        }, 30000);
      } finally {
        // server is usually closed by the callback or the timeout, this is to handle corner cases
        setTimeout(() => {
          server.close();
        }, 50000);
      }
    });
  }

  public async signUp(): Promise<void> {
    await open(this.authOptions.registerUri);
  }

  /**
   * Returns extended account info for the given (and logged-in) sessionId.
   *
   * @param sessionId the sessionId to get info about. If not provided, all account info are returned
   * @returns an array of IToken, containing extended info for the accounts
   */
  public accountInfo(sessionId?: string) {
    return this._tokens.filter((token) =>
      sessionId ? token.sessionId === sessionId : true
    );
  }

  /**
   * Removes any logged-in sessions
   */
  public logout() {
    this._tokens.forEach((token) => this.removeSession(token.sessionId));

    // remove any dangling credential in the keychain
    this.keychain.deleteCredentials();
  }

  public async removeSession(sessionId: string): Promise<void> {
    // remove token from memory, if successful fire the event
    const token = this.removeInMemoryToken(sessionId);
    if (token) {
      this._onDidChangeSessions.fire({
        added: [],
        removed: [IToken2Session(token)],
        changed: [],
      });
    }

    // update the tokens in the keychain
    this.keychain.storeCredentials(JSON.stringify(this._tokens));
  }

  /**
   * Clears the refresh timeout associated to a session and removes the key from the set
   */
  private clearSessionTimeout(sessionId: string): void {
    const timeout = this._refreshTimeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this._refreshTimeouts.delete(sessionId);
    }
  }

  /**
   * Remove the given token from memory and clears the associated refresh timeout
   * @param token
   * @returns the removed token
   */
  private removeInMemoryToken(sessionId: string): IToken | undefined {
    const tokenIndex = this._tokens.findIndex(
      (token) => token.sessionId === sessionId
    );
    let token: IToken | undefined;
    if (tokenIndex > -1) {
      token = this._tokens[tokenIndex];
      this._tokens.splice(tokenIndex, 1);
    }

    this.clearSessionTimeout(sessionId);
    return token;
  }

  /**
   * Add the given token to memory storage and keychain. Prepares Timeout for token refresh
   * NOTE: we currently support 1 token (logged user) at a time
   * @param token
   * @returns
   */
  public async addToken(token: IToken): Promise<IToken | undefined> {
    if (!token) {
      return;
    }
    this._tokens = [token];
    // update the tokens in the keychain
    this.keychain.storeCredentials(JSON.stringify(this._tokens));

    // notify subscribers about the newly added/changed session
    const session = IToken2Session(token);
    const changedToken = this._tokens.find(
      (itoken) => itoken.sessionId === session.id
    );
    const changes = {
      added: (!changedToken && [session]) || [],
      removed: [],
      changed: (!!changedToken && [session]) || [],
    };
    this._onDidChangeSessions.fire(changes);

    // setup token refresh
    this.clearSessionTimeout(token.sessionId);
    if (token.expiresAt) {
      // refresh the token 30sec before expiration
      const expiration = token.expiresAt - Date.now() - 30 * 1000;

      this._refreshTimeouts.set(
        token.sessionId,
        setTimeout(
          async () => {
            try {
              const refreshedToken = await this.refreshToken(token);
              this.addToken(refreshedToken);
            } catch (e) {
              await this.removeSession(token.sessionId);
            }
          },
          expiration > 0 ? expiration : 0
        )
      );
    }

    return token;
  }
}
