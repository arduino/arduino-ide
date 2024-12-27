import { nls } from '@theia/core/lib/common/nls';

// TODO: rename constants: `Unknown` should be `unknownLabel`, change `Later` to `laterLabel`, etc.
export const Unknown = nls.localize('arduino/common/unknown', 'Unknown');
export const Later = nls.localize('arduino/common/later', 'Later');
export const Updatable = nls.localize('arduino/common/updateable', 'Updatable');
export const All = nls.localize('arduino/common/all', 'All');
export const Type = nls.localize('arduino/common/type', 'Type');
export const Partner = nls.localize('arduino/common/partner', 'Partner');
export const Contributed = nls.localize(
  'arduino/common/contributed',
  'Contributed'
);
export const Recommended = nls.localize(
  'arduino/common/recommended',
  'Recommended'
);
export const Retired = nls.localize('arduino/common/retired', 'Retired');
export const InstallManually = '手动安装';
export const SelectManually = '手动选择';

export const serialMonitorWidgetLabel = '串口监视器';

export const noBoardSelected = nls.localize(
  'arduino/common/noBoardSelected',
  'No board selected'
);

export const noSketchOpened = nls.localize(
  'arduino/common/noSketchOpened',
  'No sketch opened'
);
