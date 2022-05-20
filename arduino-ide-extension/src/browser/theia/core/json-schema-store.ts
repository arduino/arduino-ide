import { injectable } from '@theia/core/shared/inversify';
import { DefaultJsonSchemaContribution as TheiaDefaultJsonSchemaContribution } from '@theia/core/lib/browser/json-schema-store';

@injectable()
export class DefaultJsonSchemaContribution extends TheiaDefaultJsonSchemaContribution {
  override async registerSchemas(): Promise<void> {
    // NOOP
    // Do not fetch the https://www.schemastore.org/api/json/catalog.json on every single browser window load.
    // If the schemas are required in the future, we should fetch the `catalog.json` on build time and load it.
  }
}
