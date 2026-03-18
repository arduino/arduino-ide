import React from '@theia/core/shared/react';
import { Event } from '@theia/core/lib/common/event';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { messagesToLines, truncateLines, joinLines } from './monitor-utils';
import { MonitorManagerProxyClient } from '../../../common/protocol';
import { MonitorModel } from '../../monitor-model';
import { ClipboardService } from '@theia/core/lib/browser/clipboard-service';

export type Line = { message: string; timestamp?: Date; lineLen: number };

export class SerialMonitorOutput extends React.Component<
  SerialMonitorOutput.Props,
  SerialMonitorOutput.State
> {
  /**
   * Do not touch it. It is used to be able to "follow" the serial monitor log.
   */
  protected toDisposeBeforeUnmount = new DisposableCollection();
  private serialTextAreaRef = React.createRef<HTMLTextAreaElement>();


  constructor(props: Readonly<SerialMonitorOutput.Props>) {
    super(props);
    this.state = {
      lines: [],
      timestamp: this.props.monitorModel.timestamp,
      charCount: 0,
    };
  }

  override render(): React.ReactNode {
  const text = joinLines(this.state.lines).replace(/\u0000/g, '\u25A1');
  return (
    <textarea
      ref={this.serialTextAreaRef}
      readOnly
      value={text}
      style={{
        width: '100%',
        height: this.props.height,
        resize: 'none',
        fontFamily: 'var(--monospace-font-family, "Menlo", "Ubuntu Mono", "Courier New", monospace)',
        fontSize: 'var(--monospace-font-size, 12px)',
        lineHeight: '18px',
        whiteSpace: 'pre',
        overflowY: 'scroll',
        background: 'var(--theia-editor-background)',
        color: 'var(--theia-editor-foreground)',
        border: 'none',
        outline: 'none',
        cursor: 'text',
        boxSizing: 'border-box',
        padding: '4px 8px',
      }}
    />
  );
}

  override shouldComponentUpdate(): boolean {
    return true;
  }

  override componentDidMount(): void {
    this.scrollToBottom();
    this.toDisposeBeforeUnmount.pushAll([
      this.props.monitorManagerProxy.onMessagesReceived(({ messages }) => {
        const [newLines, totalCharCount] = messagesToLines(
          messages,
          this.state.lines,
          this.state.charCount
        );
        const [lines, charCount] = truncateLines(newLines, totalCharCount);
        this.setState(
          {
            lines,
            charCount,
          },
          () => this.scrollToBottom()
        );
      }),
      this.props.clearConsoleEvent(() =>
        this.setState({ lines: [], charCount: 0 })
      ),
      this.props.copyOutputEvent(() => {
        const text = joinLines(this.state.lines);
        // Replace null characters with a visible symbol
        const safe = text.replace(/\u0000/g, '\u25A1');
        this.props.clipboardService.writeText(safe);
      }),
      this.props.monitorModel.onChange(({ property }) => {
        if (property === 'timestamp') {
          const { timestamp } = this.props.monitorModel;
          this.setState({ timestamp });
        }
        if (property === 'autoscroll') {
          this.scrollToBottom();
        }
      }),
    ]);
  }

  override componentWillUnmount(): void {
    // TODO: "Your preferred browser's local storage is almost full." Discard `content` before saving layout?
    this.toDisposeBeforeUnmount.dispose();
  }

  private readonly scrollToBottom = () => {
    const ta = this.serialTextAreaRef.current;
    if (ta && this.props.monitorModel.autoscroll) {
      ta.scrollTop = ta.scrollHeight;
    }
  };
}

export namespace SerialMonitorOutput {
  export interface Props {
    readonly monitorModel: MonitorModel;
    readonly monitorManagerProxy: MonitorManagerProxyClient;
    readonly clearConsoleEvent: Event<void>;
    readonly copyOutputEvent: Event<void>;
    readonly clipboardService: ClipboardService;
    readonly height: number;
  }

  export interface State {
    lines: Line[];
    timestamp: boolean;
    charCount: number;
  }

  export interface SelectOption<T> {
    readonly label: string;
    readonly value: T;
  }

  export const MAX_CHARACTERS = 1_000_000;
}
