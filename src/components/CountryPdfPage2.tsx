import React, { useMemo } from 'react';
import { Compass, Globe, Navigation, MapPin, Shield } from 'lucide-react';
import { Country } from '../types';
import { CountryPdfMap } from './CountryPdfMap';
import { NauticalCompass } from './NauticalCompass';
import { getCountryPoliticalStructure } from '../data/politicalDivisions';
import { KdpTranslationService } from '../services/kdpTranslationService';

interface CountryPdfPage2Props {
  country: Country;
  id?: string;
  theme?: 'light' | 'dark';
  lang?: 'es' | 'en';
}

export const CountryPdfPage2: React.FC<CountryPdfPage2Props> = ({
  country,
  id = `pdf-sheet-p2-${country.id}`,
  theme = 'light',
  lang = 'es'
}) => {
  const isEn = lang === 'en';
  const isLight = theme === 'light';

  // Political structure
  const structure = useMemo(() => getCountryPoliticalStructure(country), [country]);

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
  const capitalDisplay = isEn ? (country.capitalEn || country.capitalEs) : (country.capitalEs || country.capitalEn);

  return (
    <div
      id={id}
      className={`relative mx-auto overflow-hidden font-sans select-none print:shadow-none ${
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
      {/* Decorative Outer Border */}
      <div
        className="absolute inset-0 border-4 pointer-events-none"
        style={{ borderColor: isLight ? '#0284c7' : '#0369a1' }}
      />
      <div
        className="absolute inset-[3px] border pointer-events-none"
        style={{ borderColor: isLight ? '#cbd5e1' : '#1e293b' }}
      />

      {/* PAGE HEADER: ENCABEZADO CARTOGRÁFICO */}
      <div className="relative border-b pb-3 mb-4" style={{ borderColor: isLight ? '#cbd5e1' : '#334155' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
              style={{
                background: isLight ? '#0284c7' : '#0369a1',
                color: '#ffffff'
              }}
            >
              <Compass className="w-7 h-7" />
            </div>
            <div>
              <p
                className="text-[10px] font-black tracking-widest uppercase"
                style={{ color: isLight ? '#0284c7' : '#38bdf8' }}
              >
                {isEn ? 'WorldFlags • Cartographic & Geopolitical Atlas' : 'MundoBanderas • Atlas Cartográfico & Geopolítico'}
              </p>
              <div className="flex items-baseline gap-3">
                <h1 className="text-2xl font-black tracking-tight" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                  {primaryName}
                </h1>
                <span className="text-sm font-semibold" style={{ color: isLight ? '#64748b' : '#94a3b8' }}>
                  {isEn ? '— Territorial Map & Political Division' : '— Mapa Territorial & División Política'}
                </span>
              </div>
              <p className="text-[10.5px] font-medium" style={{ color: isLight ? '#475569' : '#94a3b8' }}>
                {isEn
                  ? `SVG Cartography: ${structure.totalCount} ${structure.divisionTypeName} • Bordering Nations & WGS84 Compass`
                  : `Cartografía SVG: ${structure.totalCount} ${structure.divisionTypeName} • Países Limítrofes y Brújula WGS84`}
              </p>
            </div>
          </div>

          {/* Right Header Badges */}
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2">
              <span
                className="px-3 py-1 rounded-lg text-xs font-bold border shadow-sm"
                style={{
                  background: isLight ? '#ecfdf5' : '#064e3b',
                  borderColor: isLight ? '#a7f3d0' : '#047857',
                  color: isLight ? '#047857' : '#34d399'
                }}
              >
                {continentDisplay}
              </span>
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold border shadow-sm"
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
              className="text-[9.5px] font-bold px-2 py-0.5 rounded border"
              style={{
                background: isLight ? '#f1f5f9' : '#1e293b',
                borderColor: isLight ? '#cbd5e1' : '#334155',
                color: isLight ? '#64748b' : '#94a3b8'
              }}
            >
              {isEn ? 'PAGE 2 • SVG CARTOGRAPHIC ATLAS' : 'PÁGINA 2 • ATLAS CARTOGRÁFICO SVG'}
            </span>
          </div>
        </div>
      </div>

      {/* HERO SECTION: MAPA CARTOGRÁFICO VECTORIAL SVG (GRAN FORMATO) */}
      <div
        className="mb-3.5 p-4 rounded-2xl border shadow-sm"
        style={{
          background: isLight ? '#f8fafc' : '#0f172a',
          borderColor: isLight ? '#e2e8f0' : '#1e293b'
        }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <span
            className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
            style={{ color: isLight ? '#0284c7' : '#38bdf8' }}
          >
            <Navigation className="w-4 h-4" />
            {isEn ? `Territorial SVG Atlas • ${structure.totalCount} ${structure.divisionTypeName}` : `Atlas Territorial SVG • ${structure.totalCount} ${structure.divisionTypeName}`}
          </span>
          <span className="text-[10px] font-mono text-slate-500 font-semibold">
            {isEn ? 'Internal Division & Neighboring States • D3.js GeoJSON' : 'División Interna & Países Limítrofes (Estados / Deptos) • D3.js GeoJSON'}
          </span>
        </div>

        {/* Large Format SVG Map Display (High-Def) */}
        <div
          className="w-full h-[540px] rounded-xl overflow-hidden border shadow-md relative"
          style={{ borderColor: isLight ? '#cbd5e1' : '#334155' }}
        >
          <CountryPdfMap
            country={country}
            theme={theme}
            width={710}
            height={540}
          />
        </div>

        <div
          className="mt-2.5 pt-2 border-t flex items-center justify-between text-[10.5px] text-slate-500 font-medium"
          style={{ borderColor: isLight ? '#e2e8f0' : '#1e293b' }}
        >
          <span>{isEn ? '★ State Capital:' : '★ Capital de Estado:'} <strong>{capitalDisplay}</strong> ({latStr}, {lonStr})</span>
          <span>{isEn ? 'Border boundaries, neighboring nations and state demarcation' : 'Fronteras limítrofes, naciones vecinas y demarcación departamental/estatal'}</span>
        </div>
      </div>

      {/* THREE-COLUMN CARTOGRAPHIC SPECIFICATIONS & BORDERS */}
      <div className="grid grid-cols-12 gap-3 mb-3">
        {/* Col 1 (4 cols): Estructura Administrativa */}
        <div
          className="col-span-4 p-3 rounded-xl border flex flex-col justify-between shadow-xs"
          style={{
            background: isLight ? '#ffffff' : '#1e293b',
            borderColor: isLight ? '#e2e8f0' : '#334155'
          }}
        >
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-sky-600 mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span>{isEn ? 'Internal Organization' : 'Organización Interna'}</span>
            </div>
            <p className="text-xs font-bold" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
              {structure.totalCount} {structure.divisionTypeName}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {isEn ? 'Regime:' : 'Régimen:'} {structure.governmentSystem}
            </p>
          </div>
          <div className="mt-2 pt-1.5 border-t text-[9.5px] text-slate-500 font-mono" style={{ borderColor: isLight ? '#f1f5f9' : '#334155' }}>
            {continentDisplay} • {country.code3}
          </div>
        </div>

        {/* Col 2 (4 cols): Posicionamiento & Hemisferios */}
        <div
          className="col-span-4 p-3 rounded-xl border flex flex-col justify-between shadow-xs"
          style={{
            background: isLight ? '#ffffff' : '#1e293b',
            borderColor: isLight ? '#e2e8f0' : '#334155'
          }}
        >
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-600 mb-1">
              <Globe className="w-3.5 h-3.5" />
              <span>{isEn ? 'WGS84 Geodesy' : 'Geodesia WGS84'}</span>
            </div>
            <p className="text-xs font-bold font-mono" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
              {latStr}
            </p>
            <p className="text-xs font-bold font-mono text-slate-500">
              {lonStr}
            </p>
          </div>
          <div className="mt-2 pt-1.5 border-t text-[9.5px] text-slate-500" style={{ borderColor: isLight ? '#f1f5f9' : '#334155' }}>
            {hemisphereNS}
          </div>
        </div>

        {/* Col 3 (4 cols): Superficie & Escala */}
        <div
          className="col-span-4 p-3 rounded-xl border flex flex-col justify-between shadow-xs"
          style={{
            background: isLight ? '#ffffff' : '#1e293b',
            borderColor: isLight ? '#e2e8f0' : '#334155'
          }}
        >
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-amber-600 mb-1">
              <Compass className="w-3.5 h-3.5" />
              <span>{isEn ? 'Territorial Area' : 'Extensión Territorial'}</span>
            </div>
            <p className="text-xs font-bold" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
              {country.areaKm2.toLocaleString()} km²
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {isEn
                ? `Population: ${(country.population / 1000000).toFixed(1)}M inhabitants`
                : `Población: ${(country.population / 1000000).toFixed(1)}M habitantes`}
            </p>
          </div>
          <div className="mt-2 pt-1.5 border-t text-[9.5px] text-slate-500 flex justify-between" style={{ borderColor: isLight ? '#f1f5f9' : '#334155' }}>
            <span>{isEn ? 'D3 WGS84 Scale' : 'Escala D3 WGS84'}</span>
            <span className="font-bold text-amber-600">{isEn ? 'Vector' : 'Vectorial'}</span>
          </div>
        </div>
      </div>

      {/* FOOTER: PAGE 2 NUMBER & SIGNATURE */}
      <div
        className="absolute bottom-3 left-7 right-7 pt-2 border-t flex items-center justify-between text-[9.5px]"
        style={{
          borderColor: isLight ? '#cbd5e1' : '#334155',
          color: isLight ? '#64748b' : '#94a3b8'
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-[8px]">
            2
          </div>
          <span>
            <strong>{isEn ? 'WorldFlags' : 'MundoBanderas'}</strong> • {isEn ? 'Cartographic Atlas & Official Territorial Division' : 'Atlas Cartográfico & División Territorial Oficial'}
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span>{primaryName} ({country.code3})</span>
          <span>{isEn ? 'Page 2 • Cartographic Atlas' : 'Página 2 • Atlas Cartográfico'}</span>
        </div>
      </div>
    </div>
  );
};

