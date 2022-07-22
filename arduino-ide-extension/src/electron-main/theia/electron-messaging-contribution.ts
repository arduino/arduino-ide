import { ChannelMultiplexer } from '@theia/core/lib/common/message-rpc/channel';
import {
  ElectronMessagingContribution as TheiaElectronMessagingContribution,
  ElectronWebContentChannel,
} from '@theia/core/lib/electron-main/messaging/electron-messaging-contribution';
import { injectable } from '@theia/core/shared/inversify';

// Electron window cannot reload: https://github.com/eclipse-theia/theia/issues/11600
// This patch fixes it by removing the channel multiplexer from the cache.
// A related PR in Theia: https://github.com/eclipse-theia/theia/pull/11810
@injectable()
export class ElectronMessagingContribution extends TheiaElectronMessagingContribution {
  // Based on: https://github.com/kittaakos/theia/commit/12dd318df589f1c48de2b58545912d8385919b22
  protected override createWindowChannelData(sender: Electron.WebContents): {
    channel: ElectronWebContentChannel;
    multiplexer: ChannelMultiplexer;
  } {
    const mainChannel = this.createWindowMainChannel(sender);
    const multiplexer = new ChannelMultiplexer(mainChannel);
    multiplexer.onDidOpenChannel((openEvent) => {
      const { channel, id } = openEvent;
      if (this.channelHandlers.route(id, channel)) {
        console.debug(`Opening channel for service path '${id}'.`);
        channel.onClose(() =>
          console.debug(`Closing channel on service path '${id}'.`)
        );
      }
    });

    // When refreshing the browser window.
    sender.once('did-navigate', () => {
      multiplexer.onUnderlyingChannelClose({ reason: 'Window was refreshed' });
      this.windowChannelMultiplexer.delete(sender.id);
    });
    // When closing the browser window.
    sender.once('destroyed', () => {
      multiplexer.onUnderlyingChannelClose({ reason: 'Window was closed' });
      this.windowChannelMultiplexer.delete(sender.id);
    });
    const data = { channel: mainChannel, multiplexer };
    this.windowChannelMultiplexer.set(sender.id, data);
    return data;
  }
}
