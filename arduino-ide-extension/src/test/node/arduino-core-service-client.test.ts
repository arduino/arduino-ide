import { expect } from 'chai';
import { createArduinoCoreServiceClient } from '../../node/arduino-core-service-client';

describe('arduino-core-service-client', () => {
  it('uses IPv4 loopback by default for the local CLI daemon', () => {
    const client = createArduinoCoreServiceClient({ port: 1521 });
    try {
      expect(client.getChannel().getTarget()).to.equal('127.0.0.1:1521');
    } finally {
      client.close();
    }
  });
});
