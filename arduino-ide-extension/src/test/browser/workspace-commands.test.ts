import { enableJSDOM } from '@theia/core/lib/browser/test/jsdom';
const disableJSDOM = enableJSDOM();

import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
FrontendApplicationConfigProvider.set({});

import {
  FrontendApplication,
  LabelProvider,
  OpenerService,
} from '@theia/core/lib/browser';
import { ClipboardService } from '@theia/core/lib/browser/clipboard-service';
import { ApplicationServer } from '@theia/core/lib/common/application-protocol';
import { CommandService } from '@theia/core/lib/common/command';
import { MessageService } from '@theia/core/lib/common/message-service';
import { nls } from '@theia/core/lib/common/nls';
import { OS } from '@theia/core/lib/common/os';
import { SelectionService } from '@theia/core/lib/common/selection-service';
import URI from '@theia/core/lib/common/uri';
import { Container } from '@theia/core/shared/inversify';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileStat } from '@theia/filesystem/lib/common/files';
import { WorkspaceCompareHandler } from '@theia/workspace/lib/browser/workspace-compare-handler';
import { WorkspaceDeleteHandler } from '@theia/workspace/lib/browser/workspace-delete-handler';
import { WorkspaceDuplicateHandler } from '@theia/workspace/lib/browser/workspace-duplicate-handler';
import { WorkspacePreferences } from '@theia/workspace/lib/browser/workspace-preferences';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { expect } from 'chai';
import {
  invalidExtension as invalidExtensionMessage,
  parseFileInput,
  WorkspaceCommandContribution,
} from '../../browser/theia/workspace/workspace-commands';
import { Sketch, SketchesService } from '../../common/protocol';
import { SketchesServiceClientImpl } from '../../common/protocol/sketches-service-client-impl';

disableJSDOM();

