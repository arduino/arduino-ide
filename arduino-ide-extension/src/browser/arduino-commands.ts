import { Command } from '@theia/core/lib/common/command';

export namespace ArduinoCommands {

    export const VERIFY: Command = {
        id: 'arduino-verify',
        label: 'Verify Sketch'
    }

    export const UPLOAD: Command = {
        id: 'arduino-upload',
        label: 'Upload Sketch'
    }

    export const NEW_SKETCH: Command = {
        id: "arduino-new-sketch",
        label: 'New Sketch',
        category: 'File'
    }

}
