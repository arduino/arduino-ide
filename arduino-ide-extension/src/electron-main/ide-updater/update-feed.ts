import { UpdateChannel } from '../../browser/arduino-preferences';

export const officialUpdateBaseUrl = 'https://downloads.arduino.cc/arduino-ide';
/**
 * Base URL of a custom update server to test the IDE updater with
 */
export const updateBaseUrlEnvKey = 'ARDUINO_IDE_UPDATE_BASE_URL';

const loopbackHostnames = ['localhost', '127.0.0.1', '[::1]'];

export interface UpdateFeed {
  readonly channel: UpdateChannel;
  readonly url: string;
}

export function updateFeed(
  channel: UpdateChannel,
  env: NodeJS.ProcessEnv = process.env
): UpdateFeed {
  if (!Object.values(UpdateChannel).includes(channel)) {
    console.error(
      `Invalid IDE update channel: ${channel}. Using ${UpdateChannel.Stable}.`
    );
    channel = UpdateChannel.Stable;
  }
  const baseUrl = updateBaseUrl(env[updateBaseUrlEnvKey]);
  return {
    channel,
    url: `${baseUrl}/${channel === UpdateChannel.Nightly ? 'nightly' : ''}`,
  };
}

function updateBaseUrl(override: string | undefined): string {
  if (!override) {
    return officialUpdateBaseUrl;
  }
  const url = parseUpdateBaseUrl(override);
  if (!url) {
    console.error(
      `Invalid ${updateBaseUrlEnvKey}: ${override}. Using ${officialUpdateBaseUrl}.`
    );
    return officialUpdateBaseUrl;
  }
  const baseUrl = url.href.replace(/\/+$/, '');
  console.warn(`Using a custom IDE update base URL: ${baseUrl}`);
  return baseUrl;
}

export function parseUpdateBaseUrl(raw: string): URL | undefined {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return undefined;
  }
  if (url.username || url.password || url.search || url.hash) {
    return undefined;
  }
  const valid =
    url.protocol === 'https:' ||
    (url.protocol === 'http:' && loopbackHostnames.includes(url.hostname));
  return valid ? url : undefined;
}
