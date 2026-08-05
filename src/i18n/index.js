import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import lg from './locales/lg.json';
import sw from './locales/sw.json';

const SUPPORTED_LANGUAGES = ['en', 'lg', 'sw'];

function deviceLanguage() {
  const tag = Localization.getLocales()?.[0]?.languageCode;
  return SUPPORTED_LANGUAGES.includes(tag) ? tag : 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    lg: { translation: lg },
    sw: { translation: sw },
  },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

export default i18n;
export { SUPPORTED_LANGUAGES };
