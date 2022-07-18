import * as React from '@theia/core/shared/react';
import classnames from 'classnames';

interface SettingsStepInputProps {
  value: number;
  setSettingsStateValue: (value: number) => void;
  step: number;
  maxValue: number;
  minValue: number;
  classNames?: { [key: string]: string };
}

const SettingsStepInput: React.FC<SettingsStepInputProps> = (
  props: SettingsStepInputProps
) => {
  const { value, setSettingsStateValue, step, maxValue, minValue, classNames } =
    props;

  const [stepUpDisabled, setStepUpDisabled] = React.useState(false);
  const [stepDownDisabled, setStepDownDisabled] = React.useState(false);

  const onStepUp = (): void => {
    const valueRoundedToScale = Math.ceil(value / step) * step;
    const calculatedValue =
      valueRoundedToScale === value ? value + step : valueRoundedToScale;
    const newValue = limitValueByCondition(
      calculatedValue,
      maxValue,
      calculatedValue >= maxValue,
      disableStepUp
    );

    setSettingsStateValue(newValue);
  };

  const onStepDown = (): void => {
    const valueRoundedToScale = Math.floor(value / step) * step;
    const calculatedValue =
      valueRoundedToScale === value ? value - step : valueRoundedToScale;
    const newValue = limitValueByCondition(
      calculatedValue,
      minValue,
      calculatedValue <= minValue,
      disableStepDown
    );

    setSettingsStateValue(newValue);
  };

  const limitValueByCondition = (
    calculatedValue: number,
    limitedValue: number,
    condition: boolean,
    onConditionTrue: () => void,
    onConditionFalse = enableButtons
  ): number => {
    if (condition) {
      onConditionTrue();
      return limitedValue;
    } else {
      onConditionFalse();
      return calculatedValue;
    }
  };

  const enableButtons = (): void => {
    setStepUpDisabled(false);
    setStepDownDisabled(false);
  };

  const disableStepUp = (): void => {
    setStepUpDisabled(true);
  };

  const disableStepDown = (): void => {
    setStepDownDisabled(true);
  };

  const onUserInput = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { value: eventValue } = event.target;

    if (eventValue === '') {
      setSettingsStateValue(0);
    }

    const number = Number(eventValue);

    if (!isNaN(number) && number !== value) {
      let newValue;
      if (number > value) {
        newValue = limitValueByCondition(
          number,
          maxValue,
          number >= maxValue,
          disableStepUp
        );
      } else {
        newValue = limitValueByCondition(
          number,
          minValue,
          number <= minValue,
          disableStepDown
        );
      }

      setSettingsStateValue(newValue);
    }
  };

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
          disabled={stepUpDisabled}
          onClick={onStepUp}
        >
          &#9662;
        </button>
        <button
          className="settings-step-input-button"
          disabled={stepDownDisabled}
          onClick={onStepDown}
        >
          &#9662;
        </button>
      </div>
    </div>
  );
};

export default SettingsStepInput;
