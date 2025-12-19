import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TranslationCache {
  [key: string]: string;
}

export const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'it', name: 'Italian (Italiano)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'ko', name: 'Korean (한국어)' },
  { code: 'zh', name: 'Chinese (中文)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'bn', name: 'Bengali (বাংলা)' },
  { code: 'ur', name: 'Urdu (اردو)' },
  { code: 'tr', name: 'Turkish (Türkçe)' },
  { code: 'vi', name: 'Vietnamese (Tiếng Việt)' },
  { code: 'th', name: 'Thai (ไทย)' },
  { code: 'nl', name: 'Dutch (Nederlands)' },
  { code: 'pl', name: 'Polish (Polski)' },
  { code: 'id', name: 'Indonesian (Bahasa Indonesia)' },
];

interface TranslationContextType {
  targetLanguage: string;
  changeLanguage: (langCode: string) => void;
  translateText: (text: string) => Promise<string>;
  t: (text: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const cache: TranslationCache = {};

export function TranslationProvider({ children }: { children: ReactNode }) {
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

  return (
    <TranslationContext.Provider value={{ targetLanguage, changeLanguage, translateText, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
}
