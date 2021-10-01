import * as React from 'react';
import { Event } from '@theia/core/lib/common/event';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { MonitorModel } from './monitor-model';
import { MonitorConnection } from './monitor-connection';
import dateFormat = require('dateformat');
import { messageToLines, truncateLines } from './monitor-utils';

export type Line = { message: string; timestamp?: Date };

export class SerialMonitorOutput extends React.Component<
  SerialMonitorOutput.Props,
  SerialMonitorOutput.State
> {
  /**
   * Do not touch it. It is used to be able to "follow" the serial monitor log.
   */
  protected anchor: HTMLElement | null;
  protected toDisposeBeforeUnmount = new DisposableCollection();

  constructor(props: Readonly<SerialMonitorOutput.Props>) {
    super(props);
    this.state = {
      lines: [],
      timestamp: this.props.monitorModel.timestamp,
      charCount: 0,
    };
  }

  render(): React.ReactNode {
    return (
      <React.Fragment>
        <AutoSizer>
          {({ height, width }) => (
            <List
              className="List"
              height={height}
              itemData={
                {
                  lines: this.state.lines,
                  timestamp: this.state.timestamp,
                } as any
              }
              itemCount={this.state.lines.length}
              itemSize={20}
              width={width}
            >
              {Row}
            </List>
          )}
        </AutoSizer>
        {/* <div style={{ whiteSpace: 'pre', fontFamily: 'monospace' }}>
          {this.state.lines.map((line, i) => (
            <MonitorTextLine text={line} key={i} />
          ))}
        </div> */}
        <div
          style={{ float: 'left', clear: 'both' }}
          ref={(element) => {
            this.anchor = element;
          }}
        />
      </React.Fragment>
    );
  }

  shouldComponentUpdate(): boolean {
    return true;
  }

  componentDidMount(): void {
    this.scrollToBottom();
    this.toDisposeBeforeUnmount.pushAll([
      this.props.monitorConnection.onRead(({ messages }) => {
        const [newLines, charsToAddCount] = messageToLines(
          messages,
          this.state.lines
        );
        const [lines, charCount] = truncateLines(
          newLines,
          this.state.charCount + charsToAddCount
        );

        this.setState({
          lines,
          charCount,
        });
      }),
      this.props.clearConsoleEvent(() => this.setState({ lines: [] })),
      this.props.monitorModel.onChange(({ property }) => {
        if (property === 'timestamp') {
          const { timestamp } = this.props.monitorModel;
          this.setState({ timestamp });
        }
      }),
    ]);
  }

  componentDidUpdate(): void {
    this.scrollToBottom();
  }

  componentWillUnmount(): void {
    // TODO: "Your preferred browser's local storage is almost full." Discard `content` before saving layout?
    this.toDisposeBeforeUnmount.dispose();
  }

  protected scrollToBottom(): void {
    if (this.props.monitorModel.autoscroll && this.anchor) {
      this.anchor.scrollIntoView();
      // this.listRef.current.scrollToItem(this.state.lines.length);
    }
  }
}

const Row = ({
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
    <div style={style}>
      {timestamp}
      {data.lines[index].message}
    </div>
  );
};

export namespace SerialMonitorOutput {
  export interface Props {
    readonly monitorModel: MonitorModel;
    readonly monitorConnection: MonitorConnection;
    readonly clearConsoleEvent: Event<void>;
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
