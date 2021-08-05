import * as React from 'react';
import { AvailableBoard } from '../../boards/boards-service-provider';
import { ArduinoSelect } from '../../widgets/arduino-select';

type BoardOption = { value: string; label: string };

export const SelectBoardComponent = ({
  availableBoards,
  updatableFqbns,
  onBoardSelect,
  selectedBoard,
}: {
  availableBoards: AvailableBoard[];
  updatableFqbns: string[];
  onBoardSelect: (board: AvailableBoard | null) => void;
  selectedBoard: AvailableBoard | null;
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
    let placeholderTxt = 'Select a board...';
    let selBoard = -1;
    const updatableBoards = availableBoards.filter(
      (board) => board.port && board.fqbn && updatableFqbns.includes(board.fqbn)
    );
    const boardsList: BoardOption[] = updatableBoards.map((board, i) => {
      if (board.selected) {
        selBoard = i;
      }
      return {
        label: `${board.name} at ${board.port?.address}`,
        value: board.fqbn || '',
      };
    });

    if (boardsList.length === 0) {
      placeholderTxt = 'No supported board connected';
    }

    setSelectBoardPlaceholder(placeholderTxt);
    setSelectOptions(boardsList);

    if (selectedBoard) {
      selBoard = boardsList
        .map((boardOpt) => boardOpt.value)
        .indexOf(selectedBoard.fqbn || '');
    }

    selectOption(boardsList[selBoard] || null);
  }, [availableBoards, selectOption, updatableFqbns, selectedBoard]);

  return (
    <ArduinoSelect
      id="board-select"
      menuPosition="fixed"
      isDisabled={selectOptions.length === 0}
      placeholder={selectBoardPlaceholder}
      options={selectOptions}
      value={
        (selectedBoard && {
          value: selectedBoard.fqbn,
          label: `${selectedBoard.name} at ${selectedBoard.port?.address}`,
        }) ||
        null
      }
      tabSelectsValue={false}
      onChange={selectOption}
    />
  );
};
