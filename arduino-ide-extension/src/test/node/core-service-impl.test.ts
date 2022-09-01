import { expect } from 'chai';
import {
  PortIdentifier,
  portIdentifierEquals,
  Port,
} from '../../common/protocol/boards-service';
import { Port as RpcPort } from '../../node/cli-protocol/cc/arduino/cli/commands/v1/port_pb';
import { CoreServiceImpl } from '../../node/core-service-impl';

describe('core-service-impl', () => {
  describe('createPort', () => {
    it("should map the 'undefined' port object to an 'undefined' gRPC port value", () => {
      const actual = new CoreServiceImpl()['createPort'](undefined);
      expect(actual).to.be.undefined;
    });

    it('should map a port object to the appropriate gRPC port object', () => {
      const properties = {
        alma: 'false',
        korte: '36',
      };
      const port = {
        address: 'address',
        addressLabel: 'address label',
        hardwareId: '1730323',
        protocol: 'serial',
        protocolLabel: 'serial port',
        properties,
      } as const;
      const resolve = (toResolve: PortIdentifier): Port | undefined => {
        if (portIdentifierEquals(toResolve, port)) {
          return port;
        }
        return undefined;
      };
      const actual = new CoreServiceImpl()['createPort'](
        { protocol: port.protocol, address: port.address },
        resolve
      );
      expect(actual).to.be.not.undefined;
      const expected = new RpcPort()
        .setAddress(port.address)
        .setHardwareId(port.hardwareId)
        .setLabel(port.addressLabel)
        .setProtocol(port.protocol)
        .setProtocolLabel(port.protocolLabel);
      Object.entries(properties).forEach(([key, value]) =>
        expected.getPropertiesMap().set(key, value)
      );
      expect((<RpcPort>actual).toObject(false)).to.be.deep.equal(
        expected.toObject(false)
      );
    });
  });
});
