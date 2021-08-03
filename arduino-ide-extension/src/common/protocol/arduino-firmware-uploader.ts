export const ArduinoFirmwareUploaderPath =
  '/services/arduino-firmware-uploader';
export const ArduinoFirmwareUploader = Symbol('ArduinoFirmwareUploader');
export type FirmwareInfo = {
  board_name: string;
  board_fqbn: string;
  module: string;
  firmware_version: string;
  Latest: boolean;
};
export interface ArduinoFirmwareUploader {
  list(fqbn?: string): Promise<FirmwareInfo[]>;
  flash(firmware: FirmwareInfo, port: string): Promise<string>;
  updatableBoards(): Promise<string[]>;
  availableFirmwares(fqbn: string): Promise<FirmwareInfo[]>;
}
