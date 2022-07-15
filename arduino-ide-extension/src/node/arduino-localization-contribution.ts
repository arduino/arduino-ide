import {
  LocalizationContribution,
  LocalizationRegistry,
} from '@theia/core/lib/node/i18n/localization-contribution';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class ArduinoLocalizationContribution
  implements LocalizationContribution
{
  async registerLocalizations(registry: LocalizationRegistry): Promise<void> {
    registry.registerLocalizationFromRequire(
      'af',
      require('../../build/i18n/af.json')
    );

    registry.registerLocalizationFromRequire(
      'en',
      require('../../build/i18n/en.json')
    );

    registry.registerLocalizationFromRequire(
      'fr',
      require('../../build/i18n/fr.json')
    );

    registry.registerLocalizationFromRequire(
      'ko',
      require('../../build/i18n/ko.json')
    );

    registry.registerLocalizationFromRequire(
      'pt-br',
      require('../../build/i18n/pt.json')
    );

    registry.registerLocalizationFromRequire(
      'uk_UA',
      require('../../build/i18n/uk_UA.json')
    );

    registry.registerLocalizationFromRequire(
      'ar',
      require('../../build/i18n/ar.json')
    );

    registry.registerLocalizationFromRequire(
      'es',
      require('../../build/i18n/es.json')
    );

    registry.registerLocalizationFromRequire(
      'he',
      require('../../build/i18n/he.json')
    );

    registry.registerLocalizationFromRequire(
      'my_MM',
      require('../../build/i18n/my_MM.json')
    );

    registry.registerLocalizationFromRequire(
      'ro',
      require('../../build/i18n/ro.json')
    );

    registry.registerLocalizationFromRequire(
      'zh-cn',
      require('../../build/i18n/zh.json')
    );

    registry.registerLocalizationFromRequire(
      'bg',
      require('../../build/i18n/bg.json')
    );

    registry.registerLocalizationFromRequire(
      'eu',
      require('../../build/i18n/eu.json')
    );

    registry.registerLocalizationFromRequire(
      'hu',
      require('../../build/i18n/hu.json')
    );

    registry.registerLocalizationFromRequire(
      'ne',
      require('../../build/i18n/ne.json')
    );

    registry.registerLocalizationFromRequire(
      'ru',
      require('../../build/i18n/ru.json')
    );

    registry.registerLocalizationFromRequire(
      'zh_TW',
      require('../../build/i18n/zh_TW.json')
    );

    registry.registerLocalizationFromRequire(
      'de',
      require('../../build/i18n/de.json')
    );

    registry.registerLocalizationFromRequire(
      'fa',
      require('../../build/i18n/fa.json')
    );

    registry.registerLocalizationFromRequire(
      'it',
      require('../../build/i18n/it.json')
    );

    registry.registerLocalizationFromRequire(
      'nl',
      require('../../build/i18n/nl.json')
    );

    registry.registerLocalizationFromRequire(
      'sv_SE',
      require('../../build/i18n/sv_SE.json')
    );

    registry.registerLocalizationFromRequire(
      'el',
      require('../../build/i18n/el.json')
    );

    registry.registerLocalizationFromRequire(
      'fil',
      require('../../build/i18n/fil.json')
    );

    registry.registerLocalizationFromRequire(
      'ja',
      require('../../build/i18n/ja.json')
    );

    registry.registerLocalizationFromRequire(
      'pl',
      require('../../build/i18n/pl.json')
    );

    registry.registerLocalizationFromRequire(
      'tr',
      require('../../build/i18n/tr.json')
    );
  }
}
