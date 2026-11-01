import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Country } from '../types';
import {
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Sparkles,
  FileText,
  Printer,
  Share2
} from 'lucide-react';
import { KdpPdfGeneratorService } from '../services/kdpPdfGeneratorService';
import { DownloadHelper } from '../utils/downloadHelper';

interface CountryQrDownloadModuleProps {
  country: Country;
  onOpenPdfModal?: (country: Country) => void;
  className?: string;
  defaultPaperFormat?: 'letter' | 'a4';
  defaultTheme?: 'light' | 'dark';
}

export const CountryQrDownloadModule: React.FC<CountryQrDownloadModuleProps> = ({
  country,
  onOpenPdfModal,
  className = '',
  defaultPaperFormat = 'letter',
  defaultTheme = 'light'
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSvgString, setQrSvgString] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [paperFormat, setPaperFormat] = useState<'letter' | 'a4'>(defaultPaperFormat);
  const [sheetTheme, setSheetTheme] = useState<'light' | 'dark'>(defaultTheme);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [pdfDownloaded, setPdfDownloaded] = useState<boolean>(false);

  // Compute direct PDF download URL
  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : 'https://mundobanderas.app';

  const directDownloadUrl = `${baseUrl}?action=download-pdf&country=${country.id}&paper=${paperFormat}&theme=${sheetTheme}`;

  // Generate QR code whenever country, paperFormat, or theme changes
  useEffect(() => {
    let isMounted = true;
    setIsGenerating(true);

    const generateQr = async () => {
      try {
        // Generate high resolution PNG Data URL
        const dataUrl = await QRCode.toDataURL(directDownloadUrl, {
          width: 480,
          margin: 2,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });

        // Generate clean SVG vector string for Illustrator / print exports
        const svgString = await QRCode.toString(directDownloadUrl, {
          type: 'svg',
          margin: 2,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });

        if (isMounted) {
          setQrDataUrl(dataUrl);
          setQrSvgString(svgString);
          setIsGenerating(false);
        }
      } catch (err) {
        console.error('Error al generar código QR:', err);
        if (isMounted) setIsGenerating(false);
      }
    };

    generateQr();

    return () => {
      isMounted = false;
    };
  }, [country.id, directDownloadUrl]);

  const handleCopyUrl = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(directDownloadUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = directDownloadUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Error al copiar URL:', err);
    }
  };

  const handleDownloadQrPng = () => {
    if (!qrDataUrl) return;
    const cleanName = country.nameEs
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    const filename = `qr_descarga_pdf_${country.id}_${cleanName}.png`;
    DownloadHelper.downloadRemoteFile(qrDataUrl, filename);
  };

  const handleDownloadQrSvg = () => {
    if (!qrSvgString) return;
    const cleanName = country.nameEs
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    const filename = `qr_descarga_pdf_${country.id}_${cleanName}.svg`;
    DownloadHelper.downloadText(qrSvgString, filename, 'image/svg+xml;charset=utf-8');
  };

  const handleDirectDownloadPdf = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      await KdpPdfGeneratorService.generateSingleCountryVectorPdf(
        country,
        paperFormat,
        sheetTheme
      );
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 3000);
    } catch (err) {
      console.error('Error descargando PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div
      className={`bg-slate-950/80 border border-sky-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden ${className}`}
    >
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white flex-shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white">
                Código QR de Descarga Directa del PDF
              </h3>
              <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950/80 border border-sky-500/30 px-2 py-0.5 rounded-full">
                SVG & PDF
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Escanea para descargar directamente la ficha PDF vectorial con la bandera en SVG de {country.nameEs}
            </p>
          </div>
        </div>

        {/* Paper & Theme configuration badges */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            value={paperFormat}
            onChange={(e) => setPaperFormat(e.target.value as 'letter' | 'a4')}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer"
            title="Formato de hoja al descargar mediante QR"
          >
            <option value="letter">Carta (Letter)</option>
            <option value="a4">A4 (Internacional)</option>
          </select>

          <select
            value={sheetTheme}
            onChange={(e) => setSheetTheme(e.target.value as 'light' | 'dark')}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer"
            title="Tema del diseño del PDF"
          >
            <option value="light">Fondo Blanco (Bond)</option>
            <option value="dark">Fondo Oscuro</option>
          </select>
        </div>
      </div>

      {/* Main Module Layout: QR Card + Info & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* QR Code Graphic Frame (md:col-span-5) */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="relative group bg-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border-4 border-slate-800 transition-transform duration-200 hover:scale-[1.02]">
            {isGenerating ? (
              <div className="w-48 h-48 sm:w-52 sm:h-52 flex flex-col items-center justify-center bg-slate-100 rounded-xl">
                <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs text-slate-500 font-semibold">Generando QR...</span>
              </div>
            ) : qrDataUrl ? (
              <div className="relative flex items-center justify-center">
                <img
                  src={qrDataUrl}
                  alt={`Código QR para descargar PDF de la bandera de ${country.nameEs}`}
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                />
                {/* Center Badge: Country Flag Overlay */}
                <div className="absolute w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white p-1 shadow-lg border-2 border-slate-900/10 flex items-center justify-center overflow-hidden pointer-events-none">
                  <img
                    src={`https://flagcdn.com/${country.id}.svg`}
                    alt={country.nameEs}
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
              </div>
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-xs text-red-500">
                Error al generar QR
              </div>
            )}
          </div>

          {/* Quick buttons to download QR code image */}
          <div className="flex items-center gap-2 mt-3.5">
            <button
              onClick={handleDownloadQrPng}
              className="text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="Descargar este código QR en PNG para insertar en libros o carteles"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Guardar QR (PNG)</span>
            </button>
            <button
              onClick={handleDownloadQrSvg}
              className="text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="Descargar este código QR en formato vectorial SVG para Adobe Illustrator"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>QR Vectorial (SVG)</span>
            </button>
          </div>
        </div>

        {/* Instructions & Interactive Tools (md:col-span-7) */}
        <div className="md:col-span-7 space-y-4">
          {/* Mobile scan instruction step */}
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
              <Smartphone className="w-4 h-4" />
              <span>Descarga Móvil Instantánea</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Apunta la cámara de cualquier teléfono móvil o tablet hacia el código QR. El enlace abrirá la aplicación y descargará automáticamente la ficha en <strong className="text-white">PDF 100% Vectorial</strong> con la bandera oficial en <strong className="text-sky-300">formato SVG copiable para Adobe Illustrator</strong>.
            </p>
          </div>

          {/* Direct URL input bar with Copy & Open */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
              <span>URL Única de Descarga Directa:</span>
              <span className="text-[10px] text-slate-500 font-mono">ID: {country.id.toUpperCase()}</span>
            </label>
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2">
              <input
                type="text"
                readOnly
                value={directDownloadUrl}
                className="bg-transparent text-xs text-slate-300 font-mono flex-1 outline-none truncate select-all"
                title={directDownloadUrl}
              />
              <button
                onClick={handleCopyUrl}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/20'
                }`}
                title="Copiar enlace al portapapeles"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Test Action Buttons */}
          <div className="pt-1 flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDirectDownloadPdf}
              disabled={isDownloadingPdf}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                pdfDownloaded
                  ? 'bg-emerald-600 text-white border border-emerald-500'
                  : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/20'
              }`}
              title="Descargar ahora mismo el PDF con la bandera en SVG para verificar"
            >
              {isDownloadingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generando PDF Vectorial...</span>
                </>
              ) : pdfDownloaded ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>¡PDF Descargado Exitosamente!</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Probar Descarga Directa Ahora</span>
                </>
              )}
            </button>

            {onOpenPdfModal && (
              <button
                onClick={() => onOpenPdfModal(country)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                title="Abrir el visor interactivo de personalización de la ficha PDF"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Personalizar Ficha PDF</span>
              </button>
            )}

            <a
              href={directDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
              title="Abrir enlace directo en una nueva pestaña"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir URL</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
