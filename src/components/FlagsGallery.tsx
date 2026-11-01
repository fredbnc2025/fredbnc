import React, { useState, useMemo, useEffect } from 'react';
import { Country, Continent, SubscriptionPlanId } from '../types';
import { subscriptionService } from '../services/subscriptionService';
import { FlagCard } from './FlagCard';
import { CONTINENTS } from '../data/countries';
import {
  Search,
  Filter,
  SortAsc,
  Palette,
  Download,
  Archive,
  Loader2,
  CheckCircle2,
  Grid3X3,
  LayoutGrid,
  Sparkles,
  Shuffle,
  Crown,
  FileText,
  ShoppingBag,
  BookOpen
} from 'lucide-react';
import { DownloadHelper } from '../utils/downloadHelper';

interface FlagsGalleryProps {
  countries: Country[];
  onSelectCountry: (country: Country) => void;
  onCompareWith?: (country: Country) => void;
  onUpgradePro?: (plan?: SubscriptionPlanId) => void;
  onOpenPdfModal?: (country: Country) => void;
  onOpenAmazonKdpModal?: () => void;
  onOpenAmazonKdpHardcoverModal?: () => void;
}

export const FlagsGallery: React.FC<FlagsGalleryProps> = ({
  countries,
  onSelectCountry,
  onCompareWith,
  onUpgradePro,
  onOpenPdfModal,
  onOpenAmazonKdpModal,
  onOpenAmazonKdpHardcoverModal
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedContinent, setSelectedContinent] = useState<Continent | 'Islas' | 'Todos'>('Todos');
  const [selectedColor, setSelectedColor] = useState<string | 'Todos'>('Todos');
  const [sortBy, setSortBy] = useState<'name' | 'population' | 'area'>('name');
  const [gridDensity, setGridDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [isProUser, setIsProUser] = useState<boolean>(subscriptionService.isPro());

  useEffect(() => {
    const unsub = subscriptionService.subscribe((sub) => {
      setIsProUser(sub.isPro);
    });
    return unsub;
  }, []);

  // Batch download state
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<{ percent: number; current: string }>({ percent: 0, current: '' });
  const [zipSuccess, setZipSuccess] = useState<boolean>(false);

  const availableColors = ['red', 'blue', 'yellow', 'green', 'white', 'black', 'orange'];

  const filteredCountries = useMemo(() => {
    return countries
      .filter((c) => {
        const matchesSearch =
          c.nameEs.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.capitalEs.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.code3.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.currency.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesContinent = true;
        if (selectedContinent === 'Islas') {
          matchesContinent = Boolean(c.isIsland || c.isTerritory);
        } else if (selectedContinent !== 'Todos') {
          matchesContinent = c.continent === selectedContinent;
        }

        const matchesColor =
          selectedColor === 'Todos' || c.colors.includes(selectedColor);

        return matchesSearch && matchesContinent && matchesColor;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.nameEs.localeCompare(b.nameEs);
        if (sortBy === 'population') return b.population - a.population;
        if (sortBy === 'area') return b.areaKm2 - a.areaKm2;
        return 0;
      });
  }, [countries, searchTerm, selectedContinent, selectedColor, sortBy]);

  const handleDownloadBatchZip = async () => {
    if (filteredCountries.length === 0 || isZipping) return;
    setIsZipping(true);
    setZipSuccess(false);

    const flagItems = filteredCountries.map((c) => ({
      id: c.id,
      nameEs: c.nameEs,
      url: `https://flagcdn.com/${c.id}.svg`
    }));

    const continentTag = selectedContinent !== 'Todos' ? `_${selectedContinent.toLowerCase()}` : '';
    const zipName = `coleccion_banderas_svg${continentTag}_${filteredCountries.length}_paises.zip`;

    try {
      await DownloadHelper.downloadFlagsBatchZip(flagItems, zipName, (percent, current) => {
        setZipProgress({ percent, current });
      });
      setZipSuccess(true);
      setTimeout(() => setZipSuccess(false), 4000);
    } catch (err) {
      console.error('Error al descargar ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleRandomFlag = () => {
    if (filteredCountries.length === 0) return;
    const randomCountry = filteredCountries[Math.floor(Math.random() * filteredCountries.length)];
    if (typeof onSelectCountry === 'function') {
      onSelectCountry(randomCountry);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Search & Filter Header Bar */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar país, capital, código ISO, moneda o idioma..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Results Badge, Random Flag, Amazon KDP & Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
            <span className="text-xs font-semibold text-sky-400 bg-sky-950/80 border border-sky-500/30 px-3 py-1.5 rounded-xl whitespace-nowrap">
              {filteredCountries.length} banderas
            </span>

            <button
              onClick={handleRandomFlag}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
              title="Abrir una bandera al azar"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span>Aleatoria</span>
            </button>

            {/* Amazon KDP Auto-Publish & PDF Book Compiler Button */}
            {onOpenAmazonKdpModal && (
              <button
                onClick={onOpenAmazonKdpModal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 border border-amber-400/50 transition-all shadow-lg shadow-amber-500/20 cursor-pointer whitespace-nowrap"
                title="Generar libro PDF único de todas las banderas para vender en Amazon KDP con título, descripción y precios listos (Tapa Blanda)"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                <span>Libro Completo PDF Amazon KDP</span>
              </button>
            )}

            {/* Amazon KDP Libro de Tapa Dura (Hardcover Case Laminate) */}
            {onOpenAmazonKdpHardcoverModal && (
              <button
                onClick={onOpenAmazonKdpHardcoverModal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white border border-indigo-400/40 transition-all shadow-lg shadow-indigo-500/25 cursor-pointer whitespace-nowrap"
                title="Generar edición especial de Lujo en Tapa Dura (Hardcover Case Laminate) para Amazon KDP lista para subir sin complicaciones"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-200" />
                <span>Libro Tapa Dura KDP</span>
              </button>
            )}

            {/* Fichas PDF Papel Bond Quick Access Button */}
            {onOpenPdfModal && (
              <button
                onClick={() => {
                  const target = filteredCountries.length > 0 ? filteredCountries[0] : countries[0];
                  if (target) onOpenPdfModal(target);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all shadow-md cursor-pointer whitespace-nowrap"
                title="Abrir generador y visor de Fichas Vexilológicas PDF de 2 páginas tamaño Papel Bond"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Ficha PDF 2 Págs</span>
                <span className="sm:hidden">PDF</span>
              </button>
            )}

            {/* Batch Auto Download ZIP Button */}
            <button
              onClick={handleDownloadBatchZip}
              disabled={isZipping || filteredCountries.length === 0}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                zipSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20'
              }`}
              title="Descargar automáticamente todas las banderas visibles en un paquete ZIP"
            >
              {isZipping ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Comprimiendo ({zipProgress.percent}%)...</span>
                </>
              ) : zipSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                  <span>¡ZIP Descargado!</span>
                </>
              ) : (
                <>
                  <Archive className="w-3.5 h-3.5" />
                  <span>Descargar Lote SVG ({filteredCountries.length})</span>
                </>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <SortAsc className="w-4 h-4 text-sky-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="name">Nombre (A-Z)</option>
                <option value="population">Mayor Población</option>
                <option value="area">Mayor Superficie (km²)</option>
              </select>
            </div>

            {/* Grid Density Toggle */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setGridDensity('comfortable')}
                className={`p-1.5 rounded-lg transition-all ${
                  gridDensity === 'comfortable' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Vista Estándar"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setGridDensity('compact')}
                className={`p-1.5 rounded-lg transition-all ${
                  gridDensity === 'compact' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Vista Compacta / Densa"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Continent & Islands Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedContinent('Todos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedContinent === 'Todos'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            🌍 Todos los Países ({countries.length})
          </button>
          {CONTINENTS.map((continent) => (
            <button
              key={continent}
              onClick={() => setSelectedContinent(continent)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedContinent === continent
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {continent}
            </button>
          ))}
          <button
            onClick={() => setSelectedContinent('Islas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedContinent === 'Islas'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20'
                : 'bg-slate-950 text-teal-400 border border-teal-900/60 hover:text-white'
            }`}
          >
            🏝️ Naciones Insulares ({countries.filter((c) => c.isIsland).length})
          </button>
        </div>

        {/* Color Palette Filters */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium whitespace-nowrap">
            <Palette className="w-3.5 h-3.5 text-sky-400" />
            Color en la bandera:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedColor('Todos')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                selectedColor === 'Todos'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Cualquiera
            </button>
            {availableColors.map((col) => {
              const colorBgMap: Record<string, string> = {
                red: 'bg-rose-500',
                blue: 'bg-blue-500',
                yellow: 'bg-amber-400',
                green: 'bg-emerald-500',
                white: 'bg-slate-100 border border-slate-400',
                black: 'bg-slate-950 border border-slate-700',
                orange: 'bg-orange-500'
              };
              const colorLabelMap: Record<string, string> = {
                red: 'Rojo',
                blue: 'Azul',
                yellow: 'Amarillo',
                green: 'Verde',
                white: 'Blanco',
                black: 'Negro',
                orange: 'Naranja'
              };

              const isSelected = selectedColor === col;

              return (
                <button
                  key={col}
                  onClick={() => setSelectedColor(col)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-800 text-white border-slate-700 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${colorBgMap[col]}`} />
                  <span>{colorLabelMap[col]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid of Flag Cards */}
      {filteredCountries.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-12 text-center space-y-3">
          <p className="text-base font-semibold text-slate-300">
            No se encontraron banderas con los filtros seleccionados
          </p>
          <p className="text-xs text-slate-500">
            Intenta cambiar el término de búsqueda o seleccionar "Todos los Países".
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedContinent('Todos');
              setSelectedColor('Todos');
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white transition-all shadow-md cursor-pointer"
          >
            Restablecer Filtros
          </button>
        </div>
      ) : (
        <div
          className={`grid gap-4 ${
            gridDensity === 'comfortable'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
          }`}
        >
          {filteredCountries.map((country) => (
            <FlagCard
              key={country.id}
              country={country}
              onSelectCountry={onSelectCountry}
              onSelect={() => onSelectCountry && onSelectCountry(country)}
              onCompareWith={onCompareWith}
              onCompare={() => onCompareWith && onCompareWith(country)}
              onOpenPdfModal={() => onOpenPdfModal && onOpenPdfModal(country)}
              isCompact={gridDensity === 'compact'}
            />
          ))}
        </div>
      )}
    </div>
  );
};
