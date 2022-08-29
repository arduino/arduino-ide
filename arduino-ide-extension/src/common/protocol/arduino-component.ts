import { Installable } from './installable';

export interface ArduinoComponent {
  readonly name: string;
  readonly deprecated: boolean;
  readonly author: string;
  readonly summary: string;
  readonly description: string;
  readonly moreInfoLink?: string;
  readonly availableVersions: Installable.Version[];
  readonly installable: boolean;
  readonly installedVersion?: Installable.Version;
  /**
   * This is the `Type` in IDE (1.x) UI.
   */
  readonly types: string[];
}
export namespace ArduinoComponent {
  export function is(arg: any): arg is ArduinoComponent {
    return (
      !!arg &&
      'name' in arg &&
      typeof arg['name'] === 'string' &&
      'author' in arg &&
      typeof arg['author'] === 'string' &&
      'summary' in arg &&
      typeof arg['summary'] === 'string' &&
      'description' in arg &&
      typeof arg['description'] === 'string' &&
      'installable' in arg &&
      typeof arg['installable'] === 'boolean'
    );
  }
}
