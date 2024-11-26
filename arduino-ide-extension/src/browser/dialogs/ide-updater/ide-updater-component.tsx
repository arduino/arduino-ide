import { nls } from '@theia/core/lib/common/nls';
import React from '@theia/core/shared/react';
// @ts-expect-error see https://github.com/microsoft/TypeScript/issues/49721#issuecomment-1319854183
import type { Options } from 'react-markdown';
import { ProgressInfo, UpdateInfo } from '../../../common/protocol/ide-updater';
import ProgressBar from '../../components/ProgressBar';
import { createPortal } from '@theia/core/shared/react-dom';

const ReactMarkdown = React.lazy<React.ComponentType<Options>>(
  // @ts-expect-error see above
  () => import('react-markdown')
);

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
  hasControls: boolean;
  controlPanel: HTMLDivElement;
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
  hasControls,
  controlPanel,
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
              <React.Suspense
                fallback={
                  <div className="fallback">
                    <div className="spinner" />
                  </div>
                }
              >
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
              </React.Suspense>
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

  const DonateFooter = (
    <div
      className={
        hasControls
          ? 'ide-updater-dialog--content--child--footer-with-controls'
          : 'ide-updater-dialog--content--child--footer'
      }
    >
      <hr />
      <span>
        {nls.localize(
          'arduino/ide-updater/donate-preface',
          'Open source is love, '
        )}
        <a
          className="donate-link"
          onClick={() => openExternal('https://www.arduino.cc/en/donate/')}
        >
          {nls.localize(
            'arduino/ide-updater/donate-link-text',
            'donate to support us'
          )}
          <div
            className="donate-link-icon"
            title={nls.localize(
              'arduino/ide-updater/donate-link-text',
              'donate to support us'
            )}
          />
        </a>
      </span>
    </div>
  );

  const DonateFooterToRender =
    hasControls && controlPanel.parentElement
      ? createPortal(DonateFooter, controlPanel.parentElement)
      : DonateFooter;

  const isPreDownload = !error && !downloadFinished && !downloadStarted;
  return (
    <div className="ide-updater-dialog--content">
      <div>
        {!!error ? (
          <GoToDownloadPage />
        ) : downloadFinished ? (
          <DownloadCompleted />
        ) : downloadStarted ? (
          <DownloadStarted />
        ) : (
          <PreDownload />
        )}
        {isPreDownload ? null : DonateFooterToRender}
      </div>
    </div>
  );
};
