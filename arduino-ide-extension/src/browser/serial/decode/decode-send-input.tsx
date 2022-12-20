import * as React from '@theia/core/shared/react';
import { Key, KeyCode } from '@theia/core/lib/browser/keys';
import { DisposableCollection } from '@theia/core/lib/common';

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

export namespace DecodeSendInput {
  export interface Props {
    readonly onSend: (text: string) => void;
    readonly resolveFocus: (element: HTMLElement | undefined) => void;
  }
  export interface State {
    text: string;
    history: HistoryList;
  }
}

export class DecodeSendInput extends React.Component<
  DecodeSendInput.Props,
  DecodeSendInput.State
> {
  protected toDisposeBeforeUnmount = new DisposableCollection();

  constructor(props: Readonly<DecodeSendInput.Props>) {
    super(props);
    this.state = { text: '', history: new HistoryList() };
    this.onChange = this.onChange.bind(this);
    this.onSend = this.onSend.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
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
        className='theia-input'
        placeholder={this.placeholder}
        value={this.state.text}
        onChange={this.onChange}
        onKeyDown={this.onKeyDown}
      />
    );
  }

  protected get placeholder(): string {

    return 'Enter backtrace text to decode. (Ex: Backtrace: 0x40086e7c:0x3ffb4ff0...)';
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
    this.props.onSend(this.state.text);
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
