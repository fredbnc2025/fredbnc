import React, { useState } from 'react';
import { Country } from '../types';
import {
  Scale,
  Plus,
  Trash2,
  Download,
  Check,
  Palette,
  Layers,
  Sparkles,
  RefreshCw,
  Search,
  ExternalLink,
  BookOpen,
  Info,
  Map as MapIcon
} from 'lucide-react';
import { DownloadHelper } from '../utils/downloadHelper';
import { CountryPdfMap } from './CountryPdfMap';

interface FlagComparatorProps {
  countries: Country[];
  initialSelectedCountries?: Country[];
  initialSelection?: Country[];
  onOpenDetails: (country: Country) => void;
}

interface PresetComparison {
  title: string;
  category: string;
  countryIds: string[];
  description: string;
}

const FAMOUS_PRESETS: PresetComparison[] = [
  {
    title: 'Chad 🇹🇩 vs Rumanía 🇷🇴',
    category: 'Prácticamente Idénticas',
    countryIds: ['td', 'ro'],
    description: 'Ambas banderas usan el tricolor azul, amarillo y rojo. La única diferencia es que el azul de Chad es ligeramente más oscuro (añil).'
  },
  {
    title: 'Mónaco 🇲🇨 vs Indonesia 🇮🇩 vs Polonia 🇵🇱',
    category: 'Bicolor Rojo y Blanco',
    countryIds: ['mc', 'id', 'pl'],
    description: 'Indonesia y Mónaco comparten rojo arriba y blanco abajo (Indonesia tiene ratio 2:3 y Mónaco 4:5). Polonia tiene la disposición inversa (blanco arriba, rojo abajo).'
  },
  {
    title: 'Irlanda 🇮🇪 vs Costa de Marfil 🇨🇮',
    category: 'Efecto Espejo',
    countryIds: ['ie', 'ci'],
    description: 'Irlanda es Verde-Blanco-Naranja (simbolizando católicos, paz y protestantes). Costa de Marfil es Naranja-Blanco-Verde.'
  },
  {
    title: 'Colombia 🇨🇴 vs Ecuador 🇪🇨 vs Venezuela 🇻🇪',
    category: 'Gran Colombia (Miranda)',
    countryIds: ['co', 'ec', 've'],
    description: 'Inspiradas en la bandera de Francisco de Miranda. Colombia y Ecuador tienen la franja amarilla el doble de ancha; Ecuador añade el escudo de armas; Venezuela añade el arco de 8 estrellas blancas.'
  },
  {
    title: 'Noruega 🇳🇴 vs Islandia 🇮🇸 vs Dinamarca 🇩🇰 vs Suecia 🇸🇪',
    category: 'Cruces Nórdicas',
    countryIds: ['no', 'is', 'dk', 'se'],
    description: 'El diseño de cruz escandinava o nórdica proviene de la bandera danesa Dannebrog (siglo XIII) y representa el cristianismo y la unión de los pueblos nórdicos.'
  },
  {
    title: 'Senegal 🇸🇳 vs Camerún 🇨🇲 vs Malí 🇲🇱 vs Ghana 🇬🇭',
    category: 'Colores Panafricanos',
    countryIds: ['sn', 'cm', 'ml', 'gh'],
    description: 'Basados en los colores de la bandera de Etiopía (verde, amarillo, rojo y a veces negro) como símbolo de la independencia y solidaridad africana.'
  }
];

