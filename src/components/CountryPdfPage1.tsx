import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Country } from '../types';
import { KdpTranslationService } from '../services/kdpTranslationService';

interface CountryPdfPage1Props {
  country: Country;
  id?: string;
  theme?: 'light' | 'dark';
  lang?: 'es' | 'en';
}

export const CountryPdfPage1: React.FC<CountryPdfPage1Props> = ({
  country,
  id = `pdf-sheet-p1-${country.id}`,
  theme = 'light',
  lang = 'es'
}) => {
  const isEn = lang === 'en';
  const flagSvgUrl = `https://flagcdn.com/${country.id}.svg`;
  const isLight = theme === 'light';
  const [footerQrUrl, setFooterQrUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const directUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?action=download-pdf&country=${country.id}`
      : `https://mundobanderas.app?action=download-pdf&country=${country.id}`;

    QRCode.toDataURL(directUrl, { width: 100, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => {
        if (isMounted) setFooterQrUrl(url);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [country.id]);

  const continentDisplay = isEn ? KdpTranslationService.getContinentEn(country.continent) : country.continent;
  const primaryName = isEn ? (country.nameEn || country.nameEs) : country.nameEs;
  const secondaryName = isEn ? country.nameEs : country.nameEn;

  return (
    <div
      id={id}
      className={`relative mx-auto overflow-hidden font-sans select-none print:shadow-none flex flex-col items-center justify-between p-10 sm:p-12 ${
        isLight
          ? 'bg-white text-slate-900'
          : 'bg-slate-950 text-slate-100'
      }`}
      style={{
        width: '794px',   // Standard printable Letter / A4 portrait width
        height: '1123px', // Standard printable Letter / A4 portrait height
        boxSizing: 'border-box'
      }}
    >
      {/* Amazon KDP Safe Printable Margin Frame (0.5 in / 12.7 mm) */}
      <div
        className={`absolute inset-4 rounded-xl border pointer-events-none ${
          isLight ? 'border-slate-200/80' : 'border-slate-800/80'
        }`}
      />

      {/* 1. Header Bar: Running Head (KDP Print-on-Demand standard) */}
      <div className="w-full flex items-center justify-between text-[11px] font-bold tracking-wider uppercase border-b pb-2.5 z-10">
        <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>
          {isEn ? 'VEXILLOLOGICAL ENCYCLOPEDIA • WORLD ATLAS' : 'ENCICLOPEDIA VEXILOLÓGICA • ATLAS MUNDIAL'}
        </span>
        <span className={isLight ? 'text-sky-700' : 'text-sky-400'}>
          {continentDisplay}
        </span>
      </div>

      {/* 2. Top Banner: Official Country Name above the Flag */}
      <div className="w-full pt-3 pb-2 z-10 flex flex-col items-center">
        <span className="text-[11px] font-bold tracking-widest uppercase text-sky-600 block mb-0.5">
          {isEn ? 'SOVEREIGN NATIONAL FLAG' : 'PABELLÓN NACIONAL SOBERANO'}
        </span>
        <h1
          className={`text-4xl sm:text-5xl font-black tracking-wide uppercase leading-tight text-center ${
            isLight ? 'text-slate-950' : 'text-white'
          }`}
        >
          {primaryName}
        </h1>
        <div
          className={`flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest mt-1 ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}
        >
          <span>{secondaryName}</span>
          <span className="opacity-40">•</span>
          <span className="font-mono">ISO: {country.code3 || country.id.toUpperCase()}</span>
          <span className="opacity-40">•</span>
          <span>{continentDisplay}</span>
        </div>
      </div>

      {/* 3. Main Flag Section with High-Resolution SVG & Official Name Plaque */}
      <div className="flex-1 w-full flex flex-col items-center justify-center min-h-0 py-3 px-4">
        <img
          src={flagSvgUrl}
          alt={isEn ? `Official flag of ${primaryName}` : `Bandera oficial de ${country.nameEs}`}
          className={`max-w-[94%] max-h-[520px] w-auto h-auto object-contain shadow-2xl rounded-sm border ${
            isLight ? 'border-slate-300' : 'border-slate-700'
          }`}
          crossOrigin="anonymous"
        />

        {/* Placa / Cartela Oficial con el Nombre del País en la Bandera */}
        <div
          className={`mt-3.5 px-5 py-1.5 rounded-full border text-xs font-bold tracking-wider uppercase flex items-center gap-2.5 shadow-sm ${
            isLight
              ? 'bg-slate-100/90 border-slate-300 text-slate-800'
              : 'bg-slate-900/90 border-slate-700 text-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-sky-500" />
          <span>{isEn ? `Official Flag of ${primaryName}` : `Bandera Oficial de ${country.nameEs}`}</span>
          <span className="opacity-40">•</span>
          <span className="font-mono text-[11px] text-sky-600">
            {isEn ? `Proportion ${country.proportions || '2:3'}` : `Proporción ${country.proportions || '2:3'}`}
          </span>
        </div>
      </div>

      {/* 4. Metadata Cards / Chips (Amazon KDP Book Format) */}
      <div className="w-full pt-3 pb-1 z-10 border-t border-slate-200/80">
        <div className="w-full grid grid-cols-4 gap-2.5 mt-2 text-xs">
          {/* Capital */}
          <div className={`p-2.5 rounded-lg border text-center ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
            <span className="block text-[10px] font-bold uppercase text-sky-600">
              {isEn ? 'Capital' : 'Capital'}
            </span>
            <span className={`block font-bold truncate mt-0.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {isEn
                ? (country.capitalEn || country.capitalEs || 'Official Capital')
                : (country.capitalEs || country.capitalEn || 'Capital de Estado')}
            </span>
          </div>

          {/* Demografía */}
          <div className={`p-2.5 rounded-lg border text-center ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
            <span className="block text-[10px] font-bold uppercase text-emerald-600">
              {isEn ? 'Population' : 'Población'}
            </span>
            <span className={`block font-bold truncate mt-0.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {country.population
                ? (country.population >= 1000000
                    ? `${(country.population / 1000000).toFixed(1)}M ${isEn ? 'inhab.' : 'hab.'}`
                    : `${country.population.toLocaleString()} ${isEn ? 'inhab.' : 'hab.'}`)
                : (isEn ? 'Sovereign state' : 'Soberanía oficial')}
            </span>
          </div>

          {/* Moneda / Idioma */}
          <div className={`p-2.5 rounded-lg border text-center ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
            <span className="block text-[10px] font-bold uppercase text-amber-600">
              {isEn ? 'Currency' : 'Moneda'}
            </span>
            <span className={`block font-bold truncate mt-0.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {isEn
                ? KdpTranslationService.translateCurrency(country.currency || '', country.id)
                : (country.currency || 'Moneda oficial')}
            </span>
          </div>

          {/* Proporción Vexilológica */}
          <div className={`p-2.5 rounded-lg border text-center ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
            <span className="block text-[10px] font-bold uppercase text-purple-600">
              {isEn ? 'Proportion' : 'Proporción'}
            </span>
            <span className={`block font-mono font-bold truncate mt-0.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {country.proportions || '2:3'}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Running Footer (Folio, QR Code & Amazon KDP Print Compliance) */}
      <div className={`w-full flex items-center justify-between text-[10px] pt-3 border-t font-mono z-10 ${
        isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
      }`}>
        <span className="truncate max-w-[280px]">
          {isEn
            ? `WorldFlags • National Flag of ${primaryName}`
            : `MundoBanderas • Pabellón Nacional de ${country.nameEs}`}
        </span>
        {footerQrUrl && (
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-800">
            <img src={footerQrUrl} alt="QR Code" className="w-5 h-5 object-contain" />
            <span className="text-[9px] font-sans font-semibold text-sky-600 dark:text-sky-400">
              {isEn ? 'Direct PDF / SVG Download' : 'Descarga Directa PDF / SVG'}
            </span>
          </div>
        )}
        <span className="font-bold">
          {isEn ? 'AMAZON KDP INTERNATIONAL EDITION' : 'EDICIÓN INTERNACIONAL AMAZON KDP'}
        </span>
      </div>
    </div>
  );
};

