import { Globe } from 'lucide-react';
import { useTranslation, languages } from '../contexts/TranslationContext';

export default function LanguageSelector() {
  const { targetLanguage, changeLanguage } = useTranslation();

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border-2 border-gray-200 hover:border-red-300 transition-all">
        <Globe className="w-4 h-4 text-gray-600" />
        <select
          value={targetLanguage}
          onChange={(e) => changeLanguage(e.target.value)}
          className="outline-none bg-transparent text-sm font-medium text-gray-700 cursor-pointer"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
