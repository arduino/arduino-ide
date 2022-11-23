import { DebugStackFrame as TheiaDebugStackFrame } from '@theia/debug/lib/browser/model/debug-stack-frame';
import { DebugThread as TheiaDebugThread } from '@theia/debug/lib/browser/model/debug-thread';
import { DebugProtocol } from '@vscode/debugprotocol';
import { DebugStackFrame } from './debug-stack-frame';

export class DebugThread extends TheiaDebugThread {
  protected override doUpdateFrames(
    frames: DebugProtocol.StackFrame[]
  ): TheiaDebugStackFrame[] {
    const result = new Set<TheiaDebugStackFrame>();
    for (const raw of frames) {
      const id = raw.id;
      const frame =
        this._frames.get(id) || new DebugStackFrame(this, this.session); // patched debug stack frame
      this._frames.set(id, frame);
      frame.update({ raw });
      result.add(frame);
    }
    this.updateCurrentFrame();
    return [...result.values()];
  }
}
