import * as React from 'react';

export type ProgressBarProps = {
  percent?: number;
  showPercentage?: boolean;
};

export default function ProgressBar({
  percent = 0,
  showPercentage = false,
}: ProgressBarProps): React.ReactElement {
  const roundedPercent = Math.round(percent);
  return (
    <div className="progress-bar">
      <div className="progress-bar--outer">
        <div
          className="progress-bar--inner"
          style={{ width: `${roundedPercent}%` }}
        />
      </div>
      {showPercentage && (
        <div className="progress-bar--percentage">
          <div className="progress-bar--percentage-text">{roundedPercent}%</div>
        </div>
      )}
    </div>
  );
}
