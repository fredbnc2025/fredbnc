export type Continent = 'América' | 'América del Sur' | 'América del Norte' | 'Europa' | 'Asia' | 'África' | 'Oceanía';

export interface Country {
  id: string; // ISO 3166-1 alpha-2 code (lowercase, e.g. 'es', 'mx', 'ar')
  code3: string;
  nameEs: string;
  nameEn: string;
  capitalEs: string;
  capitalEn: string;
  continent: Continent;
  lat: number;
  lng: number;
  capitalCoordinates?: [number, number];
  population: number; // e.g. 47000000
  areaKm2: number;
  currency: string;
  language: string;
  colors: string[]; // e.g. ['red', 'yellow']
  flagSymbolismEs: string;
  funFactEs: string;
  borders?: string[];
  isIsland?: boolean;
  isTerritory?: boolean;
  territoryCategory?: 'country' | 'island' | 'territory';
}

export type ViewMode = 'gallery' | 'comparator' | 'quiz' | 'creator' | 'vexillology';

export interface FlagColorPalette {
  name: string;
  hex: string;
  meaningEs: string;
  proportionApprox?: string;
}

export type FlagLayoutType =
  | 'triband-h'
  | 'triband-v'
  | 'bicolor-h'
  | 'bicolor-v'
  | 'nordic-cross'
  | 'saltire'
  | 'canton'
  | 'diagonal'
  | 'solid';

export type FlagEmblemType =
  | 'none'
  | 'star-5'
  | 'sun'
  | 'crescent-star'
  | 'shield'
  | 'crown'
  | 'eagle'
  | 'maple-leaf'
  | 'compass-rose'
  | 'fleur-de-lis';

export interface CustomFlag {
  id: string;
  title: string;
  author: string;
  layout: FlagLayoutType;
  color1: string;
  color2: string;
  color3: string;
  colorCanton?: string;
  emblem: FlagEmblemType;
  emblemColor: string;
  aspectRatio: '2:3' | '1:2' | '3:5' | '1:1';
  createdAt: number;
}

export type EarthMapStyle =
  | 'political'
  | 'satellite'
  | 'night'
  | 'geodetic'
  | 'topography'
  | 'minimal_blue'
  | 'subdivision_bw'
  | 'royal_blue'
  | 'ice_slate'
  | 'continental_spectrum';

export interface MapLayerConfig {
  showClouds: boolean;
  showGraticule: boolean;
  showSolarTerminator: boolean;
  showExtremes: boolean;
  showAntipode: boolean;
  showGreatCircleArc: boolean;
  showVectorBorders?: boolean;
  showIslands?: boolean;
  showSubdivisions?: boolean;
  showPoliticalDivision?: boolean;
  showCountryLabels?: boolean;
}

export type SubdivisionType =
  | 'estado'
  | 'departamento'
  | 'provincia'
  | 'comunidad_autonoma'
  | 'region'
  | 'bundesland'
  | 'prefectura'
  | 'canton'
  | 'territorio'
  | 'condado'
  | 'distrito'
  | 'otro';

export interface PoliticalSubdivision {
  id: string; // e.g. 'es-an', 'mx-jal', 'ar-b', 'co-ant'
  name: string; // e.g. 'Andalucía', 'Jalisco', 'Buenos Aires', 'Antioquia'
  code: string; // ISO 3166-2 e.g. 'ES-AN', 'MX-JAL', 'AR-B'
  type: string; // e.g. 'Comunidad Autónoma', 'Estado', 'Provincia', 'Departamento'
  capital: string; // e.g. 'Sevilla', 'Guadalajara', 'La Plata', 'Medellín'
  population: number;
  areaKm2: number;
  lat: number;
  lng: number;
  triviaEs?: string;
  badge?: string;
  isCapitalRegion?: boolean;
}

export interface CountryPoliticalStructure {
  countryId: string;
  countryName: string;
  divisionTypeName: string; // e.g. "Comunidades Autónomas", "Estados Federados", "Departamentos"
  totalCount: number;
  governmentSystem: string; // e.g. "Monarquía Parlamentaria / Estado Autonómico", "República Federal Presidencialista"
  descriptionEs: string;
  subdivisions: PoliticalSubdivision[];
}

export interface QuizState {
  currentQuestionIndex: number;
  score: number;
  streak: number;
  totalQuestions: number;
  isCompleted: boolean;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  timeLeft: number;
}

export type SubscriptionPlanId = 'free' | 'monthly' | 'annual' | 'lifetime';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  badge?: string;
  price: number;
  periodLabel: string;
  billingDescription: string;
  savingsBadge?: string;
  isPopular?: boolean;
  features: string[];
  ctaLabel: string;
}

export interface UserSubscription {
  planId: SubscriptionPlanId;
  isPro: boolean;
  activatedAt?: number;
  expiresAt?: number | null; // null if lifetime
  customerEmail?: string;
}
