import type * as keytarType from 'keytar';

export type KeychainConfig = {
  credentialsSection: string;
  account: string;
};

type Keytar = {
  getPassword: typeof keytarType['getPassword'];
  setPassword: typeof keytarType['setPassword'];
  deletePassword: typeof keytarType['deletePassword'];
};

export class Keychain {
  credentialsSection: string;
  account: string;

  constructor(config: KeychainConfig) {
    this.credentialsSection = config.credentialsSection;
    this.account = config.account;
  }

  getKeytar(): Keytar | undefined {
    try {
      return require('keytar');
    } catch (err) {
      console.log(err);
    }
    return undefined;
  }

  async getStoredCredentials(): Promise<string | undefined | null> {
    const keytar = this.getKeytar();
    if (!keytar) {
      return undefined;
    }
    try {
      return keytar.getPassword(this.credentialsSection, this.account);
    } catch {
      return undefined;
    }
  }

  async storeCredentials(stringifiedToken: string): Promise<boolean> {
    const keytar = this.getKeytar();
    if (!keytar) {
      return false;
    }
    try {
      const stringifiedTokenLength = stringifiedToken.length;
      const tokenLengthNotSupported =
        stringifiedTokenLength > 2500 && process.platform === 'win32';

      if (tokenLengthNotSupported) {
        // TODO manage this specific error appropriately
        return false;
      }

      await keytar.setPassword(
        this.credentialsSection,
        this.account,
        stringifiedToken
      );
      return true;
    } catch {
      return false;
    }
  }

  async deleteCredentials(): Promise<boolean> {
    const keytar = this.getKeytar();
    if (!keytar) {
      return false;
    }
    try {
      const result = await keytar.deletePassword(
        this.credentialsSection,
        this.account
      );
      return result;
    } catch {
      return false;
    }
  }
}
