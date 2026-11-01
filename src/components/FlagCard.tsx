import React, { useState } from 'react';
import { Country } from '../types';
import { BookOpen, Download, Check, Scale, Palette, FileText, Map as MapIcon } from 'lucide-react';
import { DownloadHelper } from '../utils/downloadHelper';

interface FlagCardProps {
  country: Country;
  onSelectCountry?: (country: Country) => void;
  onSelect?: (country: Country) => void;
  onCompareWith?: (country: Country) => void;
  onCompare?: (country: Country) => void;
  onOpenPdfModal?: (country: Country) => void;
  isCompact?: boolean;
}

const colorHexMap: Record<string, string> = {
  red: '#EF4444',
  blue: '#3B82F6',
  yellow: '#EAB308',
  green: '#10B981',
  white: '#F8FAFC',
  black: '#0F172A',
  orange: '#F97316'
};

export const FlagCard: React.FC<FlagCardProps> = ({
  country,
  onSelectCountry,
  onSelect,
  onCompareWith,
  onCompare,
  onOpenPdfModal,
  isCompact = false
}) => {
  const [isDownloaded, setIsDownloaded] = useState<boolean>(false);
  const flagSvgUrl = `https://flagcdn.com/${country.id}.svg`;

  const handleSelect = () => {
    if (typeof onSelectCountry === 'function') {
      onSelectCountry(country);
    } else if (typeof onSelect === 'function') {
      onSelect(country);
    }
  };

  const handleDownloadSvg = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanName = country.nameEs
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    const filename = `bandera_${country.id}_${cleanName}.svg`;

    await DownloadHelper.downloadRemoteFile(flagSvgUrl, filename);
    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 2000);
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof onCompareWith === 'function') {
      onCompareWith(country);
    } else if (typeof onCompare === 'function') {
      onCompare(country);
    }
  };

  return (
    <div
      onClick={handleSelect}
      className={`group relative bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-sky-500/50 rounded-3xl transition-all duration-300 shadow-lg hover:shadow-sky-500/10 cursor-pointer flex flex-col justify-between overflow-hidden ${
        isCompact ? 'p-3' : 'p-4'
      }`}
    >
      {/* SVG Flag Banner Frame */}
      <div className="relative aspect-[3/2] w-full rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shadow-inner group-hover:scale-[1.02] transition-transform duration-300">
        <img
          src={flagSvgUrl}
          alt={`Bandera SVG de ${country.nameEs}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Subtle Shine Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />

        {/* Top Left Country Name Pill directly on flag */}
        <div className="absolute top-2.5 left-2.5 bg-slate-950/90 backdrop-blur-md text-white font-bold text-[11px] px-2.5 py-1 rounded-lg border border-white/20 shadow-md flex items-center gap-1.5 z-10 max-w-[65%]">
          <span className="truncate">{country.nameEs}</span>
        </div>

        {/* Top Right Continent Pill */}
        <span className="absolute top-2.5 right-2.5 bg-slate-950/85 backdrop-blur-md text-sky-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-sky-500/30 shadow-md z-10">
          {country.continent}
        </span>

        {/* Bottom Banner with Country Name directly on Flag */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent pt-5 pb-2 px-3 flex items-center justify-between z-10 pointer-events-none">
          <span className="text-white font-black text-xs tracking-wider uppercase truncate drop-shadow-md">
            {country.nameEs}
          </span>
          <span className="text-[10px] font-mono font-bold text-sky-300 bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-500/30">
            {country.code3}
          </span>
        </div>

        {/* Quick Instant Auto-Download Overlay Button on Flag */}
        <button
          onClick={handleDownloadSvg}
          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-slate-900/90 hover:bg-sky-500 text-slate-200 hover:text-white border border-white/20 shadow-lg backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer z-20 pointer-events-auto"
          title={`Descarga directa de Bandera SVG de ${country.nameEs}`}
        >
          {isDownloaded ? (
            <Check className="w-3.5 h-3.5 text-emerald-300" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Country Info & Details */}
      <div className="mt-3.5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base group-hover:text-sky-400 transition-colors">
            {country.nameEs}
          </h3>
          <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded-md border border-sky-500/30">
            {country.code3}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <p className="truncate">
            Cap: <span className="text-slate-200 font-medium">{country.capitalEs}</span>
          </p>
          {/* Color Dots */}
          <div className="flex items-center gap-1">
            {country.colors.slice(0, 4).map((c) => (
              <span
                key={c}
                className="w-2.5 h-2.5 rounded-full border border-white/20"
                style={{ backgroundColor: colorHexMap[c] || '#94A3B8' }}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-medium gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSelect();
          }}
          className="flex-1 py-1.5 px-2 rounded-xl bg-slate-950 hover:bg-sky-600 text-slate-300 hover:text-white border border-slate-800 hover:border-sky-500 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5 text-sky-400 group-hover:text-white" />
          <span>Ficha</span>
        </button>

        {onOpenPdfModal && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenPdfModal(country);
            }}
            className="py-1.5 px-2.5 rounded-xl bg-slate-950 hover:bg-amber-600 text-amber-400 hover:text-slate-950 border border-slate-800 hover:border-amber-500 transition-all flex items-center gap-1 cursor-pointer"
            title="Generar Dossier Geopolítico & Cartográfico en PDF (3 Páginas Bond)"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
        )}

        {(onCompareWith || onCompare) && (
          <button
            onClick={handleCompare}
            className="py-1.5 px-2.5 rounded-xl bg-slate-950 hover:bg-indigo-600 text-slate-400 hover:text-white border border-slate-800 hover:border-indigo-500 transition-all flex items-center gap-1 cursor-pointer"
            title="Comparar esta bandera en el Estudio"
          >
            <Scale className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={handleDownloadSvg}
          className={`py-1.5 px-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
            isDownloaded
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
          }`}
          title="Descargar SVG"
        >
          {isDownloaded ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
