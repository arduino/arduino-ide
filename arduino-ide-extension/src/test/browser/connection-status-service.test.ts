import { enableJSDOM } from '@theia/core/lib/browser/test/jsdom';
const disableJSDOM = enableJSDOM();

import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
FrontendApplicationConfigProvider.set({});

import { expect } from 'chai';
import {
  backendOfflineText,
  backendOfflineTooltip,
  daemonOfflineText,
  daemonOfflineTooltip,
  offlineText,
  offlineTooltip,
  offlineMessage,
} from '../../browser/theia/core/connection-status-service';

disableJSDOM();

describe('connection-status-service', () => {
  describe('offlineMessage', () => {
    it('should warn about the offline backend if connected to both CLI daemon and Internet but offline', () => {
      const actual = offlineMessage({
        port: '50051',
        online: true,
        backendConnected: false,
      });
      expect(actual.text).to.be.equal(backendOfflineText);
      expect(actual.tooltip).to.be.equal(backendOfflineTooltip);
    });

    it('should warn about the offline CLI daemon if the CLI daemon port is missing but has Internet connection', () => {
      const actual = offlineMessage({
        port: undefined,
        online: true,
        backendConnected: true,
      });
      expect(actual.text.endsWith(daemonOfflineText)).to.be.true;
      expect(actual.tooltip).to.be.equal(daemonOfflineTooltip);
    });

    it('should warn about the offline CLI daemon if the CLI daemon port is missing and has no Internet connection', () => {
      const actual = offlineMessage({
        port: undefined,
        online: false,
        backendConnected: true,
      });
      expect(actual.text.endsWith(daemonOfflineText)).to.be.true;
      expect(actual.tooltip).to.be.equal(daemonOfflineTooltip);
    });

    it('should warn about no Internet connection if CLI daemon port is available but the Internet connection is offline', () => {
      const actual = offlineMessage({
        port: '50051',
        online: false,
        backendConnected: true,
      });
      expect(actual.text.endsWith(offlineText)).to.be.true;
      expect(actual.tooltip).to.be.equal(offlineTooltip);
    });
  });
});
