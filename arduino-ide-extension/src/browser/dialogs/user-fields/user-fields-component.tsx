import React from '@theia/core/shared/react';
import { BoardUserField } from '../../../common/protocol';
import { nls } from '@theia/core/lib/common';

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
  const firstInputElement = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setBoardUserFields(initialBoardUserFields);
  }, [initialBoardUserFields]);

  const updateUserField =
    (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const newBoardUserFields = [...boardUserFields];
      newBoardUserFields[index].value = e.target.value;
      setBoardUserFields(newBoardUserFields);
    };

  const allFieldsHaveValues = (userFields: BoardUserField[]): boolean => {
    return (
      userFields &&
      userFields.length > 0 &&
      userFields
        .map<boolean>((field: BoardUserField): boolean => {
          return field.value.length > 0;
        })
        .reduce((previous: boolean, current: boolean): boolean => {
          return previous && current;
        })
    );
  };

  React.useEffect(() => {
    updateUserFields(boardUserFields);
    setUploadButtonDisabled(!allFieldsHaveValues(boardUserFields));
    if (firstInputElement.current) {
      firstInputElement.current.focus();
    }
  }, [boardUserFields, updateUserFields]);

  return (
    <div>
      <div className="user-fields-container">
        <div className="user-fields-list">
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
                    placeholder={nls.localize(
                      'arduino/userFields/enterField',
                      'Enter {0}',
                      field.label
                    )}
                    onChange={updateUserField(index)}
                    ref={index === 0 ? firstInputElement : undefined}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="dialogSection">
        <div className="dialogRow button-container">
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
