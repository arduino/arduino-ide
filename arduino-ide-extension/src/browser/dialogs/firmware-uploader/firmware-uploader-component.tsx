import { nls } from '@theia/core/lib/common';
import * as React from 'react';
import { Port } from '../../../common/protocol';
import {
  ArduinoFirmwareUploader,
  FirmwareInfo,
} from '../../../common/protocol/arduino-firmware-uploader';
import { AvailableBoard } from '../../boards/boards-service-provider';
import { ArduinoSelect } from '../../widgets/arduino-select';
import { SelectBoardComponent } from '../certificate-uploader/select-board-components';

type FirmwareOption = { value: string; label: string };

export const FirmwareUploaderComponent = ({
  availableBoards,
  firmwareUploader,
  updatableFqbns,
  flashFirmware,
  isOpen,
}: {
  availableBoards: AvailableBoard[];
  firmwareUploader: ArduinoFirmwareUploader;
  updatableFqbns: string[];
  flashFirmware: (firmware: FirmwareInfo, port: Port) => Promise<any>;
  isOpen: any;
}): React.ReactElement => {
  // boolean states for buttons
  const [firmwaresFetching, setFirmwaresFetching] = React.useState(false);

  const [installFeedback, setInstallFeedback] = React.useState<
    'ok' | 'fail' | 'installing' | null
  >(null);

  const [selectedBoard, setSelectedBoard] =
    React.useState<AvailableBoard | null>(null);

  const [availableFirmwares, setAvailableFirmwares] = React.useState<
    FirmwareInfo[]
  >([]);
  React.useEffect(() => {
    setAvailableFirmwares([]);
  }, [isOpen]);
  const [selectedFirmware, setSelectedFirmware] =
    React.useState<FirmwareOption | null>(null);

  const [firmwareOptions, setFirmwareOptions] = React.useState<
    FirmwareOption[]
  >([]);

  const fetchFirmwares = React.useCallback(async () => {
    setInstallFeedback(null);
    setFirmwaresFetching(true);
    if (!selectedBoard) {
      return;
    }

    // fetch the firmwares for the selected board
    const firmwaresForFqbn = await firmwareUploader.availableFirmwares(
      selectedBoard.fqbn || ''
    );
    setAvailableFirmwares(firmwaresForFqbn);

    const firmwaresOpts = firmwaresForFqbn.map((f) => ({
      label: f.firmware_version,
      value: f.firmware_version,
    }));

    setFirmwareOptions(firmwaresOpts);

    if (firmwaresForFqbn.length > 0) setSelectedFirmware(firmwaresOpts[0]);
    setFirmwaresFetching(false);
  }, [firmwareUploader, selectedBoard]);

  const installFirmware = React.useCallback(async () => {
    setInstallFeedback('installing');

    const firmwareToFlash = availableFirmwares.find(
      (firmware) => firmware.firmware_version === selectedFirmware?.value
    );

    try {
      const installStatus =
        !!firmwareToFlash &&
        !!selectedBoard?.port &&
        (await flashFirmware(firmwareToFlash, selectedBoard?.port));

      setInstallFeedback((installStatus && 'ok') || 'fail');
    } catch {
      setInstallFeedback('fail');
    }
  }, [firmwareUploader, selectedBoard, selectedFirmware, availableFirmwares]);

  const onBoardSelect = React.useCallback(
    (board: AvailableBoard) => {
      const newFqbn = (board && board.fqbn) || null;
      const prevFqbn = (selectedBoard && selectedBoard.fqbn) || null;

      if (newFqbn !== prevFqbn) {
        setInstallFeedback(null);
        setAvailableFirmwares([]);
        setSelectedBoard(board);
      }
    },
    [selectedBoard]
  );

  return (
    <>
      <div className="dialogSection">
        <div className="dialogRow">
          <label htmlFor="board-select">
            {nls.localize('arduino/firmware/selectBoard', 'Select Board')}
          </label>
        </div>
        <div className="dialogRow">
          <div className="fl1">
            <SelectBoardComponent
              availableBoards={availableBoards}
              updatableFqbns={updatableFqbns}
              onBoardSelect={onBoardSelect}
              selectedBoard={selectedBoard}
              busy={installFeedback === 'installing'}
            />
          </div>
          <button
            type="button"
            className="theia-button secondary"
            disabled={
              selectedBoard === null ||
              firmwaresFetching ||
              installFeedback === 'installing'
            }
            onClick={fetchFirmwares}
          >
            {nls.localize('arduino/firmware/checkUpdates', 'Check Updates')}
          </button>
        </div>
      </div>
      {availableFirmwares.length > 0 && (
        <>
          <div className="dialogSection">
            <div className="dialogRow">
              <label htmlFor="firmware-select" className="fl1">
                {nls.localize(
                  'arduino/firmware/selectVersion',
                  'Select firmware version'
                )}
              </label>
              <ArduinoSelect
                id="firmware-select"
                menuPosition="fixed"
                isDisabled={
                  !selectedBoard ||
                  firmwaresFetching ||
                  installFeedback === 'installing'
                }
                options={firmwareOptions}
                value={selectedFirmware}
                tabSelectsValue={false}
                onChange={(value) => {
                  if (value) {
                    setInstallFeedback(null);
                    setSelectedFirmware(value);
                  }
                }}
              />
              <button
                type="button"
                className="theia-button primary"
                disabled={
                  selectedFirmware === null ||
                  firmwaresFetching ||
                  installFeedback === 'installing'
                }
                onClick={installFirmware}
              >
                {nls.localize('arduino/firmware/install', 'Install')}
              </button>
            </div>
          </div>
          <div className="dialogSection">
            {installFeedback === null && (
              <div className="dialogRow warn">
                <i className="fa fa-exclamation status-icon" />
                {nls.localize(
                  'arduino/firmware/overwriteSketch',
                  'Installation will overwrite the Sketch on the board.'
                )}
              </div>
            )}
            {installFeedback === 'installing' && (
              <div className="dialogRow success">
                <div className="spinner" />
                {nls.localize(
                  'arduino/firmware/installingFirmware',
                  'Installing firmware.'
                )}
              </div>
            )}
            {installFeedback === 'ok' && (
              <div className="dialogRow success">
                <i className="fa fa-info status-icon" />
                {nls.localize(
                  'arduino/firmware/successfullyInstalled',
                  'Firmware successfully installed.'
                )}
              </div>
            )}
            {installFeedback === 'fail' && (
              <div className="dialogRow warn">
                <i className="fa fa-exclamation status-icon" />
                {nls.localize(
                  'arduino/firmware/failedInstall',
                  'Installation failed. Please try again.'
                )}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};
