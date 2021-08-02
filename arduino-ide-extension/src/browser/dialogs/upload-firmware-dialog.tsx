import * as React from 'react';
import { inject, injectable } from 'inversify';
import { AbstractDialog, DialogProps } from '@theia/core/lib/browser/dialogs';
import { Widget } from '@phosphor/widgets';
import { Message } from '@phosphor/messaging';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import { ArduinoSelect } from '../widgets/arduino-select';

export const FirmwareUploaderComponent = ({
  boardsServiceClient,
}: {
  boardsServiceClient: BoardsServiceProvider;
}): React.ReactElement => {
  const [defaultValue, setdefaultValue] = React.useState<{
    label: string;
    value: string;
  } | null>(null);

  const [placeholder, setPlaceholder] = React.useState('');

  const [portsboards, setportsboards] = React.useState<
    {
      label: string;
      value: string;
    }[]
  >([]);

  React.useEffect(() => {
    boardsServiceClient.onAvailableBoardsChanged((availableBoards) => {
      let placeholderTxt = 'Select a board...';
      let selectedBoard = -1;
      const boardsList = availableBoards
        .filter((board) => !!board.fqbn)
        .map((board, i) => {
          if (board.selected) {
            selectedBoard = i;
          }
          return {
            label: `${board.name} at ${board.port?.address}`,
            value: board.port?.address || '',
          };
        });

      if (boardsList.length === 0) {
        placeholderTxt = 'No board connected to serial port';
      }

      setPlaceholder(placeholderTxt);
      setportsboards(boardsList);
      setdefaultValue(boardsList[selectedBoard] || null);
    });
  }, [boardsServiceClient]);
  return (
    <div id="widget-container">
      <ArduinoSelect
        isDisabled={portsboards.length === 0}
        placeholder={placeholder}
        options={portsboards}
        value={defaultValue}
        tabSelectsValue={false}
        onChange={(value) => {
          if (value) {
            setdefaultValue(value);
          }
        }}
      />
    </div>
  );
};

@injectable()
export class UploadFirmwareDialogWidget extends ReactWidget {
  @inject(BoardsServiceProvider)
  protected readonly boardsServiceClient: BoardsServiceProvider;

  constructor() {
    super();
  }

  protected render(): React.ReactNode {
    return (
      <form>
        <FirmwareUploaderComponent
          boardsServiceClient={this.boardsServiceClient}
        />
      </form>
    );
  }
}

@injectable()
export class UploadFirmwareDialogProps extends DialogProps {}

@injectable()
export class UploadFirmwareDialog extends AbstractDialog<void> {
  @inject(UploadFirmwareDialogWidget)
  protected readonly widget: UploadFirmwareDialogWidget;

  constructor(
    @inject(UploadFirmwareDialogProps)
    protected readonly props: UploadFirmwareDialogProps
  ) {
    super({ title: 'Connectivity Firmware Updater' });
    this.contentNode.classList.add('firmware-uploader-dialog');
    this.acceptButton = undefined;
  }

  get value(): void {
    return;
  }

  protected onAfterAttach(msg: Message): void {
    if (this.widget.isAttached) {
      Widget.detach(this.widget);
    }
    Widget.attach(this.widget, this.contentNode);
    super.onAfterAttach(msg);
    this.update();
  }

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.widget.update();
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.widget.activate();
  }

  protected handleEnter(event: KeyboardEvent): boolean | void {
    return false;
  }
}
