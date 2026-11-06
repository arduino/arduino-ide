import React from '@theia/core/shared/react';
import { Event } from '@theia/core/lib/common/event';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { areEqual, FixedSizeList as List } from 'react-window';
import {
  messagesToLines,
  truncateLines,
  linesToPlainText,
  formatTimestamp,
} from './monitor-utils';
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
  private listRef: React.RefObject<List>;
  private containerRef: React.RefObject<HTMLDivElement>;

  constructor(props: Readonly<SerialMonitorOutput.Props>) {
    super(props);
    this.listRef = React.createRef();
    this.containerRef = React.createRef();
    this.state = {
      lines: [],
      timestamp: this.props.monitorModel.timestamp,
      charCount: 0,
    };
  }

  override render(): React.ReactNode {
    return (
      <div
        className={SerialMonitorOutput.CONTAINER_CLASS}
        tabIndex={0}
        ref={this.containerRef}
        onCopy={this.onCopy}
      >
        <List
          className="serial-monitor-messages"
          height={this.props.height}
          itemData={{
            lines: this.state.lines,
            timestamp: this.state.timestamp,
          }}
          itemCount={this.state.lines.length}
          itemSize={18}
          width={'100%'}
          style={{ whiteSpace: 'nowrap' }}
          ref={this.listRef}
        >
          {Row}
        </List>
      </div>
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
      this.props.copyOutputEvent(() =>
        this.props.clipboardService.writeText(
          linesToPlainText(this.state.lines, this.state.timestamp)
        )
      ),
      this.props.selectAllEvent(() => this.selectAll()),
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
    if (this.listRef.current && this.props.monitorModel.autoscroll) {
      this.listRef.current.scrollToItem(this.state.lines.length, 'end');
    }
  };

  private readonly selectAll = (): void => {
    const node = this.containerRef.current;
    if (node) {
      node.focus();
      document.getSelection()?.selectAllChildren(node);
    }
  };

  /**
   * Only the visible rows are rendered, so a "select all" is a selection of
   * the container itself. A mouse selection starts and ends in the rows.
   */
  private isAllSelected(): boolean {
    const node = this.containerRef.current;
    const selection = document.getSelection();
    return (
      !!node &&
      !!selection &&
      selection.anchorNode === node &&
      selection.focusNode === node &&
      selection.anchorOffset === 0 &&
      selection.focusOffset === node.childNodes.length
    );
  }

  private readonly onCopy = (event: React.ClipboardEvent): void => {
    const text = this.isAllSelected()
      ? linesToPlainText(this.state.lines, this.state.timestamp)
      : document.getSelection()?.toString();
    if (text) {
      // Write the monitor output as plain text to the clipboard. The
      // default behavior would copy the formatted HTML of the visible rows.
      event.preventDefault();
      event.clipboardData.setData('text/plain', text);
    }
  };
}

const _Row = ({
  index,
  style,
  data,
}: {
  index: number;
  style: any;
  data: { lines: Line[]; timestamp: boolean };
}) => {
  const lineTimestamp = data.lines[index].timestamp;
  const timestamp =
    (data.timestamp && lineTimestamp && formatTimestamp(lineTimestamp)) || '';
  return (
    (data.lines[index].lineLen && (
      <div style={style}>
        <pre>
          {timestamp}
          {data.lines[index].message}
        </pre>
      </div>
    )) ||
    null
  );
};
const Row = React.memo(_Row, areEqual);

export namespace SerialMonitorOutput {
  /**
   * CSS class of the focusable output container. Keybindings that must only
   * be active inside the output area check the current focus against it.
   */
  export const CONTAINER_CLASS = 'serial-monitor-messages-container';

  export interface Props {
    readonly monitorModel: MonitorModel;
    readonly monitorManagerProxy: MonitorManagerProxyClient;
    readonly clearConsoleEvent: Event<void>;
    readonly copyOutputEvent: Event<void>;
    readonly selectAllEvent: Event<void>;
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
