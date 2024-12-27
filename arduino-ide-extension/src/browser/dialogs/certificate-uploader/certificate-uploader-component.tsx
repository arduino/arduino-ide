import { nls } from '@theia/core/lib/common/nls';
import React from '@theia/core/shared/react';
import Tippy from '@tippyjs/react';
import type { BoardList } from '../../../common/protocol/board-list';
import {
  boardIdentifierEquals,
  portIdentifierEquals,
} from '../../../common/protocol/boards-service';
import { CertificateAddComponent } from './certificate-add-new';
import { CertificateListComponent } from './certificate-list';
import {
  BoardOptionValue,
  SelectBoardComponent,
} from './select-board-components';

export const CertificateUploaderComponent = ({
  boardList,
  certificates,
  addCertificate,
  updatableFqbns,
  uploadCertificates,
  openContextMenu,
}: {
  boardList: BoardList;
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

  const [selectedItem, setSelectedItem] =
    React.useState<BoardOptionValue | null>(null);

  const installCertificates = async () => {
    if (!selectedItem) {
      return;
    }
    const board = selectedItem.board;
    if (!board.fqbn) {
      return;
    }

    setInstallFeedback('installing');

    try {
      await uploadCertificates(
        board.fqbn,
        selectedItem.port.address,
        selectedCerts
      );
      setInstallFeedback('ok');
    } catch {
      setInstallFeedback('fail');
    }
  };

  const onItemSelect = React.useCallback(
    (item: BoardOptionValue | null) => {
      if (!item) {
        setSelectedItem(null);
        return;
      }
      const board = item.board;
      const port = item.port;
      const selectedBoard = selectedItem?.board;
      const selectedPort = selectedItem?.port;

      if (
        !boardIdentifierEquals(board, selectedBoard) ||
        !portIdentifierEquals(port, selectedPort)
      ) {
        setInstallFeedback(null);
        setSelectedItem(item);
      }
    },
    [selectedItem]
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
              className="theia-button secondary add-cert-btn"
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
              boardList={boardList}
              updatableFqbns={updatableFqbns}
              onItemSelect={onItemSelect}
              selectedItem={selectedItem}
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
                {'上传失败。请再试一次。'}
              </div>
            )}
          </div>
          <button
            type="button"
            className="theia-button primary install-cert-btn"
            onClick={installCertificates}
            disabled={selectedCerts.length === 0 || !selectedItem}
          >
            {'上传'}
          </button>
        </div>
      </div>
    </>
  );
};
