import React from 'react';
import { Country } from '../types';
import { KdpTranslationService } from '../services/kdpTranslationService';

interface CountryPdfSheetProps {
  country: Country;
  id?: string;
  theme?: 'light' | 'dark';
  orientation?: 'landscape' | 'portrait';
  lang?: 'es' | 'en';
}

export const CountryPdfSheet: React.FC<CountryPdfSheetProps> = ({
  country,
  id = `pdf-sheet-${country.id}`,
  theme = 'light',
  orientation = 'landscape',
  lang = 'es'
}) => {
  const isEn = lang === 'en';
  const flagSvgUrl = `https://flagcdn.com/${country.id}.svg`;
  const isLight = theme === 'light';
  const isLandscape = orientation === 'landscape';
  const primaryName = isEn ? (country.nameEn || country.nameEs) : country.nameEs;
  const secondaryName = isEn ? country.nameEs : country.nameEn;
  const continentDisplay = isEn ? KdpTranslationService.getContinentEn(country.continent) : country.continent;

  return (
    <div
      id={id}
      className={`relative mx-auto overflow-hidden font-sans select-none print:shadow-none flex flex-col items-center justify-between p-8 sm:p-12 ${
        isLight
          ? 'bg-white text-slate-900'
          : 'bg-slate-950 text-slate-100'
      }`}
      style={{
        width: isLandscape ? '1123px' : '794px',
        height: isLandscape ? '794px' : '1123px',
        boxSizing: 'border-box'
      }}
    >
      {/* Country Name Header */}
      <div className="w-full text-center pb-3 border-b border-slate-200/80">
        <span className="text-xs font-bold tracking-widest uppercase text-sky-600 block mb-1">
          {isEn ? 'SOVEREIGN NATIONAL FLAG' : 'PABELLÓN NACIONAL OFICIAL'}
        </span>
        <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-wider">
          {primaryName}
        </h1>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">
          {secondaryName} • {isEn ? 'ISO CODE' : 'CÓDIGO ISO'}: {country.code3 || country.id.toUpperCase()} • {continentDisplay}
        </p>
      </div>

      {/* Flag Display Area */}
      <div className="w-full flex-1 flex flex-col items-center justify-center my-4 min-h-0">
        <img
          src={flagSvgUrl}
          alt={isEn ? `Official flag of ${primaryName}` : `Bandera oficial de ${country.nameEs}`}
          className="max-w-full max-h-[500px] w-auto h-auto object-contain shadow-2xl border border-slate-200/80 rounded-sm"
          crossOrigin="anonymous"
        />
        {/* Name Cartouche on Flag */}
        <div className={`mt-3.5 px-5 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
          isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
        }`}>
          <span className="w-2 h-2 rounded-full bg-sky-500" />
          <span>{isEn ? `Official Flag of ${primaryName}` : `Bandera Oficial de ${country.nameEs}`}</span>
          <span className="opacity-40">•</span>
          <span className="font-mono text-sky-600">{country.code3}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full flex items-center justify-between text-xs text-slate-400 border-t border-slate-200/80 pt-3">
        <span>{isEn ? `WorldFlags • National Flag of ${primaryName}` : `MundoBanderas • Pabellón Nacional de ${country.nameEs}`}</span>
        <span className="font-mono uppercase">{isEn ? 'Official Vexillological Atlas' : 'Atlas Vexilológico Oficial'}</span>
      </div>
    </div>
  );
};
