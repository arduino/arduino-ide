import { injectable } from '@theia/core/shared/inversify';
import {
  Contribution,
  Command,
  MenuModelRegistry,
  KeybindingRegistry,
} from './contribution';
import { ArduinoMenus } from '../menu/arduino-menus';
import { CommandRegistry, MaybePromise, nls } from '@theia/core/lib/common';
import { Settings } from '../dialogs/settings/settings';
import debounce = require('lodash.debounce');

@injectable()
export class InterfaceScale extends Contribution {
  private fontScalingEnabled: InterfaceScale.FontScalingEnabled = {
    increase: true,
    decrease: true,
  };

  private currentSettings: Settings;
  private updateSettingsDebounced = debounce(
    async () => {
      await this.settingsService.update(this.currentSettings);
      await this.settingsService.save();
    },
    100,
    { maxWait: 200 }
  );

  override onStart(): MaybePromise<void> {
    const updateCurrent = (settings: Settings) => {
      this.currentSettings = settings;
      this.updateFontScalingEnabled();
    };
    this.settingsService.onDidChange((settings) => updateCurrent(settings));
    this.settingsService.settings().then((settings) => updateCurrent(settings));
  }

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(InterfaceScale.Commands.INCREASE_FONT_SIZE, {
      execute: () => this.updateFontSize('increase'),
      isEnabled: () => this.fontScalingEnabled.increase,
    });
    registry.registerCommand(InterfaceScale.Commands.DECREASE_FONT_SIZE, {
      execute: () => this.updateFontSize('decrease'),
      isEnabled: () => this.fontScalingEnabled.decrease,
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.EDIT__FONT_CONTROL_GROUP, {
      commandId: InterfaceScale.Commands.INCREASE_FONT_SIZE.id,
      label: nls.localize(
        'arduino/editor/increaseFontSize',
        'Increase Font Size'
      ),
      order: '0',
    });
    registry.registerMenuAction(ArduinoMenus.EDIT__FONT_CONTROL_GROUP, {
      commandId: InterfaceScale.Commands.DECREASE_FONT_SIZE.id,
      label: nls.localize(
        'arduino/editor/decreaseFontSize',
        'Decrease Font Size'
      ),
      order: '1',
    });
  }

  private updateFontScalingEnabled(): void {
    let fontScalingEnabled = {
      increase: true,
      decrease: true,
    };

    if (this.currentSettings.autoScaleInterface) {
      fontScalingEnabled = {
        increase:
          this.currentSettings.interfaceScale + InterfaceScale.ZoomLevel.STEP <=
          InterfaceScale.ZoomLevel.MAX,
        decrease:
          this.currentSettings.interfaceScale - InterfaceScale.ZoomLevel.STEP >=
          InterfaceScale.ZoomLevel.MIN,
      };
    } else {
      fontScalingEnabled = {
        increase:
          this.currentSettings.editorFontSize + InterfaceScale.FontSize.STEP <=
          InterfaceScale.FontSize.MAX,
        decrease:
          this.currentSettings.editorFontSize - InterfaceScale.FontSize.STEP >=
          InterfaceScale.FontSize.MIN,
      };
    }

    const isChanged = Object.keys(fontScalingEnabled).some(
      (key: keyof InterfaceScale.FontScalingEnabled) =>
        fontScalingEnabled[key] !== this.fontScalingEnabled[key]
    );
    if (isChanged) {
      this.fontScalingEnabled = fontScalingEnabled;
      this.menuManager.update();
    }
  }

  private updateFontSize(mode: 'increase' | 'decrease'): void {
    if (this.currentSettings.autoScaleInterface) {
      mode === 'increase'
        ? (this.currentSettings.interfaceScale += InterfaceScale.ZoomLevel.STEP)
        : (this.currentSettings.interfaceScale -=
            InterfaceScale.ZoomLevel.STEP);
    } else {
      mode === 'increase'
        ? (this.currentSettings.editorFontSize += InterfaceScale.FontSize.STEP)
        : (this.currentSettings.editorFontSize -= InterfaceScale.FontSize.STEP);
    }
    this.updateFontScalingEnabled();
    this.updateSettingsDebounced();
  }

  override registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding({
      command: InterfaceScale.Commands.INCREASE_FONT_SIZE.id,
      keybinding: 'CtrlCmd+=',
    });
    registry.registerKeybinding({
      command: InterfaceScale.Commands.DECREASE_FONT_SIZE.id,
      keybinding: 'CtrlCmd+-',
    });
  }
}

export namespace InterfaceScale {
  export namespace Commands {
    export const INCREASE_FONT_SIZE: Command = {
      id: 'arduino-increase-font-size',
    };
    export const DECREASE_FONT_SIZE: Command = {
      id: 'arduino-decrease-font-size',
    };
  }

  export namespace ZoomLevel {
    export const MIN = -8;
    export const MAX = 9;
    export const STEP = 1;

    export function toPercentage(scale: number): number {
      return scale * 20 + 100;
    }
    export function fromPercentage(percentage: number): number {
      return (percentage - 100) / 20;
    }
    export namespace Step {
      export function toPercentage(step: number): number {
        return step * 20;
      }
      export function fromPercentage(percentage: number): number {
        return percentage / 20;
      }
    }
  }

  export namespace FontSize {
    export const MIN = 8;
    export const MAX = 72;
    export const STEP = 2;
  }

  export interface FontScalingEnabled {
    increase: boolean;
    decrease: boolean;
  }
}
