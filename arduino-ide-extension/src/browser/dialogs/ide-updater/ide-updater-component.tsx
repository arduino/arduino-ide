import React from '@theia/core/shared/react';
// @ts-expect-error see https://github.com/microsoft/TypeScript/issues/49721#issuecomment-1319854183
import type { Options } from 'react-markdown';
import { ProgressInfo, UpdateInfo } from '../../../common/protocol/ide-updater';
import ProgressBar from '../../components/ProgressBar';

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
  contentNode: HTMLDivElement;
}

export const IDEUpdaterComponent = ({
  updateInfo,
  updateProgress: {
    downloadStarted = false,
    downloadFinished = false,
    progressInfo,
    error,
  },
  contentNode,
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

  const DownloadCompleted: () => React.ReactElement = () => {
    contentNode.style.height = '45px';
    return (
      <div className="ide-updater-dialog--downloaded">
        <div>{`Lingzhi IDE ${version} 已经下载。`}</div>
        <div>{'关闭软件并安装更新。'}</div>
      </div>
    );
  };

  const DownloadStarted: () => React.ReactElement = () => {
    contentNode.style.height = 'auto';
    return (
      <div className="ide-updater-dialog--downloading">
        <div>{'正在下载 Lingzhi IDE 的最新版本。'}</div>
        <ProgressBar percent={progressInfo?.percent} showPercentage />
      </div>
    );
  };

  const PreDownload: () => React.ReactElement = () => {
    contentNode.style.height = '200px';
    return (
      <div className="ide-updater-dialog--pre-download">
        <div className="ide-updater-dialog--new-version-text dialogSection">
          {releaseNotes && (
            <div className="lingzhi-ide-update-notes">
              {releaseNotes as string}
            </div>
          )}
        </div>
      </div>
    );
  };

  const GoToDownloadPage: () => React.ReactElement = () => {
    contentNode.style.height = '40px';
    return (
      <div className="ide-updater-dialog--go-to-download-page">
        <div>
          {
            'lingzhiLab IDE可以更新，但我们无法自动下载和安装。请转到下载页面并下载最新版本手动安装。'
          }
        </div>
      </div>
    );
  };

  console.log('===========================updateError', error);
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
