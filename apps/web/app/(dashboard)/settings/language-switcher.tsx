'use client';

import { useLocale } from '../locale-provider';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">
        {locale === 'pt' ? 'Idioma' : 'Language'}
      </h2>
      <div className="mt-3 flex gap-3">
        <button
          onClick={() => setLocale('pt')}
          className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            locale === 'pt'
              ? 'bg-blue-600 text-white'
              : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          🇵🇹 Portugues
        </button>
        <button
          onClick={() => setLocale('en')}
          className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            locale === 'en'
              ? 'bg-blue-600 text-white'
              : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          🇬🇧 English
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {locale === 'pt'
          ? 'A alteracao aplica-se imediatamente a toda a interface.'
          : 'Changes apply immediately to the entire interface.'}
      </p>
    </div>
  );
}
