import * as React from '@theia/core/shared/react';
import { injectable, inject } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/lib/common/event';
import {
  ReactWidget,
  Message,
  Widget,
  MessageLoop,
} from '@theia/core/lib/browser/widgets';
import { DecodeSendInput } from './decode-send-input';
import { DecodeOutput } from './decode-output';
import { spawnCommand } from '../../../node/exec-util';
import { ConfigService } from '../../../common/protocol';


@injectable()
export class DecodeWidget extends ReactWidget {

  @inject(ConfigService)
  protected readonly configService: ConfigService;

  static readonly LABEL = 'Decode Box';
  static readonly ID = 'decode-box';
  protected widgetHeight: number;
  protected text: string;
  private decodeOutputElement: React.RefObject<any>;

  /**
   * Do not touch or use it. It is for setting the focus on the `input` after the widget activation.
   */
  protected focusNode: HTMLElement | undefined;
  /**
   * Guard against re-rendering the view after the close was requested.
   * See: https://github.com/eclipse-theia/theia/issues/6704
   */
  protected closing = false;
  protected readonly clearOutputEmitter = new Emitter<void>();

  constructor() {
    super();
    this.id = DecodeWidget.ID;
    this.title.label = DecodeWidget.LABEL;
    this.title.iconClass = 'monitor-tab-icon';
    this.title.closable = true;
    this.scrollOptions = undefined;
    this.toDispose.push(this.clearOutputEmitter);
    this.decodeOutputElement = React.createRef();
  }

  protected override onBeforeAttach(msg: Message): void {
    this.update();
  }

  clearConsole(): void {
    this.clearOutputEmitter.fire(undefined);
    this.update();
  }

  override dispose(): void {
    super.dispose();
  }

  protected override onCloseRequest(msg: Message): void {
    this.closing = true;
    super.onCloseRequest(msg);
  }

  protected override onUpdateRequest(msg: Message): void {
    // TODO: `this.isAttached`
    // See: https://github.com/eclipse-theia/theia/issues/6704#issuecomment-562574713
    if (!this.closing && this.isAttached) {
      super.onUpdateRequest(msg);
    }
  }

  protected override onResize(msg: Widget.ResizeMessage): void {
    super.onResize(msg);
    this.widgetHeight = msg.height;
    this.update();
  }

  protected override onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    (this.focusNode || this.node).focus();
  }

  protected onFocusResolved = (element: HTMLElement | undefined) => {
    if (this.closing || !this.isAttached) {
      return;
    }
    this.focusNode = element;
    requestAnimationFrame(() =>
      MessageLoop.sendMessage(this, Widget.Msg.ActivateRequest)
    );
  };

  protected render(): React.ReactNode {

    return (
      <div 
      className="serial-monitor">
        <div className="head">
          <div className="send">
            <DecodeSendInput
              resolveFocus={this.onFocusResolved}
              onSend={this.onSend}
            />
          </div>
        </div>
        <div className="body">
          <DecodeOutput
            clearConsoleEvent={this.clearOutputEmitter.event}
            height={Math.floor(this.widgetHeight - 50)}
            ref={this.decodeOutputElement}
          />
        </div>
      </div>
    );
  }

  protected readonly onSend = (value: string) => this.doSend(value);
  protected async doSend(value: string) {
    const configPath = await this.configService.getConfiguration();
    console.log('This is the config path', configPath);
    const xtensaPath= '/Users/radurentea/Library/Arduino15/packages/esp32/tools/xtensa-esp32-elf-gcc/gcc8_4_0-esp-2021r2-patch3/bin/xtensa-esp32-elf-addr2line';
    // Add logic here; value is the backtrace user copied
    let result = await spawnCommand(`${xtensaPath}`, [
      '-pfiaC',
      '-e',
      '/Users/radurentea/Documents/Arduino/sketch_nov3a/build/esp32.esp32.esp32wroverkit/sketch_nov3a.ino.elf',
      `"${value}"`,
    ]);
    this.decodeOutputElement.current.decodeText(result);
  }
}