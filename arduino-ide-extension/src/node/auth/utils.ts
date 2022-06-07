import jwt_decode from 'jwt-decode';
import { sha256 } from 'hash.js';
import { randomBytes } from 'crypto';
import btoa = require('btoa'); // TODO: check why we cannot
import { AuthenticationSession } from './types';

export interface IToken {
  accessToken: string; // When unable to refresh due to network problems, the access token becomes undefined
  idToken?: string; // depending on the scopes can be either supplied or empty

  expiresIn?: number; // How long access token is valid, in seconds
  expiresAt?: number; // UNIX epoch time at which token will expire
  refreshToken: string;

  account: {
    id: string;
    email: string;
    nickname: string;
    picture: string;
  };
  scope: string;
  sessionId: string;
}
export namespace IToken {
  // check if the token is expired or will expired before the buffer
  export function requiresRefresh(token: IToken, buffer: number): boolean {
    return token.expiresAt ? token.expiresAt < Date.now() + buffer : false;
  }
}

export interface Token {
  access_token: string;
  id_token?: string;
  refresh_token: string;
  scope: 'offline_access' | string; // `offline_access`
  expires_in: number; // expires in seconds
  token_type: string; // `Bearer`
}

export type RefreshToken = Omit<Token, 'refresh_token'>;

export function token2IToken(token: Token): IToken {
  const parsedIdToken: any =
    (token.id_token && jwt_decode(token.id_token)) || {};

  return {
    /*
     * ".id_token" is already decoded for account details above
     * so we probably don't need to keep it around as "idToken".
     * If we do, and subsequently try to store it with
     * Windows Credential Manager (WCM) it's probable we'll
     * exceed WCMs' 2500 password character limit breaking
     * our auth functionality
     */
    // ! idToken: token.id_token,
    expiresIn: token.expires_in,
    expiresAt: token.expires_in
      ? Date.now() + token.expires_in * 1000
      : undefined,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    sessionId: parsedIdToken.sub,
    scope: token.scope,
    account: {
      id: parsedIdToken.sub || 'unknown',
      email: parsedIdToken.email || 'unknown',
      nickname: parsedIdToken.nickname || 'unknown',
      picture: parsedIdToken.picture || 'unknown',
    },
  };
}

export function IToken2Session(token: IToken): AuthenticationSession {
  return {
    accessToken: token.accessToken,
    account: {
      id: token.account.id,
      label: token.account.nickname,
      picture: token.account.picture,
      email: token.account.email,
    },
    id: token.account.id,
    scopes: token.scope.split(' '),
  };
}

export function getRandomValues(input: Uint8Array): Uint8Array {
  const bytes = randomBytes(input.length);
  for (let i = 0, n = bytes.length; i < n; ++i) {
    input[i] = bytes[i];
  }
  return input;
}

export function generateProofKeyPair() {
  const urlEncode = (str: string) =>
    str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const decode = (buffer: Uint8Array | number[]) => {
    let decodedString = '';
    for (let i = 0; i < buffer.length; i++) {
      decodedString += String.fromCharCode(buffer[i]);
    }
    return decodedString;
  };
  const buffer = getRandomValues(new Uint8Array(32));
  const seed = btoa(decode(buffer));

  const verifier = urlEncode(seed);
  const challenge = urlEncode(btoa(decode(sha256().update(verifier).digest())));
  return { verifier, challenge };
}
