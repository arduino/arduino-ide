import { FileUri } from '@theia/core/lib/common/file-uri';
import { expect } from 'chai';
import { Sketch } from '../../common/protocol/sketches-service';
import { tryParseError } from '../../node/cli-error-parser';

describe('cli-error-parser', () => {
  const sketchPath = '/path/to/sketch';
  const mainFilePath = `${sketchPath}/sketch.ino`;
  const sketch: Sketch = {
    name: 'sketch',
    uri: FileUri.create(sketchPath).toString(),
    mainFileUri: FileUri.create(mainFilePath).toString(),
    otherSketchFileUris: [],
    additionalFileUris: [],
    rootFolderFileUris: [],
  };

  for (const column of [1, 9, 10, 42, 100, 123]) {
    for (const lineEnding of ['\n', '\r\n']) {
      it(`should preserve column ${column} with ${JSON.stringify(
        lineEnding
      )} line endings`, () => {
        const content = `Compiling sketch...${lineEnding}${mainFilePath}:12:${column}: error: invalid expression${lineEnding}`;
        const errors = tryParseError({ content, sketch });

        expect(errors).to.have.lengthOf(1);
        expect(errors[0].location).to.deep.equal({
          uri: sketch.mainFileUri,
          range: {
            start: { line: 11, character: column - 1 },
            end: { line: 11, character: column - 1 },
          },
        });
        expect(errors[0].rangesInOutput).to.deep.equal([
          {
            start: { line: 1, character: 0 },
            end: {
              line: 1,
              character: `${mainFilePath}:12:${column}`.length,
            },
          },
        ]);
      });
    }
  }

  it('should use the start of the line when no column is provided', () => {
    const content = `${mainFilePath}:12: fatal error: missing.h: No such file or directory\n`;
    const errors = tryParseError({ content, sketch });

    expect(errors).to.have.lengthOf(1);
    expect(errors[0].location.range.start).to.deep.equal({
      line: 11,
      character: 0,
    });
    expect(errors[0].message).to.equal('missing.h: No such file or directory');
  });

  it('should retain separate diagnostics at different columns on the same line', () => {
    const content = [
      `${mainFilePath}:12:12: error: invalid expression`,
      `${mainFilePath}:12:22: error: invalid expression`,
      '',
    ].join('\n');
    const errors = tryParseError({ content, sketch });

    expect(errors).to.have.lengthOf(2);
    expect(
      errors.map(({ location }) => location.range.start.character)
    ).to.deep.equal([11, 21]);
  });

  it('should preserve columns when compiler output is supplied in byte chunks', () => {
    const content = `${mainFilePath}:12:42: error: invalid expression\n`;
    const errors = tryParseError({
      content: [
        Buffer.from(content.slice(0, 10)),
        Buffer.from(content.slice(10)),
      ],
      sketch,
    });

    expect(errors).to.have.lengthOf(1);
    expect(errors[0].location.range.start).to.deep.equal({
      line: 11,
      character: 41,
    });
  });
});
