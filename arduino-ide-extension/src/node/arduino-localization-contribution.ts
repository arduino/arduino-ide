import {
  LocalizationContribution,
  LocalizationRegistry,
} from '@theia/core/lib/node/i18n/localization-contribution';
import { injectable } from 'inversify';

@injectable()
export class ArduinoLocalizationContribution
  implements LocalizationContribution
{
  async registerLocalizations(registry: LocalizationRegistry): Promise<void> {
    registry.registerLocalizationFromRequire(
      'af',
      require('../../../i18n/af.json')
    );

    registry.registerLocalizationFromRequire(
      'en',
      require('../../../i18n/en.json')
    );

    registry.registerLocalizationFromRequire(
      'fr',
      require('../../../i18n/fr.json')
    );

    registry.registerLocalizationFromRequire(
      'ko',
      require('../../../i18n/ko.json')
    );

    registry.registerLocalizationFromRequire(
      'pt',
      require('../../../i18n/pt.json')
    );

    registry.registerLocalizationFromRequire(
      'uk_UA',
      require('../../../i18n/uk_UA.json')
    );

    registry.registerLocalizationFromRequire(
      'ar',
      require('../../../i18n/ar.json')
    );

    registry.registerLocalizationFromRequire(
      'es',
      require('../../../i18n/es.json')
    );

    registry.registerLocalizationFromRequire(
      'he',
      require('../../../i18n/he.json')
    );

    registry.registerLocalizationFromRequire(
      'my_MM',
      require('../../../i18n/my_MM.json')
    );

    registry.registerLocalizationFromRequire(
      'ro',
      require('../../../i18n/ro.json')
    );

    registry.registerLocalizationFromRequire(
      'zh',
      require('../../../i18n/zh.json')
    );

    registry.registerLocalizationFromRequire(
      'bg',
      require('../../../i18n/bg.json')
    );

    registry.registerLocalizationFromRequire(
      'eu',
      require('../../../i18n/eu.json')
    );

    registry.registerLocalizationFromRequire(
      'hu',
      require('../../../i18n/hu.json')
    );

    registry.registerLocalizationFromRequire(
      'ne',
      require('../../../i18n/ne.json')
    );

    registry.registerLocalizationFromRequire(
      'ru',
      require('../../../i18n/ru.json')
    );

    registry.registerLocalizationFromRequire(
      'zh_TW',
      require('../../../i18n/zh_TW.json')
    );

    registry.registerLocalizationFromRequire(
      'de',
      require('../../../i18n/de.json')
    );

    registry.registerLocalizationFromRequire(
      'fa',
      require('../../../i18n/fa.json')
    );

    registry.registerLocalizationFromRequire(
      'it',
      require('../../../i18n/it.json')
    );

    registry.registerLocalizationFromRequire(
      'nl',
      require('../../../i18n/nl.json')
    );

    registry.registerLocalizationFromRequire(
      'sv_SE',
      require('../../../i18n/sv_SE.json')
    );

    registry.registerLocalizationFromRequire(
      'el',
      require('../../../i18n/el.json')
    );

    registry.registerLocalizationFromRequire(
      'fil',
      require('../../../i18n/fil.json')
    );

    registry.registerLocalizationFromRequire(
      'ja',
      require('../../../i18n/ja.json')
    );

    registry.registerLocalizationFromRequire(
      'pl',
      require('../../../i18n/pl.json')
    );

    registry.registerLocalizationFromRequire(
      'tr',
      require('../../../i18n/tr.json')
    );
  }
}
