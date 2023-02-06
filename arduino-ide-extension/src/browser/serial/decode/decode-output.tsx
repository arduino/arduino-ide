import * as React from '@theia/core/shared/react';
import { Event } from '@theia/core/lib/common/event';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
// import { areEqual } from 'react-window';

export type Line = { message: string; lineLen: number };

export class DecodeOutput extends React.Component<
  DecodeOutput.Props,
  DecodeOutput.State
> {
  /**
   * Do not touch it. It is used to be able to "follow" the serial monitor log.
   */
  protected toDisposeBeforeUnmount = new DisposableCollection();
  private listRef: React.RefObject<any>;

  constructor(props: Readonly<DecodeOutput.Props>) {
    super(props);
    this.listRef = React.createRef();
    this.state = {
      lines: [],
      charCount: 0,
      text: '',
    };
  }

  decodeText = (value: string) => {
    this.setState({ text: value });
  };

  override render(): React.ReactNode {
    return (
      // <List
      //   className="serial-monitor-messages"
      //   height={this.props.height}
      //   itemData={
      //     {
      //       lines: this.state.lines,
      //     } as any
      //   }
      //   itemCount={this.state.lines.length}
      //   itemSize={18}
      //   width={'100%'}
      //   style={{ whiteSpace: 'nowrap' }}
      //   ref={this.listRef}
      // >
      //   {Row}
      // </List>
      <div style={{ whiteSpace: 'pre-wrap' }}>{this.state.text}</div>
    );
  }

  override shouldComponentUpdate(): boolean {
    return true;
  }

  override componentDidMount(): void {
    this.scrollToBottom();
    this.toDisposeBeforeUnmount.pushAll([
      this.props.clearConsoleEvent(() =>
        this.setState({ lines: [], charCount: 0 })
      ),
    ]);
  }

  override componentWillUnmount(): void {
    // TODO: "Your preferred browser's local storage is almost full." Discard `content` before saving layout?
    this.toDisposeBeforeUnmount.dispose();
  }

  scrollToBottom = ((): void => {
    if (this.listRef.current) {
      this.listRef.current.scrollToItem(this.state.lines.length, 'end');
    }
  }).bind(this);
}

// const _Row = ({
//   index,
//   style,
//   data,
// }: {
//   index: number;
//   style: any;
//   data: { lines: Line[]; timestamp: boolean };
// }) => {
//   return (
//     (data.lines[index].lineLen && (
//       <div style={style}>
//         <pre>
//           {data.lines[index].message}
//         </pre>
//       </div>
//     )) ||
//     null
//   );
// };
// const Row = React.memo(_Row, areEqual);

export namespace DecodeOutput {
  export interface Props {
    readonly clearConsoleEvent: Event<void>;
    readonly height: number;
  }

  export interface State {
    lines: Line[];
    charCount: number;
    text: string;
  }

  export interface SelectOption<T> {
    readonly label: string;
    readonly value: T;
  }

  export const MAX_CHARACTERS = 1_000_000;
}
