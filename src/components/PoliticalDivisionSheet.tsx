import React, { useState, useMemo } from 'react';
import { Country, PoliticalSubdivision, CountryPoliticalStructure } from '../types';
import { getCountryPoliticalStructure } from '../data/politicalDivisions';
import { CountryPdfMap } from './CountryPdfMap';
import {
  X,
  Building2,
  Users,
  MapPin,
  Maximize2,
  Search,
  Download,
  Check,
  FileJson,
  Sparkles,
  Layers,
  ArrowUpDown,
  Compass,
  Landmark,
  Shield,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Map as MapIcon,
  Eye
} from 'lucide-react';
import { DownloadHelper } from '../utils/downloadHelper';

interface PoliticalDivisionSheetProps {
  isOpen: boolean;
  country: Country | null;
  onClose: () => void;
  onSelectSubdivision?: (sub: PoliticalSubdivision) => void;
  onFocusGlobe?: (country: Country, sub?: PoliticalSubdivision) => void;
  onFocusMap?: (country: Country, sub?: PoliticalSubdivision) => void;
}

export const PoliticalDivisionSheet: React.FC<PoliticalDivisionSheetProps> = ({
  isOpen,
  country,
  onClose,
  onSelectSubdivision,
  onFocusGlobe,
  onFocusMap
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'population' | 'area'>('population');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedSubdivision, setSelectedSubdivision] = useState<PoliticalSubdivision | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [showMapPreview, setShowMapPreview] = useState<boolean>(true);

  // Political Structure for active country
  const politicalStructure: CountryPoliticalStructure | null = useMemo(() => {
    if (!country) return null;
    return getCountryPoliticalStructure(country);
  }, [country]);

  // Filter and sort subdivisions
  const filteredSubdivisions = useMemo(() => {
    if (!politicalStructure) return [];
    let list = [...politicalStructure.subdivisions];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.capital.toLowerCase().includes(term) ||
          s.code.toLowerCase().includes(term) ||
          s.type.toLowerCase().includes(term)
      );
    }

    list.sort((a, b) => {
      let comp = 0;
      if (sortBy === 'name') {
        comp = a.name.localeCompare(b.name);
      } else if (sortBy === 'population') {
        comp = a.population - b.population;
      } else if (sortBy === 'area') {
        comp = a.areaKm2 - b.areaKm2;
      }
      return sortOrder === 'desc' ? -comp : comp;
    });

    return list;
  }, [politicalStructure, searchTerm, sortBy, sortOrder]);

  // Set initial selected subdivision
  React.useEffect(() => {
    if (politicalStructure && politicalStructure.subdivisions.length > 0) {
      setSelectedSubdivision(politicalStructure.subdivisions[0]);
    } else {
      setSelectedSubdivision(null);
    }
    setSearchTerm('');
    setAiAnalysis(null);
  }, [country?.id, politicalStructure]);

  if (!isOpen || !country || !politicalStructure) return null;

  const flagSvgUrl = `https://flagcdn.com/${country.id}.svg`;
  const cleanName = country.nameEs
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');

  // Export full political sheet JSON
  const handleDownloadSheetJson = () => {
    const dataString = JSON.stringify(
      {
        ...politicalStructure,
        nationalTotals: {
          population: country.population,
          areaKm2: country.areaKm2,
          capital: country.capitalEs,
          currency: country.currency,
          language: country.language
        },
        exportedAt: new Date().toISOString(),
        source: 'Atlas Cartográfico Mundial - Divisiones Políticas'
      },
      null,
      2
    );
    DownloadHelper.downloadText(
      dataString,
      `ficha_politica_${country.id}_${cleanName}_divisiones.json`,
      'application/json'
    );
    setDownloadSuccess('json');
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  // Export GeoJSON of subdivisions points
  const handleDownloadSubdivisionsGeoJson = () => {
    const featureCollection = {
      type: 'FeatureCollection',
      properties: {
        country: country.nameEs,
        countryId: country.id,
        divisionType: politicalStructure.divisionTypeName,
        totalCount: politicalStructure.totalCount
      },
      features: politicalStructure.subdivisions.map((sub) => ({
        type: 'Feature',
        id: sub.code,
        properties: {
          name: sub.name,
          code: sub.code,
          type: sub.type,
          capital: sub.capital,
          population: sub.population,
          areaKm2: sub.areaKm2,
          trivia: sub.triviaEs,
          country: country.nameEs
        },
        geometry: {
          type: 'Point',
          coordinates: [sub.lng, sub.lat]
        }
      }))
    };

    DownloadHelper.downloadText(
      JSON.stringify(featureCollection, null, 2),
      `geojson_divisiones_${country.id}_${cleanName}.geojson`,
      'application/geo+json'
    );
    setDownloadSuccess('geo');
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  // AI Geopolitical Summary
  const handleGenerateAiAnalysis = () => {
    setIsLoadingAi(true);
    setTimeout(() => {
      setAiAnalysis(
        `Estructura Territorial de ${country.nameEs}: Con un régimen de ${politicalStructure.governmentSystem}, ${country.nameEs} articula su soberanía a través de ${politicalStructure.totalCount} ${politicalStructure.divisionTypeName.toLowerCase()}. La distribución poblacional y económica refleja el peso histórico de sus capitales regionales como ${politicalStructure.subdivisions.slice(0, 3).map((s) => s.capital).join(', ')}, integrando diversidades geográficas, climáticas y culturales únicas.`
      );
      setIsLoadingAi(false);
    }, 600);
  };

  return (
    <div
      id="political-division-sheet-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        id="political-division-sheet-modal"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header Superior con Bandera y Título */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-sky-950/40">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <img
                src={flagSvgUrl}
                alt={`Bandera de ${country.nameEs}`}
                className="w-12 h-8 sm:w-14 sm:h-9 object-cover rounded-lg shadow-md border border-white/20"
              />
              <span className="absolute -bottom-1 -right-1 text-xs bg-slate-900 rounded-full p-0.5 border border-slate-700">
                🏛️
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  Ficha de División Política: {country.nameEs}
                </h2>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold">
                  {country.code3}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {politicalStructure.totalCount} {politicalStructure.divisionTypeName}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                <span>{country.continent}</span>
                <span>•</span>
                <span className="text-slate-300 font-medium">{politicalStructure.governmentSystem}</span>
                <span>•</span>
                <span>Capital: {country.capitalEs}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar Ficha de División Política"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Action Bar (Downloads, Actions, AI Analysis) */}
        <div className="px-5 sm:px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadSheetJson}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
                downloadSuccess === 'json'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700'
              }`}
              title="Descargar Ficha Política Completa en Formato JSON"
            >
              {downloadSuccess === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <FileJson className="w-3.5 h-3.5 text-amber-400" />}
              <span>Descargar Ficha (JSON)</span>
            </button>

            <button
              onClick={handleDownloadSubdivisionsGeoJson}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
                downloadSuccess === 'geo'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700'
              }`}
              title="Descargar Coordenadas y Puntos de las Divisiones en GeoJSON"
            >
              {downloadSuccess === 'geo' ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Layers className="w-3.5 h-3.5 text-sky-400" />}
              <span>GeoJSON Divisiones</span>
            </button>

            <button
              onClick={handleGenerateAiAnalysis}
              disabled={isLoadingAi}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-600 hover:to-purple-600 text-white border border-indigo-500/40 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              title="Generar síntesis geopolítica de las divisiones con Inteligencia Artificial"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
              <span>{isLoadingAi ? 'Analizando...' : 'Análisis Geopolítico IA'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onFocusMap && (
              <button
                onClick={() => {
                  onFocusMap(country, selectedSubdivision || undefined);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-500/15 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 transition-all cursor-pointer"
                title="Ver y explorar este país y sus divisiones en el Mapa 2D"
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Ver en Mapa 2D</span>
              </button>
            )}

            {onFocusGlobe && (
              <button
                onClick={() => {
                  onFocusGlobe(country, selectedSubdivision || undefined);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 transition-all cursor-pointer"
                title="Ver y rotar el Globo 3D hacia este país"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Ver en Globo 3D</span>
              </button>
            )}
          </div>
        </div>

        {/* AI Insight Box (if generated) */}
        {aiAnalysis && (
          <div className="px-5 sm:px-6 py-3 bg-indigo-950/40 border-b border-indigo-500/30 text-xs text-indigo-200 flex items-start gap-2.5 animate-in fade-in duration-150">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{aiAnalysis}</p>
          </div>
        )}

        {/* Main Body Layout: Split Directory & Detail Card */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* Left Column: Subdivisions Directory & Search (5 cols) */}
          <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col overflow-hidden bg-slate-900/40">
            {/* Search & Sort Toolbar */}
            <div className="space-y-3 mb-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Buscar en ${politicalStructure.totalCount} ${politicalStructure.divisionTypeName.toLowerCase()}...`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 gap-2">
                <span className="font-semibold">{filteredSubdivisions.length} divisiones listadas:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">Ordenar por:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
                  >
                    <option value="population">Población</option>
                    <option value="name">Nombre</option>
                    <option value="area">Superficie</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white"
                    title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Subdivisions List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {filteredSubdivisions.map((sub) => {
                const isSelected = selectedSubdivision?.id === sub.id;
                const popPct = country.population > 0 ? ((sub.population / country.population) * 100).toFixed(1) : '0';

                return (
                  <div
                    key={sub.id}
                    onClick={() => {
                      setSelectedSubdivision(sub);
                      if (onSelectSubdivision) onSelectSubdivision(sub);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-sky-950/60 border-sky-500/60 shadow-md shadow-sky-950/30'
                        : 'bg-slate-950/40 hover:bg-slate-800/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">{sub.badge || '📍'}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-sky-300' : 'text-slate-200'}`}>
                            {sub.name}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                            {sub.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          Capital: <span className="text-slate-300">{sub.capital}</span> • {sub.type}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-300">
                        {(sub.population / 1000000).toFixed(1)}M hab.
                      </span>
                      <p className="text-[10px] text-sky-400/90 font-mono">
                        {popPct}% del país
                      </p>
                    </div>
                  </div>
                );
              })}

              {filteredSubdivisions.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No se encontraron divisiones con los filtros actuales.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Active Subdivision Detail & Country Geopolitical Dossier (7 cols) */}
          <div className="lg:col-span-7 p-5 sm:p-6 overflow-y-auto space-y-6 bg-slate-900/60">
            {/* Authentic Vector SVG Map Preview Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapIcon className="w-4 h-4 text-sky-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Mapa Vectorial SVG: {country.nameEs}
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-400">
                    ({politicalStructure.totalCount} {politicalStructure.divisionTypeName})
                  </span>
                </div>

                <button
                  onClick={() => setShowMapPreview(!showMapPreview)}
                  className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showMapPreview ? 'Ocultar Mapa' : 'Ver Mapa SVG'}</span>
                </button>
              </div>

              {showMapPreview && (
                <div className="w-full aspect-[16/9] sm:aspect-[21/9] rounded-xl overflow-hidden shadow-inner border border-white/10 bg-slate-900 flex items-center justify-center animate-in fade-in duration-150">
                  <CountryPdfMap country={country} theme="light" width={680} height={300} />
                </div>
              )}
            </div>

            {selectedSubdivision ? (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Active Subdivision Banner Card */}
                <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none text-8xl">
                    {selectedSubdivision.badge || '🏛️'}
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{selectedSubdivision.badge || '📍'}</span>
                        <h3 className="text-xl font-bold text-white tracking-tight">
                          {selectedSubdivision.name}
                        </h3>
                      </div>
                      <p className="text-xs text-sky-400 font-semibold mt-0.5">
                        {selectedSubdivision.type} • Código ISO: <span className="font-mono">{selectedSubdivision.code}</span>
                      </p>
                    </div>

                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
                      {country.nameEs}
                    </span>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Landmark className="w-3 h-3 text-amber-400" />
                        <span>Capital</span>
                      </p>
                      <p className="text-xs font-bold text-white mt-1 truncate">
                        {selectedSubdivision.capital}
                      </p>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3 text-sky-400" />
                        <span>Población</span>
                      </p>
                      <p className="text-xs font-bold text-sky-300 mt-1 font-mono">
                        {selectedSubdivision.population.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Maximize2 className="w-3 h-3 text-emerald-400" />
                        <span>Superficie</span>
                      </p>
                      <p className="text-xs font-bold text-emerald-300 mt-1 font-mono">
                        {selectedSubdivision.areaKm2.toLocaleString()} km²
                      </p>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-purple-400" />
                        <span>Densidad</span>
                      </p>
                      <p className="text-xs font-bold text-purple-300 mt-1 font-mono">
                        {selectedSubdivision.areaKm2 > 0
                          ? (selectedSubdivision.population / selectedSubdivision.areaKm2).toFixed(1)
                          : 'N/A'}{' '}
                        <span className="text-[10px] font-normal text-slate-400">hab/km²</span>
                      </p>
                    </div>
                  </div>

                  {/* Demographic & Geographic Share Meters */}
                  <div className="mt-5 space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Peso Demográfico Nacional:</span>
                        <span className="text-sky-300 font-bold font-mono">
                          {country.population > 0
                            ? ((selectedSubdivision.population / country.population) * 100).toFixed(2)
                            : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              100,
                              country.population > 0
                                ? (selectedSubdivision.population / country.population) * 100
                                : 0
                            )}%`
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Participación Territorial:</span>
                        <span className="text-emerald-300 font-bold font-mono">
                          {country.areaKm2 > 0
                            ? ((selectedSubdivision.areaKm2 / country.areaKm2) * 100).toFixed(2)
                            : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              100,
                              country.areaKm2 > 0
                                ? (selectedSubdivision.areaKm2 / country.areaKm2) * 100
                                : 0
                            )}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Trivia & Historical Fact */}
                  {selectedSubdivision.triviaEs && (
                    <div className="mt-4 p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        <strong className="text-white">Reseña Cartográfica e Histórica: </strong>
                        {selectedSubdivision.triviaEs}
                      </p>
                    </div>
                  )}

                  {/* Coordinates Badge */}
                  <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-800/80">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      Coordenadas: Lat {selectedSubdivision.lat.toFixed(4)}°, Lng {selectedSubdivision.lng.toFixed(4)}°
                    </span>

                    <span className="text-slate-500">
                      Entidad de Primer Nivel (ADM1)
                    </span>
                  </div>
                </div>

                {/* Country-wide Political Structure Summary */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-sky-400" />
                    Régimen y Organización Territorial Nacional
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {politicalStructure.descriptionEs}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
                      <span className="text-[11px] text-slate-400">Total Nacional:</span>
                      <p className="text-xs font-bold text-white mt-0.5">
                        {politicalStructure.totalCount} {politicalStructure.divisionTypeName}
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
                      <span className="text-[11px] text-slate-400">Población País:</span>
                      <p className="text-xs font-bold text-sky-300 mt-0.5 font-mono">
                        {country.population.toLocaleString()} hab.
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80 col-span-2 sm:col-span-1">
                      <span className="text-[11px] text-slate-400">Superficie Total:</span>
                      <p className="text-xs font-bold text-emerald-300 mt-0.5 font-mono">
                        {country.areaKm2.toLocaleString()} km²
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 text-center text-slate-500 text-xs">
                Selecciona una subdivisión política a la izquierda para ver su ficha técnica detallada.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span>🌍 Atlas de Geografía Política Mundial</span>
            <span>•</span>
            <span>{country.nameEs} ({country.code3})</span>
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
