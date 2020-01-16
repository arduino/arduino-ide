import { ILogger, Loggable, LogLevel } from '@theia/core';

export class NullLogger implements ILogger {
    logLevel = 0;

    setLogLevel(logLevel: number): Promise<void> {
        this.logLevel = logLevel;
        return Promise.resolve();
    }
    getLogLevel(): Promise<number> {
        return Promise.resolve(this.logLevel);
    }
    isEnabled(logLevel: number): Promise<boolean> {
        return Promise.resolve(logLevel >= this.logLevel);
    }
    ifEnabled(logLevel: number): Promise<void> {
        if (logLevel >= this.logLevel)
            return Promise.resolve();
        else
            return Promise.reject();
    }
    log(logLevel: any, loggable: any, ...rest: any[]) {
        return Promise.resolve();
    }

    isTrace(): Promise<boolean> {
        return this.isEnabled(LogLevel.TRACE);
    }
    ifTrace(): Promise<void> {
        return this.ifEnabled(LogLevel.TRACE);
    }
    trace(arg: any | Loggable, ...params: any[]): Promise<void> {
        return this.log(LogLevel.TRACE, arg, ...params);
    }

    isDebug(): Promise<boolean> {
        return this.isEnabled(LogLevel.DEBUG);
    }
    ifDebug(): Promise<void> {
        return this.ifEnabled(LogLevel.DEBUG);
    }
    debug(arg: any | Loggable, ...params: any[]): Promise<void> {
        return this.log(LogLevel.DEBUG, arg, ...params);
    }

    isInfo(): Promise<boolean> {
        return this.isEnabled(LogLevel.INFO);
    }
    ifInfo(): Promise<void> {
        return this.ifEnabled(LogLevel.INFO);
    }
    info(arg: any | Loggable, ...params: any[]): Promise<void> {
        return this.log(LogLevel.INFO, arg, ...params);
    }

    isWarn(): Promise<boolean> {
        return this.isEnabled(LogLevel.WARN);
    }
    ifWarn(): Promise<void> {
        return this.ifEnabled(LogLevel.WARN);
    }
    warn(arg: any | Loggable, ...params: any[]): Promise<void> {
        return this.log(LogLevel.WARN, arg, ...params);
    }

    isError(): Promise<boolean> {
        return this.isEnabled(LogLevel.ERROR);
    }
    ifError(): Promise<void> {
        return this.ifEnabled(LogLevel.ERROR);
    }
    error(arg: any | Loggable, ...params: any[]): Promise<void> {
        return this.log(LogLevel.ERROR, arg, ...params);
    }

    isFatal(): Promise<boolean> {
        return this.isEnabled(LogLevel.FATAL);
    }
    ifFatal(): Promise<void> {
        return this.ifEnabled(LogLevel.FATAL);
    }
    fatal(arg: any | Loggable, ...params: any[]): Promise<void> {
        return this.log(LogLevel.FATAL, arg, ...params);
    }

    child(name: string): ILogger {
        return this;
    }
}
