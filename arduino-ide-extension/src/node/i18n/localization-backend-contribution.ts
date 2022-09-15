import * as express from 'express';
import { inject, injectable } from '@theia/core/shared/inversify';
import { LocalizationBackendContribution as TheiaLocalizationBackendContribution } from '@theia/core/lib/node/i18n/localization-backend-contribution';
import { PluginDeployer } from '@theia/plugin-ext/lib/common/plugin-protocol';
import { PluginDeployerImpl } from '@theia/plugin-ext/lib/main/node/plugin-deployer-impl';
import { Deferred } from '@theia/core/lib/common/promise-util';

@injectable()
export class LocalizationBackendContribution extends TheiaLocalizationBackendContribution {
  @inject(PluginDeployer)
  private readonly pluginDeployer: PluginDeployerImpl;

  private readonly initialized = new Deferred<void>();

  override async initialize(): Promise<void> {
    this.pluginDeployer.onDidDeploy(() => {
      this.initialized.resolve();
    });
    return super.initialize();
  }

  override configure(app: express.Application): void {
    app.get('/i18n/:locale', async (req, res) => {
      let locale = req.params.locale;
      /*
        Waiting for the deploy of the language plugins is necessary to avoid checking the available
        languages before they're finished to be loaded: https://github.com/eclipse-theia/theia/issues/11471
      */
      const start = performance.now();
      await this.initialized.promise;
      console.info(
        'Waiting for the deploy of the language plugins took: ' +
          (performance.now() - start) +
          ' ms.'
      );
      locale = this.localizationProvider
        .getAvailableLanguages()
        .some((e) => e.languageId === locale)
        ? locale
        : 'en';
      this.localizationProvider.setCurrentLanguage(locale);
      res.send(this.localizationProvider.loadLocalization(locale));
    });
  }
}
