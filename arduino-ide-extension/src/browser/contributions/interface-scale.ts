import { inject, injectable } from '@theia/core/shared/inversify';
import {
  Contribution,
  Command,
  MenuModelRegistry,
  KeybindingRegistry,
} from './contribution';
import { ArduinoMenus, PlaceholderMenuNode } from '../menu/arduino-menus';
import {
  CommandRegistry,
  DisposableCollection,
  MaybePromise,
  nls,
} from '@theia/core/lib/common';

import { Settings } from '../dialogs/settings/settings';
import { MainMenuManager } from '../../common/main-menu-manager';
import debounce = require('lodash.debounce');

@injectable()
export class InterfaceScale extends Contribution {
  @inject(MenuModelRegistry)
  private readonly menuRegistry: MenuModelRegistry;

  @inject(MainMenuManager)
  protected readonly mainMenuManager: MainMenuManager;

  private readonly menuActionsDisposables = new DisposableCollection();
  private fontScalingEnabled: InterfaceScale.FontScalingEnabled = {
    increase: true,
    decrease: true,
  };

  private currentScale: InterfaceScale.ScaleSettings;
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
      this.currentScale = { ...settings };
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
    this.menuActionsDisposables.dispose();
    const increaseFontSizeMenuAction = {
      commandId: InterfaceScale.Commands.INCREASE_FONT_SIZE.id,
      label: nls.localize(
        'arduino/editor/increaseFontSize',
        'Increase Font Size'
      ),
      order: '0',
    };
    const decreaseFontSizeMenuAction = {
      commandId: InterfaceScale.Commands.DECREASE_FONT_SIZE.id,
      label: nls.localize(
        'arduino/editor/decreaseFontSize',
        'Decrease Font Size'
      ),
      order: '1',
    };

    if (this.fontScalingEnabled.increase) {
      this.menuActionsDisposables.push(
        registry.registerMenuAction(
          ArduinoMenus.EDIT__FONT_CONTROL_GROUP,
          increaseFontSizeMenuAction
        )
      );
    } else {
      this.menuActionsDisposables.push(
        registry.registerMenuNode(
          ArduinoMenus.EDIT__FONT_CONTROL_GROUP,
          new PlaceholderMenuNode(
            ArduinoMenus.EDIT__FONT_CONTROL_GROUP,
            increaseFontSizeMenuAction.label,
            { order: increaseFontSizeMenuAction.order }
          )
        )
      );
    }
    if (this.fontScalingEnabled.decrease) {
      this.menuActionsDisposables.push(
        this.menuRegistry.registerMenuAction(
          ArduinoMenus.EDIT__FONT_CONTROL_GROUP,
          decreaseFontSizeMenuAction
        )
      );
    } else {
      this.menuActionsDisposables.push(
        this.menuRegistry.registerMenuNode(
          ArduinoMenus.EDIT__FONT_CONTROL_GROUP,
          new PlaceholderMenuNode(
            ArduinoMenus.EDIT__FONT_CONTROL_GROUP,
            decreaseFontSizeMenuAction.label,
            { order: decreaseFontSizeMenuAction.order }
          )
        )
      );
    }
    this.mainMenuManager.update();
  }

  private async updateFontSize(mode: 'increase' | 'decrease'): Promise<void> {
    if (this.currentSettings.autoScaleInterface) {
      mode === 'increase'
        ? (this.currentScale.interfaceScale += InterfaceScale.ZoomLevel.STEP)
        : (this.currentScale.interfaceScale -= InterfaceScale.ZoomLevel.STEP);
    } else {
      mode === 'increase'
        ? (this.currentScale.editorFontSize += InterfaceScale.FontSize.STEP)
        : (this.currentScale.editorFontSize -= InterfaceScale.FontSize.STEP);
    }
    this.currentSettings = {
      ...this.currentSettings,
      editorFontSize: this.currentScale.editorFontSize,
      interfaceScale: this.currentScale.interfaceScale,
    };
    let newFontScalingEnabled: InterfaceScale.FontScalingEnabled = {
      increase: true,
      decrease: true,
    };
    if (this.currentSettings.autoScaleInterface) {
      newFontScalingEnabled = {
        increase:
          this.currentSettings.interfaceScale + InterfaceScale.ZoomLevel.STEP <=
          InterfaceScale.ZoomLevel.MAX,
        decrease:
          this.currentSettings.interfaceScale - InterfaceScale.ZoomLevel.STEP >=
          InterfaceScale.ZoomLevel.MIN,
      };
    } else {
      newFontScalingEnabled = {
        increase:
          this.currentSettings.editorFontSize + InterfaceScale.FontSize.STEP <=
          InterfaceScale.FontSize.MAX,
        decrease:
          this.currentSettings.editorFontSize - InterfaceScale.FontSize.STEP >=
          InterfaceScale.FontSize.MIN,
      };
    }
    const isChanged = Object.keys(newFontScalingEnabled).some(
      (key: keyof InterfaceScale.FontScalingEnabled) =>
        newFontScalingEnabled[key] !== this.fontScalingEnabled[key]
    );
    if (isChanged) {
      this.registerMenus(this.menuRegistry);
      this.fontScalingEnabled = newFontScalingEnabled;
    }
    this.fontScalingEnabled = newFontScalingEnabled;
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

  export type ScaleSettings = Pick<
    Settings,
    'interfaceScale' | 'editorFontSize'
  >;
}
