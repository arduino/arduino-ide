import {
  CHANNEL_INVOKE_MENU,
  InternalMenuDto,
} from '@theia/core/lib/electron-common/electron-api';
import { TheiaMainApi } from '@theia/core/lib/electron-main/electron-api-main';
import { injectable } from '@theia/core/shared/inversify';
import { MenuItemConstructorOptions } from '@theia/electron/shared/electron';

@injectable()
export class TheiaMainApiFixFalsyHandlerId extends TheiaMainApi {
  override fromMenuDto(
    sender: Electron.WebContents,
    menuId: number,
    menuDto: InternalMenuDto[]
  ): Electron.MenuItemConstructorOptions[] {
    return menuDto.map((dto) => {
      const result: MenuItemConstructorOptions = {
        id: dto.id,
        label: dto.label,
        type: dto.type,
        checked: dto.checked,
        enabled: dto.enabled,
        visible: dto.visible,
        role: dto.role,
        accelerator: dto.accelerator,
      };
      if (dto.submenu) {
        result.submenu = this.fromMenuDto(sender, menuId, dto.submenu);
      }
      // Fix for handlerId === 0
      // https://github.com/eclipse-theia/theia/pull/12500#issuecomment-1686074836
      if (typeof dto.handlerId === 'number') {
        result.click = () => {
          sender.send(CHANNEL_INVOKE_MENU, menuId, dto.handlerId);
        };
      }
      return result;
    });
  }
}
