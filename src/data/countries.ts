import { Country, Continent } from '../types';
import { AMERICA_COUNTRIES } from './america';
import { EUROPE_COUNTRIES } from './europe';
import { ASIA_COUNTRIES } from './asia';
import { AFRICA_COUNTRIES } from './africa';
import { OCEANIA_COUNTRIES } from './oceania';

export const COUNTRIES: Country[] = [
  ...AMERICA_COUNTRIES,
  ...EUROPE_COUNTRIES,
  ...ASIA_COUNTRIES,
  ...AFRICA_COUNTRIES,
  ...OCEANIA_COUNTRIES
];

export const CONTINENTS: Continent[] = [
  'América',
  'Europa',
  'Asia',
  'África',
  'Oceanía'
];
