import axios from 'axios';
import { injectable } from 'inversify';
import * as os from 'os';
import { compare } from 'semver';
import { remote } from 'electron';

const BASE_URL = 'https://downloads.arduino.cc';
const LATEST_LOCATION_PARTIAL_URL = `${BASE_URL}/latest-location/arduino-ide/arduino-ide_latest_`;
const LATEST_VERSION_PARTIAL_URL = `${BASE_URL}/arduino-ide/arduino-ide_`;

@injectable()
export class UpdatesRetriever {
    public async isUpdateAvailable(): Promise<boolean> {
        let filename;
        switch (os.type()) {
            case 'Linux':
                filename = 'Linux_64bit.zip';
                break;
            case 'Darwin':
                filename = 'macOS_64bit.dmg';
                break;
            case 'Windows_NT':
                filename = 'Windows_64bit.exe';
                break;
            default:
                return false;
        }
        const response = await axios.head(`${LATEST_LOCATION_PARTIAL_URL}${filename}`)
        const location = (response.headers?.location as String); 
        if (location && location.startsWith(LATEST_VERSION_PARTIAL_URL)) {
            const latestVersion = location.split('_')[1];
            const version = await remote.app.getVersion();
            return compare(latestVersion, version) === 1;
        } 
        return false;
    }
}
