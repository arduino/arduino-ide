import React from '@theia/core/shared/react';
import classnames from 'classnames';

interface SettingsStepInputProps {
  initialValue: number;
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
    initialValue,
    setSettingsStateValue,
    step,
    maxValue,
    minValue,
    unitOfMeasure,
    classNames,
  } = props;

  const [valueState, setValueState] = React.useState<{
    currentValue: number;
    isEmptyString: boolean;
  }>({
    currentValue: initialValue,
    isEmptyString: false,
  });
  const { currentValue, isEmptyString } = valueState;

  const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
  };

  const resetToInitialState = (): void => {
    setValueState({
      currentValue: initialValue,
      isEmptyString: false,
    });
  };

  const onStep = (
    roundingOperation: 'ceil' | 'floor',
    stepOperation: (a: number, b: number) => number
  ): void => {
    const valueRoundedToScale =
      Math[roundingOperation](currentValue / step) * step;
    const calculatedValue =
      valueRoundedToScale === currentValue
        ? stepOperation(currentValue, step)
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
    setValueState({
      currentValue: Number(eventValue),
      isEmptyString: eventValue === '',
    });
  };

  /* Prevent the user from entering invalid values */
  const onBlur = (event: React.FocusEvent): void => {
    if (
      (currentValue === initialValue && !isEmptyString) ||
      event.currentTarget.contains(event.relatedTarget as Node)
    ) {
      return;
    }

    const clampedValue = clamp(currentValue, minValue, maxValue);
    if (clampedValue === initialValue || isNaN(currentValue) || isEmptyString) {
      resetToInitialState();
      return;
    }

    setSettingsStateValue(clampedValue);
  };

  const valueIsNotWithinRange =
    currentValue < minValue || currentValue > maxValue;
  const isDisabledException =
    valueIsNotWithinRange || isEmptyString || isNaN(currentValue);

  const upDisabled = isDisabledException || currentValue >= maxValue;
  const downDisabled = isDisabledException || currentValue <= minValue;

  return (
    <div className="settings-step-input-container" onBlur={onBlur}>
      <input
        className={classnames('settings-step-input-element', classNames?.input)}
        value={isEmptyString ? '' : String(currentValue)}
        onChange={onUserInput}
        type="number"
        pattern="[0-9]+"
      />
      <div
        className={classnames(
          'settings-step-input-buttons-container',
          classNames?.buttonsContainer
        )}
      >
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
