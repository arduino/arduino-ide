import { DisposableCollection } from '@theia/core/lib/common/disposable';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { HostedPluginSupport } from '../hosted/hosted-plugin-support';
import type { ArduinoState } from 'vscode-arduino-api';
import {
  BoardsService,
  CompileSummary,
  isCompileSummary,
  BoardsConfig,
  PortIdentifier,
  resolveDetectedPort,
} from '../../common/protocol';
import {
  toApiBoardDetails,
  toApiCompileSummary,
  toApiPort,
} from '../../common/protocol/arduino-context-mapper';
import { BoardsDataStore } from '../boards/boards-data-store';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import { CurrentSketch } from '../sketches-service-client-impl';
import { SketchContribution } from './contribution';

/**
 * (non-API) exported for tests
 */
export interface UpdateStateParams<T extends ArduinoState = ArduinoState> {
  readonly key: keyof T;
  readonly value: T[keyof T];
}

/**
 * Contribution for updating the Arduino state, such as the FQBN, selected port, and sketch path changes via commands, so other VS Code extensions can access it.
 * See [`vscode-arduino-api`](https://github.com/dankeboy36/vscode-arduino-api#api) for more details.
 */
@injectable()
export class UpdateArduinoState extends SketchContribution {
  @inject(BoardsService)
  private readonly boardsService: BoardsService;
  @inject(BoardsServiceProvider)
  private readonly boardsServiceProvider: BoardsServiceProvider;
  @inject(BoardsDataStore)
  private readonly boardsDataStore: BoardsDataStore;
  @inject(HostedPluginSupport)
  private readonly hostedPluginSupport: HostedPluginSupport;

  private readonly toDispose = new DisposableCollection();

  override onStart(): void {
    this.toDispose.pushAll([
      this.boardsServiceProvider.onBoardsConfigDidChange(() =>
        this.updateBoardsConfig(this.boardsServiceProvider.boardsConfig)
      ),
      this.sketchServiceClient.onCurrentSketchDidChange((sketch) =>
        this.updateSketchPath(sketch)
      ),
      this.configService.onDidChangeDataDirUri((dataDirUri) =>
        this.updateDataDirPath(dataDirUri)
      ),
      this.configService.onDidChangeSketchDirUri((userDirUri) =>
        this.updateUserDirPath(userDirUri)
      ),
      this.commandService.onDidExecuteCommand(({ commandId, args }) => {
        if (
          commandId === 'arduino.languageserver.notifyBuildDidComplete' &&
          isCompileSummary(args[0])
        ) {
          this.updateCompileSummary(args[0]);
        }
      }),
      this.boardsDataStore.onChanged((fqbn) => {
        const selectedFqbn =
          this.boardsServiceProvider.boardsConfig.selectedBoard?.fqbn;
        if (selectedFqbn && fqbn.includes(selectedFqbn)) {
          this.updateBoardDetails(selectedFqbn);
        }
      }),
    ]);
  }

  override onReady(): void {
    this.boardsServiceProvider.ready.then(() => {
      this.updateBoardsConfig(this.boardsServiceProvider.boardsConfig);
    });
    this.updateSketchPath(this.sketchServiceClient.tryGetCurrentSketch());
    this.updateUserDirPath(this.configService.tryGetSketchDirUri());
    this.updateDataDirPath(this.configService.tryGetDataDirUri());
  }

  onStop(): void {
    this.toDispose.dispose();
  }

  private async updateSketchPath(
    sketch: CurrentSketch | undefined
  ): Promise<void> {
    const sketchPath = CurrentSketch.isValid(sketch)
      ? new URI(sketch.uri).path.fsPath()
      : undefined;
    return this.updateState({ key: 'sketchPath', value: sketchPath });
  }

  private async updateCompileSummary(
    compileSummary: CompileSummary
  ): Promise<void> {
    const apiCompileSummary = toApiCompileSummary(compileSummary);
    return this.updateState({
      key: 'compileSummary',
      value: apiCompileSummary,
    });
  }

  private async updateBoardsConfig(boardsConfig: BoardsConfig): Promise<void> {
    const fqbn = boardsConfig.selectedBoard?.fqbn;
    const port = boardsConfig.selectedPort;
    await this.updateFqbn(fqbn);
    await this.updateBoardDetails(fqbn);
    await this.updatePort(port);
  }

  private async updateFqbn(fqbn: string | undefined): Promise<void> {
    await this.updateState({ key: 'fqbn', value: fqbn });
  }

  private async updateBoardDetails(fqbn: string | undefined): Promise<void> {
    const unset = () =>
      this.updateState({ key: 'boardDetails', value: undefined });
    if (!fqbn) {
      return unset();
    }
    const [details, persistedData] = await Promise.all([
      this.boardsService.getBoardDetails({ fqbn }),
      this.boardsDataStore.getData(fqbn),
    ]);
    if (!details) {
      return unset();
    }
    const apiBoardDetails = toApiBoardDetails({
      ...details,
      configOptions:
        BoardsDataStore.Data.EMPTY === persistedData
          ? details.configOptions
          : persistedData.configOptions.slice(),
    });
    return this.updateState({
      key: 'boardDetails',
      value: apiBoardDetails,
    });
  }

  private async updatePort(port: PortIdentifier | undefined): Promise<void> {
    const resolvedPort =
      port &&
      resolveDetectedPort(port, this.boardsServiceProvider.detectedPorts);
    const apiPort = resolvedPort && toApiPort(resolvedPort);
    return this.updateState({ key: 'port', value: apiPort });
  }

  private async updateUserDirPath(userDirUri: URI | undefined): Promise<void> {
    const userDirPath = userDirUri?.path.fsPath();
    return this.updateState({
      key: 'userDirPath',
      value: userDirPath,
    });
  }

  private async updateDataDirPath(dataDirUri: URI | undefined): Promise<void> {
    const dataDirPath = dataDirUri?.path.fsPath();
    return this.updateState({
      key: 'dataDirPath',
      value: dataDirPath,
    });
  }

  private async updateState<T extends ArduinoState>(
    params: UpdateStateParams<T>
  ): Promise<void> {
    await this.hostedPluginSupport.didStart;
    return this.commandService.executeCommand('arduinoAPI.updateState', params);
  }
}
