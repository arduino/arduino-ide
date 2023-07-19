import * as React from '@theia/core/shared/react';
import { Key, KeyCode } from '@theia/core/lib/browser/keys';
import { Board } from '../../../common/protocol/boards-service';
import { DisposableCollection, nls } from '@theia/core/lib/common';
import { BoardsServiceProvider } from '../../boards/boards-service-provider';
import { MonitorModel } from '../../monitor-model';
import { Unknown } from '../../../common/nls';
import {
  isMonitorConnectionError,
  MonitorConnectionStatus,
} from '../../../common/protocol';

class HistoryList {
  private readonly items: string[] = [];
  private index = -1;

  constructor(private readonly size = 100) {}

  push(val: string): void {
    if (val !== this.items[this.items.length - 1]) {
      this.items.push(val);
    }
    while (this.items.length > this.size) {
      this.items.shift();
    }
    this.index = -1;
  }

  previous(): string {
    if (this.index === -1) {
      this.index = this.items.length - 1;
      return this.items[this.index];
    }
    if (this.hasPrevious) {
      return this.items[--this.index];
    }
    return this.items[this.index];
  }

  private get hasPrevious(): boolean {
    return this.index >= 1;
  }

  next(): string {
    if (this.index === this.items.length - 1) {
      this.index = -1;
      return '';
    }
    if (this.hasNext) {
      return this.items[++this.index];
    }
    return '';
  }

  private get hasNext(): boolean {
    return this.index >= 0 && this.index !== this.items.length - 1;
  }
}

export namespace SerialMonitorSendInput {
  export interface Props {
    readonly boardsServiceProvider: BoardsServiceProvider;
    readonly monitorModel: MonitorModel;
    readonly onSend: (text: string) => void;
    readonly resolveFocus: (element: HTMLElement | undefined) => void;
  }
  export interface State {
    text: string;
    connectionStatus: MonitorConnectionStatus;
    history: HistoryList;
  }
}

export class SerialMonitorSendInput extends React.Component<
  SerialMonitorSendInput.Props,
  SerialMonitorSendInput.State
> {
  protected toDisposeBeforeUnmount = new DisposableCollection();

  constructor(props: Readonly<SerialMonitorSendInput.Props>) {
    super(props);
    this.state = {
      text: '',
      connectionStatus: 'not-connected',
      history: new HistoryList(),
    };
    this.onChange = this.onChange.bind(this);
    this.onSend = this.onSend.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  override componentDidMount(): void {
    this.setState({
      connectionStatus: this.props.monitorModel.connectionStatus,
    });
    this.toDisposeBeforeUnmount.push(
      this.props.monitorModel.onChange(({ property }) => {
        if (property === 'connected' || property === 'connectionStatus') {
          this.setState({
            connectionStatus: this.props.monitorModel.connectionStatus,
          });
        }
      })
    );
  }

  override componentWillUnmount(): void {
    // TODO: "Your preferred browser's local storage is almost full." Discard `content` before saving layout?
    this.toDisposeBeforeUnmount.dispose();
  }

  override render(): React.ReactNode {
    const status = this.state.connectionStatus;
    const input = this.renderInput(status);
    if (status !== 'connecting') {
      return input;
    }
    return <label>{input}</label>;
  }

  private renderInput(status: MonitorConnectionStatus): React.ReactNode {
    const inputClassName = this.inputClassName(status);
    const placeholder = this.placeholder;
    const readOnly = Boolean(inputClassName);
    return (
      <input
        ref={this.setRef}
        type="text"
        className={`theia-input ${inputClassName}`}
        readOnly={readOnly}
        placeholder={placeholder}
        title={placeholder}
        value={readOnly ? '' : this.state.text} // always show the placeholder if cannot edit the <input>
        onChange={this.onChange}
        onKeyDown={this.onKeyDown}
      />
    );
  }

  private inputClassName(
    status: MonitorConnectionStatus
  ): 'error' | 'warning' | '' {
    if (isMonitorConnectionError(status)) {
      return 'error';
    }
    if (status === 'connected') {
      return '';
    }
    return 'warning';
  }

  protected shouldShowWarning(): boolean {
    const board = this.props.boardsServiceProvider.boardsConfig.selectedBoard;
    const port = this.props.boardsServiceProvider.boardsConfig.selectedPort;
    return !this.state.connectionStatus || !board || !port;
  }

  protected get placeholder(): string {
    const status = this.state.connectionStatus;
    if (isMonitorConnectionError(status)) {
      return status.errorMessage;
    }
    if (status === 'not-connected') {
      return nls.localize(
        'arduino/serial/notConnected',
        'Not connected. Select a board and a port to connect automatically.'
      );
    }
    const board = this.props.boardsServiceProvider.boardsConfig.selectedBoard;
    const port = this.props.boardsServiceProvider.boardsConfig.selectedPort;
    const boardLabel = board
      ? Board.toString(board, {
          useFqbn: false,
        })
      : Unknown;
    const portLabel = port ? port.address : Unknown;
    if (status === 'connecting') {
      return nls.localize(
        'arduino/serial/connecting',
        "Connecting to '{0}' on '{1}'...",
        boardLabel,
        portLabel
      );
    }
    return nls.localize(
      'arduino/serial/message',
      "Message (Enter to send message to '{0}' on '{1}')",
      boardLabel,
      portLabel
    );
  }

  protected setRef = (element: HTMLElement | null): void => {
    if (this.props.resolveFocus) {
      this.props.resolveFocus(element || undefined);
    }
  };

  protected onChange(event: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({ text: event.target.value });
  }

  protected onSend(): void {
    this.props.onSend(this.state.text + this.props.monitorModel.lineEnding);
    this.setState({ text: '' });
  }

  protected onKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    const keyCode = KeyCode.createKeyCode(event.nativeEvent);
    if (keyCode) {
      const { key } = keyCode;
      if (key === Key.ENTER) {
        const { text } = this.state;
        this.onSend();
        if (text) {
          this.state.history.push(text);
        }
      } else if (key === Key.ARROW_UP) {
        this.setState({ text: this.state.history.previous() });
      } else if (key === Key.ARROW_DOWN) {
        this.setState({ text: this.state.history.next() });
      } else if (key === Key.ESCAPE) {
        this.setState({ text: '' });
      }
    }
  }
}
