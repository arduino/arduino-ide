import { ReactWidget, Message } from "@theia/core/lib/browser";
import { postConstruct, injectable, inject } from "inversify";
import * as React from 'react';
import Select, { components } from 'react-select';
import { Styles } from "react-select/src/styles";
import { ThemeConfig } from "react-select/src/theme";
import { OptionsType } from "react-select/src/types";
import { MonitorServiceClientImpl } from "./monitor-service-client-impl";
import { MessageService } from "@theia/core";
import { ConnectionConfig, MonitorService } from "../../common/protocol/monitor-service";
import { MonitorConnection } from "./monitor-connection";
import { BoardsServiceClientImpl } from "../boards/boards-service-client-impl";
import { AttachedSerialBoard, BoardsService, Board } from "../../common/protocol/boards-service";
import { BoardsConfig } from "../boards/boards-config";
import { MonitorModel } from "./monitor-model";

export namespace SerialMonitorSendField {
    export interface Props {
        onSend: (text: string) => void
    }

    export interface State {
        value: string;
    }
}

export class SerialMonitorSendField extends React.Component<SerialMonitorSendField.Props, SerialMonitorSendField.State> {
    constructor(props: SerialMonitorSendField.Props) {
        super(props);
        this.state = { value: '' };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    render() {
        return <React.Fragment>
            <form onSubmit={this.handleSubmit}>
                <input type='text' id='serial-monitor-send' autoComplete='off' value={this.state.value} onChange={this.handleChange} />
                <input className="btn" type="submit" value="Submit" />
            </form>
        </React.Fragment>
    }

    protected handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ value: event.target.value });
    }

    protected handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        this.props.onSend(this.state.value);
        event.preventDefault();
    }
}

export namespace SerialMonitorOutput {
    export interface Props {
        lines: string[];
        model: MonitorModel;
    }
}

export class SerialMonitorOutput extends React.Component<SerialMonitorOutput.Props> {
    protected theEnd: HTMLDivElement | null;

    render() {
        let result = '';

        const style: React.CSSProperties = {
            whiteSpace: 'pre',
            fontFamily: 'monospace',
        };

        for (let text of this.props.lines) {
            result += text;
        }
        if (result.length === 0) {
            result = '';
        }
        return <React.Fragment>
            <div style={style}>{result}</div>
            <div style={{ float: "left", clear: "both" }}
                ref={(el) => { this.theEnd = el; }}>
            </div>
        </React.Fragment>;
    }

    protected scrollToBottom() {
        if (this.theEnd) {
            this.theEnd.scrollIntoView();
        }
    }

    componentDidMount() {
        if (this.props.model.autoscroll) {
            this.scrollToBottom();
        }
    }

    componentDidUpdate() {
        if (this.props.model.autoscroll) {
            this.scrollToBottom();
        }
    }
}

export interface SelectOption {
    label: string;
    value: string | number;
}

@injectable()
export class MonitorWidget extends ReactWidget {

    static readonly ID = 'serial-monitor';

    protected lines: string[];
    protected tempData: string;
    protected _baudRate: number;
    protected _lineEnding: string;

    constructor(
        @inject(MonitorServiceClientImpl) protected readonly serviceClient: MonitorServiceClientImpl,
        @inject(MonitorConnection) protected readonly connection: MonitorConnection,
        @inject(MonitorService) protected readonly monitorService: MonitorService,
        @inject(BoardsServiceClientImpl) protected readonly boardsServiceClient: BoardsServiceClientImpl,
        @inject(MessageService) protected readonly messageService: MessageService,
        @inject(BoardsService) protected readonly boardsService: BoardsService,
        @inject(MonitorModel) protected readonly model: MonitorModel
    ) {
        super();

        this.id = MonitorWidget.ID;
        this.title.label = 'Serial Monitor';

        this.lines = [];
        this.tempData = '';
        this._lineEnding = '\n';

        this.toDisposeOnDetach.push(serviceClient.onRead(({ data, connectionId }) => {
            this.tempData += data;
            if (this.tempData.endsWith('\n')) {
                if (this.model.timestamp) {
                    const nu = new Date();
                    this.tempData = `${nu.getHours()}:${nu.getMinutes()}:${nu.getSeconds()}.${nu.getMilliseconds()} -> ` + this.tempData;
                }
                this.lines.push(this.tempData);
                this.tempData = '';
                this.update();
            }
        }));

        // TODO onError
    }

    @postConstruct()
    protected init(): void {
        this.update();
    }

    clear(): void {
        this.lines = [];
        this.update();
    }

    get baudRate(): number | undefined {
        return this._baudRate;
    }

