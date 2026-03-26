'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { pt } from '@gini/shared/src/i18n/pt';
import { en } from '@gini/shared/src/i18n/en';

type Locale = 'pt' | 'en';
type TranslationKeys = keyof typeof pt;

const translations: Record<Locale, Record<string, string>> = { pt, en };

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKeys | string) => string;
}>({
  locale: 'pt',
  setLocale: () => {},
  t: (key) => key,
});

export function useLocale() {
  return useContext(LocaleContext);
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('pt');

  useEffect(() => {
    const saved = localStorage.getItem('gini-locale') as Locale;
    if (saved && (saved === 'pt' || saved === 'en')) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('gini-locale', l);
  }, []);

  const t = useCallback((key: string): string => {
    return translations[locale][key] || key;
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}
