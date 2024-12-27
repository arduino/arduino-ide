import {
  FrontendApplicationContribution,
  FrontendApplication,
  Widget,
  Message,
} from '@theia/core/lib/browser';
import { injectable, inject } from '@theia/core/shared/inversify';
import { ArduinoToolbar } from './arduino-toolbar';
import { TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { CommandRegistry } from '@theia/core';
import { LabelParser } from '@theia/core/lib/browser/label-parser';

export class ArduinoToolbarContainer extends Widget {
  protected toolbars: ArduinoToolbar[];

  constructor(...toolbars: ArduinoToolbar[]) {
    super();
    this.id = 'arduino-toolbar-container';
    this.toolbars = toolbars;
  }

  override onAfterAttach(msg: Message) {
    this.node.style.flexDirection = 'column';

    // 使用div包裹
    const toolDiv = document.createElement('div');
    toolDiv.className = 'p-Widget';
    toolDiv.id = 'arduino-toolbar-container';
    this.node.appendChild(toolDiv);

    for (const toolbar of this.toolbars) {
      Widget.attach(toolbar, toolDiv);
    }

    // 添加横线
    let index = 1;
    if (index === 1) {
      const topTransverseLine = document.createElement('div');
      topTransverseLine.className = 'lingzhi-top-transverse-line';
      this.node.appendChild(topTransverseLine);
      index++;
    }
  }
}

@injectable()
export class ArduinoToolbarContribution
  implements FrontendApplicationContribution {
  protected arduinoToolbarContainer: ArduinoToolbarContainer;

  constructor(
    @inject(TabBarToolbarRegistry)
    protected tabBarToolBarRegistry: TabBarToolbarRegistry,
    @inject(CommandRegistry) protected commandRegistry: CommandRegistry,
    @inject(LabelParser) protected labelParser: LabelParser
  ) {
    const leftToolbarWidget = new ArduinoToolbar(
      tabBarToolBarRegistry,
      commandRegistry,
      labelParser,
      'left'
    );
    const rightToolbarWidget = new ArduinoToolbar(
      tabBarToolBarRegistry,
      commandRegistry,
      labelParser,
      'right'
    );
    this.arduinoToolbarContainer = new ArduinoToolbarContainer(
      leftToolbarWidget,
      rightToolbarWidget
    );
  }

  onStart(app: FrontendApplication) {
    app.shell.addWidget(this.arduinoToolbarContainer, {
      area: 'top',
    });
  }
}
