export const ConfigServicePath = '/services/config-service';
export const ConfigService = Symbol('ConfigService');
export interface ConfigService {
  getVersion(): Promise<
    Readonly<{ version: string; commit: string; status?: string }>
  >;
  getCliConfigFileUri(): Promise<string>;
  getConfiguration(): Promise<Config>;
  setConfiguration(config: Config): Promise<void>;
  isInDataDir(uri: string): Promise<boolean>;
  isInSketchDir(uri: string): Promise<boolean>;
}

export interface ProxySettings {
  protocol: string;
  hostname: string;
  port: string;
  username: string;
  password: string;
}
export type Network = 'none' | ProxySettings;
export namespace Network {
  export function Default(): Network {
    return {
      protocol: 'http',
      hostname: '',
      port: '',
      username: '',
      password: '',
    };
  }

  export function parse(raw: string | undefined): Network {
    if (!raw) {
      return 'none';
    }
    try {
      // Patter: PROTOCOL://USER:PASS@HOSTNAME:PORT/
      const { protocol, hostname, password, username, port } = new URL(raw);
      return {
        protocol,
        hostname,
        password,
        username,
        port,
      };
    } catch {
      return 'none';
    }
  }

  export function stringify(network: Network): string | undefined {
    if (network === 'none') {
      return undefined;
    }
    const { protocol, hostname, password, username, port } = network;
    try {
      const defaultUrl = new URL(
        `${protocol ? protocol : 'http'}://${hostname ? hostname : '_'}`
      );
      return Object.assign(defaultUrl, {
        protocol,
        hostname,
        password,
        username,
        port,
      }).toString();
    } catch {
      return undefined;
    }
  }

  export function sameAs(left: Network, right: Network): boolean {
    if (left === 'none') {
      return right === 'none';
    }
    if (right === 'none') {
      return false;
    }
    return (
      left.hostname === right.hostname &&
      left.password === right.password &&
      left.protocol === right.protocol &&
      left.username === right.username
    );
  }
}

export interface Config {
  readonly locale: string;
  readonly sketchDirUri: string;
  readonly dataDirUri: string;
  readonly downloadsDirUri: string;
  readonly additionalUrls: AdditionalUrls;
  readonly network: Network;
}
export namespace Config {
  export function sameAs(left: Config, right: Config): boolean {
    const leftUrls = left.additionalUrls.sort();
    const rightUrls = right.additionalUrls.sort();
    if (leftUrls.length !== rightUrls.length) {
      return false;
    }
    for (let i = 0; i < leftUrls.length; i++) {
      if (leftUrls[i] !== rightUrls[i]) {
        return false;
      }
    }
    return (
      left.locale === right.locale &&
      left.dataDirUri === right.dataDirUri &&
      left.downloadsDirUri === right.downloadsDirUri &&
      left.sketchDirUri === right.sketchDirUri &&
      Network.sameAs(left.network, right.network)
    );
  }
}
export type AdditionalUrls = string[];
export namespace AdditionalUrls {
  export function parse(value: string, delimiter: ',' | 'newline'): string[] {
    return value
      .trim()
      .split(delimiter === ',' ? delimiter : /\r?\n/)
      .map((url) => url.trim())
      .filter((url) => !!url);
  }
  export function stringify(additionalUrls: AdditionalUrls): string {
    return additionalUrls.join(',');
  }
  export function sameAs(left: AdditionalUrls, right: AdditionalUrls): boolean {
    if (left.length !== right.length) {
      return false;
    }
    const localeCompare = (left: string, right: string) =>
      left.localeCompare(right);
    const normalize = (url: string) => url.toLowerCase();
    const normalizedLeft = left.map(normalize).sort(localeCompare);
    const normalizedRight = right.map(normalize).sort(localeCompare);
    for (let i = 0; i < normalizedLeft.length; i++) {
      if (normalizedLeft[i] !== normalizedRight[i]) {
        return false;
      }
    }
    return true;
  }
}
