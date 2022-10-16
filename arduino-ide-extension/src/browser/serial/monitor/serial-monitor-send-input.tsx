import * as React from '@theia/core/shared/react';
import { Key, KeyCode } from '@theia/core/lib/browser/keys';
import { Board } from '../../../common/protocol/boards-service';
import { DisposableCollection, nls } from '@theia/core/lib/common';
import { BoardsServiceProvider } from '../../boards/boards-service-provider';
import { MonitorModel } from '../../monitor-model';
import { Unknown } from '../../../common/nls';

class HistoryList {
  private ring: string[];
  private size: number;
  private begin: number;
  private index: number;
  private end: number;
  private traverse: boolean;

  constructor(size: number = 100) {
    this.init = this.init.bind(this);
    this.push = this.push.bind(this);
    this.prev = this.prev.bind(this);
    this.next = this.next.bind(this);
    this.init(size);
  }
  private init(size: number = 100) {
    this.ring = [];
    this.size = (size > 0) ? size : 1;
    this.begin = 0;
    this.index = 0;
    this.end = -1;
    this.traverse = false;
  }

  push(val: string): number {
    this.end++;
    if (this.ring.length >= this.size) {
      if (this.end >= this.size)
        this.end = 0;
      if (this.end === this.begin) {
        this.begin++;
        if (this.begin >= this.size)
          this.begin = 0;
      }
    }
    this.ring[this.end] = val;
    this.index = this.end;
    this.traverse = false;
    return this.index;
  }

  prev(): string {
    if (this.ring.length < 1) {
      return '';
    }
    if (this.index === this.end) {
      this.traverse = true;
      this.index--;
      return this.ring[this.end];
    }
    if (this.index !== this.begin) {
      if (this.traverse) {
        this.traverse = false;
      }
      else
        this.index = (this.index > 0) ? --this.index : this.size - 1;
    }

    return this.ring[this.index];
  }

  next(): string {
    if (this.ring.length < 1) {
      return '';
    }
    if (this.index !== this.end) {
      this.traverse = true;
      this.index = (++this.index < this.size) ? this.index : 0;
      if(this.index === this.end)
        this.traverse = false;
    }
    else {
      if (!this.traverse) {
        return '';
      }
    }
    return this.ring[this.index];
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
    connected: boolean;
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
    this.state = { text: '', connected: true, history: new HistoryList() };
    this.onChange = this.onChange.bind(this);
    this.onSend = this.onSend.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  override componentDidMount(): void {
    this.setState({ connected: this.props.monitorModel.connected });
    this.toDisposeBeforeUnmount.push(
      this.props.monitorModel.onChange(({ property }) => {
        if (property === 'connected')
          this.setState({ connected: this.props.monitorModel.connected });
      })
    );
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
      "Message (Enter to send message to '{0}' on '{1}')",
      board
        ? Board.toString(board, {
            useFqbn: false,
          })
        : Unknown,
      port ? port.address : Unknown
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
    this.props.onSend(this.state.text + this.props.monitorModel.lineEnding);
    this.setState({ text: '' });
  }

  protected onKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    const keyCode = KeyCode.createKeyCode(event.nativeEvent);
    if (keyCode) {
      const { key } = keyCode;
      if (key === Key.ENTER) {
        // NOTE: order of operations is critical here. Push the current state.text
        // onto the history stack before sending. After sending, state.text is empty
        // and you'd end up pushing '' onto the history stack.
        if (this.state.text.length > 0) {
          this.state.history.push(this.state.text);
        }
        this.onSend();
      } 
      else if (key === Key.ARROW_UP) {
        this.setState({ text: this.state.history.prev()});
      } 
      else if (key === Key.ARROW_DOWN) {
        this.setState({ text: this.state.history.next()});
      }
      else if (key === Key.ESCAPE) {
        this.setState({ text: ''});
      }
    }
  }
}