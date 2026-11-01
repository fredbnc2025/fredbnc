import React, { useState, useRef, useEffect } from 'react';
import { FlagLayoutType, FlagEmblemType, SubscriptionPlanId } from '../types';
import { subscriptionService } from '../services/subscriptionService';
import {
  Sparkles,
  Download,
  Check,
  Palette,
  Layers,
  RotateCcw,
  Sliders,
  FileCode,
  Image as ImageIcon,
  Save,
  Trash2,
  Crown,
  Zap
} from 'lucide-react';
import { DownloadHelper } from '../utils/downloadHelper';

interface VexColorPreset {
  name: string;
  hex: string;
  heraldic: string;
}

const HERALDIC_PALETTE: VexColorPreset[] = [
  { name: 'Rojo Carmesí', hex: '#DC2626', heraldic: 'Gules' },
  { name: 'Azul Real', hex: '#2563EB', heraldic: 'Azur' },
  { name: 'Amarillo Dorado', hex: '#FACC15', heraldic: 'Oro' },
  { name: 'Verde Esmeralda', hex: '#16A34A', heraldic: 'Sinople' },
  { name: 'Blanco Puro', hex: '#FFFFFF', heraldic: 'Plata' },
  { name: 'Negro Profundo', hex: '#0F172A', heraldic: 'Sable' },
  { name: 'Naranja Fuego', hex: '#EA580C', heraldic: 'Aurora' },
  { name: 'Púrpura Imperial', hex: '#9333EA', heraldic: 'Púrpura' },
  { name: 'Azul Celeste', hex: '#38BDF8', heraldic: 'Celeste' },
  { name: 'Granate', hex: '#881337', heraldic: 'Sanguíneo' }
];

interface FlagCreatorProps {
  onUpgradePro?: (plan?: SubscriptionPlanId) => void;
}

