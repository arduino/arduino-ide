import { injectable } from 'inversify';
import { Library, LibraryService } from '../common/protocol/library-service';

@injectable()
export class LibraryServiceImpl implements LibraryService {

    async search(options: { query?: string; }): Promise<{ items: Library[] }> {
        const { query } = options;
        const allItems: Library[] = [
            <Library>{
                name: 'Keyboard',
                availableVersions: ['1.0.0', '1.0.1', '1.02'],
                author: 'Arduino',
                summary: 'Allows an Arduino/Genuino board with USB capabilities to act as a Keyboard',
                description: 'This library plugs on the HID library. It can be used with or without other HIG-based libraries (Mouse, Gamepad etc)',
                installedVersion: '1.0.1',
                moreInfoLink: 'https://www.arduino.cc/reference/en/language/functions/usb/keyboard/',
                builtIn: true
            },
            <Library>{
                name: 'Mouse',
                availableVersions: ['1.0.0', '1.0.1'],
                author: 'Arduino',
                summary: 'Allows an Arduino board with USB capabilities to act as a Mouse. For Leonardo/Micro only',
                description: 'This library plugs on the HID library. Can be used with ot without other HID-based libraries (Keyboard, Gamepad etc)',
                installedVersion: '1.0.1',
                moreInfoLink: 'https://www.arduino.cc/reference/en/language/functions/usb/mouse/',
                builtIn: true
            },
            <Library>{
                name: 'USBHost',
                availableVersions: ['1.0.0', '1.0.1', '1.02', '1.0.3', '1.0.3', '1.0.4', '1.0.5'],
                author: 'Arduino',
                summary: 'Allows communication with USB peripherals like mice, keyboard, and thumbdrives.',
                // tslint:disable-next-line:max-line-length
                description: 'This USBHost library allows an Arduino Due board to appear as a USB host, enabling it to communicate with peripherals like USB mice and keyboards. USBHost does not support devices that ace corrected through USB hubs. This includes some keyboards that have an internal hub.',
                moreInfoLink: 'https://www.arduino.cc/en/Reference/USBHost',
                installable: true
            }
        ];
        return {
            items: allItems.filter(item => !query || item.name.toLocaleLowerCase().indexOf(query.toLocaleLowerCase()) !== -1)
        };
    }

}
