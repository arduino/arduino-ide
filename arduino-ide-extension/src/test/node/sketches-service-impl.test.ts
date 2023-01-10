import { Mutable } from '@theia/core/lib/common/types';
import { FileUri } from '@theia/core/lib/node';
import * as assert from 'assert';
import { basename, join } from 'path';
import { SketchContainer, SketchRef } from '../../common/protocol';
import { discoverSketches } from '../../node/sketches-service-impl';
import stableJsonStringify = require('fast-json-stable-stringify');

const testSketchbook = join(
  __dirname,
  '..',
  '..',
  '..',
  'src',
  'test',
  'node',
  '__test_sketchbook__'
);
const sketchFolderAsSketchbook = join(testSketchbook, 'a_sketch');
const emptySketchbook = join(testSketchbook, 'empty');

describe('discover-sketches', () => {
  it('should recursively discover all sketches in a folder', async () => {
    const actual = await discoverSketches(
      testSketchbook,
      SketchContainer.create('test')
    );
    containersDeepEquals(
      actual,
      expectedTestSketchbookContainer(
        testSketchbook,
        testSketchbookContainerTemplate
      )
    );
  });

  it('should handle when the sketchbook is a sketch folder', async () => {
    const actual = await discoverSketches(
      sketchFolderAsSketchbook,
      SketchContainer.create('foo-bar')
    );
    const name = basename(sketchFolderAsSketchbook);
    containersDeepEquals(actual, {
      children: [],
      label: 'foo-bar',
      sketches: [
        {
          name,
          uri: FileUri.create(sketchFolderAsSketchbook).toString(),
        },
      ],
    });
  });

  it('should handle empty sketchbook', async () => {
    const actual = await discoverSketches(
      emptySketchbook,
      SketchContainer.create('empty')
    );
    containersDeepEquals(actual, SketchContainer.create('empty'));
  });
});

function containersDeepEquals(
  actual: SketchContainer,
  expected: SketchContainer
) {
  const stableActual = JSON.parse(stableJsonStringify(actual));
  const stableExpected = JSON.parse(stableJsonStringify(expected));
  assert.deepEqual(stableActual, stableExpected);
}

/**
 * A `template://` schema will be resolved against the actual `rootPath` location at runtime.
 * For example if `rootPath` is `/path/to/a/folder/` and the template URI is `template://foo/bar/My_Sketch/My_Sketch.ino`,
 * then the resolved, expected URI will be `file:///path/to/a/folder/foo/bar/My_Sketch/My_Sketch.ino`.
 * The path of a template URI must be relative.
 */
function expectedTestSketchbookContainer(
  rootPath: string,
  containerTemplate: SketchContainer,
  label?: string
): SketchContainer {
  let rootUri = FileUri.create(rootPath).toString();
  if (rootUri.charAt(rootUri.length - 1) !== '/') {
    rootUri += '/';
  }
  const adjustUri = (sketch: Mutable<SketchRef>) => {
    assert.equal(sketch.uri.startsWith('template://'), true);
    assert.equal(sketch.uri.startsWith('template:///'), false);
    sketch.uri = sketch.uri.replace('template://', rootUri).toString();
    return sketch;
  };
  const adjustContainer = (container: SketchContainer) => {
    container.sketches.forEach(adjustUri);
    container.children.forEach(adjustContainer);
    return <Mutable<SketchContainer>>container;
  };
  const container = adjustContainer(containerTemplate);
  if (label) {
    container.label = label;
  }
  return container;
}

const testSketchbookContainerTemplate: SketchContainer = {
  label: 'test',
  children: [
    {
      label: 'project1',
      children: [
        {
          label: 'CodeA',
          children: [],
          sketches: [
            {
              name: 'version1A',
              uri: 'template://project1/CodeA/version1A',
            },
            {
              name: 'version2A',
              uri: 'template://project1/CodeA/version2A',
            },
          ],
        },
        {
          label: 'CodeB',
          children: [],
          sketches: [
            {
              name: 'version1B',
              uri: 'template://project1/CodeB/version1B',
            },
            {
              name: 'version2B',
              uri: 'template://project1/CodeB/version2B',
            },
          ],
        },
      ],
      sketches: [],
    },
    {
      label: 'nested_4',
      children: [
        {
          label: 'nested_3',
          children: [],
          sketches: [
            {
              name: 'nested_2',
              uri: 'template://nested_4/nested_3/nested_2',
            },
          ],
        },
      ],
      sketches: [],
    },
  ],
  sketches: [
    {
      name: 'bar++',
      uri: 'template://bar%2B%2B',
    },
    {
      name: 'a_sketch',
      uri: 'template://a_sketch',
    },
  ],
};
