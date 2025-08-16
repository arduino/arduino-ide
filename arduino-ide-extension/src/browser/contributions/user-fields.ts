import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import { BoardUserField, CoreError } from '../../common/protocol';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import { UserFieldsDialog } from '../dialogs/user-fields/user-fields-dialog';
import { ArduinoMenus } from '../menu/arduino-menus';
import { Contribution, MenuModelRegistry } from './contribution';
import { UploadSketch } from './upload-sketch';

@injectable()
export class UserFields extends Contribution {
  private boardRequiresUserFields = false;
  private userFieldsSet = false;
  private readonly cachedUserFields: Map<string, BoardUserField[]> = new Map();

  @inject(UserFieldsDialog)
  private readonly userFieldsDialog: UserFieldsDialog;

  @inject(BoardsServiceProvider)
  private readonly boardsServiceProvider: BoardsServiceProvider;

  protected override init(): void {
    super.init();
    this.boardsServiceProvider.onBoardsConfigDidChange(() => this.refresh());
  }

  override onReady(): void {
    this.boardsServiceProvider.ready.then(() => this.refresh());
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.SKETCH__MAIN_GROUP, {
      commandId: UploadSketch.Commands.UPLOAD_WITH_CONFIGURATION.id,
      label: UploadSketch.Commands.UPLOAD_WITH_CONFIGURATION.label,
      order: '2',
    });
  }

  private async refresh(): Promise<void> {
    const userFields =
      await this.boardsServiceProvider.selectedBoardUserFields();
    this.boardRequiresUserFields = userFields.length > 0;
    this.menuManager.update();
  }

  private selectedFqbnAddress(): string | undefined {
    const { boardsConfig } = this.boardsServiceProvider;
    const fqbn = boardsConfig.selectedBoard?.fqbn;
    if (!fqbn) {
      return undefined;
    }
    const address = boardsConfig.selectedPort?.address || '';
    return fqbn + '|' + address;
  }

  private async showUserFieldsDialog(
    key: string
  ): Promise<BoardUserField[] | undefined> {
    const cached = this.cachedUserFields.get(key);
    // Deep clone the array of board fields to avoid editing the cached ones
    this.userFieldsDialog.value = cached
      ? cached.slice()
      : await this.boardsServiceProvider.selectedBoardUserFields();
    const result = await this.userFieldsDialog.open();
    if (!result) {
      return;
    }

    this.userFieldsSet = true;
    this.cachedUserFields.set(key, result);
    return result;
  }

  async checkUserFieldsDialog(forceOpen = false): Promise<boolean> {
    const key = this.selectedFqbnAddress();
    if (!key) {
      // Let the upload continue without an FQBN and the CLI fail instead of disabling the upload from IDE.
      // https://github.com/arduino/arduino-ide/issues/1714
      return true;
    }
    /*
      If the board requires to be configured with user fields, we want
      to show the user fields dialog, but only if they weren't already
      filled in or if they were filled in, but the previous upload failed.
    */
    if (
      !forceOpen &&
      (!this.boardRequiresUserFields ||
        (this.cachedUserFields.has(key) && this.userFieldsSet))
    ) {
      return true;
    }
    const userFieldsFilledIn = Boolean(await this.showUserFieldsDialog(key));
    return userFieldsFilledIn;
  }

  checkUserFieldsForUpload(): boolean {
    // TODO: This does not belong here.
    // IDE2 should not do any preliminary checks but let the CLI fail and then toast a user consumable error message.
    if (!this.boardRequiresUserFields || this.getUserFields().length > 0) {
      this.userFieldsSet = true;
      return true;
    }
    this.messageService.error(
      nls.localize(
        'arduino/sketch/userFieldsNotFoundError',
        "Can't find user fields for connected board"
      )
    );
    this.userFieldsSet = false;
    return false;
  }

  getUserFields(): BoardUserField[] {
    const fqbnAddress = this.selectedFqbnAddress();
    if (!fqbnAddress) {
      return [];
    }
    return this.cachedUserFields.get(fqbnAddress) ?? [];
  }

  isRequired(): boolean {
    return this.boardRequiresUserFields;
  }

  notifyFailedWithError(e: Error): void {
    if (this.boardRequiresUserFields && CoreError.UploadFailed.is(e)) {
      this.userFieldsSet = false;
    }
  }
}
