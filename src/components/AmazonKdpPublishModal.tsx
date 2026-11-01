import React, { useState, useRef, useEffect } from 'react';
import { Country } from '../types';
import { CountryPdfPage1 } from './CountryPdfPage1';
import { CountryPdfPage2 } from './CountryPdfPage2';
import { CountryPdfPage3 } from './CountryPdfPage3';
import { KdpQuickPreviewModal } from './KdpQuickPreviewModal';
import { AmazonKdpService } from '../services/amazonKdpService';
import { KdpPdfGeneratorService } from '../services/kdpPdfGeneratorService';
import { KdpTranslationService } from '../services/kdpTranslationService';
import {
  BookOpen,
  ShoppingBag,
  Download,
  CheckCircle2,
  Copy,
  Layers,
  Sparkles,
  FileText,
  DollarSign,
  TrendingUp,
  Tag,
  ShieldCheck,
  Package,
  Compass,
  Award,
  Globe,
  Zap,
  AlertCircle,
  Eye,
  X
} from 'lucide-react';

interface AmazonKdpPublishModalProps {
  isOpen: boolean;
  countries: Country[];
  onClose: () => void;
  initialFormat?: 'paperback' | 'hardcover';
  initialLang?: 'es' | 'en';
}

export const AmazonKdpPublishModal: React.FC<AmazonKdpPublishModalProps> = ({
  isOpen,
  countries,
  onClose,
  initialFormat = 'paperback',
  initialLang = 'es'
}) => {
  const [activeTab, setActiveTab] = useState<'compilation' | 'preview' | 'metadata' | 'instructions' | 'pricing'>('compilation');
  const [selectedFormat, setSelectedFormat] = useState<'paperback' | 'hardcover'>(initialFormat);
  const [selectedLang, setSelectedLang] = useState<'es' | 'en'>(initialLang);
  const [selectedPaper, setSelectedPaper] = useState<'letter' | 'a4'>('letter');
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compilingMode, setCompilingMode] = useState<'instant' | 'visual' | 'cover' | 'zip' | null>(null);
  const [compileProgress, setCompileProgress] = useState<{ current: number; total: number; stage: string; currentCountry: string }>({
    current: 0,
    total: 0,
    stage: '',
    currentCountry: ''
  });
  const [compilationDone, setCompilationDone] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [stagingCountry, setStagingCountry] = useState<Country | null>(null);
  const [previewCountryId, setPreviewCountryId] = useState<string>(countries[0]?.id || 'ESP');
  const [isQuickPreviewOpen, setIsQuickPreviewOpen] = useState<boolean>(false);
  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  // Sync when initialFormat or initialLang changes
  useEffect(() => {
    if (initialFormat) setSelectedFormat(initialFormat);
  }, [initialFormat]);

  useEffect(() => {
    if (initialLang) setSelectedLang(initialLang);
  }, [initialLang]);

  // Filter or selection for countries
  const [countrySubset, setCountrySubset] = useState<'all' | 'sample10' | 'america' | 'europe' | 'asia' | 'africa' | 'oceania'>('all');

  const filteredCountries = countrySubset === 'all'
    ? countries
    : countrySubset === 'sample10'
    ? countries.slice(0, 10)
    : countrySubset === 'america'
    ? countries.filter((c) => c.continent.includes('América'))
    : countries.filter((c) => c.continent.toLowerCase() === countrySubset.toLowerCase());

  const previewCountry = countries.find(c => c.id === previewCountryId) || filteredCountries[0] || countries[0];

  const isHardcover = selectedFormat === 'hardcover';
  const isEn = selectedLang === 'en';

  const metadata = isEn
    ? KdpTranslationService.generateEnglishListingMetadata(filteredCountries, selectedFormat)
    : (isHardcover
        ? KdpTranslationService.generateSpanishHardcoverListingMetadata(filteredCountries)
        : AmazonKdpService.generateListingMetadata(filteredCountries));

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCancelCompilation = () => {
    cancelRef.current.cancelled = true;
    setIsCompiling(false);
    setStagingCountry(null);
  };

  // 1. Instant Direct Vector Generator (Ultra-fast & 100% Reliable con soporte KDP G201857950)
  const handleInstantVectorDownload = async (
    bleed: boolean = true,
    lang: 'es' | 'en' = selectedLang,
    formatOverride?: 'paperback' | 'hardcover'
  ) => {
    if (isCompiling || filteredCountries.length === 0) return;
    const effectiveFormat = formatOverride || selectedFormat;
    setIsCompiling(true);
    setCompilingMode('instant');
    setCompilationDone(false);
    cancelRef.current.cancelled = false;

    try {
      await KdpPdfGeneratorService.generateInstantVectorPdf(
        filteredCountries,
        selectedPaper,
        (current, total, stage, countryName) => {
          setCompileProgress({ current, total, stage, currentCountry: countryName });
        },
        { bleed, lang, bookFormat: effectiveFormat }
      );
      setCompilationDone(true);
    } catch (err) {
      console.error('Error en generación vectorial directa:', err);
      alert('Hubo un error al generar el archivo PDF. Intente nuevamente.');
    } finally {
      setIsCompiling(false);
      setCompilingMode(null);
    }
  };

  // 2. Visual DOM High-Fidelity Rendering Generator
  const handleVisualDomDownload = async () => {
    if (isCompiling || filteredCountries.length === 0) return;
    setIsCompiling(true);
    setCompilingMode('visual');
    setCompilationDone(false);
    cancelRef.current.cancelled = false;

    try {
      await KdpPdfGeneratorService.generateVisualDomPdf(
        filteredCountries,
        selectedPaper,
        (country) => setStagingCountry(country),
        (current, total, stage, countryName) => {
          setCompileProgress({ current, total, stage, currentCountry: countryName });
        },
        cancelRef.current
      );
      setCompilationDone(true);
    } catch (err: any) {
      if (cancelRef.current.cancelled) return;
      console.error('Error en renderizado visual:', err);
      const retryVector = window.confirm(
        'El renderizado gráfico intensivo tardó demasiado o tuvo una restricción de memoria en el navegador. ¿Deseas descargar el libro inmediatamente usando el Generador Vectorial Ultra-Rápido?'
      );
      if (retryVector) {
        handleInstantVectorDownload(true, selectedLang);
      }
    } finally {
      setIsCompiling(false);
      setCompilingMode(null);
      setStagingCountry(null);
    }
  };

  // 3. Full Wrap Cover Generator (Portada + Lomo exacto + Contraportada KDP)
  const handleFullWrapCoverDownload = async (
    lang: 'es' | 'en' = selectedLang,
    formatOverride?: 'paperback' | 'hardcover'
  ) => {
    if (isCompiling || filteredCountries.length === 0) return;
    const effectiveFormat = formatOverride || selectedFormat;
    setIsCompiling(true);
    setCompilingMode('cover');
    setCompilationDone(false);
    cancelRef.current.cancelled = false;

    try {
      await KdpPdfGeneratorService.generateFullWrapCoverPdf(
        filteredCountries,
        selectedPaper,
        (current, total, stage, countryName) => {
          setCompileProgress({ current, total, stage, currentCountry: countryName });
        },
        { lang, bookFormat: effectiveFormat }
      );
      setCompilationDone(true);
    } catch (err) {
      console.error('Error en generación de cubierta KDP:', err);
      alert('Hubo un error al generar la cubierta KDP. Intente nuevamente.');
    } finally {
      setIsCompiling(false);
      setCompilingMode(null);
    }
  };

  // 4. Paquete Automático 1-Clic Todo-en-Uno (ZIP) para Amazon KDP
  const handleKdpZipBundleDownload = async (
    lang: 'es' | 'en' = selectedLang,
    formatOverride?: 'paperback' | 'hardcover'
  ) => {
    if (isCompiling || filteredCountries.length === 0) return;
    const effectiveFormat = formatOverride || selectedFormat;
    setIsCompiling(true);
    setCompilingMode('zip');
    setCompilationDone(false);
    cancelRef.current.cancelled = false;

    try {
      await KdpPdfGeneratorService.generateKdpZipPackage(
        filteredCountries,
        selectedPaper,
        (current, total, stage, countryName) => {
          setCompileProgress({ current, total, stage, currentCountry: countryName });
        },
        { lang, bookFormat: effectiveFormat }
      );
      setCompilationDone(true);
    } catch (err) {
      console.error('Error en generación del paquete KDP ZIP:', err);
      alert('Hubo un error al generar el paquete ZIP. Intente nuevamente.');
    } finally {
      setIsCompiling(false);
      setCompilingMode(null);
    }
  };

  return (
    <div
      id="amazon-kdp-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        id="amazon-kdp-modal-card"
        className="relative w-full max-w-6xl h-[94vh] bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER BAR */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/95 gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-black">
              <ShoppingBag className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  {isEn
                    ? 'Amazon KDP Book Compiler & Publishing Studio'
                    : 'Compilador Editorial para Amazon KDP (Kindle Direct Publishing)'}
                </h2>
                <span className="text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {isEn ? 'Automatic Commercial Listing' : 'Listado Comercial Automático'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isEn
                  ? 'Compiles full PDF manuscript with embedded SVG vector flags, official country profiles, and metadata ready for Amazon sale'
                  : 'Genera el manuscrito PDF completo con banderas vectoriales SVG incrustadas, nombres oficiales y ficha KDP lista para venta en Amazon'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsQuickPreviewOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold border border-amber-500/40 transition-all cursor-pointer shadow-sm"
              title={isEn ? 'Open interactive full book preview popup' : 'Abrir ventana emergente con la previsualización interactiva del libro PDF completo'}
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>{isEn ? 'Book Live Preview' : 'Vista Previa del Libro'}</span>
            </button>
            <button
              onClick={() => AmazonKdpService.downloadKdpManifest(filteredCountries)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              title={isEn ? 'Download JSON file with title, description, and keywords for Amazon API' : 'Descargar archivo JSON con título, descripción y palabras clave para la API de Amazon'}
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>{isEn ? 'Export Metadata JSON' : 'Exportar JSON Metadatos'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              aria-label={isEn ? 'Close' : 'Cerrar'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center px-6 border-b border-slate-800 bg-slate-900/60 overflow-x-auto no-scrollbar gap-2 py-2">
          <button
            onClick={() => setActiveTab('compilation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'compilation'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>
              {isEn
                ? `1. Compile PDF Book (${filteredCountries.length * 3 + 2} Pages)`
                : `1. Compilar Libro PDF (${filteredCountries.length * 3 + 2} Páginas)`}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'preview'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{isEn ? '2. SVG Map & Flag Preview' : '2. Vista Previa de Mapas SVG & Páginas'}</span>
          </button>

          <button
            onClick={() => setActiveTab('metadata')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'metadata'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isEn ? '3. Title, Synopsis & SEO' : '3. Título, Sinopsis & SEO'}</span>
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pricing'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>{isEn ? '4. Pricing & KDP Royalties' : '4. Precios & Regalías KDP'}</span>
          </button>

          <button
            onClick={() => setActiveTab('instructions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'instructions'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{isEn ? '5. Publishing Guide' : '5. Guía de Publicación'}</span>
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/70">
          {/* TAB 1: COMPILATION */}
          {activeTab === 'compilation' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Selector de Formato KDP & Idioma */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      {isEn ? 'Amazon KDP Book Format' : 'Tipo de Libro Amazon KDP'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-bold">
                      {isHardcover
                        ? (isEn ? 'Hardcover (Case Laminate)' : 'Tapa Dura (Case Laminate)')
                        : (isEn ? 'Paperback' : 'Tapa Blanda (Paperback)')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => setSelectedFormat('paperback')}
                      className={`p-3 rounded-xl border flex flex-col items-start gap-1 cursor-pointer transition-all ${
                        selectedFormat === 'paperback'
                          ? 'bg-amber-500/10 border-amber-500 text-white shadow-md shadow-amber-500/10'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-amber-300">{isEn ? 'Paperback' : 'Tapa Blanda'}</span>
                        <span className="text-[9px] font-mono text-slate-400">Paperback</span>
                      </div>
                      <span className="text-[11px] text-slate-300">8.5" x 11.0" Letter</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        {isEn ? '★ Original KDP Format' : '★ Formato Original KDP'}
                      </span>
                    </button>

                    <button
                      onClick={() => setSelectedFormat('hardcover')}
                      className={`p-3 rounded-xl border flex flex-col items-start gap-1 cursor-pointer transition-all ${
                        selectedFormat === 'hardcover'
                          ? 'bg-gradient-to-br from-indigo-500/20 to-sky-500/20 border-sky-400 text-white shadow-md shadow-sky-500/15'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-sky-300">{isEn ? 'Hardcover' : 'Tapa Dura'}</span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-sky-500 text-slate-950">
                          {isEn ? 'NEW' : 'NUEVO'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-300">8.25" x 11.0" Case Laminate</span>
                      <span className="text-[10px] text-amber-400 font-semibold">
                        {isEn ? 'Collector\'s Edition' : 'Edición de Colección'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-sky-400" />
                      {isEn ? 'Edition Language' : 'Idioma de Edición'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-sky-300 font-bold">
                      {isEn ? 'English Edition' : 'Edición en Español'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => setSelectedLang('es')}
                      className={`p-3 rounded-xl border flex flex-col items-start gap-1 cursor-pointer transition-all ${
                        selectedLang === 'es'
                          ? 'bg-amber-500/10 border-amber-500 text-white shadow-md shadow-amber-500/10'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-amber-300">
                        <span>🇪🇸 Español</span>
                      </div>
                      <span className="text-[11px] text-slate-300">MundoBanderas Editorial</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        {isEn ? 'Complete text in Spanish' : 'Texto íntegro en español'}
                      </span>
                    </button>

                    <button
                      onClick={() => setSelectedLang('en')}
                      className={`p-3 rounded-xl border flex flex-col items-start gap-1 cursor-pointer transition-all ${
                        selectedLang === 'en'
                          ? 'bg-sky-500/10 border-sky-400 text-white shadow-md shadow-sky-500/10'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-sky-300">
                        <span>🇬🇧 English</span>
                      </div>
                      <span className="text-[11px] text-slate-300">WorldFlags Publishing</span>
                      <span className="text-[10px] text-sky-400 font-semibold">
                        {isEn ? 'Comprehensive English translation' : 'Traducción exhaustiva'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Region Filter & Paper Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-sky-400" />
                      {isEn ? 'Country Selection to Compile' : 'Selección de Países a Compilar'}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {filteredCountries.length} {isEn ? 'Countries' : 'Países'} ({filteredCountries.length + Math.max(1, Math.ceil(filteredCountries.length / 40)) + 7} {isEn ? 'Pages' : 'Páginas'})
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    {[
                      { id: 'all', label: isEn ? 'All Countries' : 'Todos los Países' },
                      { id: 'sample10', label: isEn ? 'Sample (10)' : 'Muestra (10 Países)' },
                      { id: 'america', label: isEn ? 'Americas' : 'América' },
                      { id: 'europe', label: isEn ? 'Europe' : 'Europa' },
                      { id: 'asia', label: isEn ? 'Asia' : 'Asia' },
                      { id: 'africa', label: isEn ? 'Africa' : 'África' },
                      { id: 'oceania', label: isEn ? 'Oceania' : 'Oceanía' }
                    ].map((scope) => (
                      <button
                        key={scope.id}
                        onClick={() => setCountrySubset(scope.id as any)}
                        className={`p-2 rounded-xl font-semibold transition-all text-center cursor-pointer border ${
                          countrySubset === scope.id
                            ? 'bg-sky-500 text-white border-sky-400 shadow-sm'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {scope.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-amber-400" />
                    {isEn ? 'Amazon KDP Interior Trim Size' : 'Formato de Interior Amazon KDP'}
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => setSelectedPaper('letter')}
                      className={`p-3 rounded-xl border flex flex-col items-start gap-1 cursor-pointer transition-all ${
                        selectedPaper === 'letter'
                          ? 'bg-amber-500/10 border-amber-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="font-bold text-amber-300">
                        {isHardcover
                          ? (isEn ? '8.25 x 11 in (Hardcover)' : '8.25 x 11 in (Tapa Dura)')
                          : (isEn ? 'Letter (8.5 x 11 in)' : 'Carta / Letter (8.5 x 11 in)')}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {isHardcover ? '20.95 x 27.94 cm' : '21.59 x 27.94 cm'}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        {isEn ? '★ Amazon KDP Standard' : '★ Estándar Amazon KDP'}
                      </span>
                    </button>

                    <button
                      onClick={() => setSelectedPaper('a4')}
                      className={`p-3 rounded-xl border flex flex-col items-start gap-1 cursor-pointer transition-all ${
                        selectedPaper === 'a4'
                          ? 'bg-amber-500/10 border-amber-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="font-bold text-sky-300">{isEn ? 'A4 Standard' : 'Estándar A4'}</span>
                      <span className="text-[11px] text-slate-400">21.0 x 29.7 cm</span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {isEn ? 'Ideal for Amazon UK / Europe' : 'Ideal Amazon España/Europa'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Book Overview Showcase */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    {isHardcover
                      ? (isEn ? 'Hardcover Book Structure (Case Laminate)' : 'Estructura del Libro de Tapa Dura (Case Laminate)')
                      : (isEn ? 'Paperback Book Structure' : 'Estructura del Libro de Tapa Blanda')}
                  </h3>
                  <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
                    {isEn ? 'English Edition • ' : 'Edición en Español • '} {metadata.bookSpecifications.pageCount} {isEn ? 'Pages' : 'Páginas'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 flex-shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-0.5">
                        {isEn ? 'High-Definition SVG Vector Flags' : 'Banderas Vectoriales SVG'}
                      </h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        {isEn
                          ? 'Official state flag of each nation embedded at maximum resolution (300+ DPI) with exact geometric proportions and protective frame.'
                          : 'Pabellón oficial de cada nación incrustado a máxima resolución (300+ DPI) con proporción geométrica exacta y marco protector.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-sky-500/30 flex items-start gap-3 shadow-md shadow-sky-500/5">
                    <div className="p-2 rounded-lg bg-sky-500/20 text-sky-300 flex-shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sky-300 mb-0.5">
                        {isEn ? 'Official English Names & Heraldry' : 'Nombres Oficiales & Soberanía'}
                      </h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        {isEn
                          ? 'Official English country names, native titles, ISO 3166-1 alpha-3 code, national capital, demographics, and heraldic symbolism.'
                          : 'Nombre destacado en español, denominación en inglés, código ISO, capital nacional, población, superficie, moneda e idiomas.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 flex-shrink-0">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-0.5">
                        {isHardcover
                          ? (isEn ? 'Hardcover Binding Specifications' : 'Encuadernación de Tapa Dura')
                          : (isEn ? 'KDP Editorial Structure' : 'Estructura Editorial KDP')}
                      </h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        {isHardcover
                          ? (isEn
                              ? 'Reinforced 22 mm gutter margin for rigid case laminate binding, 15 mm foldover wrap (turn-in), and 10 mm hinge score.'
                              : 'Medianil reforzado de 22 mm para encuadernación rígida, cubierta Case Laminate con 15 mm de forrado y 10 mm de hendidura de bisagra.')
                          : (isEn
                              ? 'Deluxe interior title page, ISBN copyright credits, paginated table of contents, technical appendix, and barcode back cover.'
                              : 'Portada interior de lujo, créditos con ISBN, tabla de contenidos paginada, apéndice técnico y contraportada con código de barras.')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Compilation action button & Progress */}
                <div className="pt-3 border-t border-slate-800 flex flex-col items-center gap-3">
                  {isCompiling ? (
                    <div className="w-full space-y-3 p-4 rounded-2xl bg-slate-900 border border-amber-500/30">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span className="font-bold text-amber-400 animate-pulse flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                          {compileProgress.stage || (isEn ? 'Compiling manuscript...' : 'Compilando manuscrito...')}
                        </span>
                        <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-300">
                          {compileProgress.current} / {compileProgress.total} {isEn ? 'pages' : 'páginas'}
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-200"
                          style={{
                            width: `${(compileProgress.current / Math.max(1, compileProgress.total)) * 100}%`
                          }}
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={handleCancelCompilation}
                          className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
                        >
                          {isEn ? 'Cancel compilation' : 'Cancelar compilación'}
                        </button>
                      </div>
                    </div>
                  ) : compilationDone ? (
                    <div className="w-full p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-white">
                            {isEn ? 'PDF file downloaded successfully!' : '¡Archivo PDF descargado con éxito!'}
                          </p>
                          <p className="text-emerald-400/80">
                            {isEn
                              ? `Manuscript of ${metadata.bookSpecifications.pageCount} pages (${isHardcover ? 'Hardcover' : 'Paperback'}, English) ready for sale on Amazon KDP.`
                              : `Manuscrito de ${metadata.bookSpecifications.pageCount} páginas (${isHardcover ? 'Tapa Dura' : 'Tapa Blanda'}, ${isEn ? 'English' : 'Español'}) listo para venta en Amazon KDP.`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleInstantVectorDownload(true, selectedLang)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold cursor-pointer transition-all shadow"
                        >
                          {isEn ? 'Download Another Copy' : 'Descargar Otra Copia'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full space-y-4">
                      {/* PESTAÑAS DE IDIOMA PARA DESCARGA: ESPAÑOL PRIMERO, LUEGO INGLÉS */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
                            {isEn ? 'Select Language for Downloads:' : 'Selecciona Idioma para Descargas:'}
                          </span>
                          <button
                            onClick={() => setSelectedLang('es')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              selectedLang === 'es'
                                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                            }`}
                          >
                            <span>🇪🇸 Español (MundoBanderas)</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-black/20 font-extrabold">
                              ES
                            </span>
                          </button>

                          <button
                            onClick={() => setSelectedLang('en')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              selectedLang === 'en'
                                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                            }`}
                          >
                            <span>🇬🇧 English (WorldFlags)</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-black/20 font-extrabold">
                              EN
                            </span>
                          </button>
                        </div>

                        <span className="text-[11px] text-slate-400 hidden sm:inline font-mono">
                          {selectedLang === 'es' ? 'Archivos listos para Amazon KDP España / América' : 'Files ready for Amazon KDP US / UK / Worldwide'}
                        </span>
                      </div>

                      {/* CONTENIDO DE PESTAÑA: EDICIÓN EN ESPAÑOL */}
                      {selectedLang === 'es' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                          {/* SECCIÓN 1: ARCHIVOS PARA TAPA BLANDA (PAPERBACK) */}
                          <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                <h4 className="text-sm font-black text-white">
                                  📘 Archivos para TAPA BLANDA (Paperback • 8.5" × 11.0" Carta)
                                </h4>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                Margen KDP Estándar • Lomo {metadata.bookSpecifications.spineWidthMm} mm
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                              {/* 1. Interior con sangría */}
                              <button
                                onClick={() => handleInstantVectorDownload(true, 'es', 'paperback')}
                                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 text-white border border-amber-500/40 hover:border-amber-400 transition-all text-left cursor-pointer flex flex-col justify-between"
                                title="Manuscrito Interior con sangría listo para Amazon KDP. Elige 'Con sangría' en KDP."
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">CON SANGRÍA</span>
                                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                                </div>
                                <div className="font-bold text-xs text-white">Interior Tapa Blanda</div>
                                <div className="text-[10px] text-slate-400 mt-1">8.625" × 11.25" • {metadata.bookSpecifications.pageCount} Págs.</div>
                              </button>

                              {/* 2. Interior sin sangría */}
                              <button
                                onClick={() => handleInstantVectorDownload(false, 'es', 'paperback')}
                                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 text-white border border-slate-700 hover:border-slate-500 transition-all text-left cursor-pointer flex flex-col justify-between"
                                title="Manuscrito Interior sin sangría con márgenes seguros. Elige 'Sin sangría' en KDP."
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">SIN SANGRÍA</span>
                                  <FileText className="w-3.5 h-3.5 text-slate-300" />
                                </div>
                                <div className="font-bold text-xs text-white">Interior Tapa Blanda</div>
                                <div className="text-[10px] text-slate-400 mt-1">8.5" × 11.0" • {metadata.bookSpecifications.pageCount} Págs.</div>
                              </button>

                              {/* 3. Cubierta completa con lomo */}
                              <button
                                onClick={() => handleFullWrapCoverDownload('es', 'paperback')}
                                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 text-white border border-slate-700 hover:border-amber-400 transition-all text-left cursor-pointer flex flex-col justify-between"
                                title="Cubierta completa con portada, lomo exacto y contraportada con código de barras"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">CUBIERTA WRAP</span>
                                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                                </div>
                                <div className="font-bold text-xs text-white">Cubierta con Lomo</div>
                                <div className="text-[10px] text-slate-400 mt-1">Lomo: {metadata.bookSpecifications.spineWidthMm} mm • PDF</div>
                              </button>

                              {/* 4. Paquete 1-Clic ZIP */}
                              <button
                                onClick={() => handleKdpZipBundleDownload('es', 'paperback')}
                                className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 transition-all text-left cursor-pointer flex flex-col justify-between shadow-md shadow-amber-500/20"
                                title="Descargar paquete completo ZIP con interior, cubierta y metadatos en español para Tapa Blanda"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-black/20 text-slate-950 font-mono">1-CLIC ZIP</span>
                                  <Package className="w-4 h-4 text-slate-950" />
                                </div>
                                <div className="font-black text-xs text-slate-950">Paquete Tapa Blanda</div>
                                <div className="text-[10px] text-slate-900 font-semibold mt-1">Todo incluido en 1 archivo ZIP</div>
                              </button>
                            </div>
                          </div>

                          {/* SECCIÓN 2: ARCHIVOS PARA TAPA DURA (HARDCOVER) */}
                          <div className="p-4 rounded-2xl bg-slate-900/90 border border-sky-500/40 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                                <h4 className="text-sm font-black text-white">
                                  📕 Archivos para TAPA DURA (Hardcover • 8.25" × 11.0" Case Laminate)
                                </h4>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30">
                                Medianil reforzado 22 mm • Bisagras 10 mm • Forrado 15 mm
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                              {/* 1. Interior con sangría */}
                              <button
                                onClick={() => handleInstantVectorDownload(true, 'es', 'hardcover')}
                                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 text-white border border-sky-500/40 hover:border-sky-400 transition-all text-left cursor-pointer flex flex-col justify-between"
                                title="Manuscrito Interior de Tapa Dura con sangría (22mm medianil reforzado)."
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono">CON SANGRÍA</span>
                                  <Zap className="w-3.5 h-3.5 text-sky-400" />
                                </div>
                                <div className="font-bold text-xs text-white">Interior Tapa Dura</div>
                                <div className="text-[10px] text-slate-400 mt-1">8.25" × 11.0" • {metadata.bookSpecifications.pageCount} Págs.</div>
                              </button>

                              {/* 2. Interior sin sangría */}
                              <button
                                onClick={() => handleInstantVectorDownload(false, 'es', 'hardcover')}
                                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 text-white border border-slate-700 hover:border-slate-500 transition-all text-left cursor-pointer flex flex-col justify-between"
                                title="Manuscrito Interior de Tapa Dura sin sangría."
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">SIN SANGRÍA</span>
                                  <FileText className="w-3.5 h-3.5 text-slate-300" />
                                </div>
                                <div className="font-bold text-xs text-white">Interior Tapa Dura</div>
                                <div className="text-[10px] text-slate-400 mt-1">8.25" × 11.0" • {metadata.bookSpecifications.pageCount} Págs.</div>
                              </button>

                              {/* 3. Cubierta Case Laminate */}
                              <button
                                onClick={() => handleFullWrapCoverDownload('es', 'hardcover')}
                                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 text-white border border-slate-700 hover:border-sky-400 transition-all text-left cursor-pointer flex flex-col justify-between"
                                title="Cubierta rígida Case Laminate con 15mm de forrado y 10mm de bisagras reglamentarias KDP"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono">CASE LAMINATE</span>
                                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                                </div>
                                <div className="font-bold text-xs text-white">Cubierta Tapa Dura</div>
                                <div className="text-[10px] text-slate-400 mt-1">Rígida con Bisagras • PDF</div>
                              </button>

                              {/* 4. Paquete 1-Clic ZIP Tapa Dura */}
                              <button
                                onClick={() => handleKdpZipBundleDownload('es', 'hardcover')}
                                className="p-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white transition-all text-left cursor-pointer flex flex-col justify-between shadow-md shadow-sky-500/20"
                                title="Descargar paquete completo ZIP para Tapa Dura en español"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-black/20 text-white font-mono">1-CLIC ZIP</span>
                                  <Package className="w-4 h-4 text-white" />
                                </div>
                                <div className="font-black text-xs text-white">Paquete Tapa Dura</div>
                                <div className="text-[10px] text-sky-100 font-semibold mt-1">Todo incluido en 1 archivo ZIP</div>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* CONTENIDO DE PESTAÑA: ENGLISH EDITION */}
                      {selectedLang === 'en' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                          {/* SECCIÓN 1: PAPERBACK FILES (ENGLISH) */}
                          <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                <h4 className="text-sm font-black text-white">
                                  📘 PAPERBACK Files (8.5" × 11.0" Letter Standard • English)
                                </h4>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                Standard KDP Margins • Spine {metadata.bookSpecifications.spineWidthMm} mm
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                              {/* 1. Interior with bleed */}
                              <button
                                onClick={() => handleInstantVectorDownload(true, 'en', 'paperback')}
                                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 text-white border border-amber-500/40 hover:border-amber-400 transition-all text-left cursor-pointer flex flex-col justify-between"
                                title="Interior manuscript with bleed ready for Amazon KDP. Choose 'Bleed' in KDP."
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">WITH BLEED</span>
                                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                                </div>
                                <div className="font-bold text-xs text-white">Paperback Interior</div>
                                <div className="text-[10px] text-slate-400 mt-1">8.625" × 11.25" • {metadata.bookSpecifications.pageCount} Pages</div>
                              </button>

                              {/* 2. Interior without bleed */}
                              <button
                                onClick={() => handleInstantVectorDownload(false, 'en', 'paperback')}
                                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 text-white border border-slate-700 hover:border-slate-500 transition-all text-left cursor-pointer flex flex-col justify-between"
                                title="Interior manuscript without bleed with safe margins. Choose 'No Bleed' in KDP."
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">NO BLEED</span>
                                  <FileText className="w-3.5 h-3.5 text-slate-300" />
                                </div>
                                <div className="font-bold text-xs text-white">Paperback Interior</div>
                                <div className="text-[10px] text-slate-400 mt-1">8.5" × 11.0" • {metadata.bookSpecifications.pageCount} Pages</div>
                              </button>

                              {/* 3. Full wrap cover with spine */}
                              <button
                                onClick={() => handleFullWrapCoverDownload('en', 'paperback')}
                                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 text-white border border-slate-700 hover:border-amber-400 transition-all text-left cursor-pointer flex flex-col justify-between"
                                title="Full wrap cover with front, exact spine and back barcode area"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">WRAP COVER</span>
                                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                                </div>
                                <div className="font-bold text-xs text-white">Full Wrap Cover</div>
                                <div className="text-[10px] text-slate-400 mt-1">Spine: {metadata.bookSpecifications.spineWidthMm} mm • PDF</div>
                              </button>

                              {/* 4. 1-Click ZIP Package */}
                              <button
                                onClick={() => handleKdpZipBundleDownload('en', 'paperback')}
                                className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 transition-all text-left cursor-pointer flex flex-col justify-between shadow-md shadow-amber-500/20"
                                title="Download complete English Paperback package with interiors, cover, and metadata"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-black/20 text-slate-950 font-mono">1-CLICK ZIP</span>
                                  <Package className="w-4 h-4 text-slate-950" />
                                </div>
                                <div className="font-black text-xs text-slate-950">Paperback Package</div>
                                <div className="text-[10px] text-slate-900 font-semibold mt-1">All files in 1 ZIP bundle</div>
                              </button>
                            </div>
                          </div>

                          {/* SECCIÓN 2: HARDCOVER FILES (ENGLISH) */}
                          <div className="p-4 rounded-2xl bg-slate-900/90 border border-sky-500/40 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                                <h4 className="text-sm font-black text-white">
                                  📕 HARDCOVER Files (8.25" × 11.0" Case Laminate • English)
                                </h4>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30">
                                22 mm Reinforced Gutter • 10 mm Hinges • 15 mm Turn-in
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                              {/* 1. Interior with bleed */}
                              <button
                                onClick={() => handleInstantVectorDownload(true, 'en', 'hardcover')}
                                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 text-white border border-sky-500/40 hover:border-sky-400 transition-all text-left cursor-pointer flex flex-col justify-between"
                                title="Hardcover interior manuscript with bleed and reinforced 22mm gutter margin."
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono">WITH BLEED</span>
                                  <Zap className="w-3.5 h-3.5 text-sky-400" />
                                </div>
                                <div className="font-bold text-xs text-white">Hardcover Interior</div>
                                <div className="text-[10px] text-slate-400 mt-1">8.25" × 11.0" • {metadata.bookSpecifications.pageCount} Pages</div>
                              </button>

                              {/* 2. Interior without bleed */}
                              <button
                                onClick={() => handleInstantVectorDownload(false, 'en', 'hardcover')}
                                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 text-white border border-slate-700 hover:border-slate-500 transition-all text-left cursor-pointer flex flex-col justify-between"
                                title="Hardcover interior manuscript without bleed."
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">NO BLEED</span>
                                  <FileText className="w-3.5 h-3.5 text-slate-300" />
                                </div>
                                <div className="font-bold text-xs text-white">Hardcover Interior</div>
                                <div className="text-[10px] text-slate-400 mt-1">8.25" × 11.0" • {metadata.bookSpecifications.pageCount} Pages</div>
                              </button>

                              {/* 3. Case Laminate Cover */}
                              <button
                                onClick={() => handleFullWrapCoverDownload('en', 'hardcover')}
                                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 text-white border border-slate-700 hover:border-sky-400 transition-all text-left cursor-pointer flex flex-col justify-between"
                                title="Case Laminate hardcover rigid wrap with 15mm turn-in and 10mm hinges"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono">CASE LAMINATE</span>
                                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                                </div>
                                <div className="font-bold text-xs text-white">Hardcover Wrap Cover</div>
                                <div className="text-[10px] text-slate-400 mt-1">Rigid with Hinges • PDF</div>
                              </button>

                              {/* 4. 1-Click ZIP Package */}
                              <button
                                onClick={() => handleKdpZipBundleDownload('en', 'hardcover')}
                                className="p-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white transition-all text-left cursor-pointer flex flex-col justify-between shadow-md shadow-sky-500/20"
                                title="Download complete English Hardcover package with interiors, Case Laminate cover, and metadata"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-black/20 text-white font-mono">1-CLICK ZIP</span>
                                  <Package className="w-4 h-4 text-white" />
                                </div>
                                <div className="font-black text-xs text-white">Hardcover Package</div>
                                <div className="text-[10px] text-sky-100 font-semibold mt-1">All files in 1 ZIP bundle</div>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* HERRAMIENTAS ADICIONALES: VISTA PREVIA Y RENDER DOM */}
                      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800 text-xs">
                        <button
                          onClick={() => setIsQuickPreviewOpen(true)}
                          className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-amber-300 hover:text-white font-bold border border-amber-500/40 transition-all cursor-pointer shadow-sm"
                        >
                          <Eye className="w-4 h-4 text-amber-400" />
                          <span>{isEn ? 'Open Interactive Book Live Preview' : 'Abrir Vista Previa Interactiva del Libro'}</span>
                        </button>

                        <button
                          onClick={handleVisualDomDownload}
                          className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {isEn
                              ? 'Download visual progressive DOM rendering copy'
                              : 'Descargar copia con renderizado visual progresivo DOM'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500 text-center">
                    {isEn
                      ? 'The manuscript compiles automatically with embedded high-resolution SVG vector flags, official names in English, sovereignty profiles, comprehensive table of contents, ISBN credits, and barcode colophon ready for Amazon Print on Demand.'
                      : 'El archivo se compila automáticamente con banderas vectoriales SVG incrustadas, nombres oficiales en español e inglés, ficha de soberanía, índice general, ISBN y contraportada apto para impresión bajo demanda (Print on Demand).'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE PREVIEW OF PAGES & SVG MAPS */}
          {activeTab === 'preview' && (
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Header Selector */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                    <Globe className="w-4 h-4 text-sky-400" />
                    {isEn ? 'Sample Country:' : 'País de Muestra:'}
                  </span>
                  <select
                    value={previewCountryId}
                    onChange={(e) => setPreviewCountryId(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-amber-500 cursor-pointer w-full sm:w-64"
                  >
                    {filteredCountries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {isEn ? c.nameEn : c.nameEs} ({c.code3}) — {isEn ? KdpTranslationService.getContinentEn(c.continent) : c.continent}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Page indicator */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 w-full sm:w-auto justify-center">
                  <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-500 text-white shadow-sm">
                    {isEn ? 'Official Sheet: Flag Only' : 'Ficha Oficial: Solo Bandera'}
                  </span>
                </div>
              </div>

              {/* Preview Container Frame */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center overflow-x-auto">
                <div className="text-center mb-3">
                  <span className="text-xs font-bold text-amber-400">
                    {(isEn ? previewCountry.nameEn : previewCountry.nameEs).toUpperCase()} • {isEn ? 'OFFICIAL KDP SHEET (FLAG ONLY)' : 'FICHA OFICIAL KDP (SOLO BANDERA)'}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {isEn ? 'High-resolution official sovereign state flag' : 'Pabellón Nacional Oficial de Estado a alta resolución vectorial'}
                  </p>
                </div>

                <div className="shadow-2xl rounded-lg overflow-hidden border border-slate-700 bg-white" style={{ maxWidth: '794px', width: '100%' }}>
                  <CountryPdfPage1 country={previewCountry} id={`kdp-preview-p1-${previewCountry.id}`} theme="light" lang={selectedLang} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: METADATA & LISTING COPY */}
          {activeTab === 'metadata' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <div className="flex flex-wrap items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 gap-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">
                    {isEn ? 'Metadata for:' : 'Metadatos para:'}{' '}
                    <span className="text-amber-400 uppercase font-mono">
                      {isHardcover ? (isEn ? 'Hardcover' : 'Tapa Dura') : (isEn ? 'Paperback' : 'Tapa Blanda')}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{isEn ? 'Language:' : 'Idioma:'}</span>
                  <button
                    onClick={() => setSelectedLang('es')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${selectedLang === 'es' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-white'}`}
                  >
                    🇪🇸 Español
                  </button>
                  <button
                    onClick={() => setSelectedLang('en')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${selectedLang === 'en' ? 'bg-sky-500 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'}`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-4 h-4" />
                    {isEn ? 'Book Title & Subtitle (Optimized for Amazon Search)' : 'Título y Subtítulo del Libro (Optimizado para Búsquedas en Amazon)'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(metadata.title, 'title')}
                    className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 px-2.5 py-1 rounded-lg cursor-pointer"
                  >
                    {copiedKey === 'title' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'title' ? (isEn ? 'Copied' : 'Copiado') : (isEn ? 'Copy Title' : 'Copiar Título')}</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-white">
                  {metadata.title}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-400 font-semibold">{isEn ? 'Subtitle:' : 'Subtítulo:'}</span>
                  <button
                    onClick={() => copyToClipboard(metadata.subtitle, 'subtitle')}
                    className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 px-2.5 py-1 rounded-lg cursor-pointer"
                  >
                    {copiedKey === 'subtitle' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'subtitle' ? (isEn ? 'Copied' : 'Copiado') : (isEn ? 'Copy Subtitle' : 'Copiar Subtítulo')}</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  {metadata.subtitle}
                </div>
              </div>

              {/* Description & Bullet Points */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    {isEn ? 'Commercial Listing Description (Amazon HTML Ready)' : 'Descripción Comercial para la Ficha de Producto (Amazon HTML Ready)'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(metadata.descriptionHtml, 'desc')}
                    className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 px-2.5 py-1 rounded-lg cursor-pointer"
                  >
                    {copiedKey === 'desc' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'desc' ? (isEn ? 'HTML Copied' : 'HTML Copiado') : (isEn ? 'Copy Full HTML' : 'Copiar HTML Completo')}</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 max-h-48 overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed">
                  {metadata.descriptionHtml}
                </div>
              </div>

              {/* Keywords & Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      {isEn ? '7 KDP Search Keywords' : '7 Palabras Clave KDP (Keywords)'}
                    </span>
                    <button
                      onClick={() => copyToClipboard(metadata.keywords.join(', '), 'kw')}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{isEn ? 'Copy All' : 'Copiar Todas'}</span>
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {metadata.keywords.map((kw, i) => (
                      <div key={i} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                        <span className="text-slate-300">{i + 1}. {kw}</span>
                        <button
                          onClick={() => copyToClipboard(kw, `kw-${i}`)}
                          className="text-[10px] text-slate-500 hover:text-sky-400 font-mono cursor-pointer"
                        >
                          {copiedKey === `kw-${i}` ? '✓' : (isEn ? 'copy' : 'copiar')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                    {isEn ? 'Recommended BISAC Categories' : 'Categorías BISAC Recomendadas'}
                  </span>
                  <div className="space-y-1.5">
                    {metadata.categories.map((cat, i) => (
                      <div key={i} className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                        📁 {cat}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRICING & ROYALTIES */}
          {activeTab === 'pricing' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-xs font-bold text-slate-300">
                  {isEn ? 'Selected Format:' : 'Formato Seleccionado:'}{' '}
                  <span className="text-amber-400 uppercase font-mono">
                    {isHardcover ? (isEn ? 'Hardcover (Case Laminate)' : 'Tapa Dura (Case Laminate)') : (isEn ? 'Paperback' : 'Tapa Blanda (Paperback)')}
                  </span>
                </span>
                <span className="text-xs text-slate-400">
                  {isEn ? 'Premium full-color interior with white paper' : 'Interior a todo color de primera calidad'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
                  <p className="text-xs text-slate-400 font-semibold uppercase">{isEn ? 'Suggested List Price' : 'Precio Sugerido de Venta'}</p>
                  <p className="text-3xl font-black text-amber-400">${metadata.kdpPricing.suggestedListPriceUsd.toFixed(2)} USD</p>
                  <p className="text-[11px] text-slate-500">
                    {isEn ? `Or ${isHardcover ? '€32.99' : '€22.99'} on Amazon Europe` : `O ${isHardcover ? '32,99 €' : '22,99 €'} en Amazon Europa`}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
                  <p className="text-xs text-slate-400 font-semibold uppercase">{isEn ? 'KDP Color Printing Cost' : 'Costo Impresión a Color KDP'}</p>
                  <p className="text-3xl font-black text-slate-300">~${metadata.kdpPricing.printOnDemandCostEstimate.toFixed(2)} USD</p>
                  <p className="text-[11px] text-slate-500">
                    {isHardcover
                      ? (isEn ? 'Case Laminate Hardcover' : 'Tapa Dura Case Laminate')
                      : (isEn ? 'Premium Color Interior (White Paper)' : 'Premium Color Interior (Papel Bond)')}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 bg-emerald-950/20 text-center space-y-1">
                  <p className="text-xs text-emerald-400 font-semibold uppercase">{isEn ? 'Estimated Net Royalty (60-70%)' : 'Ganancia Neta Estimada (60-70%)'}</p>
                  <p className="text-3xl font-black text-emerald-400">+${metadata.kdpPricing.estimatedRoyalty70Percent.toFixed(2)} USD</p>
                  <p className="text-[11px] text-emerald-500/80">{isEn ? 'For each book sold on Amazon' : 'Por cada ejemplar vendido en Amazon'}</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs text-slate-300 leading-relaxed">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  {isEn ? 'Automated Monetization Strategy' : 'Estrategia de Monetización Automática'}
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                  <li>
                    {isEn ? (
                      <>
                        <strong className="text-white">Amazon KDP Print on Demand ({isHardcover ? 'Hardcover' : 'Paperback'}):</strong> Zero upfront inventory or setup costs. Amazon prints, binds, and ships every copy on-demand as orders arrive.
                      </>
                    ) : (
                      <>
                        <strong className="text-white">Amazon KDP Print on Demand ({isHardcover ? 'Tapa Dura' : 'Tapa Blanda'}):</strong> No requiere inventario previo ni inversión inicial. Amazon imprime, encuaderna y despacha cada libro al cliente cuando realiza la compra.
                      </>
                    )}
                  </li>
                  <li>
                    {isEn ? (
                      <>
                        <strong className="text-white">English Edition for Global Markets:</strong> You can publish both language editions simultaneously to maximize royalties in the US, UK, Canada, Australia, Europe, and Latin America.
                      </>
                    ) : (
                      <>
                        <strong className="text-white">Edición en Español e Inglés:</strong> Puedes publicar ambas ediciones simultáneamente para maximizar ventas en EE.UU., Reino Unido, Canadá, Australia, España y Latinoamérica.
                      </>
                    )}
                  </li>
                  <li>
                    {isEn ? (
                      <>
                        <strong className="text-white">KDP Expanded Distribution:</strong> Enables worldwide bookstores, libraries, and universities to order copies through the Ingram wholesale network.
                      </>
                    ) : (
                      <>
                        <strong className="text-white">Distribución Ampliada KDP:</strong> Habilita la casilla en Amazon KDP para que librerías, universidades y bibliotecas públicas de todo el mundo puedan ordenar el atlas directamente del catálogo mayorista de Ingram.
                      </>
                    )}
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: PUBLISHING STEP-BY-STEP GUIDE */}
          {activeTab === 'instructions' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-500/30 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-sky-200 leading-relaxed">
                  <p className="font-bold text-white mb-1">
                    {isEn
                      ? `Amazon KDP Publishing Guide - ${isHardcover ? 'Hardcover Edition' : 'Paperback Edition'}:`
                      : `Publicación Automática en Amazon KDP - ${isHardcover ? 'Edición en Tapa Dura' : 'Edición en Tapa Blanda'}:`}
                  </p>
                  {isEn
                    ? 'Follow these 4 simple steps to upload and publish without any technical complications.'
                    : 'Sigue estos 4 pasos rápidos para publicar y comenzar a recibir ventas globales sin trabas ni complicaciones técnicas.'}
                </div>
              </div>

              <div className="space-y-3 text-xs">
                {(isEn
                  ? [
                      {
                        step: '1',
                        title: 'Log in to Amazon KDP',
                        desc: `Go to kdp.amazon.com and sign in. Click "+ Create" and select "${isHardcover ? 'Hardcover Book' : 'Paperback Book'}".`
                      },
                      {
                        step: '2',
                        title: 'Copy & Paste Metadata',
                        desc: 'Copy the Title, Subtitle, HTML Description, and 7 Keywords generated in Tab 3 of this modal directly into KDP.'
                      },
                      {
                        step: '3',
                        title: 'Upload Manuscript and Cover PDF',
                        desc: `Select "Premium color interior with white paper". Trim size: ${isHardcover ? '8.25 x 11 in' : '8.5 x 11 in'}. Bleed: Bleed. Upload the interior PDF and the ${isHardcover ? 'Case Laminate cover PDF (with 15mm turn-in & 10mm hinges)' : 'wrap cover PDF'}. Launch Previewer and approve.`
                      },
                      {
                        step: '4',
                        title: 'Set Price and Publish',
                        desc: `Set suggested list price ($${metadata.kdpPricing.suggestedListPriceUsd.toFixed(2)} USD), check Expanded Distribution, and click "Publish Your ${isHardcover ? 'Hardcover' : 'Paperback'} Book".`
                      }
                    ]
                  : [
                      {
                        step: '1',
                        title: 'Acceder a tu cuenta de Amazon KDP',
                        desc: `Ingresa a kdp.amazon.com con tu cuenta. Haz clic en "+ Crear" y selecciona "${isHardcover ? 'Libro de tapa dura' : 'Libro de tapa blanda'}".`
                      },
                      {
                        step: '2',
                        title: 'Pegar los Metadatos Copiados',
                        desc: 'Copia el Título, Subtítulo, Descripción HTML y las 7 Palabras Clave generadas en la pestaña "3. Título, Sinopsis & SEO" de este modal.'
                      },
                      {
                        step: '3',
                        title: `Cargar el Manuscrito PDF y la Cubierta (${isHardcover ? 'Tapa Dura Case Laminate' : 'Tapa Blanda KDP'})`,
                        desc: `En "Contenido", selecciona: 1) "Interior a todo color de primera calidad con papel blanco". 2) Tamaño: ${isHardcover ? '8.25 x 11 in (20.95 x 27.94 cm)' : '8.5 x 11 pulgadas'}. 3) Sangría: "Con sangría". 4) Acabado: Brillante o Mate. 5) Sube el Manuscrito Interior (${isHardcover ? 'medianil reforzado 22 mm' : '19 mm'}) y la Cubierta ${isHardcover ? 'Case Laminate oficial (con 15 mm de forrado y 10 mm de bisagra)' : 'completa con lomo'}. Pulsa Iniciar Creador de vistas previas y Aprueba.`
                      },
                      {
                        step: '4',
                        title: 'Fijar Precios y Publicar',
                        desc: `Establece el precio recomendado ($${metadata.kdpPricing.suggestedListPriceUsd.toFixed(2)} USD / ${isHardcover ? '32,99 €' : '22,99 €'}) y marca la distribución ampliada. Haz clic en "Publicar tu libro de ${isHardcover ? 'tapa dura' : 'tapa blanda'}".`
                      }
                    ]
                ).map((item) => (
                  <div key={item.step} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">{item.title}</h4>
                      <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* DYNAMIC STAGING CONTAINER (RENDERIZA SÓLO 1 PAÍS A LA VEZ) */}
        {stagingCountry && (
          <div
            id="kdp-dynamic-staging-container"
            className="fixed -left-[9999px] top-0 opacity-100 pointer-events-none bg-white z-0"
            style={{ width: '794px' }}
          >
            <CountryPdfPage1
              country={stagingCountry}
              id="kdp-active-staging-p1"
              theme="light"
              lang={selectedLang}
            />
          </div>
        )}
      </div>

      {/* QUICK PREVIEW POPUP MODAL */}
      <KdpQuickPreviewModal
        isOpen={isQuickPreviewOpen}
        countries={filteredCountries}
        paperFormat={selectedPaper}
        onClose={() => setIsQuickPreviewOpen(false)}
        onDownloadInstant={() => {
          setIsQuickPreviewOpen(false);
          handleInstantVectorDownload();
        }}
        onDownloadVisual={() => {
          setIsQuickPreviewOpen(false);
          handleVisualDomDownload();
        }}
        lang={selectedLang}
        bookFormat={selectedFormat}
      />
    </div>
  );
};
