import { expect } from 'chai';
import { AttachedBoardsChangeEvent } from '../../common/protocol';

describe('boards-service', () => {

    describe('AttachedBoardsChangeEvent', () => {

        it('should detect one attached port', () => {
            const event = <AttachedBoardsChangeEvent & any>{
                oldState: {
                    boards: [
                        { name: 'Arduino MKR1000', fqbn: 'arduino:samd:mkr1000', port: '/dev/cu.usbmodem14601' },
                        { name: 'Arduino Uno', fqbn: 'arduino:avr:uno', port: '/dev/cu.usbmodem14501' }
                    ],
                    ports: [
                        { protocol: 'serial', address: '/dev/cu.usbmodem14501' },
                        { protocol: 'serial', address: '/dev/cu.usbmodem14601' },
                        { protocol: 'serial', address: '/dev/cu.Bluetooth-Incoming-Port' },
                        { protocol: 'serial', address: '/dev/cu.MALS' },
                        { protocol: 'serial', address: '/dev/cu.SOC' }
                    ]
                },
                newState: {
                    boards: [
                        { name: 'Arduino MKR1000', fqbn: 'arduino:samd:mkr1000', 'port': '/dev/cu.usbmodem1460' },
                        { name: 'Arduino Uno', fqbn: 'arduino:avr:uno', 'port': '/dev/cu.usbmodem14501' }
                    ],
                    ports: [
                        { protocol: 'serial', address: '/dev/cu.SLAB_USBtoUART' },
                        { protocol: 'serial', address: '/dev/cu.usbmodem14501' },
                        { protocol: 'serial', address: '/dev/cu.usbmodem14601' },
                        { protocol: 'serial', address: '/dev/cu.Bluetooth-Incoming-Port' },
                        { protocol: 'serial', address: '/dev/cu.MALS' },
                        { protocol: 'serial', address: '/dev/cu.SOC' }
                    ]
                }
            };
            const diff = AttachedBoardsChangeEvent.diff(event);
            expect(diff.attached.boards).to.be.empty; // tslint:disable-line:no-unused-expression
            expect(diff.detached.boards).to.be.empty; // tslint:disable-line:no-unused-expression
            expect(diff.detached.ports).to.be.empty; // tslint:disable-line:no-unused-expression
            expect(diff.attached.ports.length).to.be.equal(1);
            expect(diff.attached.ports[0].address).to.be.equal('/dev/cu.SLAB_USBtoUART');
        });

    });

});
