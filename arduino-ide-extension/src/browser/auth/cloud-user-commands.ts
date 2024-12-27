import { Command } from '@theia/core/lib/common/command';

export const LEARN_MORE_URL =
  'https://docs.arduino.cc/software/ide-v2/tutorials/ide-v2-cloud-sketch-sync';

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
}
