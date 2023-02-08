import {
  NativeImage,
  nativeImage,
  Size,
} from '@theia/core/electron-shared/electron';
import { Endpoint } from '@theia/core/lib/browser/endpoint';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { injectable } from '@theia/core/shared/inversify';
import fetch from 'cross-fetch';

const nativeImageIdentifierLiterals = ['cloud'] as const;
export type NativeImageIdentifier =
  typeof nativeImageIdentifierLiterals[number];
export const nativeImages: Record<NativeImageIdentifier, string> = {
  cloud: 'cloud.png',
};

@injectable()
export class NativeImageCache implements FrontendApplicationContribution {
  private readonly cache = new Map<NativeImageIdentifier, NativeImage>();
  private readonly loading = new Map<
    NativeImageIdentifier,
    Promise<NativeImage>
  >();

  onStart(): void {
    Object.keys(nativeImages).forEach((identifier: NativeImageIdentifier) =>
      this.getImage(identifier)
    );
  }

  tryGetImage(identifier: NativeImageIdentifier): NativeImage | undefined {
    return this.cache.get(identifier);
  }

  async getImage(identifier: NativeImageIdentifier): Promise<NativeImage> {
    const image = this.cache.get(identifier);
    if (image) {
      return image;
    }
    let loading = this.loading.get(identifier);
    if (!loading) {
      const deferred = new Deferred<NativeImage>();
      loading = deferred.promise;
      this.loading.set(identifier, loading);
      this.fetchIconData(identifier).then(
        (image) => {
          if (!this.cache.has(identifier)) {
            this.cache.set(identifier, image);
          }
          this.loading.delete(identifier);
          deferred.resolve(image);
        },
        (err) => {
          this.loading.delete(identifier);
          deferred.reject(err);
        }
      );
    }
    return loading;
  }

  private async fetchIconData(
    identifier: NativeImageIdentifier
  ): Promise<NativeImage> {
    const path = `nativeImage/${nativeImages[identifier]}`;
    const endpoint = new Endpoint({ path }).getRestUrl().toString();
    const response = await fetch(endpoint);
    const arrayBuffer = await response.arrayBuffer();
    const view = new Uint8Array(arrayBuffer);
    const buffer = Buffer.alloc(arrayBuffer.byteLength);
    buffer.forEach((_, index) => (buffer[index] = view[index]));
    const image = nativeImage.createFromBuffer(buffer);
    return this.maybeResize(image);
  }

  private maybeResize(image: NativeImage): NativeImage {
    const currentSize = image.getSize();
    if (sizeEquals(currentSize, preferredSize)) {
      return image;
    }
    return image.resize(preferredSize);
  }
}

const pixel = 16;
const preferredSize: Size = { height: pixel, width: pixel };
function sizeEquals(left: Size, right: Size): boolean {
  return left.height === right.height && left.width === right.width;
}