describe('workspace-commands', () => {
  describe('parseFileInput', () => {
    it("should parse input without extension as '.ino'", () => {
      const actual = parseFileInput('foo');
      expect(actual).to.be.deep.equal({
        raw: 'foo',
        name: 'foo',
        extension: '.ino',
      });
    });
    it("should parse input with a trailing dot as '.ino'", () => {
      const actual = parseFileInput('foo.');
      expect(actual).to.be.deep.equal({
        raw: 'foo.',
        name: 'foo',
        extension: '.ino',
      });
    });
    it('should parse input with a valid extension', () => {
      const actual = parseFileInput('lib.cpp');
      expect(actual).to.be.deep.equal({
        raw: 'lib.cpp',
        name: 'lib',
        extension: '.cpp',
      });
    });
    it('should calculate the file extension based on the last dot index', () => {
      const actual = parseFileInput('lib.ino.x');
      expect(actual).to.be.deep.equal({
        raw: 'lib.ino.x',
        name: 'lib.ino',
        extension: '.x',
      });
    });
    it('should ignore trailing spaces after the last dot', () => {
      const actual = parseFileInput('  foo.        ');
      expect(actual).to.be.deep.equal({
        raw: '  foo.        ',
        name: '  foo',
        extension: '.ino',
      });
    });
  });

  describe('validateFileName', () => {
    const child: FileStat = {
      isFile: true,
      isDirectory: false,
      isSymbolicLink: false,
      resource: new URI('sketch/sketch.ino'),
      name: 'sketch.ino',
    };
    const parent: FileStat = {
      isFile: false,
      isDirectory: true,
      isSymbolicLink: false,
      resource: new URI('sketch'),
      name: 'sketch',
      children: [child],
    };

    let workspaceCommands: WorkspaceCommandContribution;
    const trimmedName = (name: string) =>
      workspaceCommands['trimFileName'](name);

    async function testMe(userInput: string): Promise<string> {
      return workspaceCommands['validateFileName'](userInput, parent);
    }

    function createContainer(): Container {
      const container = new Container();
      container.bind(FileDialogService).toConstantValue(<FileDialogService>{});
      container.bind(FileService).toConstantValue(<FileService>{
        async exists(resource: URI): Promise<boolean> {
          return (
            resource.path.base.includes('_sketch') ||
            resource.path.base.includes('sketch')
          );
        },
      });
      container
        .bind(FrontendApplication)
        .toConstantValue(<FrontendApplication>{});
      container.bind(LabelProvider).toConstantValue(<LabelProvider>{});
      container.bind(MessageService).toConstantValue(<MessageService>{});
      container.bind(OpenerService).toConstantValue(<OpenerService>{});
      container.bind(SelectionService).toConstantValue(<SelectionService>{});
      container.bind(WorkspaceCommandContribution).toSelf().inSingletonScope();
      container
        .bind(WorkspaceCompareHandler)
        .toConstantValue(<WorkspaceCompareHandler>{});
      container
        .bind(WorkspaceDeleteHandler)
        .toConstantValue(<WorkspaceDeleteHandler>{});
      container
        .bind(WorkspaceDuplicateHandler)
        .toConstantValue(<WorkspaceDuplicateHandler>{});
      container
        .bind(WorkspacePreferences)
        .toConstantValue(<WorkspacePreferences>{});
      container.bind(WorkspaceService).toConstantValue(<WorkspaceService>{});
      container.bind(ClipboardService).toConstantValue(<ClipboardService>{});
      container.bind(ApplicationServer).toConstantValue(<ApplicationServer>{
        async getBackendOS(): Promise<OS.Type> {
          return OS.type();
        },
      });
      container.bind(CommandService).toConstantValue(<CommandService>{});
      container.bind(SketchesService).toConstantValue(<SketchesService>{});
      container
        .bind(SketchesServiceClientImpl)
        .toConstantValue(<SketchesServiceClientImpl>{});
      return container;
    }

    beforeEach(() => {
      workspaceCommands = createContainer().get<WorkspaceCommandContribution>(
        WorkspaceCommandContribution
      );
    });

    it("should validate input string without an extension as an '.ino' file", async () => {
      const actual = await testMe('valid');
      expect(actual).to.be.empty;
    });

    it('code files cannot start with number (no extension)', async () => {
      const actual = await testMe('_invalid');
      expect(actual).to.be.equal(Sketch.invalidSketchFolderNameMessage);
    });

    it('code files cannot start with number (trailing dot)', async () => {
      const actual = await testMe('_invalid.');
      expect(actual).to.be.equal(Sketch.invalidSketchFolderNameMessage);
    });

    it('code files cannot start with number (trailing dot)', async () => {
      const actual = await testMe('_invalid.cpp');
      expect(actual).to.be.equal(Sketch.invalidSketchFolderNameMessage);
    });

    it('should warn about invalid extension first', async () => {
      const actual = await testMe('_invalid.xxx');
      expect(actual).to.be.equal(invalidExtensionMessage('.xxx'));
    });

    it('should not warn about invalid file extension for empty input', async () => {
      const actual = await testMe('');
      expect(actual).to.be.equal(Sketch.invalidSketchFolderNameMessage);
    });

    it('should ignore non-code filename validation from the spec', async () => {
      const actual = await testMe('_invalid.json');
      expect(actual).to.be.empty;
    });

    it('non-code files should be validated against default new file validation rules', async () => {
      const name = ' invalid.json';
      const actual = await testMe(name);
      const expected = nls.localizeByDefault(
        'Leading or trailing whitespace detected in file or folder name.'
      );
      expect(actual).to.be.equal(expected);
    });

    it('should warn about existing resource', async () => {
      const name = 'sketch.ino';
      const actual = await testMe(name);
      const expected = nls.localizeByDefault(
        'A file or folder **{0}** already exists at this location. Please choose a different name.',
        trimmedName(name)
      );
      expect(actual).to.be.equal(expected);
    });
  });
});
