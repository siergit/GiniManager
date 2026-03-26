export { pt } from './pt';
export { en } from './en';
export type TranslationKey = keyof typeof import('./pt').pt;
export type Locale = 'pt' | 'en';
