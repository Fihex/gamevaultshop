import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Import translation files
import enUs from '../locales/en_us.json';
import ruRu from '../locales/ru_ru.json';

const FlagUS = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" className="w-6 h-4 rounded shadow-sm object-cover">
    <clipPath id="s"><path d="M0,0 v30 h60 v-30 z"/></clipPath>
    <path d="M0,0 v30 h60 v-30 z" fill="#002a86"/>
    <path d="M0,0 v30 h60 v-30 z" fill="#fff"/>
    <g clipPath="url(#s)">
    <path d="M0,0 v30 h60 v-30 z" fill="#b22234"/>
    <path d="M0,3.5 h60 M0,10.5 h60 M0,17.5 h60 M0,24.5 h60" stroke="#fff" strokeWidth="3.5"/>
    <path d="M0,0 h24 v16 h-24 z" fill="#3c3b6e"/>
    </g>
  </svg>
);

const FlagRU = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" className="w-6 h-4 rounded shadow-sm object-cover">
    <rect width="60" height="30" fill="#ffffff" />
    <rect y="10" width="60" height="10" fill="#0033A0" />
    <rect y="20" width="60" height="10" fill="#D52B1E" />
  </svg>
);

export const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', flag: <FlagUS />, data: enUs },
    { code: 'ru', name: 'Русский', flag: <FlagRU />, data: ruRu }
];

type LanguageContextType = {
    language: string;
    setLanguage: (code: string) => void;
    t: (key: keyof typeof enUs) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    // ... (Your existing useState logic stays the same) ...
    const [language, setLanguageState] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('app-language');
            if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) return saved;
            // const browser = navigator.language.split('-')[0];
            // if (SUPPORTED_LANGUAGES.some(l => l.code === browser)) return browser;
        }
        return 'ru';
    });

    const setLanguage = (code: string) => {
        setLanguageState(code);
        localStorage.setItem('app-language', code);
    };

    // --- UPDATED TRANSLATION FUNCTION ---
    const t = (key: string): string => {
        // 1. Load Current Language
        const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];
        const currentTranslations = currentLangObj.data as Record<string, string>;

        // 2. Check if translation exists in current language
        if (currentTranslations[key]) {
            return currentTranslations[key];
        }

        // 3. FALLBACK: Check English (Default) if missing
        // We assume 'enUs' is your default source of truth
        const defaultTranslations = enUs as Record<string, string>;
        if (defaultTranslations[key]) {
            return defaultTranslations[key];
        }

        // 4. Last Resort: Return the key itself (e.g., "unknown_key")
        return key;
    };
    // ------------------------------------

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
    return context;
};
