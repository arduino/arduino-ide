import * as React from 'react';
import { Key, KeyCode } from '@theia/core/lib/browser/keys';
import { Board, Port } from '../../../common/protocol/boards-service';
import { SerialConfig } from '../../../common/protocol/serial-service';
import { isOSX } from '@theia/core/lib/common/os';
import { nls } from '@theia/core/lib/common';

export namespace SerialMonitorSendInput {
  export interface Props {
    readonly serialConfig?: SerialConfig;
    readonly onSend: (text: string) => void;
    readonly resolveFocus: (element: HTMLElement | undefined) => void;
  }
  export interface State {
    text: string;
  }
}

export class SerialMonitorSendInput extends React.Component<
  SerialMonitorSendInput.Props,
  SerialMonitorSendInput.State
> {
  constructor(props: Readonly<SerialMonitorSendInput.Props>) {
    super(props);
    this.state = { text: '' };
    this.onChange = this.onChange.bind(this);
    this.onSend = this.onSend.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  render(): React.ReactNode {
    return (
      <input
        ref={this.setRef}
        type="text"
        className={`theia-input ${this.props.serialConfig ? '' : 'warning'}`}
        placeholder={this.placeholder}
        value={this.state.text}
        onChange={this.onChange}
        onKeyDown={this.onKeyDown}
      />
    );
  }

  protected get placeholder(): string {
    const { serialConfig } = this.props;
    if (!serialConfig) {
      return nls.localize(
        'arduino/serial/notConnected',
        'Not connected. Select a board and a port to connect automatically.'
      );
    }
    const { board, port } = serialConfig;
    return nls.localize(
      'arduino/serial/message',
      "Message ({0} + Enter to send message to '{1}' on '{2}'",
      isOSX ? '⌘' : nls.localize('vscode/keybindingLabels/ctrlKey', 'Ctrl'),
      Board.toString(board, {
        useFqbn: false,
      }),
      Port.toString(port)
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
