import * as React from 'react';
import Tippy from '@tippyjs/react';
import { AvailableBoard } from '../../boards/boards-service-provider';
import { CertificateListComponent } from './certificate-list';
import { SelectBoardComponent } from './select-board-components';
import { CertificateAddComponent } from './certificate-add-new';
import { nls } from '@theia/core/lib/common';

export const CertificateUploaderComponent = ({
  availableBoards,
  certificates,
  addCertificate,
  updatableFqbns,
  uploadCertificates,
  openContextMenu,
}: {
  availableBoards: AvailableBoard[];
  certificates: string[];
  addCertificate: (cert: string) => void;
  updatableFqbns: string[];
  uploadCertificates: (
    fqbn: string,
    address: string,
    urls: string[]
  ) => Promise<any>;
  openContextMenu: (x: number, y: number, cert: string) => void;
}): React.ReactElement => {
  const [installFeedback, setInstallFeedback] = React.useState<
    'ok' | 'fail' | 'installing' | null
  >(null);

  const [showAdd, setShowAdd] = React.useState(false);

  const [selectedCerts, setSelectedCerts] = React.useState<string[]>([]);

  const [selectedBoard, setSelectedBoard] =
    React.useState<AvailableBoard | null>(null);

  const installCertificates = async () => {
    if (!selectedBoard || !selectedBoard.fqbn || !selectedBoard.port) {
      return;
    }

    setInstallFeedback('installing');

    try {
      await uploadCertificates(
        selectedBoard.fqbn,
        selectedBoard.port.address,
        selectedCerts
      );
      setInstallFeedback('ok');
    } catch {
      setInstallFeedback('fail');
    }
  };

  const onBoardSelect = React.useCallback(
    (board: AvailableBoard) => {
      const newFqbn = (board && board.fqbn) || null;
      const prevFqbn = (selectedBoard && selectedBoard.fqbn) || null;

      if (newFqbn !== prevFqbn) {
        setInstallFeedback(null);
        setSelectedBoard(board);
      }
    },
    [selectedBoard]
  );

  return (
    <>
      <div className="dialogSection">
        <div className="dialogRow">
          <strong className="fl1">
            {nls.localize(
              'arduino/certificate/selectCertificateToUpload',
              '1. Select certificate to upload'
            )}
          </strong>
          <Tippy
            content={
              <CertificateAddComponent
                addCertificate={(cert) => {
                  addCertificate(cert);
                  setShowAdd(false);
                }}
              />
            }
            placement="bottom-end"
            onClickOutside={() => setShowAdd(false)}
            visible={showAdd}
            interactive={true}
          >
            <button
              type="button"
              className="theia-button primary add-cert-btn"
              onClick={() => {
                showAdd ? setShowAdd(false) : setShowAdd(true);
              }}
            >
              {nls.localize('arduino/certificate/addNew', 'Add New')}{' '}
              <span className="fa fa-caret-down caret"></span>
            </button>
          </Tippy>
        </div>
        <div className="dialogRow">
          <CertificateListComponent
            certificates={certificates}
            selectedCerts={selectedCerts}
            setSelectedCerts={setSelectedCerts}
            openContextMenu={openContextMenu}
          />
        </div>
      </div>
      <div className="dialogSection">
        <div className="dialogRow">
          <strong>
            {nls.localize(
              'arduino/certificate/selectDestinationBoardToUpload',
              '2. Select destination board and upload certificate'
            )}
          </strong>
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
        </div>
        <div className="dialogRow">
          <div className="upload-status">
            {installFeedback === 'installing' && (
              <div className="success">
                <div className="spinner" />
                {nls.localize(
                  'arduino/certificate/uploadingCertificates',
                  'Uploading certificates.'
                )}
              </div>
            )}
            {installFeedback === 'ok' && (
              <div className="success">
                <i className="fa fa-info status-icon" />
                {nls.localize(
                  'arduino/certificate/certificatesUploaded',
                  'Certificates uploaded.'
                )}
              </div>
            )}
            {installFeedback === 'fail' && (
              <div className="warn">
                <i className="fa fa-exclamation status-icon" />
                {nls.localize(
                  'arduino/certificate/uploadFailed',
                  'Upload failed. Please try again.'
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            className="theia-button primary install-cert-btn"
            onClick={installCertificates}
            disabled={selectedCerts.length === 0 || !selectedBoard}
          >
            {nls.localize('arduino/certificate/upload', 'Upload')}
          </button>
        </div>
      </div>
    </>
  );
};
