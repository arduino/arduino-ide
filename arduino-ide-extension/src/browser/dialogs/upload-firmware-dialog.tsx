import * as React from 'react';
import { inject, injectable } from 'inversify';
import {
  AbstractDialog,
  DialogError,
  DialogProps,
} from '@theia/core/lib/browser/dialogs';
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

  const [disabled, setdisabled] = React.useState(true);

  const [portsboards, setportsboards] = React.useState<
    {
      label: string;
      value: string;
    }[]
  >([]);

  React.useEffect(() => {
    boardsServiceClient.onAvailableBoardsChanged((availableBoards) => {
      let disabled = false;
      let selectedBoard = -1;
      let boardsList = availableBoards
        .filter((board) => !!board.port)
        .map((board, i) => {
          if (board.selected) {
            selectedBoard = i;
          }
          return {
            label: board.name,
            value: board.port?.address || '',
          };
        });

      if (boardsList.length === 0) {
        disabled = true;
        boardsList = [
          { label: 'No board connected to serial port', value: '' },
        ];
        selectedBoard = 0;
      }

      setdisabled(disabled);
      setportsboards(boardsList);
      setdefaultValue(boardsList[selectedBoard] || null);
    });
  }, [boardsServiceClient]);
  return (
    <div id="widget-container firmware-uploader">
      <ArduinoSelect
        isDisabled={disabled}
        options={portsboards}
        value={defaultValue}
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
      <div className="selectBoardContainer">
        <FirmwareUploaderComponent
          boardsServiceClient={this.boardsServiceClient}
        />
      </div>
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
  }

  protected setErrorMessage(error: DialogError): void {
    if (this.acceptButton) {
      this.acceptButton.disabled = !DialogError.getResult(error);
    }
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
}
