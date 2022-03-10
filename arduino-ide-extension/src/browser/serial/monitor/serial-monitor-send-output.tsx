import * as React from 'react';
import { Event } from '@theia/core/lib/common/event';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { areEqual, FixedSizeList as List } from 'react-window';
import dateFormat = require('dateformat');
import { messagesToLines, truncateLines } from './monitor-utils';
import { MonitorManagerProxyClient } from '../../../common/protocol';
import { MonitorModel } from '../../monitor-model';

export type Line = { message: string; timestamp?: Date; lineLen: number };

export class SerialMonitorOutput extends React.Component<
  SerialMonitorOutput.Props,
  SerialMonitorOutput.State
> {
  /**
   * Do not touch it. It is used to be able to "follow" the serial monitor log.
   */
  protected toDisposeBeforeUnmount = new DisposableCollection();
  private listRef: React.RefObject<any>;

  constructor(props: Readonly<SerialMonitorOutput.Props>) {
    super(props);
    this.listRef = React.createRef();
    this.state = {
      lines: [],
      timestamp: this.props.monitorModel.timestamp,
      charCount: 0,
    };
  }

  render(): React.ReactNode {
    return (
      <List
        className="serial-monitor-messages"
        height={this.props.height}
        itemData={
          {
            lines: this.state.lines,
            timestamp: this.state.timestamp,
          } as any
        }
        itemCount={this.state.lines.length}
        itemSize={18}
        width={'100%'}
        style={{ whiteSpace: 'nowrap' }}
        ref={this.listRef}
      >
        {Row}
      </List>
    );
  }

  shouldComponentUpdate(): boolean {
    return true;
  }

  componentDidMount(): void {
    this.scrollToBottom();
    this.toDisposeBeforeUnmount.pushAll([
      this.props.monitorManagerProxy.onMessagesReceived(({ messages }) => {
        const [newLines, totalCharCount] = messagesToLines(
          messages,
          this.state.lines,
          this.state.charCount
        );
        const [lines, charCount] = truncateLines(newLines, totalCharCount);
        this.setState({
          lines,
          charCount,
        });
        this.scrollToBottom();
      }),
      this.props.clearConsoleEvent(() =>
        this.setState({ lines: [], charCount: 0 })
      ),
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

  componentWillUnmount(): void {
    // TODO: "Your preferred browser's local storage is almost full." Discard `content` before saving layout?
    this.toDisposeBeforeUnmount.dispose();
  }

  scrollToBottom = ((): void => {
    if (this.listRef.current && this.props.monitorModel.autoscroll) {
      this.listRef.current.scrollToItem(this.state.lines.length, 'end');
    }
  }).bind(this);
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
  const timestamp =
    (data.timestamp &&
      `${dateFormat(data.lines[index].timestamp, 'H:M:ss.l')} -> `) ||
    '';
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
  export interface Props {
    readonly monitorModel: MonitorModel;
    readonly monitorManagerProxy: MonitorManagerProxyClient;
    readonly clearConsoleEvent: Event<void>;
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
