import { Command } from '@theia/core/lib/common/command';

export namespace ArduinoCommands {

    const category = 'Arduino';

    export const VERIFY: Command = {
        id: 'arduino-verify',
        label: 'Verify Sketch'
    };
    export const VERIFY_TOOLBAR: Command = {
        id: 'arduino-verify-toolbar',
    };

    export const UPLOAD: Command = {
        id: 'arduino-upload',
        label: 'Upload Sketch'
    };
    export const UPLOAD_TOOLBAR: Command = {
        id: 'arduino-upload-toolbar',
    };

    export const TOGGLE_COMPILE_FOR_DEBUG: Command = {
        id: 'arduino-toggle-compile-for-debug'
    };

    export const OPEN_FILE_NAVIGATOR: Command = {
        id: 'arduino-open-file-navigator'
    };

    /**
     * Unlike `OPEN_SKETCH`, it opens all files from a sketch folder. (ino, cpp, etc...)
     */
    export const OPEN_SKETCH_FILES: Command = {
        id: 'arduino-open-sketch-files'
    };

    export const OPEN_BOARDS_DIALOG: Command = {
        id: 'arduino-open-boards-dialog'
    };

    export const TOGGLE_ADVANCED_MODE: Command = {
        id: 'arduino-toggle-advanced-mode'
    };
    export const TOGGLE_ADVANCED_MODE_TOOLBAR: Command = {
        id: 'arduino-toggle-advanced-mode-toolbar'
    };

    export const OPEN_CLI_CONFIG: Command = {
        id: 'arduino-open-cli-config',
        label: 'Open CLI Configuration',
        category
    };

}
