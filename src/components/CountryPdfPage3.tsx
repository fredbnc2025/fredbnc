import React, { useMemo } from 'react';
import { Compass, Globe, MapPin, Shield, BookOpen, Sparkles, Award } from 'lucide-react';
import { Country } from '../types';
import { NauticalCompass } from './NauticalCompass';
import { getCountryPoliticalStructure } from '../data/politicalDivisions';
import { KdpTranslationService } from '../services/kdpTranslationService';
import { CountryNarrativeService } from '../services/countryNarrativeService';

interface CountryPdfPage3Props {
  country: Country;
  id?: string;
  theme?: 'light' | 'dark';
  lang?: 'es' | 'en';
}

export const CountryPdfPage3: React.FC<CountryPdfPage3Props> = ({
  country,
  id = `pdf-sheet-p3-${country.id}`,
  theme = 'light',
  lang = 'es'
}) => {
  const isEn = lang === 'en';
  const isLight = theme === 'light';

  // Political structure
  const structure = useMemo(() => getCountryPoliticalStructure(country), [country]);

  const effectiveLang: 'es' | 'en' = isEn ? 'en' : 'es';

  // Narrative: History & 10 curious facts
  const historyText = useMemo(() => CountryNarrativeService.getCountryHistory(country, effectiveLang), [country, effectiveLang]);
  const curiosities = useMemo(() => CountryNarrativeService.getCountryCuriosities(country, effectiveLang), [country, effectiveLang]);

  // Format coordinates safely from country.lat and country.lng
  const latitude = typeof country.lat === 'number' ? country.lat : 0;
  const longitude = typeof country.lng === 'number' ? country.lng : 0;

  const latStr = `${Math.abs(latitude).toFixed(2)}° ${
    latitude >= 0 ? (isEn ? 'N (North)' : 'N (Norte)') : (isEn ? 'S (South)' : 'S (Sur)')
  }`;
  const lonStr = `${Math.abs(longitude).toFixed(2)}° ${
    longitude >= 0 ? (isEn ? 'E (East)' : 'E (Este)') : (isEn ? 'W (West)' : 'O (Oeste)')
  }`;

  const hemisphereNS = latitude >= 0
    ? (isEn ? 'Northern Hemisphere (Boreal)' : 'Hemisferio Norte (Boreal)')
    : (isEn ? 'Southern Hemisphere (Austral)' : 'Hemisferio Sur (Austral)');
  const hemisphereEW = longitude >= 0
    ? (isEn ? 'Eastern Hemisphere (East)' : 'Hemisferio Oriental (Este)')
    : (isEn ? 'Western Hemisphere (West)' : 'Hemisferio Occidental (Oeste)');

  const primaryName = isEn ? (country.nameEn || country.nameEs) : country.nameEs;
  const continentDisplay = isEn ? KdpTranslationService.getContinentEn(country.continent) : country.continent;

  return (
    <div
      id={id}
      className={`relative mx-auto overflow-hidden font-sans select-none print:shadow-none flex flex-col justify-between ${
        isLight
          ? 'bg-white text-slate-900 border border-slate-300'
          : 'bg-slate-950 text-slate-100 border border-slate-800'
      }`}
      style={{
        width: '794px',  // Standard printable Letter / A4 portrait width
        height: '1123px', // Standard printable Letter / A4 portrait height
        padding: '24px 28px',
        boxSizing: 'border-box'
      }}
    >
      {/* Decorative Outer Border & Gold/Sky Trim */}
      <div
        className="absolute inset-0 border-4 pointer-events-none"
        style={{ borderColor: isLight ? '#0284c7' : '#0369a1' }}
      />
      <div
        className="absolute inset-[3px] border pointer-events-none"
        style={{ borderColor: isLight ? '#cbd5e1' : '#1e293b' }}
      />

      {/* 1. PAGE HEADER: ENCABEZADO EDITORIAL KDP */}
      <div className="relative border-b pb-2.5 mb-3" style={{ borderColor: isLight ? '#cbd5e1' : '#334155' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
              style={{
                background: isLight ? '#0284c7' : '#0369a1',
                color: '#ffffff'
              }}
            >
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <p
                className="text-[9.5px] font-black tracking-widest uppercase"
                style={{ color: isLight ? '#0284c7' : '#38bdf8' }}
              >
                {isEn ? 'WorldFlags • Sovereign History & Vexillological Compendium' : 'MundoBanderas • Historia Soberana & Compendio Vexilológico'}
              </p>
              <div className="flex items-baseline gap-2.5">
                <h1 className="text-xl font-black tracking-tight" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                  {primaryName}
                </h1>
                <span className="text-xs font-semibold" style={{ color: isLight ? '#64748b' : '#94a3b8' }}>
                  {isEn ? '— Historical Chronicle & 10 Curious Facts' : '— Crónica Histórica & 10 Datos Curiosos'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Badges */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5">
              <span
                className="px-2.5 py-0.5 rounded-lg text-xs font-bold border shadow-xs"
                style={{
                  background: isLight ? '#ecfdf5' : '#064e3b',
                  borderColor: isLight ? '#a7f3d0' : '#047857',
                  color: isLight ? '#047857' : '#34d399'
                }}
              >
                {continentDisplay}
              </span>
              <span
                className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold border shadow-xs"
                style={{
                  background: isLight ? '#e0f2fe' : '#082f49',
                  borderColor: isLight ? '#7dd3fc' : '#0369a1',
                  color: isLight ? '#0369a1' : '#38bdf8'
                }}
              >
                {country.code3}
              </span>
            </div>
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded border"
              style={{
                background: isLight ? '#f1f5f9' : '#1e293b',
                borderColor: isLight ? '#cbd5e1' : '#334155',
                color: isLight ? '#64748b' : '#94a3b8'
              }}
            >
              {isEn ? 'PAGE 3 • SATELLITE & NATION PROFILE' : 'PÁGINA 3 • PERFIL HISTÓRICO & CURIOSIDADES'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. TOP SECTION: BRÚJULA NÁUTICA COMPACTA + DATOS GEODÉSICOS */}
      <div className="grid grid-cols-12 gap-3 mb-3">
        {/* Left (4 cols): Brújula Náutica SVG */}
        <div
          className="col-span-4 p-2.5 rounded-xl border flex flex-col items-center justify-between shadow-xs"
          style={{
            background: isLight ? '#f8fafc' : '#0f172a',
            borderColor: isLight ? '#e2e8f0' : '#1e293b'
          }}
        >
          <div className="w-full flex items-center justify-between border-b pb-1 mb-1" style={{ borderColor: isLight ? '#e2e8f0' : '#1e293b' }}>
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-sky-600 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" /> Rosa de los Vientos
            </span>
            <span className="text-[8.5px] font-mono text-slate-500 font-semibold">
              Rumbo 000°
            </span>
          </div>

          {/* Compass Graphic with controlled size and no overlap */}
          <div className="my-0.5 flex items-center justify-center">
            <NauticalCompass
              size={120}
              theme={theme}
            />
          </div>

          <div className="w-full text-center pt-1 border-t text-[8.5px] text-slate-500" style={{ borderColor: isLight ? '#e2e8f0' : '#1e293b' }}>
            Orientación Geodésica Oficial WGS84
          </div>
        </div>

        {/* Right (8 cols): Ficha de Navegación, Hemisferios y Régimen Político */}
        <div
          className="col-span-8 p-3 rounded-xl border flex flex-col justify-between shadow-xs"
          style={{
            background: isLight ? '#f8fafc' : '#0f172a',
            borderColor: isLight ? '#e2e8f0' : '#1e293b'
          }}
        >
          <div className="flex items-center justify-between border-b pb-1.5 mb-2" style={{ borderColor: isLight ? '#e2e8f0' : '#1e293b' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Posicionamiento Geodésico & Soberanía
            </span>
            <span className="text-[9px] font-mono text-slate-500 font-semibold">
              Datum WGS84 EPSG:4326
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            {/* Capital */}
            <div
              className="p-2 rounded-lg border flex flex-col justify-between"
              style={{
                background: isLight ? '#ffffff' : '#1e293b',
                borderColor: isLight ? '#cbd5e1' : '#334155'
              }}
            >
              <div className="flex items-center gap-1 text-[9px] text-slate-500 font-semibold">
                <MapPin className="w-3 h-3 text-red-500" />
                <span>CAPITAL</span>
              </div>
              <p className="font-bold text-[11px] truncate mt-0.5" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                ★ {country.capitalEs || country.capitalEn}
              </p>
              <span className="font-mono text-[8.5px] text-sky-600 truncate">{latStr}</span>
            </div>

            {/* Hemisferios */}
            <div
              className="p-2 rounded-lg border flex flex-col justify-between"
              style={{
                background: isLight ? '#ffffff' : '#1e293b',
                borderColor: isLight ? '#cbd5e1' : '#334155'
              }}
            >
              <div className="flex items-center gap-1 text-[9px] text-slate-500 font-semibold">
                <Globe className="w-3 h-3 text-sky-500" />
                <span>HEMISFERIO</span>
              </div>
              <p className="font-bold text-[10.5px] truncate mt-0.5" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                {hemisphereNS.split(' ')[0]} {hemisphereNS.split(' ')[1]}
              </p>
              <span className="font-mono text-[8.5px] text-slate-500 truncate">{lonStr}</span>
            </div>

            {/* Organización Territorial */}
            <div
              className="p-2 rounded-lg border flex flex-col justify-between"
              style={{
                background: isLight ? '#ffffff' : '#1e293b',
                borderColor: isLight ? '#cbd5e1' : '#334155'
              }}
            >
              <div className="flex items-center gap-1 text-[9px] text-slate-500 font-semibold">
                <Shield className="w-3 h-3 text-amber-500" />
                <span>DIVISIÓN POLÍTICA</span>
              </div>
              <p className="font-bold text-[10.5px] truncate mt-0.5" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                {structure.totalCount} {structure.divisionTypeName}
              </p>
              <span className="text-[8.5px] text-emerald-600 font-semibold truncate">{structure.governmentSystem}</span>
            </div>
          </div>

          <div className="mt-2 pt-1 border-t text-[9px] text-slate-500 flex justify-between" style={{ borderColor: isLight ? '#e2e8f0' : '#1e293b' }}>
            <span>Superficie: <strong>{country.areaKm2.toLocaleString()} km²</strong></span>
            <span>Población: <strong>{(country.population / 1000000).toFixed(1)}M hab.</strong></span>
            <span>Moneda: <strong>{country.currency}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. HISTORIA DE MEDIA PÁGINA (HISTORICAL CHRONICLE) */}
      <div
        className="mb-3 p-4 rounded-xl border shadow-xs"
        style={{
          background: isLight ? '#fdf8f6' : '#18121e',
          borderColor: isLight ? '#fed7aa' : '#451a03'
        }}
      >
        <div className="flex items-center justify-between border-b pb-1.5 mb-2" style={{ borderColor: isLight ? '#fed7aa' : '#451a03' }}>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
              {isEn ? `Historical Chronicle & Sovereign Origins of ${primaryName}` : `Historia de la Nación y Origen Soberano de ${primaryName}`}
            </h2>
          </div>
          <span className="text-[9px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded">
            {isEn ? 'HALF-PAGE HISTORICAL ESSAY' : 'RESEÑA HISTÓRICA OFICIAL'}
          </span>
        </div>

        <p
          className="text-[10px] leading-relaxed text-justify font-serif"
          style={{
            color: isLight ? '#451a03' : '#fef3c7',
            lineHeight: 1.55
          }}
        >
          {historyText}
        </p>
      </div>

      {/* 4. 10 DATOS CURIOSOS & HITOS DE LA NACIÓN */}
      <div
        className="mb-2 p-3.5 rounded-xl border shadow-xs flex-1 flex flex-col justify-between"
        style={{
          background: isLight ? '#f0fdf4' : '#052e16',
          borderColor: isLight ? '#bbf7d0' : '#14532d'
        }}
      >
        <div className="flex items-center justify-between border-b pb-1.5 mb-2" style={{ borderColor: isLight ? '#bbf7d0' : '#14532d' }}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-200">
              {isEn ? `10 Fascinating Facts & Records: ${primaryName}` : `10 Datos Curiosos, Hitos & Récords de ${primaryName}`}
            </h3>
          </div>
          <span className="text-[9px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded">
            {isEn ? '10 VERIFIED FACTS' : '10 DATOS VERIFICADOS'}
          </span>
        </div>

        {/* Two-column grid of 10 facts */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[9.5px]">
          {curiosities.slice(0, 10).map((fact, fIdx) => (
            <div
              key={`fact-${fIdx}`}
              className="p-1.5 rounded-lg border flex items-start gap-2 shadow-2xs"
              style={{
                background: isLight ? '#ffffff' : '#0f172a',
                borderColor: isLight ? '#dcfce7' : '#1e3a2f'
              }}
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center font-black text-[8px] flex-shrink-0 mt-0.5 text-white"
                style={{ background: '#10b981' }}
              >
                {fIdx + 1}
              </span>
              <p
                className="leading-snug"
                style={{ color: isLight ? '#064e3b' : '#ecfdf5' }}
              >
                {fact}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. PAGE FOOTER */}
      <div
        className="relative border-t pt-2 flex items-center justify-between text-xs text-slate-500"
        style={{ borderColor: isLight ? '#cbd5e1' : '#334155' }}
      >
        <div className="flex items-center gap-2 font-medium">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{
              background: isLight ? '#0284c7' : '#0369a1',
              color: '#ffffff'
            }}
          >
            3
          </div>
          <span className="text-[10px]">
            <strong>{isEn ? 'WorldFlags' : 'MundoBanderas'}</strong> • {isEn ? 'Historical Record & 10 Curious Facts Compendium' : 'Compendio de Crónica Histórica & 10 Datos Curiosos Oficiales'}
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px]">
          <span>{primaryName.toUpperCase()}</span>
          <span>•</span>
          <span>{isEn ? 'PAGE 3' : 'PÁGINA 3'}</span>
        </div>
      </div>
    </div>
  );
};
