import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { MaybePromise } from '@theia/core/lib/common/types';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { constants, promises as fs } from 'fs';
import { join } from 'path';
import { ConfigService } from '../common/protocol';
import { Formatter, FormatterOptions } from '../common/protocol/formatter';
import { getExecPath, spawnCommand } from './exec-util';

@injectable()
export class ClangFormatter implements Formatter {
  @inject(ConfigService)
  private readonly configService: ConfigService;

  @inject(EnvVariablesServer)
  private readonly envVariableServer: EnvVariablesServer;

  async format({
    content,
    formatterConfigFolderUris,
    options,
  }: {
    content: string;
    formatterConfigFolderUris: string[];
    options?: FormatterOptions;
  }): Promise<string> {
    const [execPath, style] = await Promise.all([
      this.execPath(),
      this.style(formatterConfigFolderUris, options),
    ]);
    const formatted = await spawnCommand(
      `"${execPath}"`,
      [style],
      console.error,
      content
    );
    return formatted;
  }

  private _execPath: string | undefined;
  private async execPath(): Promise<string> {
    if (this._execPath) {
      return this._execPath;
    }
    this._execPath = await getExecPath('clang-format');
    return this._execPath;
  }

  /**
   * Calculates the `-style` flag for the formatter. Uses a `.clang-format` file if exists.
   * Otherwise, falls back to the default config.
   *
   * Style precedence:
   *  1. in the sketch folder,
   *  1. `~/.arduinoIDE/.clang-format`,
   *  1. `directories#data/.clang-format`, and
   *  1. default style flag as a string.
   *
   * See: https://github.com/arduino/arduino-ide/issues/566
   */
  private async style(
    formatterConfigFolderUris: string[],
    options?: FormatterOptions
  ): Promise<string> {
    const clangFormatPaths = await Promise.all([
      ...formatterConfigFolderUris.map((uri) => this.clangConfigPath(uri)),
      this.clangConfigPath(this.configDirPath()),
      this.clangConfigPath(this.dataDirPath()),
    ]);
    const first = clangFormatPaths.filter(Boolean).shift();
    if (first) {
      console.debug(
        `Using ${ClangFormatFile} style configuration from '${first}'.`
      );
      return `-style=file:"${first}"`;
    }
    return `-style="${style(toClangOptions(options))}"`;
  }

  private async dataDirPath(): Promise<string> {
    const { dataDirUri } = await this.configService.getConfiguration();
    return FileUri.fsPath(dataDirUri);
  }

  private async configDirPath(): Promise<string> {
    const configDirUri = await this.envVariableServer.getConfigDirUri();
    return FileUri.fsPath(configDirUri);
  }

  private async clangConfigPath(
    folderUri: MaybePromise<string>
  ): Promise<string | undefined> {
    const folderPath = FileUri.fsPath(await folderUri);
    const clangFormatPath = join(folderPath, ClangFormatFile);
    try {
      await fs.access(clangFormatPath, constants.R_OK);
      return clangFormatPath;
    } catch {
      return undefined;
    }
  }
}

interface ClangFormatOptions {
  readonly UseTab: 'Never' | 'ForIndentation';
  readonly TabWidth: number;
}

const ClangFormatFile = '.clang-format';

function toClangOptions(
  options?: FormatterOptions | undefined
): ClangFormatOptions {
  if (!!options) {
    return {
      UseTab: options.insertSpaces ? 'Never' : 'ForIndentation',
      TabWidth: options.tabSize,
    };
  }
  return { UseTab: 'Never', TabWidth: 2 };
}

