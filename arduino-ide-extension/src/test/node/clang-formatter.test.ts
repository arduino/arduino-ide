import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { expect } from 'chai';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import temp from 'temp';
import {
  clangFormatFilename,
  ClangFormatter,
} from '../../node/clang-formatter';
import { spawnCommand } from '../../node/exec-util';
import { createBaseContainer, startDaemon } from './node-test-bindings';

const unformattedContent = `void  setup ( )  { pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
 digitalWrite( LED_BUILTIN , HIGH );
     delay( 1000 ) ;
 digitalWrite( LED_BUILTIN  , LOW);
delay ( 1000 ) ;
    }
`;
const formattedContent = `void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
}
`;

type ClangStyleValue =
  | string
  | number
  | boolean
  | ClangStyleValue[]
  | { [key: string]: ClangStyleValue };
type ClangConfiguration = Record<string, ClangStyleValue>;

export interface ClangStyle {
  readonly key: string;
  readonly value: ClangStyleValue;
}

const singleClangStyles: ClangStyle[] = [
  {
    key: 'SpacesBeforeTrailingComments',
    value: 0,
  },
  {
    key: 'SortIncludes',
    value: 'Never',
  },
  {
    key: 'AlignTrailingComments',
    value: true,
  },
  {
    key: 'IfMacros',
    value: ['KJ_IF_MAYBE'],
  },
  {
    key: 'SpacesInLineCommentPrefix',
    value: {
      Minimum: 0,
      Maximum: -1,
    },
  },
];

async function expectNoChanges(
  formatter: ClangFormatter,
  styleArg: string
): Promise<void> {
  const minimalContent = `
void setup() {}
void loop() {}
`.trim();
  const execPath = formatter['execPath']();
  const actual = await spawnCommand(
    execPath,
    ['-style', styleArg],
    console.error,
    minimalContent
  );
  expect(actual).to.be.equal(minimalContent);
}

describe('clang-formatter', () => {
  let tracked: typeof temp;
  let formatter: ClangFormatter;
  let toDispose: DisposableCollection;

  before(async () => {
    tracked = temp.track();
    toDispose = new DisposableCollection(
      Disposable.create(() => tracked.cleanupSync())
    );
    const container = await createBaseContainer({
      additionalBindings: (bind) =>
        bind(ClangFormatter).toSelf().inSingletonScope(),
    });
    await startDaemon(container, toDispose);
    formatter = container.get<ClangFormatter>(ClangFormatter);
  });

  after(() => toDispose.dispose());

  singleClangStyles
    .map((style) => ({
      ...style,
      styleArg: JSON.stringify({ [style.key]: style.value }),
    }))
    .map(({ value, styleArg }) =>
      it(`should execute the formatter with a single ${Array.isArray(value) ? 'array' : typeof value
        } type style configuration value: ${styleArg}`, async () => {
          await expectNoChanges(formatter, styleArg);
        })
    );

  it('should execute the formatter with a multiple clang formatter styles', async () => {
    const styleArg = JSON.stringify(
      singleClangStyles.reduce((config, curr) => {
        config[curr.key] = curr.value;
        return config;
      }, {} as ClangConfiguration)
    );
    await expectNoChanges(formatter, styleArg);
  });

  it('should format with the default styles', async () => {
    const actual = await formatter.format({
      content: unformattedContent,
      formatterConfigFolderUris: [],
    });
    expect(actual).to.be.equal(formattedContent);
  });

  it('should format with custom formatter configuration file', async () => {
    const tempPath = tracked.mkdirSync();
    await fs.writeFile(
      path.join(tempPath, clangFormatFilename),
      'SpaceInEmptyParentheses: true',
      {
        encoding: 'utf8',
      }
    );
    const actual = await formatter.format({
      content: 'void foo() {}',
      formatterConfigFolderUris: [FileUri.create(tempPath).toString()],
    });
    expect(actual).to.be.equal('void foo( ) {}');
  });
});
