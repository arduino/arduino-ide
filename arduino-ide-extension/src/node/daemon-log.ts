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
            for (const logMsg of maybeDaemonLog) {
                logger.log(toLogLevel(logMsg), logMsg.msg);
            }
        }
    }

    // Super naive.
    function parse(toLog: string): DaemonLog[] {
        const messages = toLog.split('\ntime=');
        const result: DaemonLog[] = [];
        for (let i = 0; i < messages.length; i++) {
          const msg = (i > 0 ? 'time=' : '') + messages[i];
          const rawSegments = msg.split(/(\s+)/)
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
              result.push({
                  time: rawSegments[timeIndex].split('=')[1],
                  level: rawSegments[levelIndex].split('=')[1] as Level,
                  msg: [rawSegments[msgIndex].split('=')[1], ...rawSegments.slice(msgIndex + 1)].join(' ')
              });
          } else {
            result.push({
              time: new Date().toString(),
              level: 'info',
              msg: msg
            });
          }
        }
        // Otherwise, log the string as is.
        return result;
    }

    export function toPrettyString(logMessage: string): string {
      const parsed = parse(logMessage);
      return parsed.map(msg => `[${msg.level.toUpperCase() || 'INFO'}] ${msg.msg}\n`).join('');
    }
}