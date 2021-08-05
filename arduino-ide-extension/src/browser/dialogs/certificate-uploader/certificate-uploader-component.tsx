import * as React from 'react';
import Tippy from '@tippyjs/react';
import { AvailableBoard } from '../../boards/boards-service-provider';
import { CertificateListComponent } from './certificate-list';
import { SelectBoardComponent } from './select-board-components';
import { CertificateAddComponent } from './certificate-add-new';

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
          <strong className="fl1">1. Select certificate to upload</strong>
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
              Add New <span className="fa fa-caret-down caret"></span>
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
          <strong>2. Select destination board and upload certificate</strong>
        </div>
        <div className="dialogRow">
          <div className="fl1">
            <SelectBoardComponent
              availableBoards={availableBoards}
              updatableFqbns={updatableFqbns}
              onBoardSelect={onBoardSelect}
              selectedBoard={selectedBoard}
            />
          </div>
          <button
            type="button"
            className="theia-button primary"
            onClick={installCertificates}
            disabled={selectedCerts.length === 0 || !selectedBoard}
          >
            Upload
          </button>
        </div>
      </div>

      {installFeedback && (
        <div className="dialogSection">
          {installFeedback === 'installing' && (
            <div className="dialogRow success">
              <svg
                className="status-icon"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 17.75C7.26942 17.75 5.57769 17.2368 4.13876 16.2754C2.69983 15.3139 1.57832 13.9473 0.916058 12.3485C0.253791 10.7496 0.080512 8.9903 0.418133 7.29296C0.755753 5.59563 1.58911 4.03653 2.81282 2.81282C4.03653 1.58911 5.59563 0.755753 7.29296 0.418133C8.9903 0.080512 10.7496 0.253791 12.3485 0.916058C13.9473 1.57832 15.3139 2.69983 16.2754 4.13876C17.2368 5.57769 17.75 7.26942 17.75 9C17.75 11.3206 16.8281 13.5462 15.1872 15.1872C13.5462 16.8281 11.3206 17.75 9 17.75ZM9 1.5C7.51664 1.5 6.0666 1.93987 4.83323 2.76398C3.59986 3.58809 2.63856 4.75943 2.07091 6.12988C1.50325 7.50032 1.35473 9.00832 1.64411 10.4632C1.9335 11.918 2.64781 13.2544 3.6967 14.3033C4.7456 15.3522 6.08197 16.0665 7.53683 16.3559C8.99168 16.6453 10.4997 16.4968 11.8701 15.9291C13.2406 15.3614 14.4119 14.4001 15.236 13.1668C16.0601 11.9334 16.5 10.4834 16.5 9C16.5 7.01088 15.7098 5.10323 14.3033 3.6967C12.8968 2.29018 10.9891 1.5 9 1.5Z"
                  fill="#1DA086"
                />
                <path
                  d="M8.6875 5.875C9.20527 5.875 9.625 5.45527 9.625 4.9375C9.625 4.41973 9.20527 4 8.6875 4C8.16973 4 7.75 4.41973 7.75 4.9375C7.75 5.45527 8.16973 5.875 8.6875 5.875Z"
                  fill="#1DA086"
                />
                <path
                  d="M12.125 12.75C12.125 12.9158 12.0592 13.0747 11.9419 13.1919C11.8247 13.3092 11.6658 13.375 11.5 13.375H6.5C6.33424 13.375 6.17527 13.3092 6.05806 13.1919C5.94085 13.0747 5.875 12.9158 5.875 12.75C5.875 12.5842 5.94085 12.4253 6.05806 12.3081C6.17527 12.1908 6.33424 12.125 6.5 12.125H8.375V8.375H7.125C6.95924 8.375 6.80027 8.30915 6.68306 8.19194C6.56585 8.07473 6.5 7.91576 6.5 7.75C6.5 7.58424 6.56585 7.42527 6.68306 7.30806C6.80027 7.19085 6.95924 7.125 7.125 7.125H9C9.16576 7.125 9.32473 7.19085 9.44194 7.30806C9.55915 7.42527 9.625 7.58424 9.625 7.75V12.125H11.5C11.6658 12.125 11.8247 12.1908 11.9419 12.3081C12.0592 12.4253 12.125 12.5842 12.125 12.75Z"
                  fill="#1DA086"
                />
              </svg>
              Uploading certificates...
            </div>
          )}
          {installFeedback === 'ok' && (
            <div className="dialogRow success">
              <svg
                className="status-icon"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 17.75C7.26942 17.75 5.57769 17.2368 4.13876 16.2754C2.69983 15.3139 1.57832 13.9473 0.916058 12.3485C0.253791 10.7496 0.080512 8.9903 0.418133 7.29296C0.755753 5.59563 1.58911 4.03653 2.81282 2.81282C4.03653 1.58911 5.59563 0.755753 7.29296 0.418133C8.9903 0.080512 10.7496 0.253791 12.3485 0.916058C13.9473 1.57832 15.3139 2.69983 16.2754 4.13876C17.2368 5.57769 17.75 7.26942 17.75 9C17.75 11.3206 16.8281 13.5462 15.1872 15.1872C13.5462 16.8281 11.3206 17.75 9 17.75ZM9 1.5C7.51664 1.5 6.0666 1.93987 4.83323 2.76398C3.59986 3.58809 2.63856 4.75943 2.07091 6.12988C1.50325 7.50032 1.35473 9.00832 1.64411 10.4632C1.9335 11.918 2.64781 13.2544 3.6967 14.3033C4.7456 15.3522 6.08197 16.0665 7.53683 16.3559C8.99168 16.6453 10.4997 16.4968 11.8701 15.9291C13.2406 15.3614 14.4119 14.4001 15.236 13.1668C16.0601 11.9334 16.5 10.4834 16.5 9C16.5 7.01088 15.7098 5.10323 14.3033 3.6967C12.8968 2.29018 10.9891 1.5 9 1.5Z"
                  fill="#1DA086"
                />
                <path
                  d="M8.6875 5.875C9.20527 5.875 9.625 5.45527 9.625 4.9375C9.625 4.41973 9.20527 4 8.6875 4C8.16973 4 7.75 4.41973 7.75 4.9375C7.75 5.45527 8.16973 5.875 8.6875 5.875Z"
                  fill="#1DA086"
                />
                <path
                  d="M12.125 12.75C12.125 12.9158 12.0592 13.0747 11.9419 13.1919C11.8247 13.3092 11.6658 13.375 11.5 13.375H6.5C6.33424 13.375 6.17527 13.3092 6.05806 13.1919C5.94085 13.0747 5.875 12.9158 5.875 12.75C5.875 12.5842 5.94085 12.4253 6.05806 12.3081C6.17527 12.1908 6.33424 12.125 6.5 12.125H8.375V8.375H7.125C6.95924 8.375 6.80027 8.30915 6.68306 8.19194C6.56585 8.07473 6.5 7.91576 6.5 7.75C6.5 7.58424 6.56585 7.42527 6.68306 7.30806C6.80027 7.19085 6.95924 7.125 7.125 7.125H9C9.16576 7.125 9.32473 7.19085 9.44194 7.30806C9.55915 7.42527 9.625 7.58424 9.625 7.75V12.125H11.5C11.6658 12.125 11.8247 12.1908 11.9419 12.3081C12.0592 12.4253 12.125 12.5842 12.125 12.75Z"
                  fill="#1DA086"
                />
              </svg>
              Certificates succesfully installed.
            </div>
          )}
          {installFeedback === 'fail' && (
            <div className="dialogRow warn">
              <svg
                className="status-icon"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16.9373 17.125H1.06225C0.955444 17.1246 0.850534 17.0968 0.757532 17.0442C0.66453 16.9917 0.586538 16.9162 0.531 16.825C0.476145 16.73 0.447266 16.6222 0.447266 16.5125C0.447266 16.4028 0.476145 16.295 0.531 16.2L8.4685 0.57501C8.52095 0.472634 8.60063 0.386718 8.69878 0.326724C8.79692 0.26673 8.90972 0.234985 9.02475 0.234985C9.13978 0.234985 9.25258 0.26673 9.35072 0.326724C9.44887 0.386718 9.52855 0.472634 9.581 0.57501L17.5185 16.2C17.5734 16.295 17.6022 16.4028 17.6022 16.5125C17.6022 16.6222 17.5734 16.73 17.5185 16.825C17.4588 16.9238 17.3729 17.0042 17.2703 17.0571C17.1677 17.1101 17.0524 17.1336 16.9373 17.125ZM2.081 15.875H15.9185L8.99975 2.25626L2.081 15.875Z"
                  fill="#C11F09"
                />
                <path
                  d="M9 14.625C9.51777 14.625 9.9375 14.2053 9.9375 13.6875C9.9375 13.1697 9.51777 12.75 9 12.75C8.48223 12.75 8.0625 13.1697 8.0625 13.6875C8.0625 14.2053 8.48223 14.625 9 14.625Z"
                  fill="#C11F09"
                />
                <path
                  d="M9 11.5C8.83424 11.5 8.67527 11.4342 8.55806 11.3169C8.44085 11.1997 8.375 11.0408 8.375 10.875V6.5C8.375 6.33424 8.44085 6.17527 8.55806 6.05806C8.67527 5.94085 8.83424 5.875 9 5.875C9.16576 5.875 9.32473 5.94085 9.44194 6.05806C9.55915 6.17527 9.625 6.33424 9.625 6.5V10.875C9.625 11.0408 9.55915 11.1997 9.44194 11.3169C9.32473 11.4342 9.16576 11.5 9 11.5Z"
                  fill="#C11F09"
                />
              </svg>
              Upload failed. Please try again.
            </div>
          )}
        </div>
      )}
    </>
  );
};
