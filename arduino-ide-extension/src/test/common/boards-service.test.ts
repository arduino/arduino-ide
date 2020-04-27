import { expect } from 'chai';
import { ConfigOption, AttachedBoardsChangeEvent } from '../../common/protocol';
import { fail } from 'assert';

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


    describe('ConfigOption', () => {

        ([
            ['', false],
            ['foo', true],
            ['foo:bar', true],
            ['foo:bar:baz', true],
            ['foo:', false],
            [':foo', false],
            [':foo:', false],
            ['foo:bar:', false]
        ] as Array<[string, boolean]>).forEach(([fqbn, expectation]) => {
            it(`"${fqbn}" should ${expectation ? '' : 'not '}be a valid FQBN`, () => {
                expect(ConfigOption.isValidFqbn(fqbn)).to.be.equal(expectation);
            });
        });

        ([
            ['', false],
            ['foo:bar:option1', false],
            ['foo:bar:option1=', false],
            ['foo:bar:baz:option1=value1', true],
            ['foo:bar:baz:option1=value1,option2=value2', true],
            ['foo:bar:baz:option1=value1,option2=value2,', false],
            ['foo:bar:baz,option1=value1,option2=value2', false],
            ['foo:bar:baz:option1=value1,option2=value2,options3', false],
            ['foo:bar:baz:option1=value1,option2=value2, options3=value3', false],
        ] as Array<[string, boolean]>).forEach(([fqbn, expectation]) => {
            it(`"${fqbn}" should ${expectation ? '' : 'not '}be a valid FQBN with options`, () => {
                expect(ConfigOption.isValidFqbnWithOptions(fqbn)).to.be.equal(expectation);
            });
        });

        ([
            [
                'foo:bar:baz',
                JSON.parse('[{"label":"CPU Frequency","option":"xtal","values":[{"value":"80","label":"80 MHz","selected":true},{"value":"160","label":"160 MHz","selected":false}]},{"label":"VTables","option":"vt","values":[{"value":"flash","label":"Flash","selected":true},{"value":"heap","label":"Heap","selected":false},{"value":"iram","label":"IRAM","selected":false}]},{"label":"Exceptions","option":"exception","values":[{"value":"legacy","label":"Legacy (new can return nullptr)","selected":true},{"value":"disabled","label":"Disabled (new can abort)","selected":false},{"value":"enabled","label":"Enabled","selected":false}]},{"label":"SSL Support","option":"ssl","values":[{"value":"all","label":"All SSL ciphers (most compatible)","selected":true},{"value":"basic","label":"Basic SSL ciphers (lower ROM use)","selected":false}]},{"label":"Flash Size","option":"eesz","values":[{"value":"4M2M","label":"4MB (FS:2MB OTA:~1019KB)","selected":true},{"value":"4M3M","label":"4MB (FS:3MB OTA:~512KB)","selected":false},{"value":"4M1M","label":"4MB (FS:1MB OTA:~1019KB)","selected":false},{"value":"4M","label":"4MB (FS:none OTA:~1019KB)","selected":false}]},{"label":"lwIP Variant","option":"ip","values":[{"value":"lm2f","label":"v2 Lower Memory","selected":true},{"value":"hb2f","label":"v2 Higher Bandwidth","selected":false},{"value":"lm2n","label":"v2 Lower Memory (no features)","selected":false},{"value":"hb2n","label":"v2 Higher Bandwidth (no features)","selected":false},{"value":"lm6f","label":"v2 IPv6 Lower Memory","selected":false},{"value":"hb6f","label":"v2 IPv6 Higher Bandwidth","selected":false},{"value":"hb1","label":"v1.4 Higher Bandwidth","selected":false},{"value":"src","label":"v1.4 Compile from source","selected":false}]},{"label":"Debug port","option":"dbg","values":[{"value":"Disabled","label":"Disabled","selected":true},{"value":"Serial","label":"Serial","selected":false},{"value":"Serial1","label":"Serial1","selected":false}]},{"label":"Debug Level","option":"lvl","values":[{"value":"None____","label":"None","selected":true},{"value":"SSL","label":"SSL","selected":false},{"value":"TLS_MEM","label":"TLS_MEM","selected":false},{"value":"HTTP_CLIENT","label":"HTTP_CLIENT","selected":false},{"value":"HTTP_SERVER","label":"HTTP_SERVER","selected":false},{"value":"SSLTLS_MEM","label":"SSL+TLS_MEM","selected":false},{"value":"SSLHTTP_CLIENT","label":"SSL+HTTP_CLIENT","selected":false},{"value":"SSLHTTP_SERVER","label":"SSL+HTTP_SERVER","selected":false},{"value":"TLS_MEMHTTP_CLIENT","label":"TLS_MEM+HTTP_CLIENT","selected":false},{"value":"TLS_MEMHTTP_SERVER","label":"TLS_MEM+HTTP_SERVER","selected":false},{"value":"HTTP_CLIENTHTTP_SERVER","label":"HTTP_CLIENT+HTTP_SERVER","selected":false},{"value":"SSLTLS_MEMHTTP_CLIENT","label":"SSL+TLS_MEM+HTTP_CLIENT","selected":false},{"value":"SSLTLS_MEMHTTP_SERVER","label":"SSL+TLS_MEM+HTTP_SERVER","selected":false},{"value":"SSLHTTP_CLIENTHTTP_SERVER","label":"SSL+HTTP_CLIENT+HTTP_SERVER","selected":false},{"value":"TLS_MEMHTTP_CLIENTHTTP_SERVER","label":"TLS_MEM+HTTP_CLIENT+HTTP_SERVER","selected":false},{"value":"SSLTLS_MEMHTTP_CLIENTHTTP_SERVER","label":"SSL+TLS_MEM+HTTP_CLIENT+HTTP_SERVER","selected":false},{"value":"CORE","label":"CORE","selected":false},{"value":"WIFI","label":"WIFI","selected":false},{"value":"HTTP_UPDATE","label":"HTTP_UPDATE","selected":false},{"value":"UPDATER","label":"UPDATER","selected":false},{"value":"OTA","label":"OTA","selected":false},{"value":"OOM","label":"OOM","selected":false},{"value":"MDNS","label":"MDNS","selected":false},{"value":"COREWIFIHTTP_UPDATEUPDATEROTAOOMMDNS","label":"CORE+WIFI+HTTP_UPDATE+UPDATER+OTA+OOM+MDNS","selected":false},{"value":"SSLTLS_MEMHTTP_CLIENTHTTP_SERVERCOREWIFIHTTP_UPDATEUPDATEROTAOOMMDNS","label":"SSL+TLS_MEM+HTTP_CLIENT+HTTP_SERVER+CORE+WIFI+HTTP_UPDATE+UPDATER+OTA+OOM+MDNS","selected":false},{"value":"NoAssert-NDEBUG","label":"NoAssert-NDEBUG","selected":false}]},{"label":"Erase Flash","option":"wipe","values":[{"value":"none","label":"Only Sketch","selected":true},{"value":"sdk","label":"Sketch + WiFi Settings","selected":false},{"value":"all","label":"All Flash Contents","selected":false}]},{"label":"Upload Speed","option":"baud","values":[{"value":"115200","label":"115200","selected":true},{"value":"57600","label":"57600","selected":false},{"value":"230400","label":"230400","selected":false},{"value":"460800","label":"460800","selected":false},{"value":"921600","label":"921600","selected":false},{"value":"3000000","label":"3000000","selected":false}]}]'),
                'foo:bar:baz:xtal=80,vt=flash,exception=legacy,ssl=all,eesz=4M2M,ip=lm2f,dbg=Disabled,lvl=None____,wipe=none,baud=115200'
            ],
            [
                'foo:bar:baz',
                JSON.parse('[]'),
                'foo:bar:baz'
            ],
            [
                'foo:bar:baz:xtal=80',
                {},
                undefined
            ]
        ] as Array<[string, Array<ConfigOption>, string | undefined]>).forEach(([fqbn, configOptions, expectation]) => {
            it(`should ${expectation ? `append` : 'throw an error when appending'}config options to ${fqbn}`, () => {
                if (!expectation) {
                    try {
                        ConfigOption.decorate(fqbn, configOptions);
                        fail(`Expected a failure when decorating ${fqbn} with config options.`);
                    } catch (e) {
                        expect(e).to.be.instanceOf(ConfigOption.ConfigOptionError);
                    }
                } else {
                    expect(ConfigOption.decorate(fqbn, configOptions)).to.be.equal(expectation);
                }
            });
        });

    });

});
