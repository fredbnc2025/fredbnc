import React, { useState } from 'react';
import {
  Package,
  Download,
  CheckCircle2,
  Copy,
  DollarSign,
  FileCode,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Globe2,
  ExternalLink,
  Layers,
  ShoppingBag,
  Info,
  Check,
  X,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { DownloadHelper } from '../utils/downloadHelper';

interface SellAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SellAppModal: React.FC<SellAppModalProps> = ({ isOpen, onClose }) => {
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'package' | 'pricing' | 'copy'>('package');

  if (!isOpen) return null;

  const salesPitchCopy = `🔥 [A LA VENTA] Atlas Vexilológico Mundial & Plataforma Editorial Amazon KDP (Código Fuente Completo)

¿Buscas un proyecto web rentable y listo para monetizar en el nicho educativo, geográfico y editorial?

Pongo a la venta el código fuente completo de MundoBanderas, una plataforma web moderna creada con React 19, Vite, TypeScript y Tailwind CSS.

🚀 LO QUE INCLUYE EL PAQUETE:
- 🌍 Base de datos verificada de 249 países y territorios (ISO 3166-1, capitales, escudos, símbolos vexilológicos, monedas y subdivisiones).
- 📚 Motor Editorial Amazon KDP: Genera en 1 solo clic un libro completo de 265 páginas en vectores nítidos (8.5" x 11") listo para subir y vender en Amazon.
- 🎨 Banderas 100% vectoriales nativas (SVG puro y PDF vectorial sin pérdida de calidad con svg2pdf.js).
- 🎮 Módulos interactivos: Comparador de banderas, Quiz de trivia con puntuaciones, Diseñador interactivo de banderas y Globo terráqueo 3D.
- 💎 Interfaz SaaS lista para monetizar con planes Pro / suscripciones mensuales, anuales o vitalicias.
- ⚡ 100% lista para desplegar en Vercel, Netlify o Cloudflare Pages en 2 minutos.

📦 ENTREGA INMEDIATA:
Se entrega archivo .ZIP con todo el código fuente organizado, guía técnica de inicio rápido (README.md), guía de monetización (GUIA_COMERCIAL_Y_VENTA.md) y contrato formal de cesión de derechos de autor (LICENCIA_COMERCIAL_TRANSFERENCIA.md).`;

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(salesPitchCopy);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  const handleDownloadZip = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadError(null);

    try {
      // 1. Fetch file as arrayBuffer with cache-busting timestamp
      const res = await fetch(`/mundobanderas-app-codigo-fuente.zip?t=${Date.now()}`);
      if (!res.ok) {
        throw new Error(`Error en el servidor al obtener el archivo (${res.status} ${res.statusText})`);
      }

      const buffer = await res.arrayBuffer();
      if (!buffer || buffer.byteLength < 1000) {
        throw new Error('El archivo ZIP recibido está vacío o incompleto.');
      }

      // Check ZIP magic signature (PK\x03\x04 = 0x50, 0x4B, 0x03, 0x04)
      const header = new Uint8Array(buffer.slice(0, 4));
      if (header[0] !== 0x50 || header[1] !== 0x4b) {
        throw new Error('El archivo recibido no es un ZIP binario válido.');
      }

      // 2. Create explicit binary blob and trigger clean download via DownloadHelper
      const blob = new Blob([buffer], { type: 'application/zip' });
      DownloadHelper.triggerDownload(blob, 'mundobanderas-app-codigo-fuente.zip');

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 6000);
    } catch (err: any) {
      console.error('Error al descargar ZIP:', err);
      setDownloadError(err?.message || 'Error al descargar el archivo ZIP.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl shadow-sky-950/50 overflow-hidden">
        {/* Header */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Paquete de Venta & Código Fuente Completo
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Listo para Vender
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Descarga el archivo ZIP con todo el código, base de datos de 249 países, motor KDP y documentación legal y comercial.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-900/50">
          <button
            onClick={() => setActiveTab('package')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'package'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Contenido del ZIP</span>
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'pricing'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Estrategia de Precios & Canales</span>
          </button>
          <button
            onClick={() => setActiveTab('copy')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'copy'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Copy className="w-4 h-4" />
            <span>Texto de Anuncio (Copywriting)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-300 text-sm">
          {activeTab === 'package' && (
            <div className="space-y-6">
              {/* Highlight Banner */}
              <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-sky-950/40 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Archivo ZIP Universal (Compatible Windows, Mac y Linux)</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Archivo: <code className="text-sky-300 font-mono">mundobanderas-app-codigo-fuente.zip</code> (Comprimido con formato estándar DEFLATE y atributos de archivo verificados).
                  </p>
                  {downloadError && (
                    <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5 bg-rose-950/40 border border-rose-800/60 px-3 py-1.5 rounded-xl">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{downloadError}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                  <button
                    onClick={handleDownloadZip}
                    disabled={isDownloading}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verificando y Descargando...</span>
                      </>
                    ) : downloadSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-slate-950" />
                        <span>¡Descargado con Éxito!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Descargar Archivo ZIP (0.52 MB)</span>
                      </>
                    )}
                  </button>

                  <a
                    href="/mundobanderas-app-codigo-fuente.zip"
                    download="mundobanderas-app-codigo-fuente.zip"
                    className="text-[11px] text-center text-slate-400 hover:text-sky-300 underline py-1"
                    title="Si el botón principal no inicia, usa este enlace directo del navegador"
                  >
                    Enlace directo alternativo
                  </a>
                </div>
              </div>

              {/* Grid of Included Assets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Globe2 className="w-4 h-4 text-sky-400" />
                    <span>249 Fichas Oficiales y Fácticas</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Base de datos completa con normas ISO 3166-1, capitales, idiomas, monedas, población y descripción vexilológica única de cada país.
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span>Motor Editorial Amazon KDP (265 Págs)</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Compilador en 1 clic de libro completo listo para impresión bajo demanda (formato 8.5" x 11" con cálculo de lomo y sangría).
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Banderas SVG en Vector Nativo</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Integración con <code className="text-indigo-300">svg2pdf.js</code> para que los PDFs contengan vectores puros sin rasterizado ni pixelado.
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Documentación Legal & Comercial</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Incluye <code className="text-emerald-300">README.md</code>, <code className="text-emerald-300">GUIA_COMERCIAL_Y_VENTA.md</code> y <code className="text-emerald-300">LICENCIA_COMERCIAL_TRANSFERENCIA.md</code>.
                  </p>
                </div>
              </div>

              {/* Instructions for Buyer */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-sky-400" />
                  Instrucciones que debes darle al comprador:
                </h4>
                <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1">
                  <li>Descomprimir el archivo <code className="text-slate-300">mundobanderas-app-codigo-fuente.zip</code>.</li>
                  <li>Abrir una terminal en la carpeta y ejecutar <code className="text-sky-300 font-mono">npm install</code>.</li>
                  <li>Ejecutar <code className="text-emerald-300 font-mono">npm run dev</code> para iniciar localmente en el puerto 3000.</li>
                  <li>Para producción o subida a Vercel/Netlify, ejecutar <code className="text-indigo-300 font-mono">npm run build</code>.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="space-y-5">
              <p className="text-xs text-slate-400">
                Puedes vender este producto en diferentes modalidades dependiendo de si vendes la aplicación completa, licencias de uso o los libros generados con ella:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="bg-slate-950/70 border border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Venta Total del Activo</span>
                    <h4 className="text-base font-bold text-white mt-1">Flippa / Acquire.com</h4>
                    <div className="text-2xl font-black text-emerald-400 my-2">$1,500 – $4,500 <span className="text-xs font-normal text-slate-400">USD</span></div>
                    <p className="text-xs text-slate-400">
                      Venta exclusiva de la propiedad intelectual, código y derechos a un único comprador o inversor digital.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-medium">
                    Ideal para venta rápida en plataformas de negocios digitales.
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-sky-500/30 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Venta de Licencias</span>
                    <h4 className="text-base font-bold text-white mt-1">Gumroad / Lemon Squeezy</h4>
                    <div className="text-2xl font-black text-sky-400 my-2">$99 – $299 <span className="text-xs font-normal text-slate-400">USD/licencia</span></div>
                    <p className="text-xs text-slate-400">
                      Venta repetida del código fuente a desarrolladores, agencias o educadores. Con 10 ventas alcanzas $1,000 – $3,000 USD.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-medium">
                    Ingresos pasivos escalables sin límite de copias.
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-amber-500/30 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Regalías Editoriales</span>
                    <h4 className="text-base font-bold text-white mt-1">Amazon KDP Books</h4>
                    <div className="text-2xl font-black text-amber-400 my-2">$4 – $8 <span className="text-xs font-normal text-slate-400">USD/ejemplar</span></div>
                    <p className="text-xs text-slate-400">
                      Publica los atlas generados directamente en Amazon. Genera regalías automáticas de impresión bajo demanda todos los meses.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-medium">
                    Sin costes de inventario ni envíos.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'copy' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Usa esta descripción profesional lista para copiar y publicar en tu anuncio de venta (Gumroad, Flippa, LinkedIn, grupos de Facebook):
                </p>
                <button
                  onClick={handleCopyPitch}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition-all cursor-pointer"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">¡Texto Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar al Portapapeles</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                  {salesPitchCopy}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Código 100% testeado, compilado y listo para entregar.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            <button
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-75"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Descargando...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>¡Descargado!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar ZIP para Vender (0.52 MB)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
