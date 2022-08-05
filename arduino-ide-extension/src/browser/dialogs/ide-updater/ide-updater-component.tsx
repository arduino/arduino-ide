import { nls } from '@theia/core/lib/common';
import { shell } from 'electron';
import * as React from '@theia/core/shared/react';
import * as ReactDOM from '@theia/core/shared/react-dom';
import ReactMarkdown from 'react-markdown';
import { ProgressInfo, UpdateInfo } from '../../../common/protocol/ide-updater';
import ProgressBar from '../../components/ProgressBar';

export type UpdateProgress = {
  progressInfo?: ProgressInfo | undefined;
  downloadFinished?: boolean;
  downloadStarted?: boolean;
  error?: Error;
};

export type IDEUpdaterComponentProps = {
  updateInfo: UpdateInfo;
  updateProgress: UpdateProgress;
};

export const IDEUpdaterComponent = ({
  updateInfo,
  updateProgress: {
    downloadStarted = false,
    downloadFinished = false,
    progressInfo,
    error,
  },
}: IDEUpdaterComponentProps): React.ReactElement => {
  const { version, releaseNotes } = updateInfo;
  const changelogDivRef =
    React.useRef() as React.MutableRefObject<HTMLDivElement>;
  React.useEffect(() => {
    if (!!releaseNotes && changelogDivRef.current) {
      let changelog: string;
      if (typeof releaseNotes === 'string') changelog = releaseNotes;
      else
        changelog = releaseNotes.reduce((acc, item) => {
          return item.note ? (acc += `${item.note}\n\n`) : acc;
        }, '');
      ReactDOM.render(
        <ReactMarkdown
          components={{
            a: ({ href, children, ...props }) => (
              <a onClick={() => href && shell.openExternal(href)} {...props}>
                {children}
              </a>
            ),
          }}
        >
          {changelog}
        </ReactMarkdown>,
        changelogDivRef.current
      );
    }
  }, [updateInfo]);

  const DownloadCompleted: () => React.ReactElement = () => (
    <div className="ide-updater-dialog--downloaded">
      <div>
        {nls.localize(
          'arduino/ide-updater/versionDownloaded',
          'Arduino IDE {0} has been downloaded.',
          version
        )}
      </div>
      <div>
        {nls.localize(
          'arduino/ide-updater/closeToInstallNotice',
          'Close the software and install the update on your machine.'
        )}
      </div>
    </div>
  );

  const DownloadStarted: () => React.ReactElement = () => (
    <div className="ide-updater-dialog--downloading">
      <div>
        {nls.localize(
          'arduino/ide-updater/downloadingNotice',
          'Downloading the latest version of the Arduino IDE.'
        )}
      </div>
      <ProgressBar percent={progressInfo?.percent} showPercentage />
    </div>
  );

  const PreDownload: () => React.ReactElement = () => (
    <div className="ide-updater-dialog--pre-download">
      <div className="ide-updater-dialog--logo-container">
        <div className="ide-updater-dialog--logo"></div>
      </div>
      <div className="ide-updater-dialog--new-version-text dialogSection">
        <div className="dialogRow">
          <div className="bold">
            {nls.localize(
              'arduino/ide-updater/updateAvailable',
              'Update Available'
            )}
          </div>
        </div>
        <div className="dialogRow">
          {nls.localize(
            'arduino/ide-updater/newVersionAvailable',
            'A new version of Arduino IDE ({0}) is available for download.',
            version
          )}
        </div>
        {releaseNotes && (
          <div className="dialogRow changelog-container">
            <div className="changelog" ref={changelogDivRef} />
          </div>
        )}
      </div>
    </div>
  );

  const GoToDownloadPage: () => React.ReactElement = () => (
    <div className="ide-updater-dialog--go-to-download-page">
      <div>
        {nls.localize(
          'arduino/ide-updater/goToDownloadPage',
          "An update for the Arduino IDE is available, but we're not able to download and install it automatically. Please go to the download page and download the latest version from there."
        )}
      </div>
    </div>
  );

  return (
    <div className="ide-updater-dialog--content">
      {!!error ? (
        <GoToDownloadPage />
      ) : downloadFinished ? (
        <DownloadCompleted />
      ) : downloadStarted ? (
        <DownloadStarted />
      ) : (
        <PreDownload />
      )}
    </div>
  );
};
