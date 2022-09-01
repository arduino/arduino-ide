import { nls } from '@theia/core/lib/common/nls';
import * as React from '@theia/core/shared/react';
import {
  BoardList,
  BoardListItemWithBoard,
  InferredBoardListItem,
  isInferredBoardListItem,
} from '../../../common/protocol/board-list';
import { ArduinoSelect } from '../../widgets/arduino-select';

export type BoardOptionValue = BoardListItemWithBoard | InferredBoardListItem;
type BoardOption = { value: BoardOptionValue | undefined; label: string };

export const SelectBoardComponent = ({
  boardList,
  updatableFqbns,
  onItemSelect,
  selectedItem,
  busy,
}: {
  boardList: BoardList;
  updatableFqbns: string[];
  onItemSelect: (item: BoardOptionValue | null) => void;
  selectedItem: BoardOptionValue | null;
  busy: boolean;
}): React.ReactElement => {
  const [selectOptions, setSelectOptions] = React.useState<BoardOption[]>([]);

  const [selectItemPlaceholder, setSelectBoardPlaceholder] = React.useState('');

  const selectOption = React.useCallback(
    (boardOpt: BoardOption | null) => {
      onItemSelect(boardOpt?.value ?? null);
    },
    [onItemSelect]
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
    const updatableBoards = boardList.boards.filter((item) => {
      const fqbn = (
        isInferredBoardListItem(item) ? item.inferredBoard : item.board
      ).fqbn;
      return fqbn && updatableFqbns.includes(fqbn);
    });
    let selBoard = -1;

    const boardsList: BoardOption[] = updatableBoards.map((item, i) => {
      if (selectedItem === item) {
        selBoard = i;
      }
      const board = isInferredBoardListItem(item)
        ? item.inferredBoard
        : item.board;
      return {
        label: nls.localize(
          'arduino/certificate/boardAtPort',
          '{0} at {1}',
          board.name,
          item.port?.address ?? ''
        ),
        value: item,
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

    if (selectedItem) {
      selBoard = updatableBoards.indexOf(selectedItem);
    }

    selectOption(boardsList[selBoard] || null);
  }, [busy, boardList, selectOption, updatableFqbns, selectedItem]);
  return (
    <ArduinoSelect
      id="board-select"
      menuPosition="fixed"
      isDisabled={selectOptions.length === 0 || busy}
      placeholder={selectItemPlaceholder}
      options={selectOptions}
      value={
        (selectedItem && {
          value: selectedItem,
          label: nls.localize(
            'arduino/certificate/boardAtPort',
            '{0} at {1}',
            (isInferredBoardListItem(selectedItem)
              ? selectedItem.inferredBoard
              : selectedItem.board
            ).name,
            selectedItem.port.address ?? ''
          ),
        }) ||
        null
      }
      tabSelectsValue={false}
      onChange={selectOption}
    />
  );
};
