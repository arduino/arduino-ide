import * as React from '@theia/core/shared/react';
import { Key, KeyCode } from '@theia/core/lib/browser/keys';
import { Board } from '../../../common/protocol/boards-service';
import { isOSX } from '@theia/core/lib/common/os';
import { DisposableCollection, nls } from '@theia/core/lib/common';
import { SerialConnectionManager } from '../serial-connection-manager';
import { SerialPlotter } from '../plotter/protocol';

export namespace SerialMonitorSendInput {
  export interface Props {
    readonly serialConnection: SerialConnectionManager;
    readonly onSend: (text: string) => void;
    readonly resolveFocus: (element: HTMLElement | undefined) => void;
  }
  export interface State {
    text: string;
    connected: boolean;
  }
}

export class SerialMonitorSendInput extends React.Component<
  SerialMonitorSendInput.Props,
  SerialMonitorSendInput.State
> {
  protected toDisposeBeforeUnmount = new DisposableCollection();

  constructor(props: Readonly<SerialMonitorSendInput.Props>) {
    super(props);
    this.state = { text: '', connected: false };
    this.onChange = this.onChange.bind(this);
    this.onSend = this.onSend.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  override componentDidMount(): void {
    this.props.serialConnection.isBESerialConnected().then((connected) => {
      this.setState({ connected });
    });

    this.toDisposeBeforeUnmount.pushAll([
      this.props.serialConnection.onRead(({ messages }) => {
        if (
          messages.command ===
            SerialPlotter.Protocol.Command.MIDDLEWARE_CONFIG_CHANGED &&
          'connected' in messages.data
        ) {
          this.setState({ connected: messages.data.connected });
        }
      }),
    ]);
  }

  override componentWillUnmount(): void {
    // TODO: "Your preferred browser's local storage is almost full." Discard `content` before saving layout?
    this.toDisposeBeforeUnmount.dispose();
  }

  override render(): React.ReactNode {
    return (
      <input
        ref={this.setRef}
        type="text"
        className={`theia-input ${this.state.connected ? '' : 'warning'}`}
        placeholder={this.placeholder}
        value={this.state.text}
        onChange={this.onChange}
        onKeyDown={this.onKeyDown}
      />
    );
  }

  protected get placeholder(): string {
    const serialConfig = this.props.serialConnection.getConfig();
    if (!this.state.connected || !serialConfig) {
      return nls.localize(
        'arduino/serial/notConnected',
        'Not connected. Select a board and a port to connect automatically.'
      );
    }
    const { board, port } = serialConfig;
    return nls.localize(
      'arduino/serial/message',
      "Message ({0} + Enter to send message to '{1}' on '{2}')",
      isOSX ? '⌘' : nls.localize('vscode/keybindingLabels/ctrlKey', 'Ctrl'),
      board
        ? Board.toString(board, {
            useFqbn: false,
          })
        : 'unknown',
      port ? port.address : 'unknown'
    );
  }

  protected setRef = (element: HTMLElement | null) => {
    if (this.props.resolveFocus) {
      this.props.resolveFocus(element || undefined);
    }
  };

  protected onChange(event: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({ text: event.target.value });
  }

  protected onSend(): void {
    this.props.onSend(this.state.text);
    this.setState({ text: '' });
  }

  protected onKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    const keyCode = KeyCode.createKeyCode(event.nativeEvent);
    if (keyCode) {
      const { key, meta, ctrl } = keyCode;
      if (key === Key.ENTER && ((isOSX && meta) || (!isOSX && ctrl))) {
        this.onSend();
      }
    }
  }
}