export const FlagComparator: React.FC<FlagComparatorProps> = ({
  countries,
  initialSelectedCountries = [],
  initialSelection,
  onOpenDetails
}) => {
  const [selectedCountries, setSelectedCountries] = useState<Country[]>(() => {
    const list = initialSelection && initialSelection.length >= 2 ? initialSelection : initialSelectedCountries;
    if (list.length >= 2) return list.slice(0, 4);
    // Default preset: Chad and Romania
    const c1 = countries.find((c) => c.id === 'td') || countries[0];
    const c2 = countries.find((c) => c.id === 'ro') || countries[1];
    return [c1, c2].filter(Boolean);
  });

  const [searchPickerIndex, setSearchPickerIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'flags' | 'maps'>('flags');

  const colorMap: Record<string, { name: string; hex: string }> = {
    red: { name: 'Rojo', hex: '#EF4444' },
    blue: { name: 'Azul', hex: '#3B82F6' },
    yellow: { name: 'Amarillo', hex: '#EAB308' },
    green: { name: 'Verde', hex: '#10B981' },
    white: { name: 'Blanco', hex: '#F8FAFC' },
    black: { name: 'Negro', hex: '#0F172A' },
    orange: { name: 'Naranja', hex: '#F97316' }
  };

  const handleApplyPreset = (preset: PresetComparison) => {
    const matched = preset.countryIds
      .map((id) => countries.find((c) => c.id === id))
      .filter((c): c is Country => Boolean(c));
    setSelectedCountries(matched);
  };

  const handleAddCountry = (country: Country) => {
    if (selectedCountries.length < 4 && !selectedCountries.some((c) => c.id === country.id)) {
      setSelectedCountries([...selectedCountries, country]);
    }
    setSearchPickerIndex(null);
    setSearchTerm('');
  };

  const handleReplaceCountry = (index: number, country: Country) => {
    const updated = [...selectedCountries];
    updated[index] = country;
    setSelectedCountries(updated);
    setSearchPickerIndex(null);
    setSearchTerm('');
  };

  const handleRemoveCountry = (index: number) => {
    if (selectedCountries.length > 2) {
      setSelectedCountries(selectedCountries.filter((_, i) => i !== index));
    }
  };

  const filteredSearchCountries = searchTerm.trim()
    ? countries.filter(
        (c) =>
          c.nameEs.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.code3.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.capitalEs.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : countries.slice(0, 12);

  return (
    <div className="w-full space-y-8">
      {/* Header & Presets Bar */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
              <Scale className="w-4 h-4" />
              <span>Estudio de Comparación Vexilológica</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Comparador Visual y Cromático de Banderas</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Analiza semejanzas, diferencias de matices, proporciones y simbolismos entre 2 y 4 banderas del mundo.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Banderas vs Mapas Vectoriales */}
            <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('flags')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'flags' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Banderas</span>
              </button>
              <button
                onClick={() => setViewMode('maps')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'maps' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Mapas Vectoriales</span>
              </button>
            </div>

            {selectedCountries.length < 4 && (
              <button
                onClick={() => setSearchPickerIndex(selectedCountries.length)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Añadir País</span>
              </button>
            )}
          </div>
        </div>

        {/* Famous Presets Selector */}
        <div className="space-y-2 pt-3 border-t border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Casos Famosos de Semejanza Vexilológica:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {FAMOUS_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyPreset(preset)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-slate-200 hover:text-white whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 flex-shrink-0"
              >
                <span className="font-semibold text-sky-300">{preset.title}</span>
                <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700">
                  {preset.category}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Country Selector Modal / Dropdown */}
      {searchPickerIndex !== null && (
        <div
          onClick={() => setSearchPickerIndex(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[80vh] flex flex-col"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Seleccionar País para Comparar</h3>
              <button
                onClick={() => setSearchPickerIndex(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar país por nombre o código..."
                autoFocus
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="overflow-y-auto divide-y divide-slate-800/80 max-h-96 pr-1">
              {filteredSearchCountries.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    if (searchPickerIndex >= selectedCountries.length) {
                      handleAddCountry(c);
                    } else {
                      handleReplaceCountry(searchPickerIndex, c);
                    }
                  }}
                  className="w-full p-3 flex items-center justify-between hover:bg-slate-800/70 rounded-xl transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://flagcdn.com/${c.id}.svg`}
                      alt={c.nameEs}
                      className="w-8 h-6 object-cover rounded shadow-sm border border-white/10"
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">{c.nameEs}</p>
                      <p className="text-xs text-slate-400">{c.continent} • Capital: {c.capitalEs}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-500/20">
                    {c.code3}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Flag Comparison Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(selectedCountries.length, 4)} gap-6`}>
        {selectedCountries.map((country, idx) => (
          <div
            key={country.id}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col justify-between space-y-5 relative group"
          >
            {/* Top Control Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <button
                onClick={() => setSearchPickerIndex(idx)}
                className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1.5 cursor-pointer"
                title="Cambiar este país por otro"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Cambiar País</span>
              </button>

              {selectedCountries.length > 2 && (
                <button
                  onClick={() => handleRemoveCountry(idx)}
                  className="text-xs text-rose-400 hover:text-rose-300 p-1 rounded-lg hover:bg-rose-950/50 transition-colors"
                  title="Eliminar de la comparación"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Visual Frame: Flag or Vector Map */}
            <div className="space-y-3">
              {viewMode === 'flags' ? (
                <div className="relative aspect-[3/2] w-full rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shadow-xl flex items-center justify-center">
                  {/* Name of Country directly on flag */}
                  <div className="absolute top-2.5 left-2.5 bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20 text-white font-bold text-xs shadow-md z-10 flex items-center gap-1.5">
                    <span className="truncate">{country.nameEs}</span>
                  </div>

                  <img
                    src={`https://flagcdn.com/${country.id}.svg`}
                    alt={`Bandera de ${country.nameEs}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                </div>
              ) : (
                <div className="relative aspect-[3/2] w-full rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shadow-xl flex items-center justify-center">
                  <CountryPdfMap country={country} theme="light" width={320} height={213} />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">{country.nameEs}</h3>
                  <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-500/30">
                    {country.code3}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{country.continent} • {country.capitalEs}</p>
              </div>
            </div>

            {/* Vexillological Specs Comparison */}
            <div className="space-y-3 text-xs">
              {/* Color Swatches */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-sky-400" />
                  Paleta Cromática ({country.colors.length} colores)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {country.colors.map((c) => {
                    const info = colorMap[c] || { name: c, hex: '#94A3B8' };
                    return (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-200"
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-white/20"
                          style={{ backgroundColor: info.hex }}
                        />
                        <span>{info.name}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Symbolism */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Simbolismo Oficial
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-4">
                  {country.flagSymbolismEs}
                </p>
              </div>

              {/* Demographic & Size Specs */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <p className="text-slate-400">Población</p>
                  <p className="font-semibold text-white mt-0.5">{(country.population / 1000000).toFixed(1)} M</p>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <p className="text-slate-400">Superficie</p>
                  <p className="font-semibold text-white mt-0.5">{country.areaKm2.toLocaleString()} km²</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <button
                onClick={() => onOpenDetails(country)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-sky-600 text-slate-200 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Ver Ficha Completa</span>
              </button>
              <button
                onClick={() => {
                  DownloadHelper.downloadRemoteFile(
                    `https://flagcdn.com/${country.id}.svg`,
                    `bandera_svg_${country.id}.svg`
                  );
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                title="Descargar SVG"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
