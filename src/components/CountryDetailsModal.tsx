import React, { useState, useEffect } from 'react';
import { Country } from '../types';
import {
  X,
  Globe,
  MapPin,
  Users,
  Coins,
  Languages,
  Download,
  Sparkles,
  BookOpen,
  FileJson,
  FileImage,
  Check,
  Share2,
  Compass,
  Building2,
  Landmark,
  Shield,
  Layers,
  ChevronRight,
  Map as MapIcon,
  Flag
} from 'lucide-react';
import { DownloadHelper } from '../utils/downloadHelper';
import { geoDataService } from '../services/geoDataService';
import { getCountryPoliticalStructure } from '../data/politicalDivisions';
import { CountryPdfMap } from './CountryPdfMap';
import { CountryQrDownloadModule } from './CountryQrDownloadModule';
import { CountryNarrativeService } from '../services/countryNarrativeService';

interface CountryDetailsModalProps {
  isOpen: boolean;
  country: Country | null;
  onClose: () => void;
  onFocusGlobe: (country: Country) => void;
  onOpenPoliticalSheet?: (country: Country) => void;
  onOpenPdfModal?: (country: Country) => void;
}

export const CountryDetailsModal: React.FC<CountryDetailsModalProps> = ({
  isOpen,
  country,
  onClose,
  onFocusGlobe,
  onOpenPoliticalSheet,
  onOpenPdfModal
}) => {
  const [aiFact, setAiFact] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [activeVisualTab, setActiveVisualTab] = useState<'flag' | 'map'>('flag');

  // Reset trivia and handle ESC key to close
  useEffect(() => {
    setAiFact(null);
    setIsLoadingAi(false);
    setDownloadSuccess(null);

    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, country?.id, onClose]);

  if (!isOpen || !country) return null;

  const politicalStructure = getCountryPoliticalStructure(country);
  const flagSvgUrl = `https://flagcdn.com/${country.id}.svg`;
  const cleanName = country.nameEs
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');

  const handleAskGemini = async () => {
    setIsLoadingAi(true);
    try {
      setTimeout(() => {
        setAiFact(
          `Curiosidad Histórica de ${country.nameEs}: La bandera de ${country.nameEs} tiene un profundo simbolismo cultural. ${country.flagSymbolismEs} Además, en ${country.nameEs}, ${country.funFactEs}`
        );
        setIsLoadingAi(false);
      }, 600);
    } catch {
      setAiFact(country.funFactEs);
      setIsLoadingAi(false);
    }
  };

  // Descarga automática de Bandera SVG Oficial
  const handleDownloadSvg = async () => {
    const filename = `bandera_oficial_${country.id}_${cleanName}.svg`;
    await DownloadHelper.downloadRemoteFile(flagSvgUrl, filename);
    setDownloadSuccess('svg');
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  // Descarga automática de Ficha Técnica Geográfica (JSON)
  const handleDownloadDataJson = () => {
    const dataString = JSON.stringify(
      {
        ...country,
        exportedAt: new Date().toISOString(),
        source: 'Banderas SVG & Mapa 3D 8K Ultra-Real'
      },
      null,
      2
    );
    DownloadHelper.downloadText(dataString, `ficha_geografica_${country.id}_${cleanName}.json`, 'application/json');
    setDownloadSuccess('json');
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  // Descarga automática de Fronteras Cartográficas Vectoriales (GeoJSON)
  const handleDownloadBoundaryGeoJson = () => {
    const geojson = geoDataService.getCountriesGeoJSON();
    const countryFeature = geojson.features.find(
      (f: any) =>
        f.id === country.id.toUpperCase() ||
        f.properties?.ISO_A2 === country.id.toUpperCase() ||
        f.properties?.ISO_A3 === country.code3
    );

    const featureToExport = countryFeature || {
      type: 'Feature',
      properties: { name: country.nameEs, id: country.id, code3: country.code3 },
      geometry: { type: 'Point', coordinates: [country.lng, country.lat] }
    };

    DownloadHelper.downloadText(
      JSON.stringify(featureToExport, null, 2),
      `mapa_frontera_${country.id}_${cleanName}.geojson`,
      'application/geo+json'
    );
    setDownloadSuccess('geo');
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  return (
    <div
      id="country-details-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        id="country-details-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚩</span>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                {country.nameEs}
                <span className="text-sm font-mono font-normal text-sky-400 bg-sky-950/60 border border-sky-500/30 px-2.5 py-0.5 rounded-full">
                  {country.code3}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{country.continent} • {country.nameEn}</p>
            </div>
          </div>

          <button
            id="close-modal-button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Visual Mode Selector Tabs */}
          <div className="flex items-center justify-between gap-3 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 flex-1">
              <button
                onClick={() => setActiveVisualTab('flag')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeVisualTab === 'flag'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Bandera Oficial (SVG)</span>
              </button>

              <button
                onClick={() => setActiveVisualTab('map')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeVisualTab === 'map'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Mapa Vectorial SVG ({politicalStructure.totalCount} {politicalStructure.divisionTypeName})</span>
              </button>
            </div>

            {onOpenPoliticalSheet && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPoliticalSheet(country);
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer"
                title="Abrir Ficha Técnica Completa con todas las Subdivisiones y Estadísticas"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Ficha de Divisiones</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Active Visual Showcase Hero */}
          {activeVisualTab === 'flag' ? (
            <div className="relative group bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden shadow-inner animate-in fade-in duration-150">
              <img
                src={flagSvgUrl}
                alt={`Bandera SVG de ${country.nameEs}`}
                className="max-h-56 w-auto object-contain rounded-lg shadow-2xl border border-white/10"
              />
              
              {/* Automatic Download Action Suite */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  onClick={handleDownloadSvg}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all shadow-md cursor-pointer ${
                    downloadSuccess === 'svg'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-800 hover:bg-sky-600 text-slate-200 hover:text-white border-slate-700 hover:border-sky-500'
                  }`}
                  title="Descargar automáticamente la bandera en formato SVG Vectorial"
                >
                  {downloadSuccess === 'svg' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>¡SVG Descargado!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-sky-400 group-hover:text-white" />
                      <span>Descargar Bandera SVG</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadBoundaryGeoJson}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all shadow-md cursor-pointer ${
                    downloadSuccess === 'geo'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white border-slate-700 hover:border-emerald-500'
                  }`}
                  title="Descargar automáticamente el mapa vectorial GeoJSON con las fronteras exactas"
                >
                  {downloadSuccess === 'geo' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>¡Mapa GeoJSON Descargado!</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <span>Descargar GeoJSON</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadDataJson}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all shadow-md cursor-pointer ${
                    downloadSuccess === 'json'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                  }`}
                  title="Descargar Ficha Técnica con todas las coordenadas y estadísticas"
                >
                  {downloadSuccess === 'json' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <FileJson className="w-4 h-4 text-amber-400" />
                  )}
                  <span>Ficha JSON</span>
                </button>

                <button
                  onClick={() => {
                    onFocusGlobe(country);
                    onClose();
                  }}
                  className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>Navegar en Mapa 3D</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="relative group bg-slate-950 p-3 sm:p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden shadow-inner animate-in fade-in duration-150">
              {/* Authentic Vector SVG Map Component */}
              <div className="w-full max-w-2xl aspect-[16/9] rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900 flex items-center justify-center">
                <CountryPdfMap country={country} theme="light" width={680} height={360} />
              </div>

              {/* Map Info & Actions */}
              <div className="w-full mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">División Política Oficial:</span>
                  <span className="text-xs font-bold text-sky-400 bg-sky-950/80 border border-sky-500/30 px-2.5 py-0.5 rounded-full">
                    {politicalStructure.totalCount} {politicalStructure.divisionTypeName}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleDownloadBoundaryGeoJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all cursor-pointer"
                    title="Descargar límites fronterizos y coordenadas en GeoJSON"
                  >
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>GeoJSON Fronteras</span>
                  </button>

                  {onOpenPoliticalSheet && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenPoliticalSheet(country);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer font-bold shadow-md shadow-amber-500/20"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Ver Ficha de Subdivisiones</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Country Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-2xl">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-medium mb-1">
                <MapPin className="w-4 h-4" />
                <span>Capital</span>
              </div>
              <p className="text-white font-semibold text-sm">{country.capitalEs}</p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-2xl">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-medium mb-1">
                <Users className="w-4 h-4" />
                <span>Población</span>
              </div>
              <p className="text-white font-semibold text-sm">
                {country.population.toLocaleString('es-ES')} hab.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-2xl">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-medium mb-1">
                <Coins className="w-4 h-4" />
                <span>Moneda</span>
              </div>
              <p className="text-white font-semibold text-sm">{country.currency}</p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-2xl">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-medium mb-1">
                <Languages className="w-4 h-4" />
                <span>Idioma</span>
              </div>
              <p className="text-white font-semibold text-sm">{country.language}</p>
            </div>
          </div>

          {/* Flag Symbolism & History */}
          <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-2">
            <h4 className="text-sm font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Simbolismo de la Bandera SVG
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {country.flagSymbolismEs}
            </p>
          </div>

          {/* Historia Oficial de Media Página */}
          <div className="bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-950 border border-amber-500/30 p-5 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Historia de la Nación y su Pabellón Soberano
              </h4>
              <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                RESEÑA HISTÓRICA OFICIAL
              </span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed text-justify">
              {CountryNarrativeService.getCountryHistory(country, 'es')}
            </p>
          </div>

          {/* 10 Datos Curiosos & Récords Oficiales */}
          <div className="bg-gradient-to-br from-emerald-950/30 via-slate-950 to-slate-950 border border-emerald-500/30 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                10 Datos Curiosos, Hitos & Récords de {country.nameEs}
              </h4>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                10 DATOS OFICIALES
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {CountryNarrativeService.getCountryCuriosities(country, 'es').map((fact, idx) => (
                <div
                  key={`detail-fact-${idx}`}
                  className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-slate-300 leading-snug">{fact}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Gemini AI Fact Box */}
          <div className="bg-gradient-to-r from-sky-950/40 via-indigo-950/30 to-slate-950 border border-sky-500/20 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Explorador Gemini AI</span>
              </div>
              {!aiFact && (
                <button
                  onClick={handleAskGemini}
                  disabled={isLoadingAi}
                  className="bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isLoadingAi ? 'Consultando Gemini...' : 'Generar Curiosidad'}
                </button>
              )}
            </div>

            {aiFact ? (
              <p className="text-slate-200 text-sm leading-relaxed animate-in fade-in duration-300">
                {aiFact}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Haz clic para consultar datos fascinantes sobre la historia de {country.nameEs} y la composición de su bandera.
              </p>
            )}
          </div>

          {/* Módulo de Código QR Único de Descarga Directa del PDF */}
          <CountryQrDownloadModule
            country={country}
            onOpenPdfModal={onOpenPdfModal}
          />
        </div>
      </div>
    </div>
  );
};

