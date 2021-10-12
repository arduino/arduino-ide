import { Command } from '@theia/core/lib/common/command';

export namespace CloudUserCommands {
  export const LOGIN = Command.toLocalizedCommand(
    {
      id: 'arduino-cloud--login',
      label: 'Sign in',
    },
    'arduino/cloud/signIn'
  );

  export const LOGOUT = Command.toLocalizedCommand(
    {
      id: 'arduino-cloud--logout',
      label: 'Sign Out',
    },
    'arduino/cloud/signOut'
  );

  export const OPEN_PROFILE_CONTEXT_MENU: Command = {
    id: 'arduino-cloud-sketchbook--open-profile-menu',
    label: 'Contextual menu',
  };
}
