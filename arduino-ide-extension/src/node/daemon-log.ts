import { ILogger, LogLevel } from '@theia/core/lib/common/logger';

export interface DaemonLog {
    readonly time: string;
    readonly level: DaemonLog.Level;
    readonly msg: string;
}

export namespace DaemonLog {

    export interface Url {
        readonly Scheme: string;
        readonly Host: string;
        readonly Path: string;
    }

    export namespace Url {

        export function is(arg: any | undefined): arg is Url {
            return !!arg
                && typeof arg.Scheme === 'string'
                && typeof arg.Host === 'string'
                && typeof arg.Path === 'string';
        }

        export function toString(url: Url): string {
            const { Scheme, Host, Path } = url;
            return `${Scheme}://${Host}${Path}`;
        }

    }

    export interface System {
        readonly os: string;
        // readonly Resource: Resource;
    }

    export namespace System {
        export function toString(system: System): string {
            return `OS: ${system.os}`
        }
    }

    export interface Tool {
        readonly version: string;
        readonly systems: System[];
    }

    export namespace Tool {

        export function is(arg: any | undefined): arg is Tool {
            return !!arg && typeof arg.version === 'string' && 'systems' in arg;
        }

        export function toString(tool: Tool): string {
            const { version, systems } = tool;
            return `Version: ${version}${!!systems ? ` Systems: [${tool.systems.map(System.toString).join(', ')}]` : ''}`;
        }

    }

    export type Level = 'trace' | 'debug' | 'info' | 'warning' | 'error';

    export function is(arg: any | undefined): arg is DaemonLog {
        return !!arg
            && typeof arg.time === 'string'
            && typeof arg.level === 'string'
            && typeof arg.msg === 'string'
    }

    export function toLogLevel(log: DaemonLog): LogLevel {
        const { level } = log;
        switch (level) {
            case 'trace': return LogLevel.TRACE;
            case 'debug': return LogLevel.DEBUG;
            case 'info': return LogLevel.INFO;
            case 'warning': return LogLevel.WARN;
            case 'error': return LogLevel.ERROR;
            default: return LogLevel.INFO;
        }
    }

    export function log(logger: ILogger, logMessages: string): void {
        const parsed = parse(logMessages);
        for (const log of parsed) {
            const logLevel = toLogLevel(log);
            const message = toMessage(log, { omitLogLevel: true });
            logger.log(logLevel, message);
        }
    }

    function parse(toLog: string): DaemonLog[] {
        const messages = toLog.trim().split('\n');
        const result: DaemonLog[] = [];
        for (let i = 0; i < messages.length; i++) {
            try {
                const maybeDaemonLog = JSON.parse(messages[i]);
                if (DaemonLog.is(maybeDaemonLog)) {
                    result.push(maybeDaemonLog);
                    continue;
                }
            } catch { /* NOOP */ }
            result.push({
                time: new Date().toString(),
                level: 'info',
                msg: messages[i]
            });
        }
        return result;
    }

    export function toPrettyString(logMessages: string): string {
        const parsed = parse(logMessages);
        return parsed.map(log => toMessage(log)).join('\n') + '\n';
    }

    function toMessage(log: DaemonLog, options: { omitLogLevel: boolean } = { omitLogLevel: false }): string {
        const details = Object.keys(log).filter(key => key !== 'msg' && key !== 'level' && key !== 'time').map(key => toDetails(log, key)).join(', ');
        const logLevel = options.omitLogLevel ? '' : `[${log.level.toUpperCase()}] `;
        return `${logLevel}${log.msg}${!!details ? ` [${details}]` : ''}`
    }

    function toDetails(log: DaemonLog, key: string): string {
        let value = (log as any)[key];
        if (DaemonLog.Url.is(value)) {
            value = DaemonLog.Url.toString(value);
        } else if (DaemonLog.Tool.is(value)) {
            value = DaemonLog.Tool.toString(value);
        } else if (typeof value === 'object') {
            value = JSON.stringify(value).replace(/\"([^(\")"]+)\":/g, '$1:'); // Remove the quotes from the property keys.
        }
        return `${key.toLowerCase()}: ${value}`;
    }

}
