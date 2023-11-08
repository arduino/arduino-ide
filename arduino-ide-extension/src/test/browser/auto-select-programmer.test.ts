import { enableJSDOM } from '@theia/core/lib/browser/test/jsdom';
const disableJSDOM = enableJSDOM();

import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
FrontendApplicationConfigProvider.set({});

import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { expect } from 'chai';
import { BoardsDataStore } from '../../browser/boards/boards-data-store';
import { ensureProgrammerIsSelected } from '../../browser/contributions/auto-select-programmer';
import { Programmer } from '../../common/protocol';

disableJSDOM();

describe('auto-select-programmer', () => {
  describe('ensureProgrammerIsSelected', () => {
    let debugMessages: string[];
    const toDispose = new DisposableCollection();
    const fqbn = 'a:b:c';
    const programmer: Programmer = {
      id: 'p1',
      name: 'P1',
      platform: 'a:b',
      default: true,
    };
    const anotherProgrammer: Programmer = {
      id: 'p2',
      name: 'P2',
      platform: 'a:b',
    };

    before(() => {
      const debug = console.debug;
      console.debug = (message: string) => debugMessages.push(message);
      toDispose.push(Disposable.create(() => (console.debug = debug)));
    });

    beforeEach(() => (debugMessages = []));

    after(() => toDispose.dispose());

    it('should not set when the fqbn is missing', async () => {
      const ok = await ensureProgrammerIsSelected({
        fqbn: undefined,
        getData: () => BoardsDataStore.Data.EMPTY,
        loadBoardDetails: () => undefined,
        selectProgrammer: () => false,
      });
      expect(ok).to.be.false;
      expect(debugMessages).to.be.empty;
    });

    it('should not set when no board details found (missing core)', async () => {
      const ok = await ensureProgrammerIsSelected({
        fqbn,
        getData: () => BoardsDataStore.Data.EMPTY,
        loadBoardDetails: () => undefined,
        selectProgrammer: () => false,
      });
      expect(ok).to.be.false;
      expect(debugMessages).to.be.deep.equal([
        'Ensuring a programmer is selected for a:b:c...',
        'Skipping. No boards data is available for a:b:c.',
      ]);
    });

    it('should be noop when the programmer is already selected', async () => {
      const ok = await ensureProgrammerIsSelected({
        fqbn,
        getData: () => ({
          configOptions: [],
          programmers: [programmer],
          selectedProgrammer: programmer,
        }),
        loadBoardDetails: () => undefined,
        selectProgrammer: () => false,
      });
      expect(ok).to.be.true;
      expect(debugMessages).to.be.deep.equal([
        'Ensuring a programmer is selected for a:b:c...',
        "A programmer is already selected for a:b:c: 'p1'.",
      ]);
    });

    it('should automatically select the default one if not selected', async () => {
      const selectedProgrammers: Record<string, Programmer | undefined> = {};
      const ok = await ensureProgrammerIsSelected({
        fqbn,
        getData: () => ({
          configOptions: [],
          programmers: [anotherProgrammer, programmer],
          selectedProgrammer: undefined,
        }),
        loadBoardDetails: () => undefined,
        selectProgrammer: (arg) => {
          selectedProgrammers[arg.fqbn] = arg.selectedProgrammer;
          return true;
        },
      });
      expect(ok).to.be.true;
      expect(debugMessages).to.be.deep.equal([
        'Ensuring a programmer is selected for a:b:c...',
        "Selected 'p1' programmer for a:b:c.",
      ]);
      expect(selectedProgrammers).to.be.deep.equal({
        [fqbn]: programmer,
      });
    });

    it('should not select the programmer when loading the board details fails', async () => {
      const ok = await ensureProgrammerIsSelected({
        fqbn,
        getData: () => ({
          configOptions: [],
          programmers: [],
          selectedProgrammer: undefined,
        }),
        loadBoardDetails: () => undefined,
        selectProgrammer: () => false,
      });
      expect(ok).to.be.false;
      expect(debugMessages).to.be.deep.equal([
        'Ensuring a programmer is selected for a:b:c...',
        'Skipping. No boards data is available for a:b:c.',
      ]);
    });

    it('should select the programmer after reloading the data', async () => {
      const selectedProgrammers: Record<string, Programmer | undefined> = {};
      const ok = await ensureProgrammerIsSelected({
        fqbn,
        getData: () => ({
          configOptions: [
            {
              label: 'config',
              option: 'opt1',
              values: [{ label: 'Opt1', selected: true, value: 'Value' }],
            },
          ],
          programmers: [],
          selectedProgrammer: undefined,
        }),
        loadBoardDetails: () => ({
          fqbn,
          requiredTools: [],
          configOptions: [],
          programmers: [programmer, anotherProgrammer],
          debuggingSupported: false,
          VID: 'VID',
          PID: 'PID',
          buildProperties: [],
        }),
        selectProgrammer: (arg) => {
          selectedProgrammers[arg.fqbn] = arg.selectedProgrammer;
          return true;
        },
      });
      expect(ok).to.be.true;
      expect(debugMessages).to.be.deep.equal([
        'Ensuring a programmer is selected for a:b:c...',
        'Reloading board details for a:b:c...',
        "Selected 'p1' programmer for a:b:c.",
      ]);
      expect(selectedProgrammers).to.be.deep.equal({
        [fqbn]: programmer,
      });
    });
  });
});
