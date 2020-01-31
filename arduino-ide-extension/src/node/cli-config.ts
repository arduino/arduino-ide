import { join } from 'path';
import { RecursivePartial } from '@theia/core/lib/common/types';

export const CLI_CONFIG = 'arduino-cli.yaml';
export const CLI_CONFIG_SCHEMA = 'arduino-cli.schema.json';
export const CLI_CONFIG_SCHEMA_PATH = join(__dirname, '..', '..', 'data', 'cli', 'schema', CLI_CONFIG_SCHEMA);

export interface BoardManager {
    readonly additional_urls: Array<string>;
}
export namespace BoardManager {
    export function sameAs(left: RecursivePartial<BoardManager> | undefined, right: RecursivePartial<BoardManager> | undefined): boolean {
        const leftOrDefault = left || {};
        const rightOrDefault = right || {};
        const leftUrls = Array.from(new Set(leftOrDefault.additional_urls || []));
        const rightUrls = Array.from(new Set(rightOrDefault.additional_urls || []));
        if (leftUrls.length !== rightUrls.length) {
            return false;
        }
        return leftUrls.every(url => rightUrls.indexOf(url) !== -1);
    }
}

export interface Daemon {
    readonly port: string | number;
}
export namespace Daemon {
    export function is(daemon: RecursivePartial<Daemon> | undefined): daemon is Daemon {
        return !!daemon && !!daemon.port;
    }
    export function sameAs(left: RecursivePartial<Daemon> | undefined, right: RecursivePartial<Daemon> | undefined): boolean {
        if (left === undefined) {
            return right === undefined;
        }
        if (right === undefined) {
            return left === undefined;
        }
        return String(left.port) === String(right.port);
    }
}

export interface Directories {
    readonly data: string;
    readonly downloads: string;
    readonly user: string;
}
export namespace Directories {
    export function is(directories: RecursivePartial<Directories> | undefined): directories is Directories {
        return !!directories
            && !!directories.data
            && !!directories.downloads
            && !!directories.user;
    }
    export function sameAs(left: RecursivePartial<Directories> | undefined, right: RecursivePartial<Directories> | undefined): boolean {
        if (left === undefined) {
            return right === undefined;
        }
        if (right === undefined) {
            return left === undefined;
        }
        return left.data === right.data
            && left.downloads === right.downloads
            && left.user === right.user;
    }
}

export interface Logging {
    file: string;
    format: Logging.Format;
    level: Logging.Level;
}
export namespace Logging {

    export type Format = 'text' | 'json';
    export type Level = 'trace' | 'debug' | 'info' | 'warning' | 'error' | 'fatal' | 'panic';

    export function sameAs(left: RecursivePartial<Logging> | undefined, right: RecursivePartial<Logging> | undefined): boolean {
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

// Arduino CLI config scheme
export interface CliConfig {
    board_manager?: RecursivePartial<BoardManager>;
    directories?: RecursivePartial<Directories>;
    logging?: RecursivePartial<Logging>;
}

// Bare minimum required CLI config.
export interface DefaultCliConfig extends CliConfig {
    directories: Directories;
    daemon: Daemon;
}
export namespace DefaultCliConfig {
    export function is(config: RecursivePartial<DefaultCliConfig> | undefined): config is DefaultCliConfig {
        return !!config
            && Directories.is(config.directories)
            && Daemon.is(config.daemon);
    }
    export function sameAs(left: DefaultCliConfig, right: DefaultCliConfig): boolean {
        return Directories.sameAs(left.directories, right.directories)
            && Daemon.sameAs(left.daemon, right.daemon)
            && BoardManager.sameAs(left.board_manager, right.board_manager)
            && Logging.sameAs(left.logging, right.logging);
    }
}
