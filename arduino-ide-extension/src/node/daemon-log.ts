import { ILogger, LogLevel } from '@theia/core/lib/common/logger';

export interface DaemonLog {
    readonly time: string;
    readonly level: DaemonLog.Level;
    readonly msg: string;
}

export namespace DaemonLog {

    export type Level = 'info' | 'debug' | 'warning' | 'error';

    export function is(arg: any | undefined): arg is DaemonLog {
        return !!arg
            && typeof arg.time === 'string'
            && typeof arg.level === 'string'
            && typeof arg.msg === 'string'
    }

    export function toLogLevel(log: DaemonLog): LogLevel {
        const { level } = log;
        switch (level) {
            case 'info': return LogLevel.INFO;
            case 'debug': return LogLevel.DEBUG;
            case 'error': return LogLevel.ERROR;
            case 'warning': return LogLevel.WARN;
            default: return LogLevel.INFO;
        }
    }

    export function log(logger: ILogger, toLog: string): void {
        const segments = toLog.split('time').filter(s => s.trim().length > 0);
        for (const segment of segments) {
            const maybeDaemonLog = parse(`time${segment}`.trim());
            if (is(maybeDaemonLog)) {
                const { msg } = maybeDaemonLog;
                logger.log(toLogLevel(maybeDaemonLog), msg);
            } else {
                logger.info(toLog.trim());
            }
        }
    }

    // Super naive.
    function parse(toLog: string): string | DaemonLog {
        const rawSegments = toLog.split(/(\s+)/)
            .map(segment => segment.replace(/['"]+/g, ''))
            .map(segment => segment.trim())
            .filter(segment => segment.length > 0);

        const timeIndex = rawSegments.findIndex(segment => segment.startsWith('time='));
        const levelIndex = rawSegments.findIndex(segment => segment.startsWith('level='));
        const msgIndex = rawSegments.findIndex(segment => segment.startsWith('msg='));
        if (rawSegments.length > 2
            && timeIndex !== -1
            && levelIndex !== -1
            && msgIndex !== -1) {
            return {
                time: rawSegments[timeIndex].split('=')[1],
                level: rawSegments[levelIndex].split('=')[1] as Level,
                msg: [rawSegments[msgIndex].split('=')[1], ...rawSegments.slice(msgIndex + 1)].join(' ')
            }
        }
        // Otherwise, log the string as is.
        return toLog;
    }
}