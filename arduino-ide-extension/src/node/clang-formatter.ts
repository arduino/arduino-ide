import * as os from 'os';
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

export function style({ TabWidth, UseTab }: ClangFormatOptions): string {
  let styleArgument = JSON.stringify(styleJson({ TabWidth, UseTab })).replace(
    /[\\"]/g,
    '\\$&'
  );
  if (os.platform() === 'win32') {
    // Windows command interpreter does not use backslash escapes. This causes the argument to have alternate quoted and
    // unquoted sections.
    // Special characters in the unquoted sections must be caret escaped.
    const styleArgumentSplit = styleArgument.split('"');
    for (let i = 1; i < styleArgumentSplit.length; i += 2) {
      styleArgumentSplit[i] = styleArgumentSplit[i].replace(/[<>^|]/g, '^$&');
    }

    styleArgument = styleArgumentSplit.join('"');
  }

  return styleArgument;
}

function styleJson({
  TabWidth,
  UseTab,
}: ClangFormatOptions): Record<string, unknown> {
  // Source: https://github.com/arduino/tooling-project-assets/tree/main/other/clang-format-configuration
  return {
    AccessModifierOffset: -2,
    AlignAfterOpenBracket: 'Align',
    AlignArrayOfStructures: 'None',
    AlignConsecutiveAssignments: 'None',
    AlignConsecutiveBitFields: 'None',
    AlignConsecutiveDeclarations: 'None',
    AlignConsecutiveMacros: 'None',
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
    AllowShortIfStatementsOnASingleLine: 'AllIfsAndElse',
    AllowShortLambdasOnASingleLine: 'Empty',
    AllowShortLoopsOnASingleLine: true,
    AlwaysBreakAfterDefinitionReturnType: 'None',
    AlwaysBreakAfterReturnType: 'None',
    AlwaysBreakBeforeMultilineStrings: false,
    AlwaysBreakTemplateDeclarations: 'No',
    AttributeMacros: ['__capability'],
    BasedOnStyle: 'LLVM',
    BinPackArguments: true,
    BinPackParameters: true,
    BitFieldColonSpacing: 'Both',
    BraceWrapping: {
      AfterCaseLabel: false,
      AfterClass: false,
      AfterControlStatement: 'Never',
      AfterEnum: false,
      AfterFunction: false,
      AfterNamespace: false,
      AfterObjCDeclaration: false,
      AfterStruct: false,
      AfterUnion: false,
      AfterExternBlock: false,
      BeforeCatch: false,
      BeforeElse: false,
      BeforeLambdaBody: false,
      BeforeWhile: false,
      IndentBraces: false,
      SplitEmptyFunction: true,
      SplitEmptyRecord: true,
      SplitEmptyNamespace: true,
    },
    BreakAfterJavaFieldAnnotations: false,
    BreakBeforeBinaryOperators: 'NonAssignment',
    BreakBeforeBraces: 'Attach',
    BreakBeforeConceptDeclarations: false,
    BreakBeforeInheritanceComma: false,
    BreakBeforeTernaryOperators: true,
    BreakConstructorInitializers: 'BeforeColon',
    BreakConstructorInitializersBeforeComma: false,
    BreakInheritanceList: 'BeforeColon',
    BreakStringLiterals: false,
    ColumnLimit: 0,
    CommentPragmas: '',
    CompactNamespaces: false,
    ConstructorInitializerAllOnOneLineOrOnePerLine: false,
    ConstructorInitializerIndentWidth: 2,
    ContinuationIndentWidth: 2,
    Cpp11BracedListStyle: false,
    DeriveLineEnding: true,
    DerivePointerAlignment: true,
    DisableFormat: false,
    EmptyLineAfterAccessModifier: 'Leave',
    EmptyLineBeforeAccessModifier: 'Leave',
    ExperimentalAutoDetectBinPacking: false,
    FixNamespaceComments: false,
    ForEachMacros: ['foreach', 'Q_FOREACH', 'BOOST_FOREACH'],
    IfMacros: ['KJ_IF_MAYBE'],
    IncludeBlocks: 'Preserve',
    IncludeCategories: [
      {
        Regex: '^"(llvm|llvm-c|clang|clang-c)/',
        Priority: 2,
        SortPriority: 0,
        CaseSensitive: false,
      },
      {
        Regex: '^(<|"(gtest|gmock|isl|json)/)',
        Priority: 3,
        SortPriority: 0,
        CaseSensitive: false,
      },
      { Regex: '.*', Priority: 1, SortPriority: 0, CaseSensitive: false },
    ],
    IncludeIsMainRegex: '',
    IncludeIsMainSourceRegex: '',
    IndentAccessModifiers: false,
    IndentCaseBlocks: true,
    IndentCaseLabels: true,
    IndentExternBlock: 'Indent',
    IndentGotoLabels: false,
    IndentPPDirectives: 'None',
    IndentRequires: true,
    IndentWidth: 2,
    IndentWrappedFunctionNames: false,
    InsertTrailingCommas: 'None',
    JavaScriptQuotes: 'Leave',
    JavaScriptWrapImports: true,
    KeepEmptyLinesAtTheStartOfBlocks: true,
    LambdaBodyIndentation: 'Signature',
    Language: 'Cpp',
    MacroBlockBegin: '',
    MacroBlockEnd: '',
    MaxEmptyLinesToKeep: 100000,
    NamespaceIndentation: 'None',
    ObjCBinPackProtocolList: 'Auto',
    ObjCBlockIndentWidth: 2,
    ObjCBreakBeforeNestedBlockParam: true,
    ObjCSpaceAfterProperty: false,
    ObjCSpaceBeforeProtocolList: true,
    PPIndentWidth: -1,
    PackConstructorInitializers: 'BinPack',
    PenaltyBreakAssignment: 1,
    PenaltyBreakBeforeFirstCallParameter: 1,
    PenaltyBreakComment: 1,
    PenaltyBreakFirstLessLess: 1,
    PenaltyBreakOpenParenthesis: 1,
    PenaltyBreakString: 1,
    PenaltyBreakTemplateDeclaration: 1,
    PenaltyExcessCharacter: 1,
    PenaltyIndentedWhitespace: 1,
    PenaltyReturnTypeOnItsOwnLine: 1,
    PointerAlignment: 'Right',
    QualifierAlignment: 'Leave',
    ReferenceAlignment: 'Pointer',
    ReflowComments: false,
    RemoveBracesLLVM: false,
    SeparateDefinitionBlocks: 'Leave',
    ShortNamespaceLines: 0,
    SortIncludes: 'Never',
    SortJavaStaticImport: 'Before',
    SortUsingDeclarations: false,
    SpaceAfterCStyleCast: false,
    SpaceAfterLogicalNot: false,
    SpaceAfterTemplateKeyword: false,
    SpaceAroundPointerQualifiers: 'Default',
    SpaceBeforeAssignmentOperators: true,
    SpaceBeforeCaseColon: false,
    SpaceBeforeCpp11BracedList: false,
    SpaceBeforeCtorInitializerColon: true,
    SpaceBeforeInheritanceColon: true,
    SpaceBeforeParens: 'ControlStatements',
    SpaceBeforeParensOptions: {
      AfterControlStatements: true,
      AfterForeachMacros: true,
      AfterFunctionDefinitionName: false,
      AfterFunctionDeclarationName: false,
      AfterIfMacros: true,
      AfterOverloadedOperator: false,
      BeforeNonEmptyParentheses: false,
    },
    SpaceBeforeRangeBasedForLoopColon: true,
    SpaceBeforeSquareBrackets: false,
    SpaceInEmptyBlock: false,
    SpaceInEmptyParentheses: false,
    SpacesBeforeTrailingComments: 2,
    SpacesInAngles: 'Leave',
    SpacesInCStyleCastParentheses: false,
    SpacesInConditionalStatement: false,
    SpacesInContainerLiterals: false,
    SpacesInLineCommentPrefix: { Minimum: 0, Maximum: -1 },
    SpacesInParentheses: false,
    SpacesInSquareBrackets: false,
    Standard: 'Auto',
    StatementAttributeLikeMacros: ['Q_EMIT'],
    StatementMacros: ['Q_UNUSED', 'QT_REQUIRE_VERSION'],
    TabWidth,
    UseCRLF: false,
    UseTab,
    WhitespaceSensitiveMacros: [
      'STRINGIZE',
      'PP_STRINGIZE',
      'BOOST_PP_STRINGIZE',
      'NS_SWIFT_NAME',
      'CF_SWIFT_NAME',
    ],
  };
}
