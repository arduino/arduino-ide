import { enableJSDOM } from '@theia/core/lib/browser/test/jsdom';
const disableJSDOM = enableJSDOM();

import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
FrontendApplicationConfigProvider.set({});

import { CommandRegistry } from '@theia/core/lib/common/command';
import { MessageService } from '@theia/core/lib/common/message-service';
import { expect } from 'chai';
import { BoardsServiceProvider } from '../../browser/boards/boards-service-provider';
import { InoLanguage } from '../../browser/contributions/ino-language';
import { BoardIdentifier } from '../../common/protocol';

disableJSDOM();

describe('ino-language', () => {
  describe('Commands.RESTART_LANGUAGE_SERVER', () => {
    it('should have the expected id, label and category', () => {
      expect(InoLanguage.Commands.RESTART_LANGUAGE_SERVER.id).to.equal(
        'arduino-restart-language-server'
      );
      expect(InoLanguage.Commands.RESTART_LANGUAGE_SERVER.label).to.equal(
        'Restart Language Server'
      );
      expect(InoLanguage.Commands.RESTART_LANGUAGE_SERVER.category).to.equal(
        'Arduino'
      );
    });
  });

  describe('registerCommands', () => {
    let inoLanguage: InoLanguage;
    let registeredCommand: any;
    let selectedBoardMock: BoardIdentifier | undefined;
    let restartCalled: boolean;

    beforeEach(() => {
      restartCalled = false;
      selectedBoardMock = undefined;

      const mockBoardsServiceProvider = {
        get boardsConfig() {
          return {
            selectedBoard: selectedBoardMock,
            selectedPort: undefined,
          };
        },
      } as unknown as BoardsServiceProvider;

      inoLanguage = new (class extends InoLanguage {
        constructor() {
          super();
          (this as any).boardsServiceProvider = mockBoardsServiceProvider;
        }

        override restartLanguageServer(): Promise<void> {
          restartCalled = true;
          return Promise.resolve();
        }
      })();

      const mockRegistry = {
        registerCommand: (_command: any, handler: any) => {
          registeredCommand = handler;
          return { dispose: () => {} };
        },
      } as unknown as CommandRegistry;

      inoLanguage.registerCommands(mockRegistry);
    });

    it('should be disabled when no board is selected', () => {
      selectedBoardMock = undefined;
      expect(registeredCommand.isEnabled()).to.be.false;
    });

    it('should be disabled when selected board has no fqbn', () => {
      selectedBoardMock = { fqbn: '', name: 'No FQBN' };
      expect(registeredCommand.isEnabled()).to.be.false;
    });

    it('should be enabled when selected board has an fqbn', () => {
      selectedBoardMock = { fqbn: 'arduino:avr:uno', name: 'Arduino Uno' };
      expect(registeredCommand.isEnabled()).to.be.true;
    });

    it('should execute restartLanguageServer on execute()', async () => {
      await registeredCommand.execute();
      expect(restartCalled).to.be.true;
    });
  });

  describe('restartLanguageServer', () => {
    let inoLanguage: InoLanguage;
    let warnMessages: string[];
    let infoMessages: string[];
    let errorMessages: string[];
    let startParams: { fqbn: string; name?: string; forceStart: boolean } | undefined;
    let selectedBoardMock: BoardIdentifier | undefined;
    let shouldSucceed: boolean;

    beforeEach(() => {
      warnMessages = [];
      infoMessages = [];
      errorMessages = [];
      startParams = undefined;
      shouldSucceed = true;
      selectedBoardMock = undefined;

      const mockMessageService = {
        warn: (msg: string) => {
          warnMessages.push(msg);
          return Promise.resolve();
        },
        info: (msg: string) => {
          infoMessages.push(msg);
          return Promise.resolve();
        },
        error: (msg: string) => {
          errorMessages.push(msg);
          return Promise.resolve();
        },
      } as unknown as MessageService;

      const mockBoardsServiceProvider = {
        get boardsConfig() {
          return {
            selectedBoard: selectedBoardMock,
            selectedPort: undefined,
          };
        },
      } as unknown as BoardsServiceProvider;

      inoLanguage = new (class extends InoLanguage {
        constructor() {
          super();
          (this as any).messageService = mockMessageService;
          (this as any).boardsServiceProvider = mockBoardsServiceProvider;
        }

        // Mock startLanguageServer
        // @ts-ignore
        protected override startLanguageServer(
          fqbn: string,
          name: string | undefined,
          forceStart: boolean
        ): Promise<void> {
          startParams = { fqbn, name, forceStart };
          if (shouldSucceed) {
            (this as any).languageServerFqbn = fqbn;
          } else {
            (this as any).languageServerFqbn = undefined;
          }
          return Promise.resolve();
        }
      })();
    });

    it('should warn when no board is selected and notifyUser is true', async () => {
      selectedBoardMock = undefined;
      await inoLanguage.restartLanguageServer(true);
      expect(warnMessages).to.have.lengthOf(1);
      expect(warnMessages[0]).to.include('No board is selected');
      expect(startParams).to.be.undefined;
    });

    it('should not warn when no board is selected and notifyUser is false', async () => {
      selectedBoardMock = undefined;
      await inoLanguage.restartLanguageServer(false);
      expect(warnMessages).to.be.empty;
      expect(startParams).to.be.undefined;
    });

    it('should restart language server and show info messages when successful', async () => {
      selectedBoardMock = { fqbn: 'arduino:avr:uno', name: 'Arduino Uno' };
      shouldSucceed = true;

      await inoLanguage.restartLanguageServer(true);

      expect(startParams).to.deep.equal({
        fqbn: 'arduino:avr:uno',
        name: 'Arduino Uno',
        forceStart: true,
      });
      expect(infoMessages).to.have.lengthOf(2);
      expect(infoMessages[0]).to.include('Restarting Language Server');
      expect(infoMessages[1]).to.include('Language Server restarted');
      expect(errorMessages).to.be.empty;
    });

    it('should show error message when restart fails', async () => {
      selectedBoardMock = { fqbn: 'arduino:avr:uno', name: 'Arduino Uno' };
      shouldSucceed = false;

      await inoLanguage.restartLanguageServer(true);

      expect(startParams).to.deep.equal({
        fqbn: 'arduino:avr:uno',
        name: 'Arduino Uno',
        forceStart: true,
      });
      expect(infoMessages).to.have.lengthOf(1);
      expect(infoMessages[0]).to.include('Restarting Language Server');
      expect(errorMessages).to.have.lengthOf(1);
      expect(errorMessages[0]).to.include('Failed to restart Language Server');
    });

    it('should not show info messages when notifyUser is false', async () => {
      selectedBoardMock = { fqbn: 'arduino:avr:uno', name: 'Arduino Uno' };
      shouldSucceed = true;

      await inoLanguage.restartLanguageServer(false);

      expect(startParams).to.deep.equal({
        fqbn: 'arduino:avr:uno',
        name: 'Arduino Uno',
        forceStart: true,
      });
      expect(infoMessages).to.be.empty;
      expect(errorMessages).to.be.empty;
    });
  });
});
