import { useState, useEffect } from 'react';

interface TranslationCache {
  [key: string]: string;
}

const cache: TranslationCache = {};

export const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'ur', name: 'Urdu' },
  { code: 'tr', name: 'Turkish' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'id', name: 'Indonesian' },
];

export function useTranslation() {
  const [targetLanguage, setTargetLanguage] = useState<string>(() => {
    return localStorage.getItem('preferredLanguage') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('preferredLanguage', targetLanguage);
  }, [targetLanguage]);

  const translateText = async (text: string): Promise<string> => {
    if (!text || targetLanguage === 'en') return text;

    const cacheKey = `${text}_${targetLanguage}`;
    if (cache[cacheKey]) return cache[cacheKey];

    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLanguage}`
      );
      const data = await response.json();

      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        cache[cacheKey] = data.responseData.translatedText;
        return data.responseData.translatedText;
      }
      return text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  };

  const t = (text: string): string => {
    if (targetLanguage === 'en') return text;

    const cacheKey = `${text}_${targetLanguage}`;
    return cache[cacheKey] || text;
  };

  const changeLanguage = (langCode: string) => {
    setTargetLanguage(langCode);
  };

  return {
    targetLanguage,
    changeLanguage,
    translateText,
    t,
  };
}
