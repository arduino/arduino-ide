import { injectable } from '@theia/core/shared/inversify';
import * as monaco from '@theia/monaco-editor-core';
import { Contribution } from './contribution';

/**
 * Arduino-specific keywords and constants for syntax highlighting
 */
const ARDUINO_KEYWORDS = [
  // Setup and Loop
  'setup',
  'loop',
  
  // Digital I/O
  'pinMode',
  'digitalWrite',
  'digitalRead',
  
  // Analog I/O
  'analogReference',
  'analogRead',
  'analogWrite',
  
  // Advanced I/O
  'tone',
  'noTone',
  'shiftOut',
  'shiftIn',
  'pulseIn',
  
  // Time
  'millis',
  'micros',
  'delay',
  'delayMicroseconds',
  
  // Math
  'min',
  'max',
  'abs',
  'constrain',
  'map',
  'pow',
  'sqrt',
  
  // Trigonometry
  'sin',
  'cos',
  'tan',
  
  // Random Numbers
  'randomSeed',
  'random',
  
  // Bits and Bytes
  'lowByte',
  'highByte',
  'bitRead',
  'bitWrite',
  'bitSet',
  'bitClear',
  'bit',
  
  // External Interrupts
  'attachInterrupt',
  'detachInterrupt',
  
  // Interrupts
  'interrupts',
  'noInterrupts',
  
  // Communication
  'Serial',
  'Stream',
  'Print',
  
  // USB (for boards with native USB)
  'Keyboard',
  'Mouse',
  
  // EEPROM
  'EEPROM',
  
  // SPI
  'SPI',
  
  // Wire (I2C)
  'Wire',
  
  // Servo
  'Servo',
  
  // Stepper
  'Stepper',
];

/**
 * Arduino constants and types
 */
const ARDUINO_CONSTANTS = [
  // Pin modes
  'INPUT',
  'OUTPUT',
  'INPUT_PULLUP',
  
  // Logic levels
  'HIGH',
  'LOW',
  
  // Boolean
  'true',
  'false',
  
  // Data types
  'boolean',
  'byte',
  'word',
  'String',
  
  // Serial baud rates (common ones)
  'SERIAL_8N1',
  'SERIAL_5N1',
  'SERIAL_6N1',
  'SERIAL_7N1',
  'SERIAL_8N2',
  'SERIAL_8E1',
  'SERIAL_8E2',
  'SERIAL_8O1',
  'SERIAL_8O2',
];

/**
 * Arduino preprocessor directives and macros
 */
const ARDUINO_PREPROCESSOR = [
  'ARDUINO',
  'ARDUINO_ARCH_',
  'ARDUINO_BOARD',
  '__AVR__',
  '__AVR_ARCH__',
  'F_CPU',
  'PROGMEM',
];

/**
 * Creates a Monaco tokenizer for Arduino language
 * This extends C/C++ with Arduino-specific keywords
 */
function createArduinoTokenizer(): monaco.languages.IMonarchLanguage {
  return {
    // Start with C++ as base
    defaultToken: 'invalid',
    
    keywords: [
      // C/C++ keywords
      'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
      'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if',
      'int', 'long', 'register', 'return', 'short', 'signed', 'sizeof', 'static',
      'struct', 'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while',
      // C++ specific
      'class', 'private', 'protected', 'public', 'virtual', 'friend', 'inline', 'new',
      'delete', 'this', 'operator', 'template', 'namespace', 'using', 'try', 'catch',
      'throw', 'const_cast', 'dynamic_cast', 'reinterpret_cast', 'static_cast',
      'typeid', 'typename', 'explicit', 'mutable', 'asm', 'bool', 'export', 'wchar_t',
      // Arduino keywords
      ...ARDUINO_KEYWORDS,
      // Arduino constants (treated as keywords for highlighting)
      ...ARDUINO_CONSTANTS,
      // Arduino preprocessor macros
      ...ARDUINO_PREPROCESSOR,
    ],
    
    operators: [
      '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
      '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
      '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
      '%=', '<<=', '>>=', '>>>=',
    ],
    
    symbols: /[=><!~?:&|+\-*\/\^%]+/,
    
    // Escape sequences
    escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
    
    // Tokenizer rules
    tokenizer: {
      root: [
        // Identifiers and keywords (case-insensitive matching)
        [
          /[a-zA-Z_$][\w$]*/,
          {
            cases: {
              '@keywords': 'keyword',
              '@default': 'identifier',
            },
          },
        ],
        
        // Whitespace
        { include: '@whitespace' },
        
        // Delimiters and brackets
        [/[{}()\[\]]/, '@brackets'],
        [/[<>](?!@symbols)/, '@brackets'],
        [/@symbols/, { cases: { '@operators': 'operator', '@default': '' } }],
        
        // Numbers
        [/\d*\.\d+([eE][\-+]?\d+)?[fFdD]?/, 'number.float'],
        [/0[xX][0-9a-fA-F]+[Ll]?/, 'number.hex'],
        [/0[0-7]+[Ll]?/, 'number.octal'],
        [/\d+[lL]?/, 'number'],
        
        // Strings
        [/"([^"\\]|\\.)*$/, 'string.invalid'], // Non-terminated string
        [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
        
        // Characters
        [/'[^'\\]'/, 'string'],
        [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
        [/'/, 'string.invalid'],
      ],
      
      comment: [
        [/[^/*]+/, 'comment'],
        [/\/\*/, 'comment', '@push'], // Nested comment
        ['\\*/', 'comment', '@pop'],
        [/[/*]/, 'comment'],
      ],
      
      string: [
        [/[^\\"]+/, 'string'],
        [/@escapes/, 'string.escape'],
        [/\\./, 'string.escape.invalid'],
        [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
      ],
      
      whitespace: [
        [/[ \t\r\n]+/, 'white'],
        [/\/\*/, 'comment', '@comment'],
        [/\/\/.*$/, 'comment'],
      ],
    },
  };
}

/**
 * Language configuration for Arduino
 */
const arduinoLanguageConfiguration: monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/'],
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"', notIn: ['string'] },
    { open: "'", close: "'", notIn: ['string', 'comment'] },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  folding: {
    markers: {
      start: /^\s*#pragma\s+region\b/,
      end: /^\s*#pragma\s+endregion\b/,
    },
  },
};

/**
 * Contribution that registers Arduino syntax highlighting with Monaco Editor
 */
@injectable()
export class ArduinoSyntaxHighlighting extends Contribution {
  override onStart(): void {
    // Register the Arduino language
    monaco.languages.register({ id: 'arduino' });
    
    // Set the tokenizer (syntax highlighting rules)
    monaco.languages.setMonarchTokensProvider('arduino', createArduinoTokenizer());
    
    // Set language configuration (comments, brackets, etc.)
    monaco.languages.setLanguageConfiguration('arduino', arduinoLanguageConfiguration);
    
    // Also register 'ino' as an alias for Arduino
    monaco.languages.register({ id: 'ino', aliases: ['Arduino', 'arduino'] });
    monaco.languages.setMonarchTokensProvider('ino', createArduinoTokenizer());
    monaco.languages.setLanguageConfiguration('ino', arduinoLanguageConfiguration);
    
    // Register file associations
    monaco.languages.register({
      id: 'arduino',
      extensions: ['.ino', '.pde'],
      aliases: ['Arduino', 'arduino'],
    });
  }
}

