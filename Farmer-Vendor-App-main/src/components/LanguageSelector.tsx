import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { RadioButton, Text, Surface, Title } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../config/i18n';

export const LanguageSelector = () => {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');

  const handleLanguageChange = async (languageCode: string) => {
    try {
      setSelectedLanguage(languageCode);
      await i18n.changeLanguage(languageCode);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  // Get languages directly from the LANGUAGES object
  const languages = Object.entries(LANGUAGES).map(([code, { name }]) => ({
    code,
    name
  }));

  return (
    <Surface style={styles.container}>
      <Title style={styles.title}>{t('common.language')}</Title>
      {languages.map(({ code, name }) => (
        <RadioButton.Item
          key={code}
          label={name}
          value={code}
          status={selectedLanguage === code ? 'checked' : 'unchecked'}
          onPress={() => handleLanguageChange(code)}
          style={styles.radioItem}
        />
      ))}
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 16,
    borderRadius: 8,
    elevation: 2,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  radioItem: {
    paddingVertical: 8,
  },
});
