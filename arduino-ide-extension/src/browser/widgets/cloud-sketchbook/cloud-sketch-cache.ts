import { FileStat } from '@theia/filesystem/lib/common/files';
import { injectable } from 'inversify';
import { Create } from '../../create/create-api';
import { toPosixPath } from '../../create/create-paths';

@injectable()
export class SketchCache {
  sketches: Record<string, Create.Sketch> = {};
  filestats: Record<string, FileStat> = {};

  init(): void {
    // reset the data
    this.sketches = {};
    this.filestats = {};
  }

  addItem(item: FileStat): void {
    this.filestats[item.resource.path.toString()] = item;
  }

  getItem(path: string): FileStat | null {
    return this.filestats[path] || null;
  }

  addSketch(sketch: Create.Sketch): void {
    const { path } = sketch;
    const posixPath = toPosixPath(path);
    this.sketches[posixPath] = sketch;
  }

  getSketch(path: string): Create.Sketch | null {
    return this.sketches[path] || null;
  }
}
