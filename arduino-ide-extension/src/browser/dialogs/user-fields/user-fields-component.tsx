import * as React from 'react';
import { BoardUserField } from '../../../common/protocol';
import { nls } from '@theia/core/lib/browser/nls';

export const UserFieldsComponent = ({
  initialBoardUserFields,
  updateUserFields,
  cancel,
  accept,
}: {
  initialBoardUserFields: BoardUserField[];
  updateUserFields: (userFields: BoardUserField[]) => void;
  cancel: () => void;
  accept: () => Promise<void>;
}): React.ReactElement => {
  const [boardUserFields, setBoardUserFields] = React.useState<
    BoardUserField[]
  >(initialBoardUserFields);

  const [uploadButtonDisabled, setUploadButtonDisabled] =
    React.useState<boolean>(true);

  React.useEffect(() => {
    setBoardUserFields(initialBoardUserFields);
  }, [initialBoardUserFields]);

  const updateUserField =
    (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      let newBoardUserFields = [...boardUserFields];
      newBoardUserFields[index].value = e.target.value;
      setBoardUserFields(newBoardUserFields);
    };

  const allFieldsHaveValues = (userFields: BoardUserField[]): boolean => {
    return userFields
      .map<boolean>((field: BoardUserField): boolean => {
        return field.value.length > 0;
      })
      .reduce((previous: boolean, current: boolean): boolean => {
        return previous && current;
      });
  };

  React.useEffect(() => {
    updateUserFields(boardUserFields);
    setUploadButtonDisabled(!allFieldsHaveValues(boardUserFields));
  }, [boardUserFields]);

  return (
    <div>
      {boardUserFields.map((field, index) => {
        return (
          <div className="dialogSection" key={index}>
            <div className="dialogRow">
              <label className="field-label">{field.label}</label>
            </div>
            <div className="dialogRow">
              <input
                type={field.secret ? 'password' : 'text'}
                value={field.value}
                className="theia-input"
                placeholder={'Enter ' + field.label}
                onChange={updateUserField(index)}
              />
            </div>
          </div>
        );
      })}
      <div className="dialogSection">
        <div className="dialogRow">
          <button
            type="button"
            className="theia-button secondary install-cert-btn"
            onClick={cancel}
          >
            {nls.localize('arduino/userFields/cancel', 'Cancel')}
          </button>
          <button
            type="button"
            className="theia-button primary install-cert-btn"
            disabled={uploadButtonDisabled}
            onClick={accept}
          >
            {nls.localize('arduino/userFields/upload', 'Upload')}
          </button>
        </div>
      </div>
    </div>
  );
};
