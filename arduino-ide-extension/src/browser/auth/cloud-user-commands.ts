import { Command } from '@theia/core/lib/common/command';

export namespace CloudUserCommands {
    export const LOGIN: Command = {
        id: 'arduino-cloud--login',
        label: 'Sign in',
    };

    export const LOGOUT: Command = {
        id: 'arduino-cloud--logout',
        label: 'Sign Out',
    };

    export const OPEN_PROFILE_CONTEXT_MENU: Command = {
        id: 'arduino-cloud-sketchbook--open-profile-menu',
        label: 'Contextual menu',
    };
}
