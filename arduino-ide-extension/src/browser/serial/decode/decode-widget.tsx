import * as React from '@theia/core/shared/react';
import { injectable, inject } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/lib/common/event';
import URI from '@theia/core/lib/common/uri';
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
import { CurrentSketch, SketchesServiceClientImpl } from '../../sketches-service-client-impl';
import { BoardsServiceProvider } from '../../boards/boards-service-provider';

@injectable()
export class DecodeWidget extends ReactWidget {

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

  constructor(
    @inject(ConfigService)
    protected readonly configService: ConfigService,

    @inject(BoardsServiceProvider)
    protected readonly boardsServiceProvider: BoardsServiceProvider,

    @inject(SketchesServiceClientImpl)
    protected readonly sketchServiceClient: SketchesServiceClientImpl,
  ) {
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
    const configPath = await this.configService.getConfiguration()
      .then(({config}) => (new URI(config?.dataDirUri)).path);
    const boards = this.boardsServiceProvider.boardsConfig
    const fqbn = boards.selectedBoard?.fqbn;
    if(!fqbn) {
      return
    }
    const selectedBoard = fqbn.split(':')[1];
    const currentSketch = await this.sketchServiceClient.currentSketch();
    if (!CurrentSketch.isValid(currentSketch)) {
      return;
    }
    const sketchUri = (new URI(currentSketch.uri)).path;
    const elfPath = `${sketchUri}/build/${fqbn.split(':').join('.')}/${currentSketch.name}.ino.elf`;

    // * enters an unkown foldername, in this case the version of gcc
    const xtensaPath= `${configPath}/packages/${selectedBoard}/tools/xtensa-${selectedBoard}-elf-gcc/\*/bin/xtensa-${selectedBoard}-elf-addr2line`;
    const regex = new RegExp(/0x4(\d|[a-f]|[A-F]){7}/g);
    const arrAddresses = value.match(regex);
    if(!arrAddresses) {
      return this.decodeOutputElement.current.decodeText('Provided format can not be decoded!');
    }
    let decodeResult = '';
    for(let i=0;i<arrAddresses.length; i++) {  
      let result = await spawnCommand(`${xtensaPath}`, [
        '-pfiaC',
        '-e',
        `${elfPath}`,
        `"${arrAddresses[i]}"`,
      ]);

      // only display rows which are readable
      if(!result.includes("??")) {
        decodeResult += `${result}`;
      }
    }
    this.decodeOutputElement.current.decodeText(decodeResult);
  }
}