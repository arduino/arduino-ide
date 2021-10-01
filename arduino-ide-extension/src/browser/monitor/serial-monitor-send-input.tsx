import * as React from 'react';
import { Key, KeyCode } from '@theia/core/lib/browser/keys';
import { Board, Port } from '../../common/protocol/boards-service';
import { MonitorConfig } from '../../common/protocol/monitor-service';
import { isOSX } from '@theia/core/lib/common/os';

export namespace SerialMonitorSendInput {
  export interface Props {
    readonly monitorConfig?: MonitorConfig;
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
        className={`theia-input ${this.props.monitorConfig ? '' : 'warning'}`}
        placeholder={this.placeholder}
        value={this.state.text}
        onChange={this.onChange}
        onKeyDown={this.onKeyDown}
      />
    );
  }

  protected get placeholder(): string {
    const { monitorConfig } = this.props;
    if (!monitorConfig) {
      return 'Not connected. Select a board and a port to connect automatically.';
    }
    const { board, port } = monitorConfig;
    return `Message (${
      isOSX ? '⌘' : 'Ctrl'
    }+Enter to send message to '${Board.toString(board, {
      useFqbn: false,
    })}' on '${Port.toString(port)}')`;
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
