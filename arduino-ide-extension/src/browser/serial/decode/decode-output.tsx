import * as React from '@theia/core/shared/react';
import { Event } from '@theia/core/lib/common/event';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { spawnCommand } from '../../../node/exec-util';

export type Line = { message: string; lineLen: number };
export type Element = {
  address: string;
  function: string;
  path: {
    value: string;
    isLink: boolean;
  }
  lineNumber: string
};

export class DecodeOutput extends React.Component<
  DecodeOutput.Props,
  DecodeOutput.State
> {
  /**
   * Do not touch it. It is used to be able to "follow" the serial monitor log.
   */
  protected toDisposeBeforeUnmount = new DisposableCollection();

  constructor(props: Readonly<DecodeOutput.Props>) {
    super(props);
    this.state = {
      elements: [],
    };
  }

  isClientPath = async (path:string): Promise<boolean> => {
    return await spawnCommand("cd", [
      path
    ], (err) => err)
    .then((data) => true)
    .catch(err => false)
  }

  openFinder = async (path:string) => {
    await spawnCommand("open", [
      path
    ]);
  }

  retrievePath = (dirPath:string) => {
    return dirPath.substring(0,dirPath.lastIndexOf("/")+1);
  }

  decodeText = async (value: string) => {
    const lines = value.split("\n");

    // Remove the extra newline at the end
    lines.pop();
    const elements : Array<Element> = [];
    for(let i=0;i<lines.length;i++) {
      let line = lines[i].split(/(?!\(.*)\s(?![^(]*?\))/g);
      if(line[0] === "") {
        line.shift();
      }
      let pathSplit = line[3].split(":");
      let obj: Element = {
        address: line[0],
        function: line[1],
        path: {
          value: pathSplit[0],
          isLink: false,
        },
        lineNumber: pathSplit[1]
      };
      if(await this.isClientPath(this.retrievePath(pathSplit[0]))) {
        obj = {
          address: line[0],
          function: line[1],
          path: {
            value: pathSplit[0],
            isLink: true,
          },
          lineNumber: pathSplit[1]
        };
      }
      elements.push(obj);
    }
    this.setState({ elements });
  };

  override render(): React.ReactNode {
    return (
      <div style={{ whiteSpace: 'pre-wrap' }}>
        {this.state.elements.map((element) => (
          <div style={{display: "inline-block"}}>
            <span style={{color: "green"}}>{element.address} </span>
            <span style={{color: "blue", fontWeight: "bold"}}>{element.function} </span>
            at
            { element.path.isLink ? <a><span onClick={async () => await this.openFinder(this.retrievePath(element.path.value))}>{element.path.value}</span></a> : <span> {element.path.value} </span> }
            line
            <span style={{fontWeight: "bold"}}> {element.lineNumber}</span>
          </div>
        ))}
      </div>
    );
  }

  override shouldComponentUpdate(): boolean {
    return true;
  }

  override componentDidMount(): void {
    this.toDisposeBeforeUnmount.pushAll([
      this.props.clearConsoleEvent(() =>
        this.setState({ elements: [] })
      ),
    ]);
  }

  override componentWillUnmount(): void {
    // TODO: "Your preferred browser's local storage is almost full." Discard `content` before saving layout?
    this.toDisposeBeforeUnmount.dispose();
  }
}

export namespace DecodeOutput {
  export interface Props {
    readonly clearConsoleEvent: Event<void>;
    readonly height: number;
  }

  export interface State {
    elements: Element[];
  }

  export interface SelectOption<T> {
    readonly label: string;
    readonly value: T;
  }

  export const MAX_CHARACTERS = 1_000_000;
}
