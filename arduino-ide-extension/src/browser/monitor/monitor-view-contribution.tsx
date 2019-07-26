import * as React from 'react';
import { injectable, inject } from "inversify";
import { AbstractViewContribution } from "@theia/core/lib/browser";
import { MonitorWidget } from "./monitor-widget";
import { MenuModelRegistry, Command, CommandRegistry } from "@theia/core";
import { ArduinoMenus } from "../arduino-frontend-contribution";
import { TabBarToolbarContribution, TabBarToolbarRegistry } from "@theia/core/lib/browser/shell/tab-bar-toolbar";
import { MonitorModel } from './monitor-model';

export namespace SerialMonitor {
    export namespace Commands {
        export const AUTOSCROLL: Command = {
            id: 'serial-monitor-autoscroll',
            label: 'Autoscroll'
        }
        export const TIMESTAMP: Command = {
            id: 'serial-monitor-timestamp',
            label: 'Timestamp'
        }
        export const CLEAR_OUTPUT: Command = {
            id: 'serial-monitor-clear-output',
            label: 'Clear Output',
            iconClass: 'clear-all'
        }
    }
}

@injectable()
export class MonitorViewContribution extends AbstractViewContribution<MonitorWidget> implements TabBarToolbarContribution {

    static readonly OPEN_SERIAL_MONITOR = MonitorWidget.ID + ':toggle';

    @inject(MonitorModel) protected readonly model: MonitorModel;

    constructor() {
        super({
            widgetId: MonitorWidget.ID,
            widgetName: 'Serial Monitor',
            defaultWidgetOptions: {
                area: 'bottom'
            },
            toggleCommandId: MonitorViewContribution.OPEN_SERIAL_MONITOR,
            toggleKeybinding: 'ctrl+shift+m'
        })
    }

    registerMenus(menus: MenuModelRegistry): void {
        if (this.toggleCommand) {
            menus.registerMenuAction(ArduinoMenus.TOOLS, {
                commandId: this.toggleCommand.id,
                label: 'Serial Monitor'
            });
        }
    }

    async registerToolbarItems(registry: TabBarToolbarRegistry) {
        registry.registerItem({
            id: 'monitor-autoscroll',
            tooltip: 'Toggle Autoscroll',
            render: () => this.renderAutoScrollButton(),
            isVisible: widget => widget instanceof MonitorWidget,
            onDidChange: this.model.onChange
        });
        registry.registerItem({
            id: 'monitor-timestamp',
            tooltip: 'Toggle Timestamp',
            render: () => this.renderTimestampButton(),
            isVisible: widget => widget instanceof MonitorWidget,
            onDidChange: this.model.onChange
        });
        registry.registerItem({
            id: SerialMonitor.Commands.CLEAR_OUTPUT.id,
            command: SerialMonitor.Commands.CLEAR_OUTPUT.id,
            tooltip: 'Clear Output'
        });
    }

    registerCommands(commands: CommandRegistry): void {
        super.registerCommands(commands);
        commands.registerCommand(SerialMonitor.Commands.CLEAR_OUTPUT, {
            isEnabled: widget => widget instanceof MonitorWidget,
            isVisible: widget => widget instanceof MonitorWidget,
            execute: widget => {
                if (widget instanceof MonitorWidget) {
                    widget.clear();
                }
            }
        });
    }

    protected renderAutoScrollButton(): React.ReactNode {

        return <React.Fragment>
            <div
                className={`item enabled fa fa-angle-double-down arduino-monitor ${this.model.autoscroll ? 'toggled' : ''}`}
                onClick={this.toggleAutoScroll}
            ></div>
        </React.Fragment>;
    }

    protected readonly toggleAutoScroll = () => this.doToggleAutoScroll();
    protected async doToggleAutoScroll() {
        this.model.toggleAutoscroll();
    }

    protected renderTimestampButton(): React.ReactNode {

        return <React.Fragment>
            <div
                className={`item enabled fa fa-clock-o arduino-monitor ${this.model.timestamp ? 'toggled' : ''}`}
                onClick={this.toggleTimestamp}
            ></div>
        </React.Fragment>;
    }

    protected readonly toggleTimestamp = () => this.doToggleTimestamp();
    protected async doToggleTimestamp() {
        this.model.toggleTimestamp();
    }
}