import { nls } from '@theia/core/lib/common';
import * as React from '@theia/core/shared/react';
import ReactMarkdown from 'react-markdown';
import { ProgressInfo, UpdateInfo } from '../../../common/protocol/ide-updater';
import ProgressBar from '../../components/ProgressBar';

export interface UpdateProgress {
  progressInfo?: ProgressInfo | undefined;
  downloadFinished?: boolean;
  downloadStarted?: boolean;
  error?: Error;
}

export interface IDEUpdaterComponentProps {
  updateInfo: UpdateInfo;
  updateProgress: UpdateProgress;
  openExternal: (url: string) => undefined;
}

export const IDEUpdaterComponent = ({
  updateInfo,
  updateProgress: {
    downloadStarted = false,
    downloadFinished = false,
    progressInfo,
    error,
  },
  openExternal,
}: IDEUpdaterComponentProps): React.ReactElement => {
  const { version, releaseNotes } = updateInfo;
  const [changelog, setChangelog] = React.useState<string>('');
  React.useEffect(() => {
    if (releaseNotes) {
      setChangelog(
        typeof releaseNotes === 'string'
          ? releaseNotes
          : releaseNotes.reduce(
              (acc, item) => (item.note ? (acc += `${item.note}\n\n`) : acc),
              ''
            )
      );
    }
  }, [releaseNotes, changelog]);

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
        {changelog && (
          <div className="dialogRow changelog-container">
            <div className="changelog">
              <ReactMarkdown
                components={{
                  a: ({ href, children, ...props }) => (
                    <a onClick={() => href && openExternal(href)} {...props}>
                      {children}
                    </a>
                  ),
                }}
              >
                {changelog}
              </ReactMarkdown>
            </div>
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
