import { MessagingContribution as TheiaMessagingContribution } from '@theia/core/lib/node/messaging/messaging-contribution';
import { injectable } from '@theia/core/shared/inversify';
@injectable()
export class MessagingContribution extends TheiaMessagingContribution {
  // https://github.com/eclipse-theia/theia/discussions/11543
  protected override checkAliveTimeout = process.argv.includes(
    '--no-ping-timeout'
  )
    ? 24 * 60 * 60 * 1_000 // one day
    : 30_000;
}
