import * as process from 'process';
import { logger } from 'vscode-debugadapter/lib/logger';
import { ArduinoDebugSession } from './arduino-debug-session';
import { DebugSession } from 'vscode-debugadapter';

process.on('uncaughtException', (err: any) => {
    logger.error(JSON.stringify(err));
});

DebugSession.run(ArduinoDebugSession);
