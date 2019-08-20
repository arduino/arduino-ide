import { ReactWidget, Message, Widget, StatefulWidget } from "@theia/core/lib/browser";
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

    protected inputField: HTMLInputElement | null;

    constructor(props: SerialMonitorSendField.Props) {
        super(props);
        this.state = { value: '' };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    componentDidMount() {
        if (this.inputField) {
            this.inputField.focus();
        }
    }

    render() {
        return <React.Fragment>
            <form onSubmit={this.handleSubmit}>
                <input
                    tabIndex={-1}
                    ref={ref => this.inputField = ref}
                    type='text' id='serial-monitor-send'
                    autoComplete='off'
                    value={this.state.value}
                    onChange={this.handleChange} />
                <input className="btn" type="submit" value="Submit" />
            </form>
        </React.Fragment>
    }

    protected handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ value: event.target.value });
    }

    protected handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        this.props.onSend(this.state.value);
        this.setState({ value: '' });
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

        for (const text of this.props.lines) {
            result += text;
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
export class MonitorWidget extends ReactWidget implements StatefulWidget {

    static readonly ID = 'serial-monitor';

    protected lines: string[];
    protected tempData: string;

    protected widgetHeight: number;

    protected continuePreviousConnection: boolean;

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
        this.title.iconClass = 'arduino-serial-monitor-tab-icon';

        this.lines = [];
        this.tempData = '';

        this.scrollOptions = undefined;

        this.toDisposeOnDetach.push(serviceClient.onRead(({ data, connectionId }) => {
            this.tempData += data;
            if (this.tempData.endsWith('\n')) {
                if (this.model.timestamp) {
                    const nu = new Date();
                    const h = (100 + nu.getHours()).toString().substr(1)
                    const min = (100 + nu.getMinutes()).toString().substr(1)
                    const sec = (100 + nu.getSeconds()).toString().substr(1)
                    const ms = (1000 + nu.getMilliseconds()).toString().substr(1);
                    this.tempData = `${h}:${min}:${sec}.${ms} -> ` + this.tempData;
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

    storeState(): MonitorModel.Data {
        return this.model.store();
    }

    restoreState(oldState: MonitorModel.Data): void {
        this.model.restore(oldState);
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
            if (connectedBoard && currentConnectionConfig) {
                this.continuePreviousConnection = true;
                this.connection.connect(currentConnectionConfig);
            }
        }));

        this.toDisposeOnDetach.push(this.connection.onConnectionChanged(() => {
            if (!this.continuePreviousConnection) {
                this.clear();
            } else {
                this.continuePreviousConnection = false;
            }
        }));
    }

    protected onBeforeDetach(msg: Message) {
        super.onBeforeDetach(msg);
        this.connection.disconnect();
    }

    protected onResize(msg: Widget.ResizeMessage) {
        super.onResize(msg);
        this.widgetHeight = msg.height;
        this.update();
    }

    protected async connect() {
        const config = await this.getConnectionConfig();
        if (config) {
            this.connection.connect(config);
        }
    }

    protected async getConnectionConfig(): Promise<ConnectionConfig | undefined> {
        const baudRate = this.model.baudRate;
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
        const leVal = this.model.lineEnding && le.find(val => val.value === this.model.lineEnding);
        const brVal = this.model.baudRate && br.find(val => val.value === this.model.baudRate);
        return <React.Fragment>
            <div className='serial-monitor-container'>
                <div className='head'>
                    <div className='send'>
                        <SerialMonitorSendField onSend={this.onSend} />
                    </div>
                    <div className='config'>
                        {this.renderSelectField('arduino-serial-monitor-line-endings', le, leVal || le[1], this.onChangeLineEnding)}
                        {this.renderSelectField('arduino-serial-monitor-baud-rates', br, brVal || br[4], this.onChangeBaudRate)}
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
            this.monitorService.send(connectionId, value + this.model.lineEnding);
        }
    }

    protected readonly onChangeLineEnding = (le: SelectOption) => {
        this.model.lineEnding = typeof le.value === 'string' ? le.value : '\n';
    }

    protected readonly onChangeBaudRate = async (br: SelectOption) => {
        await this.connection.disconnect();
        this.model.baudRate = typeof br.value === 'number' ? br.value : 9600;
        this.clear();
        const config = await this.getConnectionConfig();
        if (config) {
            await this.connection.connect(config);
        }
    }

    protected renderSelectField(id: string, options: OptionsType<SelectOption>, defaultVal: SelectOption, onChange: (v: SelectOption) => void): React.ReactNode {
        const height = 25;
        const selectStyles: Styles = {
            control: (provided, state) => ({
                ...provided,
                width: 200,
                border: 'none'
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
            maxMenuHeight={this.widgetHeight - 40}
            classNamePrefix='sms'
            className='serial-monitor-select'
            id={id}
        />
    }
}