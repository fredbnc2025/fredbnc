import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Country } from '../types';
import { CountryPdfPage1 } from './CountryPdfPage1';
import { CountryPdfPage2 } from './CountryPdfPage2';
import { CountryPdfPage3 } from './CountryPdfPage3';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Zap,
  ZoomIn,
  ZoomOut,
  Maximize2,
  BookOpen,
  Layers,
  Globe,
  Compass,
  Award,
  Sparkles,
  Printer,
  Eye,
  CheckCircle2,
  Grid
} from 'lucide-react';

interface KdpQuickPreviewModalProps {
  isOpen: boolean;
  countries: Country[];
  paperFormat: 'letter' | 'a4';
  onClose: () => void;
  onDownloadInstant: () => void;
  onDownloadVisual: () => void;
  lang?: 'es' | 'en';
  bookFormat?: 'paperback' | 'hardcover';
}

export const KdpQuickPreviewModal: React.FC<KdpQuickPreviewModalProps> = ({
  isOpen,
  countries,
  paperFormat,
  onClose,
  onDownloadInstant,
  onDownloadVisual,
  lang = 'es',
  bookFormat = 'paperback'
}) => {
  const isEn = lang === 'en';
  const isHardcover = bookFormat === 'hardcover';
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'single' | 'spread'>('single');
  const [zoomScale, setZoomScale] = useState<number>(0.55);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-fit zoom on mount / resize
  useEffect(() => {
    const updateZoom = () => {
      if (window.innerWidth < 640) {
        setZoomScale(0.38);
        setViewMode('single');
      } else if (window.innerWidth < 1024) {
        setZoomScale(0.48);
      } else if (window.innerWidth < 1440) {
        setZoomScale(viewMode === 'spread' ? 0.45 : 0.62);
      } else {
        setZoomScale(viewMode === 'spread' ? 0.52 : 0.75);
      }
    };

    updateZoom();
    window.addEventListener('resize', updateZoom);
    return () => window.removeEventListener('resize', updateZoom);
  }, [viewMode]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        goToNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goToPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentPageIndex, viewMode, countries.length]);

  // Page structure definition
  // Page 0: Cover (Portada)
  // Page 1: Table of contents (Índice)
  // Country pages: for country i (0..N-1)
  //   - Page (2 + i*3 + 0): Country i Page 1 (Bandera & Vexilología)
  //   - Page (2 + i*3 + 1): Country i Page 2 (Gran Mapa SVG)
  //   - Page (2 + i*3 + 2): Country i Page 3 (Brújula & Geodesia)
  // Page (2 + N*3): Back Cover / Apéndice
  const totalPages = useMemo(() => countries.length + 3, [countries.length]);

  const getPageInfo = (pageIdx: number) => {
    if (pageIdx === 0) {
      return {
        type: 'cover',
        title: isEn ? 'Official Cover' : 'Portada Oficial',
        subtitle: isEn ? 'Amazon KDP Commercial Edition' : 'Edición Comercial Amazon KDP',
        country: null,
        pageNumber: 1
      };
    }
    if (pageIdx === 1) {
      return {
        type: 'toc',
        title: isEn ? 'Table of Contents & Guide' : 'Índice de Contenido & Guía',
        subtitle: isEn
          ? `Flag Catalog of ${countries.length} Sovereign Nations`
          : `Catálogo de Banderas de ${countries.length} Naciones Soberanas`,
        country: null,
        pageNumber: 2
      };
    }
    if (pageIdx === totalPages - 1) {
      return {
        type: 'backcover',
        title: isEn ? 'Vexillological Appendix & Back Cover' : 'Apéndice Vexilológico & Contraportada',
        subtitle: isEn ? 'Editorial Specifications & Credits' : 'Especificaciones Editoriales & Créditos',
        country: null,
        pageNumber: totalPages
      };
    }

    const countryInternalIdx = pageIdx - 2;
    const targetCountry = countries[countryInternalIdx] || countries[0];
    const cDisplayName = isEn ? (targetCountry.nameEn || targetCountry.nameEs) : targetCountry.nameEs;

    return {
      type: 'country-flag',
      title: `${cDisplayName} (${targetCountry.code3})`,
      subtitle: isEn ? 'Official National Flag' : 'Pabellón Nacional Oficial',
      country: targetCountry,
      countryPageNum: 1,
      countryIndex: countryInternalIdx,
      pageNumber: pageIdx + 1
    };
  };

  const goToNext = () => {
    const step = viewMode === 'spread' ? 2 : 1;
    setCurrentPageIndex((prev) => Math.min(totalPages - 1, prev + step));
  };

  const goToPrev = () => {
    const step = viewMode === 'spread' ? 2 : 1;
    setCurrentPageIndex((prev) => Math.max(0, prev - step));
  };

  const jumpToCountry = (countryId: string) => {
    const cIdx = countries.findIndex((c) => c.id === countryId);
    if (cIdx !== -1) {
      setCurrentPageIndex(2 + cIdx);
    }
  };

  if (!isOpen) return null;

  const leftPageInfo = getPageInfo(currentPageIndex);
  const rightPageInfo =
    viewMode === 'spread' && currentPageIndex + 1 < totalPages
      ? getPageInfo(currentPageIndex + 1)
      : null;

  // Render a specific page by index
  const renderSinglePage = (pageIdx: number) => {
    if (pageIdx < 0 || pageIdx >= totalPages) return null;
    const info = getPageInfo(pageIdx);

    if (info.type === 'cover') {
      return (
        <div
          id="kdp-preview-cover"
          className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white select-none overflow-hidden flex flex-col justify-between"
          style={{
            width: '794px',
            height: '1123px',
            padding: '48px 56px',
            boxSizing: 'border-box'
          }}
        >
          {/* Gold Filigree Border */}
          <div className="absolute inset-4 border-2 border-amber-500/40 pointer-events-none rounded-2xl" />
          <div className="absolute inset-6 border border-amber-500/20 pointer-events-none rounded-xl" />

          {/* Top Editorial Ribbon */}
          <div className="text-center relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {isEn
                ? (isHardcover ? 'Official Collector\'s Edition • Amazon KDP Hardcover' : 'Official Collector\'s Edition • Amazon KDP Print on Demand')
                : (isHardcover ? 'Edición Oficial Coleccionista • Amazon KDP Tapa Dura' : 'Edición Oficial de Colección • Amazon KDP Print on Demand')}
            </div>
            <p className="text-xs text-slate-400 font-mono tracking-wider">
              {isEn
                ? `${isHardcover ? 'HARDCOVER CASE LAMINATE (8.25 x 11 in)' : 'LETTER FORMAT (8.5 x 11 in)'} • HIGH DEFINITION BOND PAPER`
                : `FORMATO ${paperFormat.toUpperCase()} (${paperFormat === 'letter' ? '8.5 x 11 in' : '21 x 29.7 cm'}) • PAPEL BOND ALTA DEFINICIÓN`}
            </p>
          </div>

          {/* Center Graphic & Title */}
          <div className="relative z-10 text-center my-auto space-y-6">
            <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 p-1 shadow-2xl shadow-amber-500/30 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                <Compass className="w-16 h-16 text-amber-400 animate-spin-slow" />
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 tracking-tight leading-tight">
                {isEn ? 'WORLD FLAG ATLAS & SOVEREIGN NATIONS' : 'ATLAS GEOPOLÍTICO & CARTOGRÁFICO MUNDIAL'}
              </h1>
              <p className="text-lg font-bold text-sky-300 tracking-wide">
                {isEn ? 'ILLUSTRATED ENCYCLOPEDIA OF FLAGS, SVG VECTORS & HERALDRY' : 'ENCICLOPEDIA ILUSTRADA DE BANDERAS, MAPAS SVG & GEODESIA WGS84'}
              </p>
              <div className="w-32 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto" />
              <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                {isEn
                  ? `Comprehensive encyclopedic compendium of ${countries.length} sovereign nations. Full official page per nation: National Flag and Vexillology, Demographics, and Heraldic Symbolism.`
                  : `Compendio enciclopédico de ${countries.length} países soberanos. Cada nación estructurada con su Pabellón Nacional, Vexilología, Demografía y Simbolismo Heráldico.`}
              </p>
            </div>

            {/* Country flags sample strip */}
            <div className="flex justify-center items-center gap-2 pt-2">
              {countries.slice(0, 8).map((c) => (
                <div key={c.id} className="w-12 h-8 rounded border border-slate-700 overflow-hidden shadow-md bg-slate-900">
                  <img
                    src={`https://flagcdn.com/${c.id}.svg`}
                    alt={isEn ? c.nameEn : c.nameEs}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Footer of Cover */}
          <div className="relative z-10 pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              <p className="font-bold text-white text-sm">
                {isEn ? 'WorldFlags Publishing' : 'MundoBanderas Editorial'}
              </p>
              <p className="text-[11px] text-slate-500">
                {isEn ? 'Official Vector Flags & Sovereign Heraldry' : 'Cartografía Vectorial Oficial & Simbolismo Soberano'}
              </p>
            </div>
            <div className="text-right">
              <div className="font-mono text-amber-400 font-bold">
                {countries.length + 2} {isEn ? 'TOTAL PAGES' : 'PÁGINAS TOTALES'}
              </div>
              <div className="text-[10px] text-slate-500">
                {isEn ? 'ISBN / ASIN KDP • Premium Color Interior' : 'ISBN / ASIN KDP • Interior Color Premium'}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (info.type === 'toc') {
      return (
        <div
          id="kdp-preview-toc"
          className="relative bg-white text-slate-900 select-none overflow-hidden flex flex-col justify-between"
          style={{
            width: '794px',
            height: '1123px',
            padding: '36px 44px',
            boxSizing: 'border-box'
          }}
        >
          {/* Border */}
          <div className="absolute inset-3 border-2 border-sky-600/30 pointer-events-none rounded-xl" />

          <div>
            {/* Header */}
            <div className="border-b-2 border-sky-600 pb-3 mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {isEn ? 'WORLD FLAG ATLAS • TABLE OF CONTENTS' : 'ÍNDICE GENERAL DE BANDERAS'}
                </h2>
                <p className="text-xs text-sky-700 font-semibold">
                  {isEn ? 'Monographic flag catalog of cataloged sovereign nations' : 'Catálogo monográfico de banderas de cada nación soberana'}
                </p>
              </div>
              <span className="text-xs font-mono bg-sky-100 text-sky-800 px-3 py-1 rounded-full font-bold">
                {countries.length} {isEn ? 'Countries' : 'Países'}
              </span>
            </div>

            {/* Structure guide banner */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs text-center text-slate-700">
              <span className="font-bold text-sky-700">
                {isEn ? 'Official Flag Sheets:' : 'Fichas Oficiales de Banderas:'}
              </span>{' '}
              {isEn
                ? 'Each page presents the official national state flag at maximum scale and high-definition vector.'
                : 'Cada página presenta el pabellón oficial de estado a máxima escala e hiper-definición vectorial.'}
            </div>

            {/* Country list columns */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
              {countries.slice(0, 30).map((c, i) => {
                const pageNum = 3 + i;
                const cName = isEn ? (c.nameEn || c.nameEs) : c.nameEs;
                return (
                  <div key={c.id} className="flex items-center justify-between py-1 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400 w-5">{i + 1}.</span>
                      <span className="font-semibold text-slate-800">{cName}</span>
                      <span className="text-[10px] text-slate-400">({c.code3})</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-sky-700">
                      {isEn ? `p. ${pageNum}` : `Pág. ${pageNum}`}
                    </span>
                  </div>
                );
              })}
            </div>
            {countries.length > 30 && (
              <p className="text-[11px] text-slate-400 text-center italic mt-3">
                {isEn
                  ? `... and ${countries.length - 30} additional sovereign nations cataloged in the full volume.`
                  : `... y ${countries.length - 30} países adicionales detallados en el cuerpo completo del volumen.`}
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-between text-[11px] text-slate-500 font-mono">
            <span>{isEn ? 'WORLD FLAG ATLAS & SOVEREIGN NATIONS' : 'ATLAS MUNDIAL DE BANDERAS Y MAPAS'}</span>
            <span>{isEn ? 'PAGE 2' : 'PÁGINA 2'}</span>
          </div>
        </div>
      );
    }

    if (info.type === 'backcover') {
      return (
        <div
          id="kdp-preview-backcover"
          className="relative bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white select-none overflow-hidden flex flex-col justify-between"
          style={{
            width: '794px',
            height: '1123px',
            padding: '48px 56px',
            boxSizing: 'border-box'
          }}
        >
          <div className="absolute inset-4 border-2 border-slate-700/60 pointer-events-none rounded-2xl" />

          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-2xl font-black text-amber-400 tracking-tight">
                {isEn ? 'APPENDIX & TECHNICAL SPECIFICATIONS' : 'APÉNDICE & ESPECIFICACIONES TÉCNICAS'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isEn
                  ? 'Guaranteed cartographic and vexillological precision certified for Amazon KDP print-on-demand'
                  : 'Garantía de calidad cartográfica y precisión vexilológica para imprenta Amazon KDP'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h3 className="font-bold text-sky-300 text-sm">
                  {isEn ? 'High-Definition SVG Vectors' : 'Cartografía Vectorial D3'}
                </h3>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  {isEn
                    ? 'All flags included in this volume are rendered using lossless vector geometry, incorporating official national proportions and state color palettes.'
                    : 'Todos los mapas incluidos en este volumen han sido renderizados mediante algoritmos de proyección geodésica WGS84, incorporando límites fronterizos oficiales y demarcación de subdivisiones territoriales de primer orden.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h3 className="font-bold text-amber-300 text-sm">
                  {isEn ? 'Vexillology & Heraldry' : 'Vexilología & Heráldica'}
                </h3>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  {isEn
                    ? 'State standards in SVG vector format with constitutional geometric proportions (1:2, 2:3, 3:5), normalized HEX palettes, and historic symbolism reviews.'
                    : 'Pabellones vectoriales en formato SVG con proporción geométrica oficial (1:2, 2:3, 3:5), paleta de colores normalizada con códigos HEX exactos y reseñas históricas del significado cívico.'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <h3 className="font-bold text-white">
                {isEn ? 'Compendium Statistical Summary:' : 'Resumen Estadístico del Compendio:'}
              </h3>
              <div className="grid grid-cols-4 gap-2 text-center pt-2">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="text-lg font-black text-amber-400">{countries.length}</div>
                  <div className="text-[10px] text-slate-400 uppercase">{isEn ? 'Countries' : 'Países'}</div>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="text-lg font-black text-sky-400">{countries.length}</div>
                  <div className="text-[10px] text-slate-400 uppercase">{isEn ? 'SVG Flags' : 'Mapas SVG'}</div>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="text-lg font-black text-emerald-400">5</div>
                  <div className="text-[10px] text-slate-400 uppercase">{isEn ? 'Continents' : 'Continentes'}</div>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="text-lg font-black text-purple-400">{totalPages}</div>
                  <div className="text-[10px] text-slate-400 uppercase">{isEn ? 'Pages' : 'Páginas'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex items-center justify-between text-xs text-slate-500">
            <div>
              <p className="font-bold text-slate-300">
                {isEn ? 'Published compliant with Amazon Kindle Direct Publishing Standards' : 'Publicado bajo estándares de Amazon Kindle Direct Publishing'}
              </p>
              <p className="text-[10px]">
                {isEn ? `${isHardcover ? 'Hardcover Case Laminate' : 'Paperback'} • Premium Color Interior with White Paper` : 'Tapa blanda / Tapa dura • Papel Bond Blanco Color Premium'}
              </p>
            </div>
            <div className="w-24 h-12 bg-white rounded p-1 flex items-center justify-center">
              <div className="font-mono text-[8px] text-black text-center font-bold">
                |||| ||| ||||||| |<br />
                ISBN KDP READY
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (info.country) {
      return (
        <CountryPdfPage1
          country={info.country}
          id={`kdp-pop-p1-${info.country.id}`}
          theme="light"
          lang={lang}
        />
      );
    }

    return null;
  };

  return (
    <div
      id="kdp-quick-preview-popup"
      className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-[98vw] h-[96vh] bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER CONTROLS */}
        <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/95 gap-3">
          {/* Title & Page details */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-md">
              <Eye className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                  {isEn ? 'KDP Book Live Preview' : 'Vista Previa del Libro KDP'}
                </h2>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full uppercase">
                  {paperFormat === 'letter' ? (isEn ? 'Letter (8.5x11")' : 'Carta / Letter') : 'A4'} • {totalPages} {isEn ? 'Pages' : 'Págs'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                {leftPageInfo.title} — {leftPageInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Quick Country Selector Dropdown */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <select
                value={leftPageInfo.country?.id || ''}
                onChange={(e) => jumpToCountry(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="" disabled>{isEn ? 'Go to country...' : 'Ir a país...'}</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {isEn ? (c.nameEn || c.nameEs) : c.nameEs} ({c.code3})
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
              <button
                onClick={() => setViewMode('single')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === 'single'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={isEn ? 'Single Page View' : 'Ver 1 Página'}
              >
                {isEn ? '1 Page' : '1 Pág'}
              </button>
              <button
                onClick={() => setViewMode('spread')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === 'spread'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={isEn ? 'Two-Page Spread View' : 'Ver Pliego Doble (2 Páginas)'}
              >
                {isEn ? 'Two-Page Spread' : 'Doble Pliego'}
              </button>
            </div>

            {/* Zoom controls */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
              <button
                onClick={() => setZoomScale((z) => Math.max(0.3, z - 0.08))}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                title={isEn ? 'Zoom Out' : 'Reducir Zoom'}
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 font-mono text-[10px] text-slate-300">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={() => setZoomScale((z) => Math.min(1.0, z + 0.08))}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                title={isEn ? 'Zoom In' : 'Aumentar Zoom'}
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action Buttons: Direct Download from Preview */}
            <button
              onClick={onDownloadInstant}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer transition-all"
              title={isEn ? 'Download Full PDF Manuscript' : 'Descargar PDF Completo Inmediatamente'}
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span className="hidden sm:inline">{isEn ? 'Download PDF' : 'Descargar PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              aria-label={isEn ? 'Close Preview' : 'Cerrar Vista Previa'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MAIN VIEWER AREA */}
        <div className="flex-1 flex overflow-hidden bg-slate-950">
          {/* FILMSTRIP THUMBNAILS (OPTIONAL COLLAPSIBLE DRAWER) */}
          {showThumbnails && (
            <div className="hidden lg:flex w-48 border-r border-slate-800 bg-slate-900/60 flex-col overflow-y-auto p-2 gap-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                <span>{isEn ? 'Pages' : 'Páginas'} ({totalPages})</span>
                <span className="text-amber-400 font-mono">#{currentPageIndex + 1}</span>
              </div>

              {/* Cover thumbnail */}
              <button
                onClick={() => setCurrentPageIndex(0)}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col gap-1 ${
                  currentPageIndex === 0
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span>{isEn ? 'Cover' : 'Portada'}</span>
                  <span className="font-mono">{isEn ? 'Page 1' : 'Pág 1'}</span>
                </div>
                <div className="h-10 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] text-amber-400 font-bold">
                  ATLAS KDP
                </div>
              </button>

              {/* Table of contents thumbnail */}
              <button
                onClick={() => setCurrentPageIndex(1)}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col gap-1 ${
                  currentPageIndex === 1
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span>{isEn ? 'Contents' : 'Índice'}</span>
                  <span className="font-mono">{isEn ? 'Page 2' : 'Pág 2'}</span>
                </div>
                <div className="h-10 rounded bg-white border border-slate-300 flex items-center justify-center text-[9px] text-slate-800 font-bold">
                  {isEn ? 'CONTENTS' : 'ÍNDICE'}
                </div>
              </button>

              {/* Countries Thumbnails */}
              {countries.map((c, idx) => {
                const p1 = 2 + idx;
                const isSelected = currentPageIndex === p1;
                const cThumbName = isEn ? (c.nameEn || c.nameEs) : c.nameEs;

                return (
                  <div
                    key={c.id}
                    className={`p-2 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-slate-800 border-sky-500'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-200 mb-1">
                      <span className="truncate">{cThumbName}</span>
                      <span className="text-[9px] font-mono text-slate-400">
                        {p1 + 1}
                      </span>
                    </div>

                    <div>
                      <button
                        onClick={() => setCurrentPageIndex(p1)}
                        className={`h-9 w-full rounded border overflow-hidden transition-all cursor-pointer p-0.5 ${
                          currentPageIndex === p1
                            ? 'border-amber-400 ring-1 ring-amber-400 bg-amber-500/10'
                            : 'border-slate-800 bg-white hover:border-slate-600'
                        }`}
                        title={isEn ? `Page: ${cThumbName}` : `Pág: ${cThumbName}`}
                      >
                        <img
                          src={`https://flagcdn.com/${c.id}.svg`}
                          alt=""
                          className="w-full h-full object-cover rounded-[2px]"
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* PAGE DISPLAY STAGE */}
          <div
            ref={containerRef}
            className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center relative bg-slate-950/90"
          >
            {/* FLOATING PREVIOUS BUTTON */}
            <button
              onClick={goToPrev}
              disabled={currentPageIndex === 0}
              className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-2xl bg-slate-900/90 hover:bg-amber-500 text-white hover:text-slate-950 border border-slate-700 shadow-xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none`}
              aria-label={isEn ? 'Previous Page' : 'Página Anterior'}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* RENDERED PAGES IN SCALE */}
            <div
              className={`flex items-center justify-center gap-6 transition-transform duration-150 origin-center`}
              style={{
                transform: `scale(${zoomScale})`
              }}
            >
              {/* LEFT PAGE */}
              <div className="shadow-2xl rounded-lg overflow-hidden border border-slate-700 bg-white flex-shrink-0">
                {renderSinglePage(currentPageIndex)}
              </div>

              {/* RIGHT PAGE (IN SPREAD MODE) */}
              {viewMode === 'spread' && currentPageIndex + 1 < totalPages && (
                <div className="shadow-2xl rounded-lg overflow-hidden border border-slate-700 bg-white flex-shrink-0">
                  {renderSinglePage(currentPageIndex + 1)}
                </div>
              )}
            </div>

            {/* FLOATING NEXT BUTTON */}
            <button
              onClick={goToNext}
              disabled={
                viewMode === 'spread'
                  ? currentPageIndex >= totalPages - 2
                  : currentPageIndex >= totalPages - 1
              }
              className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-2xl bg-slate-900/90 hover:bg-amber-500 text-white hover:text-slate-950 border border-slate-700 shadow-xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none`}
              aria-label={isEn ? 'Next Page' : 'Página Siguiente'}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* FOOTER NAVIGATION & STATUS BAR */}
        <div className="flex flex-wrap items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950 text-xs gap-3">
          {/* Page Counter with Slider / Stepper */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPageIndex(0)}
              className="text-[11px] text-slate-400 hover:text-amber-400 font-semibold cursor-pointer"
            >
              {isEn ? 'First' : 'Inicio'}
            </button>
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-amber-400 font-black">
                {viewMode === 'spread' && currentPageIndex + 1 < totalPages
                  ? (isEn ? `Pages ${currentPageIndex + 1}-${currentPageIndex + 2}` : `Págs. ${currentPageIndex + 1}-${currentPageIndex + 2}`)
                  : (isEn ? `Page ${currentPageIndex + 1}` : `Pág. ${currentPageIndex + 1}`)}
              </span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-400">{totalPages}</span>
            </div>
            <button
              onClick={() => setCurrentPageIndex(totalPages - 1)}
              className="text-[11px] text-slate-400 hover:text-amber-400 font-semibold cursor-pointer"
            >
              {isEn ? 'Last' : 'Final'}
            </button>
          </div>

          {/* Quick Page Scrubber Slider */}
          <div className="flex-1 max-w-xs sm:max-w-md hidden sm:flex items-center gap-2">
            <input
              type="range"
              min="0"
              max={totalPages - 1}
              value={currentPageIndex}
              onChange={(e) => setCurrentPageIndex(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          {/* Shortcuts & Action */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500 hidden md:inline">
              {isEn ? 'Use keyboard arrow keys ← → to browse pages' : 'Usa las flechas ← → del teclado para hojear'}
            </span>
            <button
              onClick={onDownloadInstant}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span>{isEn ? 'Proceed to Download' : 'Proceder a Descarga'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
