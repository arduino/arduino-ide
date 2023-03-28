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
export const nativeImages: Record<
  NativeImageIdentifier,
  string | { light: string; dark: string }
> = {
  cloud: { light: 'cloud-light.png', dark: 'cloud-dark.png' },
};

export interface ThemeNativeImage {
  readonly light: NativeImage;
  readonly dark: NativeImage;
}

export function isThemeNativeImage(arg: unknown): arg is ThemeNativeImage {
  return (
    typeof arg === 'object' &&
    (<ThemeNativeImage>arg).light !== undefined &&
    (<ThemeNativeImage>arg).dark !== undefined
  );
}

type Image = NativeImage | ThemeNativeImage;

@injectable()
export class NativeImageCache implements FrontendApplicationContribution {
  private readonly cache = new Map<NativeImageIdentifier, Image>();
  private readonly loading = new Map<NativeImageIdentifier, Promise<Image>>();

  onStart(): void {
    Object.keys(nativeImages).forEach((identifier: NativeImageIdentifier) =>
      this.getImage(identifier)
    );
  }

  tryGetImage(identifier: NativeImageIdentifier): Image | undefined {
    return this.cache.get(identifier);
  }

  async getImage(identifier: NativeImageIdentifier): Promise<Image> {
    const image = this.cache.get(identifier);
    if (image) {
      return image;
    }
    let loading = this.loading.get(identifier);
    if (!loading) {
      const deferred = new Deferred<Image>();
      loading = deferred.promise;
      this.loading.set(identifier, loading);
      this.fetchImage(identifier).then(
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

  private async fetchImage(identifier: NativeImageIdentifier): Promise<Image> {
    const value = nativeImages[identifier];
    if (typeof value === 'string') {
      return this.fetchIconData(value);
    }
    const [light, dark] = await Promise.all([
      this.fetchIconData(value.light),
      this.fetchIconData(value.dark),
    ]);
    return { light, dark };
  }

  private async fetchIconData(filename: string): Promise<NativeImage> {
    const path = `nativeImage/${filename}`;
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
