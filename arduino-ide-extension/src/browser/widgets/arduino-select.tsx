import * as React from '@theia/core/shared/react';
import Select from 'react-select';
import type { StylesConfig } from 'react-select/dist/declarations/src/styles';
import type { ThemeConfig } from 'react-select/dist/declarations/src/theme';
import type { GroupBase } from 'react-select/dist/declarations/src/types';
import type { StateManagerProps } from 'react-select/dist/declarations/src/useStateManager';

export class ArduinoSelect extends React.Component<
  StateManagerProps<unknown, boolean, GroupBase<unknown>>
> {
  constructor(props: StateManagerProps<unknown, boolean, GroupBase<unknown>>) {
    super(props);
  }

  override render(): React.ReactNode {
    const controlHeight = 27; // from `monitor.css` -> `.serial-monitor-container .head` (`height: 27px;`)
    const styles: StylesConfig = {
      control: (styles) => ({
        ...styles,
        minWidth: 120,
        color: 'var(--theia-foreground)',
      }),
      dropdownIndicator: (styles) => ({
        ...styles,
        padding: 0,
      }),
      indicatorSeparator: () => ({
        display: 'none',
      }),
      indicatorsContainer: () => ({
        padding: '0px 5px',
      }),
      menu: (styles) => ({
        ...styles,
        marginTop: 0,
      }),
    };
    const theme: ThemeConfig = (theme) => ({
      ...theme,
      borderRadius: 0,
      spacing: {
        controlHeight,
        baseUnit: 2,
        menuGutter: 4,
      },
      colors: {
        ...theme.colors,
        // `primary50`??? it's crazy but apparently, without this, we would get a light-blueish
        // color when selecting an option in the select by clicking and then not releasing the button.
        // https://react-select.com/styles#overriding-the-theme
        primary50: 'var(--theia-list-activeSelectionBackground)',
      },
    });
    const DropdownIndicator = () => <span className="fa fa-caret-down caret" />;
    return (
      <Select
        {...this.props}
        className="theia-select"
        components={{ DropdownIndicator }}
        theme={theme}
        styles={styles}
        classNamePrefix="arduino-select"
        isSearchable={false}
      />
    );
  }
}
