import { expect } from 'chai';
import {
  PortIdentifier,
  portIdentifierEquals,
  Port,
} from '../../common/protocol/boards-service';
import type { Port as RpcPort } from '../../node/cli-api';
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
      const expected: RpcPort = {
        address: port.address,
        label: port.addressLabel,
        hardwareId: port.hardwareId,
        protocol: port.protocol,
        protocolLabel: port.protocolLabel,
        properties,
      };
      expect(actual).to.be.deep.equal(expected);
    });
  });
});
