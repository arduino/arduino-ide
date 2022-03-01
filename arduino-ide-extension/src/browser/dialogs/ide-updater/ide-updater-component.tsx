import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { nls } from '@theia/core/lib/common';
import { shell } from 'electron';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import ReactMarkdown from 'react-markdown';
import { ProgressInfo, UpdateInfo } from '../../../common/protocol/ide-updater';
import ProgressBar from '../../components/ProgressBar';

export type IDEUpdaterComponentProps = {
  updateInfo: UpdateInfo;
  windowService: WindowService;
  downloadFinished?: boolean;
  downloadStarted?: boolean;
  progress?: ProgressInfo;
  error?: Error;
  onDownload: () => void;
  onClose: () => void;
  onSkipVersion: () => void;
  onCloseAndInstall: () => void;
};

export const IDEUpdaterComponent = ({
  updateInfo: { version, releaseNotes },
  downloadStarted = false,
  downloadFinished = false,
  windowService,
  progress,
  error,
  onDownload,
  onClose,
  onSkipVersion,
  onCloseAndInstall,
}: IDEUpdaterComponentProps): React.ReactElement => {
  const changelogDivRef = React.useRef() as React.MutableRefObject<
    HTMLDivElement
  >;
  React.useEffect(() => {
    if (!!releaseNotes) {
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
  }, [releaseNotes]);
  const closeButton = (
    <button onClick={onClose} type="button" className="theia-button secondary">
      {nls.localize('arduino/ide-updater/notNowButton', 'Not now')}
    </button>
  );

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
      <div className="buttons-container">
        {closeButton}
        <button
          onClick={onCloseAndInstall}
          type="button"
          className="theia-button close-and-install"
        >
          {nls.localize(
            'arduino/ide-updater/closeAndInstallButton',
            'Close and Install'
          )}
        </button>
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
      <ProgressBar percent={progress?.percent} showPercentage />
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
          <div className="dialogRow">
            <div className="changelog-container" ref={changelogDivRef} />
          </div>
        )}
        <div className="buttons-container">
          <button
            onClick={onSkipVersion}
            type="button"
            className="theia-button secondary skip-version"
          >
            {nls.localize(
              'arduino/ide-updater/skipVersionButton',
              'Skip Version'
            )}
          </button>
          <div className="push"></div>
          {closeButton}
          <button
            onClick={onDownload}
            type="button"
            className="theia-button primary"
          >
            {nls.localize('arduino/ide-updater/downloadButton', 'Download')}
          </button>
        </div>
      </div>
    </div>
  );

  const onGoToDownloadClick = (
    event: React.SyntheticEvent<HTMLAnchorElement, Event>
  ) => {
    const { target } = event.nativeEvent;
    if (target instanceof HTMLAnchorElement) {
      event.nativeEvent.preventDefault();
      windowService.openNewWindow(target.href, { external: true });
      onClose();
    }
  };

  const GoToDownloadPage: () => React.ReactElement = () => (
    <div className="ide-updater-dialog--go-to-download-page">
      <div>
        {nls.localize(
          'arduino/ide-updater/goToDownloadPage',
          "An update for the Arduino IDE is available, but we're not able to download and install it automatically. Please go to the download page and download the latest version from there."
        )}
      </div>
      <div className="buttons-container">
        {closeButton}
        <a
          className="theia-button primary"
          href="https://www.arduino.cc/en/software#experimental-software"
          onClick={onGoToDownloadClick}
        >
          {nls.localize(
            'arduino/ide-updater/goToDownloadButton',
            'Go To Download'
          )}
        </a>
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
      {/* {!!error && <div className="error-container">{error}</div>} */}
    </div>
  );
};