// See: https://releases.llvm.org/11.0.1/tools/clang/docs/ClangFormatStyleOptions.html
export function style({ TabWidth, UseTab }: ClangFormatOptions): string {
  return JSON.stringify(styleJson({ TabWidth, UseTab })).replace(
    /[\\"]/g,
    '\\$&'
  );
}

function styleJson({
  TabWidth,
  UseTab,
}: ClangFormatOptions): Record<string, unknown> {
  return {
    Language: 'Cpp',
    // # LLVM is the default style setting, used when a configuration option is not set here
    BasedOnStyle: 'LLVM',
    AccessModifierOffset: -2,
    AlignAfterOpenBracket: 'Align',
    AlignConsecutiveAssignments: false,
    AlignConsecutiveBitFields: false,
    AlignConsecutiveDeclarations: false,
    AlignConsecutiveMacros: false,
    AlignEscapedNewlines: 'DontAlign',
    AlignOperands: 'Align',
    AlignTrailingComments: true,
    AllowAllArgumentsOnNextLine: true,
    AllowAllConstructorInitializersOnNextLine: true,
    AllowAllParametersOfDeclarationOnNextLine: true,
    AllowShortBlocksOnASingleLine: 'Always',
    AllowShortCaseLabelsOnASingleLine: true,
    AllowShortEnumsOnASingleLine: true,
    AllowShortFunctionsOnASingleLine: 'Empty',
    AllowShortIfStatementsOnASingleLine: 'Always',
    AllowShortLambdasOnASingleLine: 'Empty',
    AllowShortLoopsOnASingleLine: true,
    AlwaysBreakAfterDefinitionReturnType: 'None',
    AlwaysBreakAfterReturnType: 'None',
    AlwaysBreakBeforeMultilineStrings: false,
    AlwaysBreakTemplateDeclarations: 'No',
    BinPackArguments: true,
    BinPackParameters: true,
    // # Only used when "BreakBeforeBraces" set to "Custom"
    BraceWrapping: {
      AfterCaseLabel: false,
      AfterClass: false,
      AfterControlStatement: 'Never',
      AfterEnum: false,
      AfterFunction: false,
      AfterNamespace: false,
      // #AfterObjCDeclaration:
      AfterStruct: false,
      AfterUnion: false,
      AfterExternBlock: false,
      BeforeCatch: false,
      BeforeElse: false,
      BeforeLambdaBody: false,
      BeforeWhile: false,
      IndentBraces: false,
      SplitEmptyFunction: false,
      SplitEmptyRecord: false,
      SplitEmptyNamespace: false,
    },
    // # Java-specific
    // #BreakAfterJavaFieldAnnotations:
    BreakBeforeBinaryOperators: 'NonAssignment',
    BreakBeforeBraces: 'Attach',
    BreakBeforeTernaryOperators: true,
    BreakConstructorInitializers: 'BeforeColon',
    BreakInheritanceList: 'BeforeColon',
    BreakStringLiterals: false,
    ColumnLimit: 0,
    // # "" matches none
    CommentPragmas: '',
    CompactNamespaces: false,
    ConstructorInitializerAllOnOneLineOrOnePerLine: true,
    ConstructorInitializerIndentWidth: 2,
    ContinuationIndentWidth: 2,
    Cpp11BracedListStyle: false,
    DeriveLineEnding: true,
    DerivePointerAlignment: true,
    DisableFormat: false,
    // # Docs say "Do not use this in config files". The default (LLVM 11.0.1) is "false".
    // #ExperimentalAutoDetectBinPacking:
    FixNamespaceComments: false,
    ForEachMacros: [],
    IncludeBlocks: 'Preserve',
    IncludeCategories: [],
    // # "" matches none
    IncludeIsMainRegex: '',
    IncludeIsMainSourceRegex: '',
    IndentCaseBlocks: true,
    IndentCaseLabels: true,
    IndentExternBlock: 'Indent',
    IndentGotoLabels: false,
    IndentPPDirectives: 'None',
    IndentWidth: 2,
    IndentWrappedFunctionNames: false,
    InsertTrailingCommas: 'None',
    // # Java-specific
    // #JavaImportGroups:
    // # JavaScript-specific
    // #JavaScriptQuotes:
    // #JavaScriptWrapImports
    KeepEmptyLinesAtTheStartOfBlocks: true,
    MacroBlockBegin: '',
    MacroBlockEnd: '',
    // # Set to a large number to effectively disable
    MaxEmptyLinesToKeep: 100000,
    NamespaceIndentation: 'None',
    NamespaceMacros: [],
    // # Objective C-specific
    // #ObjCBinPackProtocolList:
    // #ObjCBlockIndentWidth:
    // #ObjCBreakBeforeNestedBlockParam:
    // #ObjCSpaceAfterProperty:
    // #ObjCSpaceBeforeProtocolList
    PenaltyBreakAssignment: 1,
    PenaltyBreakBeforeFirstCallParameter: 1,
    PenaltyBreakComment: 1,
    PenaltyBreakFirstLessLess: 1,
    PenaltyBreakString: 1,
    PenaltyBreakTemplateDeclaration: 1,
    PenaltyExcessCharacter: 1,
    PenaltyReturnTypeOnItsOwnLine: 1,
    // # Used as a fallback if alignment style can't be detected from code (DerivePointerAlignment: true)
    PointerAlignment: 'Right',
    RawStringFormats: [],
    ReflowComments: false,
    SortIncludes: false,
    SortUsingDeclarations: false,
    SpaceAfterCStyleCast: false,
    SpaceAfterLogicalNot: false,
    SpaceAfterTemplateKeyword: false,
    SpaceBeforeAssignmentOperators: true,
    SpaceBeforeCpp11BracedList: false,
    SpaceBeforeCtorInitializerColon: true,
    SpaceBeforeInheritanceColon: true,
    SpaceBeforeParens: 'ControlStatements',
    SpaceBeforeRangeBasedForLoopColon: true,
    SpaceBeforeSquareBrackets: false,
    SpaceInEmptyBlock: false,
    SpaceInEmptyParentheses: false,
    SpacesBeforeTrailingComments: 2,
    SpacesInAngles: false,
    SpacesInCStyleCastParentheses: false,
    SpacesInConditionalStatement: false,
    SpacesInContainerLiterals: false,
    SpacesInParentheses: false,
    SpacesInSquareBrackets: false,
    Standard: 'Auto',
    StatementMacros: [],
    TabWidth,
    TypenameMacros: [],
    // # Default to LF if line endings can't be detected from the content (DeriveLineEnding).
    UseCRLF: false,
    UseTab,
    WhitespaceSensitiveMacros: [],
  };
}
