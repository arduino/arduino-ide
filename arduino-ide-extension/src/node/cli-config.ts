import { RecursivePartial } from '@theia/core/lib/common/types';
import { AdditionalUrls } from '../common/protocol';

export const CLI_CONFIG = 'arduino-cli.yaml';

export interface BoardManager {
  readonly additional_urls: AdditionalUrls;
}
export namespace BoardManager {
  export function sameAs(
    left: RecursivePartial<BoardManager> | undefined,
    right: RecursivePartial<BoardManager> | undefined
  ): boolean {
    const leftUrls = left?.additional_urls ?? [];
    const rightUrls = right?.additional_urls ?? [];
    return AdditionalUrls.sameAs(leftUrls, rightUrls);
  }
}

export interface Directories {
  readonly data: string;
  readonly user: string;
}
export namespace Directories {
  export function is(
    directories: RecursivePartial<Directories> | undefined
  ): directories is Directories {
    return !!directories && !!directories.data && !!directories.user;
  }
  export function sameAs(
    left: RecursivePartial<Directories> | undefined,
    right: RecursivePartial<Directories> | undefined
  ): boolean {
    if (left === undefined) {
      return right === undefined;
    }
    if (right === undefined) {
      return left === undefined;
    }
    return left.data === right.data && left.user === right.user;
  }
}

export interface Logging {
  file: string;
  format: Logging.Format;
  level: Logging.Level;
}
export namespace Logging {
  export type Format = 'text' | 'json';
  export type Level =
    | 'trace'
    | 'debug'
    | 'info'
    | 'warning'
    | 'error'
    | 'fatal'
    | 'panic';

  export function sameAs(
    left: RecursivePartial<Logging> | undefined,
    right: RecursivePartial<Logging> | undefined
  ): boolean {
    if (left === undefined) {
      return right === undefined;
    }
    if (right === undefined) {
      return left === undefined;
    }
    if (left.file !== right.file) {
      return false;
    }
    if (left.format !== right.format) {
      return false;
    }
    if (left.level !== right.level) {
      return false;
    }
    return true;
  }
}

export interface Network {
  proxy?: string;
}

// Arduino CLI config scheme
export interface CliConfig {
  locale?: string;
  board_manager?: RecursivePartial<BoardManager>;
  directories?: RecursivePartial<Directories>;
  logging?: RecursivePartial<Logging>;
  network?: RecursivePartial<Network>;
}

// Bare minimum required CLI config.
export interface DefaultCliConfig extends CliConfig {
  directories: Directories;
}
export namespace DefaultCliConfig {
  export function is(
    config: RecursivePartial<DefaultCliConfig> | undefined
  ): config is DefaultCliConfig {
    return !!config && Directories.is(config.directories);
  }
  export function sameAs(
    left: DefaultCliConfig,
    right: DefaultCliConfig
  ): boolean {
    return (
      Directories.sameAs(left.directories, right.directories) &&
      BoardManager.sameAs(left.board_manager, right.board_manager) &&
      Logging.sameAs(left.logging, right.logging)
    );
  }
}
