import { FileStat } from '@theia/filesystem/lib/common/files';
import { injectable } from 'inversify';
import { toPosixPath } from '../../create/create-paths';
import { Create } from '../../create/typings';

@injectable()
export class SketchCache {
  sketches: Record<string, Create.Sketch> = {};
  fileStats: Record<string, FileStat> = {};

  init(): void {
    // reset the data
    this.sketches = {};
    this.fileStats = {};
  }

  addItem(item: FileStat): void {
    this.fileStats[item.resource.path.toString()] = item;
  }

  getItem(path: string): FileStat | null {
    return this.fileStats[path] || null;
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
