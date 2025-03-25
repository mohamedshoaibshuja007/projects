import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../translations/en';
import hi from '../translations/hi';
import kn from '../translations/kn';

export const LANGUAGES = {
  en: { name: 'English', translation: en },
  hi: { name: 'हिंदी', translation: hi },
  kn: { name: 'ಕನ್ನಡ', translation: kn },
};

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: LANGUAGES,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false
    }
  });

// Load saved language
AsyncStorage.getItem('user-language')
  .then(language => {
    if (language) {
      i18n.changeLanguage(language);
    }
  })
  .catch(error => {
    console.error('Error loading saved language:', error);
  });

export default i18n;
