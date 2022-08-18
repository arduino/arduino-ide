import * as React from '@theia/core/shared/react';
import classnames from 'classnames';

interface SettingsStepInputProps {
  value: number;
  setSettingsStateValue: (value: number) => void;
  step: number;
  maxValue: number;
  minValue: number;
  unitOfMeasure?: string;
  classNames?: { [key: string]: string };
}

const SettingsStepInput: React.FC<SettingsStepInputProps> = (
  props: SettingsStepInputProps
) => {
  const {
    value,
    setSettingsStateValue,
    step,
    maxValue,
    minValue,
    unitOfMeasure,
    classNames,
  } = props;

  const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
  };

  const onStep = (
    roundingOperation: 'ceil' | 'floor',
    stepOperation: (a: number, b: number) => number
  ): void => {
    const valueRoundedToScale = Math[roundingOperation](value / step) * step;
    const calculatedValue =
      valueRoundedToScale === value
        ? stepOperation(value, step)
        : valueRoundedToScale;
    const newValue = clamp(calculatedValue, minValue, maxValue);

    setSettingsStateValue(newValue);
  };

  const onStepUp = (): void => {
    onStep('ceil', (a: number, b: number) => a + b);
  };

  const onStepDown = (): void => {
    onStep('floor', (a: number, b: number) => a - b);
  };

  const onUserInput = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { value: eventValue } = event.target;

    if (eventValue === '') {
      setSettingsStateValue(0);
    }

    const number = Number(eventValue);

    if (!isNaN(number) && number !== value) {
      const newValue = clamp(number, minValue, maxValue);

      setSettingsStateValue(newValue);
    }
  };

  const upDisabled = value >= maxValue;
  const downDisabled = value <= minValue;

  return (
    <div className="settings-step-input-container">
      <input
        className={classnames('settings-step-input-element', classNames?.input)}
        value={value.toString()}
        onChange={onUserInput}
        type="number"
        pattern="[0-9]+"
      />
      <div className="settings-step-input-buttons-container">
        <button
          className="settings-step-input-button settings-step-input-up-button"
          disabled={upDisabled}
          onClick={onStepUp}
        >
          &#9662;
        </button>
        <button
          className="settings-step-input-button"
          disabled={downDisabled}
          onClick={onStepDown}
        >
          &#9662;
        </button>
      </div>
      {unitOfMeasure && `${unitOfMeasure}`}
    </div>
  );
};

export default SettingsStepInput;
