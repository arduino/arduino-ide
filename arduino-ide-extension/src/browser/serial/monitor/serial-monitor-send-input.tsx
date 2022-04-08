import * as React from 'react';
import { Key, KeyCode } from '@theia/core/lib/browser/keys';
import { Board } from '../../../common/protocol/boards-service';
import { isOSX } from '@theia/core/lib/common/os';
import { DisposableCollection, nls } from '@theia/core/lib/common';
import { MonitorManagerProxyClient } from '../../../common/protocol';
import { BoardsServiceProvider } from '../../boards/boards-service-provider';
import { timeout } from '@theia/core/lib/common/promise-util';

export namespace SerialMonitorSendInput {
  export interface Props {
    readonly boardsServiceProvider: BoardsServiceProvider;
    readonly monitorManagerProxy: MonitorManagerProxyClient;
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
    this.state = { text: '', connected: true };
    this.onChange = this.onChange.bind(this);
    this.onSend = this.onSend.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  componentDidMount(): void {
    this.setState({ connected: true });

    const checkWSConnection = new Promise<boolean>((resolve) => {
      this.props.monitorManagerProxy.onWSConnectionChanged((connected) => {
        this.setState({ connected });
        resolve(true);
      });
    });

    const checkWSTimeout = timeout(1000).then(() => false);

    Promise.race<boolean>([checkWSConnection, checkWSTimeout]).then(
      async (resolved) => {
        if (!resolved) {
          const connected =
            await this.props.monitorManagerProxy.isWSConnected();
          this.setState({ connected });
        }
      }
    );
  }

  componentWillUnmount(): void {
    // TODO: "Your preferred browser's local storage is almost full." Discard `content` before saving layout?
    this.toDisposeBeforeUnmount.dispose();
  }

  render(): React.ReactNode {
    return (
      <input
        ref={this.setRef}
        type="text"
        className={`theia-input ${this.shouldShowWarning() ? 'warning' : ''}`}
        placeholder={this.placeholder}
        value={this.state.text}
        onChange={this.onChange}
        onKeyDown={this.onKeyDown}
      />
    );
  }

  protected shouldShowWarning(): boolean {
    const board = this.props.boardsServiceProvider.boardsConfig.selectedBoard;
    const port = this.props.boardsServiceProvider.boardsConfig.selectedPort;
    return !this.state.connected || !board || !port;
  }

  protected get placeholder(): string {
    if (this.shouldShowWarning()) {
      return nls.localize(
        'arduino/serial/notConnected',
        'Not connected. Select a board and a port to connect automatically.'
      );
    }

    const board = this.props.boardsServiceProvider.boardsConfig.selectedBoard;
    const port = this.props.boardsServiceProvider.boardsConfig.selectedPort;
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