export const FlagCreator: React.FC<FlagCreatorProps> = ({ onUpgradePro }) => {
  const [flagTitle, setFlagTitle] = useState<string>('República de Utopía');
  const [flagDescription, setFlagDescription] = useState<string>(
    'Bandera representativa de la paz, la justicia y el horizonte marítimo.'
  );
  const [layout, setLayout] = useState<FlagLayoutType>('triband-h');
  const [aspectRatio, setAspectRatio] = useState<'2:3' | '1:2' | '3:5' | '1:1'>('2:3');
  const [isProUser, setIsProUser] = useState<boolean>(subscriptionService.isPro());

  useEffect(() => {
    const unsub = subscriptionService.subscribe((sub) => {
      setIsProUser(sub.isPro);
    });
    return unsub;
  }, []);

  // Colors
  const [color1, setColor1] = useState<string>('#2563EB'); // Blue
  const [color2, setColor2] = useState<string>('#FFFFFF'); // White
  const [color3, setColor3] = useState<string>('#DC2626'); // Red
  const [colorCanton, setColorCanton] = useState<string>('#0F172A'); // Dark Blue/Navy

  // Emblem
  const [emblem, setEmblem] = useState<FlagEmblemType>('star-5');
  const [emblemColor, setEmblemColor] = useState<string>('#FACC15'); // Gold
  const [emblemSize, setEmblemSize] = useState<number>(36);

  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Dimension calculations based on aspect ratio
  const dimensions = {
    '2:3': { width: 600, height: 400 },
    '1:2': { width: 800, height: 400 },
    '3:5': { width: 666, height: 400 },
    '1:1': { width: 500, height: 500 }
  }[aspectRatio];

  const w = dimensions.width;
  const h = dimensions.height;

  // Render SVG Emblem
  const renderEmblem = (cx: number, cy: number, size: number) => {
    switch (emblem) {
      case 'star-5': {
        // 5-pointed star
        const points: string[] = [];
        const outerRadius = size;
        const innerRadius = size * 0.4;
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
        }
        return <polygon points={points.join(' ')} fill={emblemColor} />;
      }
      case 'sun': {
        // Radiating Sun
        const rays = 16;
        const outerR = size * 1.25;
        const innerR = size * 0.6;
        const rayPaths: React.JSX.Element[] = [];
        for (let i = 0; i < rays; i++) {
          const angle = (i * 2 * Math.PI) / rays;
          const x1 = cx + innerR * Math.cos(angle);
          const y1 = cy + innerR * Math.sin(angle);
          const x2 = cx + outerR * Math.cos(angle);
          const y2 = cy + outerR * Math.sin(angle);
          rayPaths.push(
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={emblemColor}
              strokeWidth={size * 0.12}
              strokeLinecap="round"
            />
          );
        }
        return (
          <g>
            {rayPaths}
            <circle cx={cx} cy={cy} r={innerR * 0.85} fill={emblemColor} />
          </g>
        );
      }
      case 'crescent-star': {
        // Crescent & Star
        return (
          <g transform={`translate(${cx - size * 0.6}, ${cy - size * 0.6}) scale(${size / 24})`}>
            {/* Crescent */}
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c3.84 0 7.18-2.16 8.87-5.35-1.12.22-2.28.35-3.47.35-5.52 0-10-4.48-10-10 0-1.89.53-3.65 1.44-5.16C7.57 2.68 9.69 2 12 2z"
              fill={emblemColor}
            />
            {/* Small star inside crescent */}
            <path
              d="M19 7l1.2 2.5 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4z"
              fill={emblemColor}
            />
          </g>
        );
      }
      case 'shield': {
        // Heraldic Shield
        return (
          <g transform={`translate(${cx - size * 0.6}, ${cy - size * 0.7}) scale(${size / 20})`}>
            <path
              d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"
              fill={emblemColor}
              stroke="#020617"
              strokeWidth="1.5"
            />
            <path d="M12 4v16c3.67-1 6.5-4.8 6.5-9V6.2L12 4z" fill="rgba(255,255,255,0.25)" />
          </g>
        );
      }
      case 'crown': {
        // Royal Crown
        return (
          <g transform={`translate(${cx - size * 0.8}, ${cy - size * 0.6}) scale(${size / 15})`}>
            <path
              d="M2 18h20v2H2v-2zm1-4l3-7 4 4 4-6 4 6 4-4 3 7H3z"
              fill={emblemColor}
              stroke="#020617"
              strokeWidth="0.8"
            />
          </g>
        );
      }
      case 'eagle': {
        // Imperial Eagle Silhouette
        return (
          <g transform={`translate(${cx - size * 0.8}, ${cy - size * 0.8}) scale(${size / 15})`}>
            <path
              d="M12 2L9 6H4l4 4-2 6 6-2 6 2-2-6 4-4h-5l-3-4z"
              fill={emblemColor}
              stroke="#020617"
              strokeWidth="0.5"
            />
          </g>
        );
      }
      case 'maple-leaf': {
        // Maple Leaf
        return (
          <g transform={`translate(${cx - size * 0.75}, ${cy - size * 0.8}) scale(${size / 16})`}>
            <path
              d="M12 2l1.5 3.5 3-1-1 3.5 3.5 1-2 2.5 3 2.5-4 1v3h-4v-3l-4-1 3-2.5-2-2.5 3.5-1-1-3.5 3 1L12 2z"
              fill={emblemColor}
            />
          </g>
        );
      }
      case 'compass-rose': {
        // 8-point nautical compass rose
        return (
          <g transform={`translate(${cx - size}, ${cy - size}) scale(${size / 12})`}>
            <polygon points="12,2 14,10 22,12 14,14 12,22 10,14 2,12 10,10" fill={emblemColor} />
            <polygon points="12,2 12,12 2,12" fill="rgba(255,255,255,0.3)" />
            <polygon points="12,22 12,12 22,12" fill="rgba(0,0,0,0.2)" />
          </g>
        );
      }
      case 'fleur-de-lis': {
        // Fleur de Lis
        return (
          <g transform={`translate(${cx - size * 0.75}, ${cy - size * 0.8}) scale(${size / 16})`}>
            <path
              d="M12 2C10 5 8 8 8 11c0 2 1.5 3.5 3 3.5.5 0 1-.2 1-.5 0 .3.5.5 1 .5 1.5 0 3-1.5 3-3.5 0-3-2-6-4-9z M6 9c-1 2-2 4-2 6 0 2 1.5 3.5 3.5 3.5 1.5 0 2.5-1 3-2-1-.5-2-2-2-4 0-1.5 1-2.5 1-3.5-1.5 0-2.5 0-3.5 0z M18 9c-1 0-2 0-3.5 0 0 1 1 2 1 3.5 0 2-1 3.5-2 4 .5 1 1.5 2 3 2 2 0 3.5-1.5 3.5-3.5 0-2-1-4-2-6z M8 18h8v2H8z"
              fill={emblemColor}
            />
          </g>
        );
      }
      default:
        return null;
    }
  };

  // Render SVG Flag Geometry
  const renderFlagCanvas = () => {
    let baseLayout: React.JSX.Element | null = null;
    let emblemCx = w / 2;
    let emblemCy = h / 2;

    switch (layout) {
      case 'triband-h':
        baseLayout = (
          <g>
            <rect x="0" y="0" width={w} height={h / 3} fill={color1} />
            <rect x="0" y={h / 3} width={w} height={h / 3} fill={color2} />
            <rect x="0" y={(2 * h) / 3} width={w} height={h / 3} fill={color3} />
          </g>
        );
        break;

      case 'triband-v':
        baseLayout = (
          <g>
            <rect x="0" y="0" width={w / 3} height={h} fill={color1} />
            <rect x={w / 3} y="0" width={w / 3} height={h} fill={color2} />
            <rect x={(2 * w) / 3} y="0" width={w / 3} height={h} fill={color3} />
          </g>
        );
        break;

      case 'bicolor-h':
        baseLayout = (
          <g>
            <rect x="0" y="0" width={w} height={h / 2} fill={color1} />
            <rect x="0" y={h / 2} width={w} height={h / 2} fill={color2} />
          </g>
        );
        break;

      case 'bicolor-v':
        baseLayout = (
          <g>
            <rect x="0" y="0" width={w / 2} height={h} fill={color1} />
            <rect x={w / 2} y="0" width={w / 2} height={h} fill={color2} />
          </g>
        );
        break;

      case 'nordic-cross': {
        const crossW = w * 0.16;
        const crossH = h * 0.22;
        const cxPos = w * 0.35;
        const cyPos = h * 0.5;
        baseLayout = (
          <g>
            {/* Background */}
            <rect x="0" y="0" width={w} height={h} fill={color1} />
            {/* Outer Cross */}
            <rect x={cxPos - crossW * 0.8} y="0" width={crossW * 1.6} height={h} fill={color2} />
            <rect x="0" y={cyPos - crossH * 0.8} width={w} height={crossH * 1.6} fill={color2} />
            {/* Inner Cross */}
            <rect x={cxPos - crossW * 0.5} y="0" width={crossW} height={h} fill={color3} />
            <rect x="0" y={cyPos - crossH * 0.5} width={w} height={crossH} fill={color3} />
          </g>
        );
        emblemCx = cxPos;
        emblemCy = cyPos;
        break;
      }

      case 'saltire': {
        baseLayout = (
          <g>
            <rect x="0" y="0" width={w} height={h} fill={color1} />
            <polygon points={`0,0 ${w},${h} ${w},${h - 40} 40,0`} fill={color2} />
            <polygon points={`0,${h} ${w},0 ${w},40 0,${h - 40}`} fill={color2} />
            <polygon points={`0,0 ${w},${h} ${w},${h - 20} 20,0`} fill={color3} />
            <polygon points={`0,${h} ${w},0 ${w},20 0,${h - 20}`} fill={color3} />
          </g>
        );
        break;
      }

      case 'canton': {
        const cantonW = w * 0.45;
        const cantonH = h * 0.5;
        baseLayout = (
          <g>
            {/* Stripes */}
            {Array.from({ length: 7 }).map((_, i) => (
              <rect
                key={i}
                x="0"
                y={(i * h) / 7}
                width={w}
                height={h / 7}
                fill={i % 2 === 0 ? color1 : color2}
              />
            ))}
            {/* Canton Box */}
            <rect x="0" y="0" width={cantonW} height={cantonH} fill={colorCanton} />
          </g>
        );
        emblemCx = cantonW / 2;
        emblemCy = cantonH / 2;
        break;
      }

      case 'diagonal': {
        baseLayout = (
          <g>
            <polygon points={`0,0 ${w},0 0,${h}`} fill={color1} />
            <polygon points={`0,${h} ${w},0 ${w},${h}`} fill={color2} />
            {/* Diagonal Band */}
            <polygon
              points={`0,${h * 0.75} 0,${h} ${w * 0.25},${h} ${w},${h * 0.25} ${w},0 ${w * 0.75},0`}
              fill={color3}
            />
          </g>
        );
        break;
      }

      case 'solid':
      default:
        baseLayout = <rect x="0" y="0" width={w} height={h} fill={color1} />;
        break;
    }

    return (
      <svg
        ref={svgRef}
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-full object-contain rounded-2xl shadow-2xl overflow-hidden border border-white/10"
        xmlns="http://www.w3.org/2000/svg"
      >
        {baseLayout}
        {emblem !== 'none' && renderEmblem(emblemCx, emblemCy, emblemSize)}
      </svg>
    );
  };

  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const clean = flagTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
    DownloadHelper.downloadSvgElement(svgRef.current, `bandera_personalizada_${clean}.svg`);
    setDownloadSuccess('svg');
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  const handleDownloadPng = async () => {
    if (!svgRef.current) return;
    const clean = flagTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
    await DownloadHelper.downloadSvgAsPng(svgRef.current, `bandera_${clean}_hd.png`, 1800, 1200);
    setDownloadSuccess('png');
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  const handleDownloadUltraHD = async () => {
    if (!isProUser) {
      if (onUpgradePro) onUpgradePro('annual');
      return;
    }
    if (!svgRef.current) return;
    const clean = flagTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
    await DownloadHelper.downloadSvgAsPng(svgRef.current, `bandera_${clean}_4k_ultra_hd.png`, 3840, 2560);
    setDownloadSuccess('4k');
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  return (
    <div className="w-full space-y-8">
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
            <Palette className="w-4 h-4" />
            <span>Taller Vexilológico SVG</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Diseñador y Creador de Banderas Vectoriales</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Crea tu propio estandarte nacional con proporciones oficiales, patrones heráldicos y descarga en SVG o PNG.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadSvg}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
          >
            {downloadSuccess === 'svg' ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>¡SVG Guardado!</span>
              </>
            ) : (
              <>
                <FileCode className="w-4 h-4" />
                <span>Exportar SVG</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadPng}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all cursor-pointer"
          >
            {downloadSuccess === 'png' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <ImageIcon className="w-4 h-4 text-sky-400" />
            )}
            <span>PNG HD</span>
          </button>

          {/* Pro 4K Ultra HD Button */}
          <button
            onClick={handleDownloadUltraHD}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
              isProUser
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 shadow-amber-500/20'
                : 'bg-slate-950 hover:bg-slate-850 text-amber-300 border border-amber-500/40 shadow-amber-500/10'
            }`}
            title={isProUser ? 'Exportar en Ultra Alta Definición 4K' : 'Función Pro: Exportar en 4K Ultra HD'}
          >
            {downloadSuccess === '4k' ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>¡4K Descargado!</span>
              </>
            ) : (
              <>
                <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Exportar 4K Ultra HD</span>
                {!isProUser && (
                  <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300 font-extrabold">
                    PRO
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Studio Workspace: Left Canvas Preview, Right Tool Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Interactive Flag Display */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col items-center justify-center min-h-[420px]">
            <div className="w-full max-w-lg aspect-[3/2] flex items-center justify-center">
              {renderFlagCanvas()}
            </div>

            {/* Flag Title & Meta */}
            <div className="mt-6 text-center space-y-1.5 w-full">
              <h3 className="text-xl font-bold text-white tracking-wide">{flagTitle || 'Sin Título'}</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">{flagDescription}</p>
              <div className="flex items-center justify-center gap-2 pt-2 text-[11px] font-mono text-slate-500">
                <span>Ratio: {aspectRatio}</span>
                <span>•</span>
                <span>Resolución: {w} × {h} px</span>
              </div>
            </div>
          </div>

          {/* Quick Heraldic Color Presets Picker */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4 text-sky-400" />
              Paleta Vexilológica Estandarizada
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {HERALDIC_PALETTE.map((p) => (
                <button
                  key={p.hex}
                  onClick={() => setColor1(p.hex)}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 text-left transition-all group flex items-center gap-2.5 cursor-pointer"
                  title={`Asignar ${p.name} (${p.heraldic})`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm flex-shrink-0"
                    style={{ backgroundColor: p.hex }}
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-200 truncate">{p.name}</p>
                    <p className="text-[9px] font-mono text-slate-500">{p.hex}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Studio Customization Tools */}
        <div className="lg:col-span-6 space-y-6">
          {/* Identity & Metadata */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              <span>Identidad de la Bandera</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nombre o Territorio</label>
                <input
                  type="text"
                  value={flagTitle}
                  onChange={(e) => setFlagTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Significado o Lema</label>
                <input
                  type="text"
                  value={flagDescription}
                  onChange={(e) => setFlagDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Layout Patterns */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Estructura Geométrica (Layout)</span>
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'triband-h', label: 'Tribanda Horizontal' },
                { id: 'triband-v', label: 'Tribanda Vertical' },
                { id: 'bicolor-h', label: 'Bicolor Horizontal' },
                { id: 'bicolor-v', label: 'Bicolor Vertical' },
                { id: 'nordic-cross', label: 'Cruz Nórdica' },
                { id: 'saltire', label: 'Cruz en Aspa' },
                { id: 'canton', label: 'Cantón Superior' },
                { id: 'diagonal', label: 'Banda Diagonal' },
                { id: 'solid', label: 'Campo Sólido' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setLayout(item.id as FlagLayoutType)}
                  className={`p-2.5 rounded-xl border text-xs font-medium transition-all text-center cursor-pointer ${
                    layout === item.id
                      ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Aspect Ratio Picker */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Relación de Aspecto (Ratio):</span>
              <div className="flex gap-1.5">
                {(['2:3', '1:2', '3:5', '1:1'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setAspectRatio(r)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                      aspectRatio === r
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color Selectors */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-sky-400" />
              <span>Colores Principales</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-slate-300">Color Primario</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color1}
                    onChange={(e) => setColor1(e.target.value)}
                    className="w-9 h-9 rounded-xl border border-slate-700 cursor-pointer bg-transparent"
                  />
                  <span className="text-xs font-mono text-slate-400 uppercase">{color1}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-slate-300">Color Secundario</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color2}
                    onChange={(e) => setColor2(e.target.value)}
                    className="w-9 h-9 rounded-xl border border-slate-700 cursor-pointer bg-transparent"
                  />
                  <span className="text-xs font-mono text-slate-400 uppercase">{color2}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-slate-300">Color Terciario</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color3}
                    onChange={(e) => setColor3(e.target.value)}
                    className="w-9 h-9 rounded-xl border border-slate-700 cursor-pointer bg-transparent"
                  />
                  <span className="text-xs font-mono text-slate-400 uppercase">{color3}</span>
                </div>
              </div>
            </div>

            {layout === 'canton' && (
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Color del Cantón</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorCanton}
                    onChange={(e) => setColorCanton(e.target.value)}
                    className="w-8 h-8 rounded-xl border border-slate-700 cursor-pointer bg-transparent"
                  />
                  <span className="text-xs font-mono text-slate-400 uppercase">{colorCanton}</span>
                </div>
              </div>
            )}
          </div>

          {/* Emblems & Charges */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Crown className="w-4 h-4 text-sky-400" />
              <span>Emblema / Carga Heráldica</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'none', label: 'Ninguno' },
                { id: 'star-5', label: 'Estrella ★' },
                { id: 'sun', label: 'Sol Radiante ☀️' },
                { id: 'crescent-star', label: 'Media Luna 🌙' },
                { id: 'shield', label: 'Escudo 🛡️' },
                { id: 'crown', label: 'Corona 👑' },
                { id: 'eagle', label: 'Águila 🦅' },
                { id: 'compass-rose', label: 'Rosa Vientos 🧭' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setEmblem(item.id as FlagEmblemType)}
                  className={`p-2.5 rounded-xl border text-xs font-medium transition-all text-center cursor-pointer ${
                    emblem === item.id
                      ? 'bg-sky-500 text-white border-sky-400'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {emblem !== 'none' && (
              <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-xs font-medium text-slate-300">Color del Emblema</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={emblemColor}
                      onChange={(e) => setEmblemColor(e.target.value)}
                      className="w-8 h-8 rounded-xl border border-slate-700 cursor-pointer bg-transparent"
                    />
                    <span className="text-xs font-mono text-slate-400 uppercase">{emblemColor}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Tamaño del Emblema</span>
                    <span className="font-mono">{emblemSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="90"
                    value={emblemSize}
                    onChange={(e) => setEmblemSize(Number(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
