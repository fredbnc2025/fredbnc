import React, { useState, useRef, useEffect } from 'react';
import { Country } from '../types';
import { CountryPdfPage1 } from './CountryPdfPage1';
import { CountryPdfPage2 } from './CountryPdfPage2';
import { CountryPdfPage3 } from './CountryPdfPage3';
import { PdfExportService } from '../services/pdfExportService';
import { KdpPdfGeneratorService } from '../services/kdpPdfGeneratorService';
import { SvgExportHelper } from '../utils/svgExportHelper';
import {
  X,
  Download,
  Printer,
  FileText,
  Check,
  Search,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Award,
  ShoppingBag,
  FileCode,
  Copy,
  Sparkles,
  Layers,
  MapPin,
  Compass
} from 'lucide-react';

interface CountryPdfModalProps {
  isOpen: boolean;
  initialCountry: Country | null;
  allCountries: Country[];
  onClose: () => void;
  onOpenAmazonKdpModal?: () => void;
}

export const CountryPdfModal: React.FC<CountryPdfModalProps> = ({
  isOpen,
  initialCountry,
  allCountries,
  onClose,
  onOpenAmazonKdpModal
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(initialCountry);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState<boolean>(false);
  const [paperFormat, setPaperFormat] = useState<'letter' | 'a4'>('letter');
  const [sheetTheme, setSheetTheme] = useState<'light' | 'dark'>('light');
  const [exportFormat, setExportFormat] = useState<'svg' | 'pdf'>('svg');
  const [svgIncludeName, setSvgIncludeName] = useState<boolean>(true);
  const [sheetLang, setSheetLang] = useState<'es' | 'en'>('es');
  const [activeViewPage, setActiveViewPage] = useState<'all' | 'p1' | 'p2' | 'p3'>('all');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [isExportingSvg, setIsExportingSvg] = useState<boolean>(false);
  const [svgSuccess, setSvgSuccess] = useState<boolean>(false);
  const [copiedSvg, setCopiedSvg] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(0.72);

  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const page3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialCountry) {
      setSelectedCountry(initialCountry);
    }
  }, [initialCountry]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !selectedCountry) return null;

  const filteredCountries = allCountries.filter(
    (c) =>
      c.nameEs.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code3.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.capitalEs.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadPdf = async (targetPage: 'all' | 'p1' | 'p2' | 'p3' = activeViewPage) => {
    if (isExporting || !selectedCountry) return;
    setIsExporting(true);

    try {
      if (targetPage === 'p1') {
        // Generar PDF 100% Vectorial para la página 1 con bandera SVG nativa
        await KdpPdfGeneratorService.generateSingleCountryVectorPdf(
          selectedCountry,
          paperFormat,
          sheetTheme,
          sheetLang
        );
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3500);
        return;
      }

      // Si es 'all', 'p2' o 'p3', usar el exportador de elementos en alta resolución
      let elementsToExport: HTMLElement[] = [];
      let suffix = 'completo_3p';

      if (targetPage === 'p2' && page2Ref.current) {
        elementsToExport = [page2Ref.current];
        suffix = 'mapa_svg_territorial';
      } else if (targetPage === 'p3' && page3Ref.current) {
        elementsToExport = [page3Ref.current];
        suffix = 'brujula_geodesia';
      } else {
        // 'all'
        elementsToExport = [page1Ref.current, page2Ref.current, page3Ref.current].filter(Boolean) as HTMLElement[];
        suffix = 'atlas_completo';
      }

      if (elementsToExport.length === 0 && page1Ref.current) {
        elementsToExport = [page1Ref.current];
      }

      const filename = PdfExportService.getCountryPdfFilename(
        selectedCountry,
        `${paperFormat === 'letter' ? 'carta_bond' : 'a4'}_${suffix}_${sheetLang}`
      );

      await PdfExportService.exportMultipleElementsToPdf(elementsToExport, filename, {
        paperSize: paperFormat,
        orientation: 'portrait',
        qualityScale: 2.5
      });

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3500);
    } catch (err) {
      console.error('Error exportando PDF:', err);
      // Respaldo de contingencia
      try {
        await KdpPdfGeneratorService.generateSingleCountryVectorPdf(
          selectedCountry,
          paperFormat,
          sheetTheme,
          sheetLang
        );
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3500);
      } catch (backupErr) {
        console.error('Error en respaldo vectorial:', backupErr);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSvg = async (includeName: boolean = svgIncludeName) => {
    if (isExportingSvg || !selectedCountry) return;
    setIsExportingSvg(true);

    try {
      await SvgExportHelper.downloadCountrySvg(selectedCountry, {
        includeName,
        theme: sheetTheme
      });
      setSvgSuccess(true);
      setTimeout(() => setSvgSuccess(false), 3000);
    } catch (err) {
      console.error('Error exportando SVG:', err);
    } finally {
      setIsExportingSvg(false);
    }
  };

  const handleCopySvgForIllustrator = async () => {
    if (!selectedCountry) return;
    const success = await SvgExportHelper.copyFlagSvgToClipboard(selectedCountry, {
      includeName: false
    });
    if (success) {
      setCopiedSvg(true);
      setTimeout(() => setCopiedSvg(false), 3500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="country-pdf-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        id="country-pdf-modal-card"
        className="relative w-full max-w-7xl h-[95vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP CONTROL BAR */}
        <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/95 gap-3 z-30">
          {/* Left: Title & Header info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Ficha Oficial de la Bandera • {selectedCountry.nameEs}
                </h2>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Curvas SVG para Illustrator</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pabellón oficial en vector SVG con el nombre del país • Banderas en formato vectorial nativo sin pixelación listas para copiar/pegar en Adobe Illustrator
              </p>
            </div>
          </div>

          {/* Center: Country Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-semibold border border-slate-750 shadow-inner cursor-pointer"
            >
              <img
                src={`https://flagcdn.com/${selectedCountry.id}.svg`}
                alt={selectedCountry.nameEs}
                className="w-4 h-3 object-cover rounded-sm border border-white/20"
              />
              <span className="max-w-[140px] truncate">{selectedCountry.nameEs}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isCountryDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 max-h-80 bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl p-2 z-50 flex flex-col space-y-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar país, capital, código..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    autoFocus
                  />
                </div>

                <div className="overflow-y-auto max-h-60 space-y-0.5 pr-1">
                  {filteredCountries.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCountry(c);
                        setIsCountryDropdownOpen(false);
                        setSearchTerm('');
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                        selectedCountry.id === c.id
                          ? 'bg-sky-500 text-white font-bold'
                          : 'text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={`https://flagcdn.com/${c.id}.svg`}
                          alt={c.nameEs}
                          className="w-5 h-3.5 object-cover rounded-sm border border-white/20"
                        />
                        <span className="truncate max-w-[160px]">{c.nameEs}</span>
                      </div>
                      <span className="text-[10px] opacity-70 font-mono">{c.code3}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Format Selector, Options, Theme, Paper Format, Print & Export */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Format Selector (SVG vs PDF) */}
            <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-xl text-xs shadow-inner">
              <button
                onClick={() => setExportFormat('svg')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  exportFormat === 'svg'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Formato de archivo vectorial SVG descargable"
              >
                <span>SVG</span>
                <span className="text-[10px] bg-emerald-800 text-emerald-200 px-1 py-0.2 rounded font-mono">Vector</span>
              </button>
              <button
                onClick={() => setExportFormat('pdf')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  exportFormat === 'pdf'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Formato de documento PDF para impresión"
              >
                <span>PDF</span>
                <span className="text-[10px] bg-sky-800 text-sky-200 px-1 py-0.2 rounded font-mono">Doc</span>
              </button>
            </div>

            {/* SVG Content Toggle (With Name / Flag only) */}
            {exportFormat === 'svg' && (
              <div className="hidden sm:flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-xl text-xs">
                <button
                  onClick={() => setSvgIncludeName(true)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    svgIncludeName ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Descargar SVG con el nombre oficial del país"
                >
                  Con Nombre
                </button>
                <button
                  onClick={() => setSvgIncludeName(false)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    !svgIncludeName ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Descargar SVG con solo la bandera pura"
                >
                  Solo Bandera
                </button>
              </div>
            )}

            {/* Amazon KDP Compilador Rápido */}
            {onOpenAmazonKdpModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAmazonKdpModal();
                }}
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm"
                title="Compilar libro completo de todos los países en 1 solo PDF para Amazon KDP"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                <span>Compilar para Amazon KDP</span>
              </button>
            )}

            {/* Language Selector: ES / EN */}
            <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-xl text-xs">
              <button
                onClick={() => setSheetLang('es')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  sheetLang === 'es' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Ver y exportar ficha en Español"
              >
                ES
              </button>
              <button
                onClick={() => setSheetLang('en')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  sheetLang === 'en' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="View and export sheet in English"
              >
                EN
              </button>
            </div>

            {/* Theme Toggle (Light / Dark) */}
            <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-xl text-xs">
              <button
                onClick={() => setSheetTheme('light')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  sheetTheme === 'light' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Fondo Blanco Editorial (Ahorro de Tinta para Impresión)"
              >
                Claro
              </button>
              <button
                onClick={() => setSheetTheme('dark')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  sheetTheme === 'dark' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Modo Noche HD"
              >
                Noche
              </button>
            </div>

            {/* Paper Size (Letter vs A4) */}
            <div className="hidden sm:flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-xl text-xs">
              <button
                onClick={() => setPaperFormat('letter')}
                className={`px-2 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  paperFormat === 'letter' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Tamaño Papel Bond / Carta (Letter 8.5 x 11 in)"
              >
                Carta (Bond)
              </button>
              <button
                onClick={() => setPaperFormat('a4')}
                className={`px-2 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  paperFormat === 'a4' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Tamaño Estándar Internacional A4 (210 x 297 mm)"
              >
                A4
              </button>
            </div>

            {/* Zoom controls */}
            <div className="hidden md:flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl gap-1">
              <button
                onClick={() => setZoomScale((prev) => Math.max(0.4, prev - 0.1))}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                title="Alejar vista"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-300 px-1">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={() => setZoomScale((prev) => Math.min(1.4, prev + 0.1))}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                title="Acercar vista"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
              title="Imprimir páginas directamente desde el navegador"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Imprimir</span>
            </button>

            {/* Copy SVG for Illustrator Button */}
            <button
              onClick={handleCopySvgForIllustrator}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-md ${
                copiedSvg
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
                  : 'bg-slate-800 hover:bg-slate-750 text-emerald-300 hover:text-white border-emerald-500/40 hover:border-emerald-400'
              }`}
              title="Copiar código SVG vectorial al portapapeles. Pégalo directamente en Adobe Illustrator con Ctrl+V / Cmd+V"
            >
              {copiedSvg ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-200" />
                  <span>¡SVG Copiado! (Pega con Ctrl+V)</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copiar SVG (Illustrator)</span>
                </>
              )}
            </button>

            {/* Primary Action Button (Downloads SVG or PDF depending on format) */}
            {exportFormat === 'svg' ? (
              <button
                onClick={() => handleDownloadSvg(svgIncludeName)}
                disabled={isExportingSvg}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
                  svgSuccess
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/25'
                } disabled:opacity-50`}
                title="Descargar archivo SVG vectorial listo para abrir en Illustrator"
              >
                {isExportingSvg ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generando SVG...</span>
                  </>
                ) : svgSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>¡SVG Guardado!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Descargar Archivo SVG</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleDownloadPdf}
                disabled={isExporting}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
                  exportSuccess
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/25'
                } disabled:opacity-50`}
                title="Descargar Ficha en formato PDF Vectorial con Bandera en curvas SVG puras para Illustrator"
              >
                {isExporting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Compilando PDF Vectorial...</span>
                  </>
                ) : exportSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>¡PDF Vectorial Guardado!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>
                      {activeViewPage === 'all'
                        ? (sheetLang === 'en' ? 'Download Full PDF (3 Pages)' : 'Descargar PDF Completo (3 Págs)')
                        : activeViewPage === 'p2'
                        ? (sheetLang === 'en' ? 'Download SVG Map (Page 2)' : 'Descargar Mapa SVG (Pág 2)')
                        : activeViewPage === 'p3'
                        ? (sheetLang === 'en' ? 'Download History & 10 Facts (Page 3)' : 'Descargar Historia & 10 Curiosidades (Pág 3)')
                        : (sheetLang === 'en' ? 'Download Flag Sheet (PDF)' : 'Descargar Ficha Bandera (PDF)')}
                    </span>
                  </>
                )}
              </button>
            )}

            {/* Quick alternative download button */}
            {exportFormat === 'svg' ? (
              <button
                onClick={() => handleDownloadPdf(activeViewPage)}
                disabled={isExporting}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-sky-300 hover:text-sky-200 border border-sky-500/30 text-xs font-semibold transition-all cursor-pointer"
                title="Descargar también en formato PDF Vectorial con Bandera en curvas SVG para Illustrator"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>PDF (SVG)</span>
              </button>
            ) : (
              <button
                onClick={() => handleDownloadSvg(svgIncludeName)}
                disabled={isExportingSvg}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer"
                title="Descargar también en archivo directo vectorial SVG"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>SVG</span>
              </button>
            )}

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Banner Ilustrator SVG Vectorial */}
        <div className="bg-emerald-950/40 border-b border-emerald-500/20 px-5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-300 z-20">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>100% Vectorial para Adobe Illustrator:</strong> La bandera en el PDF se incrusta en curvas y trazos SVG puros sin rasterizar. Al abrir el archivo en Illustrator puedes seleccionar, desagrupar y copiar/pegar los trazos vectoriales directamente.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 hidden md:inline">¿Quieres pegar directo en tu proyecto?</span>
            <button
              onClick={handleCopySvgForIllustrator}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 font-semibold cursor-pointer transition-all"
              title="Copiar código SVG para pegar directo con Ctrl+V en Adobe Illustrator"
            >
              {copiedSvg ? (
                <>
                  <Check className="w-3 h-3 text-emerald-300" />
                  <span>¡Copiado! Pega con Ctrl+V</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-emerald-400" />
                  <span>Copiar SVG para Illustrator</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* SUBHEADER: PAGE NAVIGATION TABS */}
        <div className="bg-slate-900 border-b border-slate-800 px-5 py-2 flex flex-wrap items-center justify-between gap-2 z-20">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Páginas de la Ficha:
            </span>
            <button
              onClick={() => setActiveViewPage('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeViewPage === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Todas (3 Páginas)</span>
            </button>
            <button
              onClick={() => setActiveViewPage('p1')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeViewPage === 'p1'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pág 1: Bandera SVG</span>
            </button>
            <button
              onClick={() => setActiveViewPage('p2')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeViewPage === 'p2'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>Pág 2: Mapa Territorial SVG</span>
            </button>
            <button
              onClick={() => setActiveViewPage('p3')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeViewPage === 'p3'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>{sheetLang === 'en' ? 'Page 3: History & 10 Facts' : 'Pág 3: Historia & 10 Curiosidades'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadPdf('all')}
              disabled={isExporting}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1 rounded-lg border border-amber-500/30 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar 3 Págs en 1 PDF</span>
            </button>
          </div>
        </div>

        {/* MODAL SHEET PREVIEW CANVAS AREA */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-950/80 flex items-start justify-center">
          <div
            style={{
              transform: `scale(${zoomScale})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out'
            }}
            className="flex flex-col gap-10 print:gap-0 pb-16"
          >
            {/* PÁGINA 1: FICHA OFICIAL - BANDERA CON NOMBRE */}
            {(activeViewPage === 'all' || activeViewPage === 'p1') && (
              <div className="shadow-2xl rounded-2xl overflow-hidden transition-all">
                <div className="mb-2 text-center text-xs font-bold text-emerald-400 print:hidden flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Página 1: Ficha Oficial de la Bandera Nacional (Gráfico Vectorial SVG)</span>
                </div>
                <div ref={page1Ref} className="print:m-0">
                  <CountryPdfPage1
                    country={selectedCountry}
                    theme={sheetTheme}
                    lang={sheetLang}
                  />
                </div>
              </div>
            )}

            {/* PÁGINA 2: MAPA CARTOGRÁFICO TERRITORIAL SVG EN PÁGINA APARTE */}
            {(activeViewPage === 'all' || activeViewPage === 'p2') && (
              <div className="shadow-2xl rounded-2xl overflow-hidden transition-all">
                <div className="mb-2 text-center text-xs font-bold text-sky-400 print:hidden flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span>Página 2: Mapa Territorial SVG con Divisiones Administrativas Oficiales</span>
                </div>
                <div ref={page2Ref} className="print:m-0">
                  <CountryPdfPage2
                    country={selectedCountry}
                    theme={sheetTheme}
                    lang={sheetLang}
                  />
                </div>
              </div>
            )}

            {/* PÁGINA 3: BRÚJULA NÁUTICA, COORDENADAS WGS84 Y ORGANIZACIÓN */}
            {(activeViewPage === 'all' || activeViewPage === 'p3') && (
              <div className="shadow-2xl rounded-2xl overflow-hidden transition-all">
                <div className="mb-2 text-center text-xs font-bold text-indigo-400 print:hidden flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span>{sheetLang === 'en' ? 'Page 3: Historical Chronicle, 10 Curious Facts & Nautical Compass' : 'Página 3: Crónica Histórica, 10 Datos Curiosos & Brújula Náutica Oficial'}</span>
                </div>
                <div ref={page3Ref} className="print:m-0">
                  <CountryPdfPage3
                    country={selectedCountry}
                    theme={sheetTheme}
                    lang={sheetLang}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODAL BOTTOM STATUS BAR */}
        <div className="px-6 py-2.5 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Ficha oficial con nombre generada para <strong>{selectedCountry.nameEs}</strong> ({selectedCountry.code3})
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <FileCode className="w-3.5 h-3.5" /> Archivo Vectorial SVG Escalable
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <Award className="w-3.5 h-3.5" /> Pabellón Nacional Oficial
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
