import { nls } from '@theia/core/lib/common';
import {} from '@theia/core/shared/react';
import { shell } from 'electron';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import ReactMarkdown from 'react-markdown';
import { ProgressInfo } from '../../../common/protocol/ide-updater-service';
import ProgressBar from '../../components/ProgressBar';
import { UpdateInfo } from './ide-updater-dialog';

export type IDEUpdaterComponentProps = {
  updateInfo: UpdateInfo;
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
  updateInfo: { version, changelog },
  downloadStarted = false,
  downloadFinished = false,
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
    if (!!changelog) {
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
  }, [changelog]);
  const closeButton = (
    <button onClick={onClose} type="button" className="theia-button secondary">
      {nls.localize('arduino/ide-updater/notNowButton', 'Not now')}
    </button>
  );

  return (
    <div className="ide-updater-dialog--content">
      {downloadFinished ? (
        <div className="ide-updater-dialog--downloaded">
          <div>Arduino IDE {version} has been downloaded.</div>
          <div>Close the software and install the update on your machine.</div>
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
      ) : downloadStarted ? (
        <div className="ide-updater-dialog--downloading">
          <div>Downloading the latest version of the Arduino IDE 2.</div>
          <ProgressBar percent={progress?.percent} showPercentage />
        </div>
      ) : (
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
                  'Skip version'
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
      )}
      {!!error && <div className="error-container">{error}</div>}
    </div>
  );
};
