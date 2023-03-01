import type { Installable } from './installable';

export interface ArduinoComponent {
  readonly name: string;
  readonly author: string;
  readonly summary: string;
  readonly description: string;
  readonly availableVersions: Installable.Version[];
  readonly installedVersion?: Installable.Version;
  /**
   * This is the `Type` in IDE (1.x) UI.
   */
  readonly types: string[];
  readonly deprecated?: boolean;
  readonly moreInfoLink?: string;
}
export namespace ArduinoComponent {
  export function is(arg: unknown): arg is ArduinoComponent {
    return (
      typeof arg === 'object' &&
      (<ArduinoComponent>arg).name !== undefined &&
      typeof (<ArduinoComponent>arg).name === 'string' &&
      (<ArduinoComponent>arg).author !== undefined &&
      typeof (<ArduinoComponent>arg).author === 'string' &&
      (<ArduinoComponent>arg).summary !== undefined &&
      typeof (<ArduinoComponent>arg).summary === 'string' &&
      (<ArduinoComponent>arg).description !== undefined &&
      typeof (<ArduinoComponent>arg).description === 'string' &&
      (<ArduinoComponent>arg).availableVersions !== undefined &&
      Array.isArray((<ArduinoComponent>arg).availableVersions) &&
      (<ArduinoComponent>arg).types !== undefined &&
      Array.isArray((<ArduinoComponent>arg).types)
    );
  }
}
