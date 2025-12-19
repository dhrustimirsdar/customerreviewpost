import { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/TranslationContext';

interface TranslatedTextProps {
  text: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export default function TranslatedText({ text, className = '', as: Component = 'span' }: TranslatedTextProps) {
  const { targetLanguage, translateText } = useTranslation();
  const [translatedText, setTranslatedText] = useState(text);

  useEffect(() => {
    let mounted = true;

    const translate = async () => {
      if (targetLanguage === 'en') {
        setTranslatedText(text);
        return;
      }

      const translated = await translateText(text);
      if (mounted) {
        setTranslatedText(translated);
      }
    };

    translate();

    return () => {
      mounted = false;
    };
  }, [text, targetLanguage, translateText]);

  return <Component className={className}>{translatedText}</Component>;
}
