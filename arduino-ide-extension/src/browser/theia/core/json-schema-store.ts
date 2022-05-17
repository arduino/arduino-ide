import { injectable } from '@theia/core/shared/inversify';
import { DefaultJsonSchemaContribution as TheiaDefaultJsonSchemaContribution } from '@theia/core/lib/browser/json-schema-store';

@injectable()
export class DefaultJsonSchemaContribution extends TheiaDefaultJsonSchemaContribution {
  async registerSchemas(): Promise<void> {
    // NOOP
  }
}
