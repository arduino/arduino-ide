export namespace Create {
  export interface Sketch {
    readonly name: string;
    readonly path: string;
    readonly modified_at: string;
    readonly created_at: string;

    readonly secrets?: { name: string; value: string }[];

    readonly id: string;
    readonly is_public: boolean;
    readonly board_fqbn: '';
    readonly board_name: '';
    readonly board_type: 'serial' | 'network' | 'cloud' | '';
    readonly href?: string;
    readonly libraries: string[];
    readonly tutorials: string[] | null;
    readonly types: string[] | null;
    readonly user_id: string;
  }

  export type ResourceType = 'sketch' | 'folder' | 'file';
  export const arduino_secrets_file = 'arduino_secrets.h';
  export const do_not_sync_files = ['.theia'];
  export interface Resource {
    readonly name: string;
    /**
     * Note: this path is **not** the POSIX path we use. It has the leading segments with the `user_id`.
     */
    readonly path: string;
    readonly type: ResourceType;
    readonly sketchId?: string;
    readonly modified_at: string; // As an ISO-8601 formatted string: `YYYY-MM-DDTHH:mm:ss.sssZ`
    readonly created_at: string; // As an ISO-8601 formatted string: `YYYY-MM-DDTHH:mm:ss.sssZ`
    readonly children?: number; // For 'sketch' and 'folder' types.
    readonly size?: number; // For 'sketch' type only.
    readonly isPublic?: boolean; // For 'sketch' type only.

    readonly mimetype?: string; // For 'file' type.
    readonly href?: string;
  }
  export namespace Resource {
    export function is(arg: any): arg is Resource {
      return (
        !!arg &&
        'name' in arg &&
        typeof arg['name'] === 'string' &&
        'path' in arg &&
        typeof arg['path'] === 'string' &&
        'type' in arg &&
        typeof arg['type'] === 'string' &&
        'modified_at' in arg &&
        typeof arg['modified_at'] === 'string' &&
        (arg['type'] === 'sketch' ||
          arg['type'] === 'folder' ||
          arg['type'] === 'file')
      );
    }
  }

  export type RawResource = Omit<Resource, 'sketchId' | 'isPublic'>;
}

export class CreateError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, CreateError.prototype);
  }
}
