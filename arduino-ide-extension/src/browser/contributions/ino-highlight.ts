import { inject, injectable } from '@theia/core/shared/inversify';
import * as monaco from '@theia/monaco-editor-core';
import { DEFAULT_WORD_REGEXP } from '@theia/monaco-editor-core/esm/vs/editor/common/core/wordHelper';
import { StandardTokenType } from '@theia/monaco-editor-core/esm/vs/editor/common/encodedTokenAttributes';
import { TokenizationTextModelPart } from '@theia/monaco-editor-core/esm/vs/editor/common/model/tokenizationTextModelPart';
import { ITokenizationTextModelPart } from '@theia/monaco-editor-core/esm/vs/editor/common/tokenizationTextModelPart';
import { SemanticTokensBuilder } from '@theia/plugin-ext/lib/plugin/types-impl';
import { HostedPluginSupport } from '../hosted/hosted-plugin-support';
import { InoSelector } from '../selectors';
import { SketchContribution } from './contribution';

interface TokenizationOwner {
  readonly tokenization: ITokenizationTextModelPart;
}

function hasTokenization(arg: unknown): arg is TokenizationOwner {
  return (
    typeof arg === 'object' &&
    arg !== null &&
    (<TokenizationOwner>arg).tokenization !== undefined &&
    (<TokenizationOwner>arg).tokenization instanceof TokenizationTextModelPart
  );
}

