import { CountryTranslationEn } from './types';
import { EUROPE_TRANSLATIONS_EN } from './europeTranslationsEn';
import { AMERICA_TRANSLATIONS_EN } from './americaTranslationsEn';
import { ASIA_TRANSLATIONS_EN } from './asiaTranslationsEn';
import { AFRICA_TRANSLATIONS_EN } from './africaTranslationsEn';
import { OCEANIA_TRANSLATIONS_EN } from './oceaniaTranslationsEn';

export * from './types';
export { EUROPE_TRANSLATIONS_EN } from './europeTranslationsEn';
export { AMERICA_TRANSLATIONS_EN } from './americaTranslationsEn';
export { ASIA_TRANSLATIONS_EN } from './asiaTranslationsEn';
export { AFRICA_TRANSLATIONS_EN } from './africaTranslationsEn';
export { OCEANIA_TRANSLATIONS_EN } from './oceaniaTranslationsEn';

export const ALL_COUNTRY_TRANSLATIONS_EN: Record<string, CountryTranslationEn> = {
  ...EUROPE_TRANSLATIONS_EN,
  ...AMERICA_TRANSLATIONS_EN,
  ...ASIA_TRANSLATIONS_EN,
  ...AFRICA_TRANSLATIONS_EN,
  ...OCEANIA_TRANSLATIONS_EN
};
