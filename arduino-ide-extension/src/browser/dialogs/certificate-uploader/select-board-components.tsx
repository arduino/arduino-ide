import { nls } from '@theia/core/lib/common';
import * as React from 'react';
import { AvailableBoard } from '../../boards/boards-service-provider';
import { ArduinoSelect } from '../../widgets/arduino-select';

type BoardOption = { value: string; label: string };

export const SelectBoardComponent = ({
  availableBoards,
  updatableFqbns,
  onBoardSelect,
  selectedBoard,
  busy,
}: {
  availableBoards: AvailableBoard[];
  updatableFqbns: string[];
  onBoardSelect: (board: AvailableBoard | null) => void;
  selectedBoard: AvailableBoard | null;
  busy: boolean;
}): React.ReactElement => {
  const [selectOptions, setSelectOptions] = React.useState<BoardOption[]>([]);

  const [selectBoardPlaceholder, setSelectBoardPlaceholder] =
    React.useState('');

  const selectOption = React.useCallback(
    (boardOpt: BoardOption) => {
      onBoardSelect(
        (boardOpt &&
          availableBoards.find((board) => board.fqbn === boardOpt.value)) ||
          null
      );
    },
    [availableBoards, onBoardSelect]
  );

  React.useEffect(() => {
    // if there is activity going on, skip updating the boards (avoid flickering)
    if (busy) {
      return;
    }

    let placeholderTxt = nls.localize(
      'arduino/certificate/selectBoard',
      'Select a board...'
    );
    let selBoard = -1;
    const updatableBoards = availableBoards.filter(
      (board) => board.port && board.fqbn && updatableFqbns.includes(board.fqbn)
    );
    const boardsList: BoardOption[] = updatableBoards.map((board, i) => {
      if (board.selected) {
        selBoard = i;
      }
      return {
        label: nls.localize(
          'arduino/certificate/boardAtPort',
          '{0} at {1}',
          board.name,
          board.port?.address ?? ''
        ),
        value: board.fqbn || '',
      };
    });

    if (boardsList.length === 0) {
      placeholderTxt = nls.localize(
        'arduino/certificate/noSupportedBoardConnected',
        'No supported board connected'
      );
    }

    setSelectBoardPlaceholder(placeholderTxt);
    setSelectOptions(boardsList);

    if (selectedBoard) {
      selBoard = boardsList
        .map((boardOpt) => boardOpt.value)
        .indexOf(selectedBoard.fqbn || '');
    }

    selectOption(boardsList[selBoard] || null);
  }, [busy, availableBoards, selectOption, updatableFqbns, selectedBoard]);

  return (
    <ArduinoSelect
      id="board-select"
      menuPosition="fixed"
      isDisabled={selectOptions.length === 0 || busy}
      placeholder={selectBoardPlaceholder}
      options={selectOptions}
      value={
        (selectedBoard && {
          value: selectedBoard.fqbn,
          label: nls.localize(
            'arduino/certificate/boardAtPort',
            '{0} at {1}',
            selectedBoard.name,
            selectedBoard.port?.address ?? ''
          ),
        }) ||
        null
      }
      tabSelectsValue={false}
      onChange={selectOption}
    />
  );
};