@injectable()
export class InoHighlight
  extends SketchContribution
  implements monaco.languages.DocumentSemanticTokensProvider
{
  @inject(HostedPluginSupport)
  private readonly hostedPluginSupport: HostedPluginSupport;

  private readonly _legend: monaco.languages.SemanticTokensLegend = {
    tokenModifiers: [],
    tokenTypes: vsCodeTokenTypeLiterals.slice(),
  };

  override onStart(): void {
    monaco.languages.registerDocumentSemanticTokensProvider(InoSelector, this);
  }

  getLegend(): monaco.languages.SemanticTokensLegend {
    return this._legend;
  }

  async provideDocumentSemanticTokens(
    model: monaco.editor.ITextModel,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
    lastResultId: string | null,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
    token: monaco.CancellationToken
  ): Promise<monaco.languages.SemanticTokens> {
    await this.hostedPluginSupport.didStart;
    const start = performance.now();
    const builder = new SemanticTokensBuilder();
    if (!hasTokenization(model)) {
      return builder.build();
    }
    const parsedTokens = getHighlightedTokens(model);
    for (const parsedToken of parsedTokens) {
      builder.push(
        parsedToken.line,
        parsedToken.startCharacter,
        parsedToken.length,
        vsCodeTokenIndex[parsedToken.tokenType]
      );
    }
    const tokens = builder.build();
    console.log(
      'provideDocumentSemanticTokens',
      performance.now() - start + 'ms',
      'lastResultId',
      lastResultId
    );
    return tokens;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  releaseDocumentSemanticTokens(lastResultId: string | undefined): void {
    console.log('releaseDocumentSemanticTokens', 'lastResultId', lastResultId);
    // NOOP
  }
}

interface IParsedToken {
  line: number;
  startCharacter: number;
  length: number;
  tokenType: VSCodeTokenType;
  tokenModifiers: string[];
}

const MAX_TOKENIZATION_LINE_LEN = 500; // If line is too long tokenization is skipped
function getHighlightedTokens(
  model: (monaco.editor.ITextModel & TokenizationOwner) | null
): IParsedToken[] {
  const result: IParsedToken[] = [];
  if (!model) {
    return result;
  }

  // For every word in every line, map its ranges for fast lookup
  for (
    let lineNumber = 1, len = model.getLineCount();
    lineNumber <= len;
    ++lineNumber
  ) {
    const lineLength = model.getLineLength(lineNumber);
    // If line is too long then skip the line
    if (lineLength > MAX_TOKENIZATION_LINE_LEN) {
      continue;
    }

    const lineContent = model.getLineContent(lineNumber);
    model.tokenization.resetTokenization();
    model.tokenization.forceTokenization(lineNumber);
    const lineTokens = model.tokenization.getLineTokens(lineNumber);
    for (
      let tokenIndex = 0, tokenCount = lineTokens.getCount();
      tokenIndex < tokenCount;
      tokenIndex++
    ) {
      const tokenType = lineTokens.getStandardTokenType(tokenIndex);

      // Token is a word and not a comment
      if (tokenType === StandardTokenType.Other) {
        // reset the stateful regex
        DEFAULT_WORD_REGEXP.lastIndex = 0; // We assume tokens will usually map 1:1 to words if they match

        const tokenStartOffset = lineTokens.getStartOffset(tokenIndex);
        const tokenEndOffset = lineTokens.getEndOffset(tokenIndex);
        const tokenStr = lineContent.substring(
          tokenStartOffset,
          tokenEndOffset
        );
        const wordMatch = DEFAULT_WORD_REGEXP.exec(tokenStr);

        if (wordMatch) {
          const word = wordMatch[0];
          const tokenType = getTokenType(word);
          if (tokenType) {
            result.push({
              line: lineNumber - 1, // map monaco 1 index to protocol 0 index
              startCharacter: tokenStartOffset + wordMatch.index,
              length: word.length,
              tokenModifiers: [],
              tokenType,
            });
          }
        }
      }
    }
  }

  return result;
}

const arduinoTokenTypeLiterals = [
  'type',
  'built_in',
  '_hints',
  'literal',
] as const;
type ArduinoTokenType = (typeof arduinoTokenTypeLiterals)[number];

// https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide#standard-token-types-and-modifiers
const vsCodeTokenTypeLiterals = ['type', 'event', 'label', 'macro'] as const;
type VSCodeTokenType = (typeof vsCodeTokenTypeLiterals)[number];
const vsCodeTokenIndex = vsCodeTokenTypeLiterals.reduce((acc, curr, index) => {
  acc[curr] = index;
  return acc;
}, {} as Record<VSCodeTokenType, number>);

const arduinoToVSCodeMappings: Record<ArduinoTokenType, VSCodeTokenType> = {
  _hints: 'event',
  type: 'type',
  built_in: 'type',
  literal: 'macro',
};

let _tokens: Map<string, ArduinoTokenType> | undefined;
function getTokenType(word: string): VSCodeTokenType | undefined {
  if (!_tokens) {
    const tokens = new Map();
    for (const [type, words] of Object.entries(arduinoKeywords)) {
      words.forEach((w) => tokens.set(w, type));
    }
    _tokens = tokens;
  }
  const token = _tokens.get(word);
  if (!token) {
    return undefined;
  }
  return arduinoToVSCodeMappings[token];
}

// Based on https://github.com/highlightjs/highlight.js/blob/6317acd780bfe448f75393ea42d53c0149013274/src/languages/arduino.js#L13-L378
const arduinoKeywords = {
  type: ['boolean', 'byte', 'word', 'String'],
  built_in: [
    'KeyboardController',
    'MouseController',
    'SoftwareSerial',
    'EthernetServer',
    'EthernetClient',
    'LiquidCrystal',
    'RobotControl',
    'GSMVoiceCall',
    'EthernetUDP',
    'EsploraTFT',
    'HttpClient',
    'RobotMotor',
    'WiFiClient',
    'GSMScanner',
    'FileSystem',
    'Scheduler',
    'GSMServer',
    'YunClient',
    'YunServer',
    'IPAddress',
    'GSMClient',
    'GSMModem',
    'Keyboard',
    'Ethernet',
    'Console',
    'GSMBand',
    'Esplora',
    'Stepper',
    'Process',
    'WiFiUDP',
    'GSM_SMS',
    'Mailbox',
    'USBHost',
    'Firmata',
    'PImage',
    'Client',
    'Server',
    'GSMPIN',
    'FileIO',
    'Bridge',
    'Serial',
    'EEPROM',
    'Stream',
    'Mouse',
    'Audio',
    'Servo',
    'File',
    'Task',
    'GPRS',
    'WiFi',
    'Wire',
    'TFT',
    'GSM',
    'SPI',
    'SD',
  ],
  _hints: [
    'setup',
    'loop',
    'runShellCommandAsynchronously',
    'analogWriteResolution',
    'retrieveCallingNumber',
    'printFirmwareVersion',
    'analogReadResolution',
    'sendDigitalPortPair',
    'noListenOnLocalhost',
    'readJoystickButton',
    'setFirmwareVersion',
    'readJoystickSwitch',
    'scrollDisplayRight',
    'getVoiceCallStatus',
    'scrollDisplayLeft',
    'writeMicroseconds',
    'delayMicroseconds',
    'beginTransmission',
    'getSignalStrength',
    'runAsynchronously',
    'getAsynchronously',
    'listenOnLocalhost',
    'getCurrentCarrier',
    'readAccelerometer',
    'messageAvailable',
    'sendDigitalPorts',
    'lineFollowConfig',
    'countryNameWrite',
    'runShellCommand',
    'readStringUntil',
    'rewindDirectory',
    'readTemperature',
    'setClockDivider',
    'readLightSensor',
    'endTransmission',
    'analogReference',
    'detachInterrupt',
    'countryNameRead',
    'attachInterrupt',
    'encryptionType',
    'readBytesUntil',
    'robotNameWrite',
    'readMicrophone',
    'robotNameRead',
    'cityNameWrite',
    'userNameWrite',
    'readJoystickY',
    'readJoystickX',
    'mouseReleased',
    'openNextFile',
    'scanNetworks',
    'noInterrupts',
    'digitalWrite',
    'beginSpeaker',
    'mousePressed',
    'isActionDone',
    'mouseDragged',
    'displayLogos',
    'noAutoscroll',
    'addParameter',
    'remoteNumber',
    'getModifiers',
    'keyboardRead',
    'userNameRead',
    'waitContinue',
    'processInput',
    'parseCommand',
    'printVersion',
    'readNetworks',
    'writeMessage',
    'blinkVersion',
    'cityNameRead',
    'readMessage',
    'setDataMode',
    'parsePacket',
    'isListening',
    'setBitOrder',
    'beginPacket',
    'isDirectory',
    'motorsWrite',
    'drawCompass',
    'digitalRead',
    'clearScreen',
    'serialEvent',
    'rightToLeft',
    'setTextSize',
    'leftToRight',
    'requestFrom',
    'keyReleased',
    'compassRead',
    'analogWrite',
    'interrupts',
    'WiFiServer',
    'disconnect',
    'playMelody',
    'parseFloat',
    'autoscroll',
    'getPINUsed',
    'setPINUsed',
    'setTimeout',
    'sendAnalog',
    'readSlider',
    'analogRead',
    'beginWrite',
    'createChar',
    'motorsStop',
    'keyPressed',
    'tempoWrite',
    'readButton',
    'subnetMask',
    'debugPrint',
    'macAddress',
    'writeGreen',
    'randomSeed',
    'attachGPRS',
    'readString',
    'sendString',
    'remotePort',
    'releaseAll',
    'mouseMoved',
    'background',
    'getXChange',
    'getYChange',
    'answerCall',
    'getResult',
    'voiceCall',
    'endPacket',
    'constrain',
    'getSocket',
    'writeJSON',
    'getButton',
    'available',
    'connected',
    'findUntil',
    'readBytes',
    'exitValue',
    'readGreen',
    'writeBlue',
    'startLoop',
    'IPAddress',
    'isPressed',
    'sendSysex',
    'pauseMode',
    'gatewayIP',
    'setCursor',
    'getOemKey',
    'tuneWrite',
    'noDisplay',
    'loadImage',
    'switchPIN',
    'onRequest',
    'onReceive',
    'changePIN',
    'playFile',
    'noBuffer',
    'parseInt',
    'overflow',
    'checkPIN',
    'knobRead',
    'beginTFT',
    'bitClear',
    'updateIR',
    'bitWrite',
    'position',
    'writeRGB',
    'highByte',
    'writeRed',
    'setSpeed',
    'readBlue',
    'noStroke',
    'remoteIP',
    'transfer',
    'shutdown',
    'hangCall',
    'beginSMS',
    'endWrite',
    'attached',
    'maintain',
    'noCursor',
    'checkReg',
    'checkPUK',
    'shiftOut',
    'isValid',
    'shiftIn',
    'pulseIn',
    'connect',
    'println',
    'localIP',
    'pinMode',
    'getIMEI',
    'display',
    'noBlink',
    'process',
    'getBand',
    'running',
    'beginSD',
    'drawBMP',
    'lowByte',
    'setBand',
    'release',
    'bitRead',
    'prepare',
    'pointTo',
    'readRed',
    'setMode',
    'noFill',
    'remove',
    'listen',
    'stroke',
    'detach',
    'attach',
    'noTone',
    'exists',
    'buffer',
    'height',
    'bitSet',
    'circle',
    'config',
    'cursor',
    'random',
    'IRread',
    'setDNS',
    'endSMS',
    'getKey',
    'micros',
    'millis',
    'begin',
    'print',
    'write',
    'ready',
    'flush',
    'width',
    'isPIN',
    'blink',
    'clear',
    'press',
    'mkdir',
    'rmdir',
    'close',
    'point',
    'yield',
    'image',
    'BSSID',
    'click',
    'delay',
    'read',
    'text',
    'move',
    'peek',
    'beep',
    'rect',
    'line',
    'open',
    'seek',
    'fill',
    'size',
    'turn',
    'stop',
    'home',
    'find',
    'step',
    'tone',
    'sqrt',
    'RSSI',
    'SSID',
    'end',
    'bit',
    'tan',
    'cos',
    'sin',
    'pow',
    'map',
    'abs',
    'max',
    'min',
    'get',
    'run',
    'put',
  ],
  literal: [
    'DIGITAL_MESSAGE',
    'FIRMATA_STRING',
    'ANALOG_MESSAGE',
    'REPORT_DIGITAL',
    'REPORT_ANALOG',
    'INPUT_PULLUP',
    'SET_PIN_MODE',
    'INTERNAL2V56',
    'SYSTEM_RESET',
    'LED_BUILTIN',
    'INTERNAL1V1',
    'SYSEX_START',
    'INTERNAL',
    'EXTERNAL',
    'DEFAULT',
    'OUTPUT',
    'INPUT',
    'HIGH',
    'LOW',
  ],
} as const;