    protected onAfterAttach(msg: Message) {
        super.onAfterAttach(msg);
        this.clear();
        this.connect();
        this.toDisposeOnDetach.push(this.boardsServiceClient.onBoardsChanged(async states => {
            const currentConnectionConfig = this.connection.connectionConfig;
            const connectedBoard = states.newState.boards
                .filter(AttachedSerialBoard.is)
                .find(board => {
                    const potentiallyConnected = currentConnectionConfig && currentConnectionConfig.board;
                    if (AttachedSerialBoard.is(potentiallyConnected)) {
                        return Board.equals(board, potentiallyConnected) && board.port === potentiallyConnected.port;
                    }
                    return false;
                });
            if (!connectedBoard) {
                this.close();
            }
        }));

        this.toDisposeOnDetach.push(this.connection.onConnectionChanged(() => {
            this.clear();
        }));
    }

    protected onBeforeDetach(msg: Message) {
        super.onBeforeDetach(msg);
        this.connection.disconnect();
    }

    protected async connect() {
        const config = await this.getConnectionConfig();
        if (config) {
            this.connection.connect(config);
        }
    }

    protected async getConnectionConfig(): Promise<ConnectionConfig | undefined> {
        const baudRate = this.baudRate;
        const { boardsConfig } = this.boardsServiceClient;
        const { selectedBoard, selectedPort } = boardsConfig;
        if (!selectedBoard) {
            this.messageService.warn('No boards selected.');
            return;
        }
        const { name } = selectedBoard;
        if (!selectedPort) {
            this.messageService.warn(`No ports selected for board: '${name}'.`);
            return;
        }
        const attachedBoards = await this.boardsService.getAttachedBoards();
        const connectedBoard = attachedBoards.boards.filter(AttachedSerialBoard.is).find(board => BoardsConfig.Config.sameAs(boardsConfig, board));
        if (!connectedBoard) {
            this.messageService.warn(`The selected '${name}' board is not connected on ${selectedPort}.`);
            return;
        }

        return {
            baudRate,
            board: selectedBoard,
            port: selectedPort
        }
    }

    protected getLineEndings(): OptionsType<SelectOption> {
        return [
            {
                label: 'No Line Ending',
                value: ''
            },
            {
                label: 'Newline',
                value: '\n'
            },
            {
                label: 'Carriage Return',
                value: '\r'
            },
            {
                label: 'Both NL & CR',
                value: '\r\n'
            }
        ]
    }

    protected getBaudRates(): OptionsType<SelectOption> {
        const baudRates = [300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200];
        return baudRates.map<SelectOption>(baudRate => ({ label: baudRate + ' baud', value: baudRate }))
    }

    protected render(): React.ReactNode {
        const le = this.getLineEndings();
        const br = this.getBaudRates();
        return <React.Fragment>
            <div className='serial-monitor-container'>
                <div className='head'>
                    <div className='send'>
                        <SerialMonitorSendField onSend={this.onSend} />
                    </div>
                    <div className='config'>
                        {this.renderSelectField('arduino-serial-monitor-line-endings', le, le[1], this.onChangeLineEnding)}
                        {this.renderSelectField('arduino-serial-monitor-baud-rates', br, br[4], this.onChangeBaudRate)}
                    </div>
                </div>
                <div id='serial-monitor-output-container'>
                    <SerialMonitorOutput model={this.model} lines={this.lines} />
                </div>
            </div>
        </React.Fragment>;
    }

    protected readonly onSend = (value: string) => this.doSend(value);
    protected async doSend(value: string) {
        const { connectionId } = this.connection;
        if (connectionId) {
            this.monitorService.send(connectionId, value + this._lineEnding);
        }
    }

    protected readonly onChangeLineEnding = (le: SelectOption) => {
        this._lineEnding = typeof le.value === 'string' ? le.value : '\n';
    }

    protected readonly onChangeBaudRate = (br: SelectOption) => {
        this._baudRate = typeof br.value === 'number' ? br.value : 9600;
    }

    protected renderSelectField(id: string, options: OptionsType<SelectOption>, defaultVal: SelectOption, onChange: (v: SelectOption) => void): React.ReactNode {
        const height = 25;
        const selectStyles: Styles = {
            control: (provided, state) => ({
                ...provided,
                width: 200
            }),
            dropdownIndicator: (p, s) => ({
                ...p,
                padding: 0
            }),
            indicatorSeparator: (p, s) => ({
                display: 'none'
            }),
            indicatorsContainer: (p, s) => ({
                padding: '0 5px'
            }),
            menu: (p, s) => ({
                ...p,
                marginTop: 0
            })
        };
        const theme: ThemeConfig = theme => ({
            ...theme,
            borderRadius: 0,
            spacing: {
                controlHeight: height,
                baseUnit: 2,
                menuGutter: 4
            }
        });
        const DropdownIndicator = (
            props: React.Props<typeof components.DropdownIndicator>
        ) => {
            return (
                <span className='fa fa-caret-down caret'></span>
            );
        };
        return <Select
            options={options}
            defaultValue={defaultVal}
            onChange={onChange}
            components={{ DropdownIndicator }}
            theme={theme}
            styles={selectStyles}
            classNamePrefix='sms'
            className='serial-monitor-select'
            id={id}
        />
    }
}