import React, { useState, useEffect } from 'react';
import { Country } from '../types';
import {
  X,
  Download,
  Check,
  FileJson,
  FileText,
  Scale,
  Shield
} from 'lucide-react';
import { DownloadHelper } from '../utils/downloadHelper';
import { CountryQrDownloadModule } from './CountryQrDownloadModule';

interface FlagDetailModalProps {
  isOpen: boolean;
  country: Country | null;
  allCountries: Country[];
  onClose: () => void;
  onCompareWith?: (country: Country) => void;
  onOpenPdfModal?: (country: Country) => void;
  initialTab?: 'flag' | 'map' | 'divisions';
}

export const FlagDetailModal: React.FC<FlagDetailModalProps> = ({
  isOpen,
  country,
  onClose,
  onCompareWith,
  onOpenPdfModal
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  useEffect(() => {
    setDownloadSuccess(null);

    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, country?.id, onClose]);

  if (!isOpen || !country) return null;

  const flagSvgUrl = `https://flagcdn.com/${country.id}.svg`;
  const cleanName = country.nameEs
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');

  const handleDownloadSvg = async () => {
    const filename = `bandera_svg_${country.id}_${cleanName}.svg`;
    await DownloadHelper.downloadRemoteFile(flagSvgUrl, filename);
    setDownloadSuccess('svg');
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  const handleDownloadJson = () => {
    const data = {
      id: country.id,
      code3: country.code3,
      nombreEs: country.nameEs,
      nombreEn: country.nameEn,
      continente: country.continent,
      capital: country.capitalEs,
      svgUrl: flagSvgUrl,
      exportadoPor: 'MundoBanderas - Ficha Oficial de la Bandera',
      fecha: new Date().toISOString()
    };
    DownloadHelper.downloadText(JSON.stringify(data, null, 2), `ficha_bandera_${country.id}_${cleanName}.json`, 'application/json');
    setDownloadSuccess('json');
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  return (
    <div
      id="flag-details-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        id="flag-details-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header: Country Name and Badges */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{country.nameEs}</h2>
                <span className="text-xs font-semibold text-slate-400">({country.nameEn})</span>
                <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/80 border border-sky-500/30 px-2 py-0.5 rounded-full">
                  {country.code3}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {country.continent} • Ficha Oficial de la Bandera Nacional
              </p>
            </div>
          </div>

          <button
            id="close-flag-modal-button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content: ONLY THE FLAG */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Flag Showcase Frame */}
          <div className="bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col items-center justify-center shadow-inner relative">
            <div className="relative w-full max-w-2xl h-[340px] sm:h-[400px] flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-slate-900/90 p-4">
              {/* Badge with Country Name directly on Flag Frame */}
              <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-white font-bold text-xs shadow-md flex items-center gap-2 z-10">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Bandera Oficial de {country.nameEs}</span>
              </div>

              <img
                src={flagSvgUrl}
                alt={`Bandera oficial de ${country.nameEs}`}
                className="max-w-full max-h-full w-auto h-auto object-contain filter drop-shadow-2xl"
              />
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs font-semibold text-sky-400 tracking-wide">
                Pabellón Nacional Oficial • Gráfico Vectorial SVG de Alta Fidelidad
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Proporción Oficial Constitutiva • {country.nameEs} ({country.code3})
              </p>
            </div>

            {/* Action Bar under Flag */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleDownloadSvg}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border transition-all shadow-md cursor-pointer ${
                  downloadSuccess === 'svg'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
                    : 'bg-sky-500 hover:bg-sky-400 text-white border-sky-400/40 shadow-sky-500/20'
                }`}
                title="Descarga directa de la Bandera en Formato Vectorial SVG limpio"
              >
                {downloadSuccess === 'svg' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>¡SVG Vectorial Descargado!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Descargar Bandera SVG</span>
                  </>
                )}
              </button>

              {/* Ficha PDF Bandera */}
              {onOpenPdfModal && (
                <button
                  onClick={() => onOpenPdfModal(country)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                  title="Abrir o Imprimir Ficha PDF de la Bandera en tamaño Papel Bond"
                >
                  <FileText className="w-4 h-4 text-slate-950" />
                  <span>Ficha PDF (Bond)</span>
                </button>
              )}

              <button
                onClick={handleDownloadJson}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all cursor-pointer"
                title="Exportar datos de la bandera en formato JSON"
              >
                {downloadSuccess === 'json' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <FileJson className="w-4 h-4 text-amber-400" />
                )}
                <span>Ficha JSON</span>
              </button>

              {onCompareWith && (
                <button
                  onClick={() => {
                    onCompareWith(country);
                    onClose();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                  title="Llevar esta bandera al Comparador Vexilológico"
                >
                  <Scale className="w-4 h-4" />
                  <span>Comparar</span>
                </button>
              )}
            </div>
          </div>

          {/* Módulo de Código QR Único para Descarga Directa del PDF */}
          <CountryQrDownloadModule
            country={country}
            onOpenPdfModal={onOpenPdfModal}
          />
        </div>
      </div>
    </div>
  );
};

