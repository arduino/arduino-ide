import type { Port } from './boards-service';

export const ArduinoFirmwareUploaderPath =
  '/services/arduino-firmware-uploader';
export const ArduinoFirmwareUploader = Symbol('ArduinoFirmwareUploader');
export interface FirmwareInfo {
  board_name: string;
  board_fqbn: string;
  module: string;
  firmware_version: string;
  Latest: boolean;
}
export interface UploadCertificateParams {
  readonly fqbn: string;
  readonly address: string;
  readonly urls: readonly string[];
}
export interface ArduinoFirmwareUploader {
  list(fqbn?: string): Promise<FirmwareInfo[]>;
  flash(firmware: FirmwareInfo, port: Port): Promise<string>;
  uploadCertificates(params: UploadCertificateParams): Promise<unknown>;
  updatableBoards(): Promise<string[]>;
  availableFirmwares(fqbn: string): Promise<FirmwareInfo[]>;
}
