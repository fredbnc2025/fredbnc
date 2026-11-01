import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  geoNaturalEarth1,
  geoMercator,
  geoEquirectangular,
  geoOrthographic,
  geoPath,
  geoGraticule,
  geoInterpolate,
  GeoProjection
} from 'd3-geo';
import { Country, EarthMapStyle, MapLayerConfig, PoliticalSubdivision } from '../types';
import { geoDataService } from '../services/geoDataService';
import { countryService, GeodesicRouteInfo } from '../services/countryService';
import { getCountryPoliticalStructure } from '../data/politicalDivisions';
import { subdivisionBoundaryService } from '../services/subdivisionBoundaryService';
import {
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Compass,
  MapPin,
  Sparkles,
  Plane,
  Layers,
  Globe as GlobeIcon,
  Maximize2,
  Navigation,
  Check,
  FileCode,
  FileImage,
  FileJson,
  ChevronDown,
  Infinity as InfinityIcon,
  Building2,
  Landmark,
  Shield,
  Palette,
  FileSpreadsheet
} from 'lucide-react';
import { DownloadHelper } from '../utils/downloadHelper';

// High-fidelity political atlas color palette for subdivisions (States / Departments / Provinces)
const SUBDIVISION_PALETTE: string[] = [
  '#f87171', // Coral Salmon
  '#fb923c', // Tangerine Orange
  '#fbbf24', // Amber Yellow
  '#a3e635', // Lime Green
  '#4ade80', // Mint Green
  '#2dd4bf', // Teal Cyan
  '#38bdf8', // Sky Blue
  '#818cf8', // Indigo Periwinkle
  '#c084fc', // Lilac Purple
  '#f472b6', // Pastel Rose Pink
  '#fde047', // Sunny Yellow
  '#fed7aa', // Warm Peach
  '#ddd6fe', // Soft Violet
  '#bbf7d0', // Pastel Sage
  '#fecdd3', // Soft Rose
  '#bae6fd', // Soft Azure
  '#fef08a', // Cream Yellow
  '#86efac'  // Light Emerald
];

function getSubdivisionColor(subId: string, idx: number): string {
  let hash = 0;
  for (let i = 0; i < subId.length; i++) {
    hash = (hash << 5) - hash + subId.charCodeAt(i);
    hash |= 0;
  }
  const colorIdx = Math.abs(hash + idx * 7) % SUBDIVISION_PALETTE.length;
  return SUBDIVISION_PALETTE[colorIdx];
}

interface WorldMapSVGProps {
  countries: Country[];
  selectedCountry: Country | null;
  onSelectCountry: (country: Country) => void;
  targetDestinationCountry?: Country | null;
  onSelectDestinationCountry?: (country: Country | null) => void;
  onOpenPoliticalSheet?: (country: Country) => void;
}

export type ProjectionType = 'naturalEarth' | 'mercator' | 'equirectangular' | 'orthographic';

export const WorldMapSVG: React.FC<WorldMapSVGProps> = ({
  countries,
  selectedCountry,
  onSelectCountry,
  targetDestinationCountry,
  onSelectDestinationCountry,
  onOpenPoliticalSheet
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [projectionType, setProjectionType] = useState<ProjectionType>('naturalEarth');
  const [mapStyle, setMapStyle] = useState<EarthMapStyle>('geodetic');
  const [hoveredCountry, setHoveredCountry] = useState<Country | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [orthoRotation, setOrthoRotation] = useState<[number, number]>([0, 0]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; rot: [number, number]; pan: { x: number; y: number } }>({
    x: 0,
    y: 0,
    rot: [0, 0],
    pan: { x: 0, y: 0 }
  });

  const [layers, setLayers] = useState<MapLayerConfig>({
    showClouds: false,
    showGraticule: true,
    showSolarTerminator: true,
    showExtremes: true,
    showAntipode: true,
    showGreatCircleArc: true,
    showSubdivisions: true
  });
  const [hoveredSubdivision, setHoveredSubdivision] = useState<{
    sub: PoliticalSubdivision;
    country: Country;
  } | null>(null);
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState<boolean>(false);
  const [isStylesMenuOpen, setIsStylesMenuOpen] = useState<boolean>(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [isRenderingPng, setIsRenderingPng] = useState<boolean>(false);

  // Dimensiones del canvas SVG
  const width = 1000;
  const height = 550;

  // Real GeoJSON data from Natural Earth
  const geojson = useMemo(() => geoDataService.getCountriesGeoJSON(), []);

  // Quick lookup from alpha2 to Country object
  const countryByAlpha2 = useMemo(() => {
    const map = new Map<string, Country>();
    countries.forEach((c) => map.set(c.id.toLowerCase(), c));
    return map;
  }, [countries]);

  // Setup D3 Projection
  const projection = useMemo(() => {
    let proj: GeoProjection;
    if (projectionType === 'mercator') {
      proj = geoMercator().scale(130 * zoomLevel).center([0, 25]).translate([width / 2 + panOffset.x, height / 2 + panOffset.y]);
    } else if (projectionType === 'equirectangular') {
      proj = geoEquirectangular().scale(150 * zoomLevel).translate([width / 2 + panOffset.x, height / 2 + panOffset.y]);
    } else if (projectionType === 'orthographic') {
      proj = geoOrthographic()
        .scale(230 * zoomLevel)
        .rotate(orthoRotation)
        .translate([width / 2 + panOffset.x, height / 2 + panOffset.y])
        .clipAngle(90);
    } else {
      proj = geoNaturalEarth1().scale(175 * zoomLevel).translate([width / 2 + panOffset.x, height / 2 + panOffset.y]);
    }
    return proj;
  }, [projectionType, zoomLevel, panOffset, orthoRotation, width, height]);

  // Path Generator
  const pathGenerator = useMemo(() => geoPath().projection(projection), [projection]);

  // Graticule Generator (100% Real Geographic Grid)
  const graticuleLines = useMemo(() => {
    const graticule = geoGraticule().step([20, 20]);
    return pathGenerator(graticule()) || '';
  }, [pathGenerator]);

  // Equator & Tropics Paths
  const equatorPath = useMemo(() => {
    const equatorGeo: any = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: Array.from({ length: 361 }, (_, i) => [i - 180, 0])
      }
    };
    return pathGenerator(equatorGeo) || '';
  }, [pathGenerator]);

  const tropicCancerPath = useMemo(() => {
    const geo: any = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: Array.from({ length: 121 }, (_, i) => [i * 3 - 180, 23.436])
      }
    };
    return pathGenerator(geo) || '';
  }, [pathGenerator]);

  const tropicCapricornPath = useMemo(() => {
    const geo: any = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: Array.from({ length: 121 }, (_, i) => [i * 3 - 180, -23.436])
      }
    };
    return pathGenerator(geo) || '';
  }, [pathGenerator]);

  // Unified TopoJSON Boundaries Mesh (Zero duplicates, seamless vector arcs, antimeridian-safe)
  const bordersMeshPath = useMemo(() => {
    try {
      const mesh = geoDataService.getAntimeridianSafeBoundariesMesh();
      return pathGenerator(mesh) || '';
    } catch {
      return '';
    }
  }, [pathGenerator]);

  // Geodesic Flight Route Calculation
  const routePath = useMemo(() => {
    if (!selectedCountry || !targetDestinationCountry || selectedCountry.id === targetDestinationCountry.id) return null;
    const interpolator = geoInterpolate([selectedCountry.lng, selectedCountry.lat], [targetDestinationCountry.lng, targetDestinationCountry.lat]);
    const points: [number, number][] = [];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      points.push(interpolator(i / steps));
    }
    const routeGeo: any = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: points
      }
    };
    return pathGenerator(routeGeo);
  }, [selectedCountry, targetDestinationCountry, pathGenerator]);

  const routeInfo: GeodesicRouteInfo | null = useMemo(() => {
    if (selectedCountry && targetDestinationCountry && selectedCountry.id !== targetDestinationCountry.id) {
      return countryService.getGeodesicRouteInfo(selectedCountry, targetDestinationCountry);
    }
    return null;
  }, [selectedCountry, targetDestinationCountry]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const touchPinchDistRef = useRef<number | null>(null);

  // Wheel Infinite Zoom on SVG container
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      setZoomLevel((prev) => {
        const next = prev * zoomFactor;
        return Math.max(0.4, Math.min(250, next));
      });
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // Touch handlers for 1-finger pan and 2-finger pinch
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        rot: [...orthoRotation],
        pan: { ...panOffset }
      };
      touchPinchDistRef.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchPinchDistRef.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;

      if (projectionType === 'orthographic') {
        const sensitivity = 0.4 / Math.min(10, zoomLevel);
        setOrthoRotation([
          dragStartRef.current.rot[0] + dx * sensitivity,
          Math.max(-80, Math.min(80, dragStartRef.current.rot[1] - dy * sensitivity))
        ]);
      } else {
        setPanOffset({
          x: dragStartRef.current.pan.x + dx,
          y: dragStartRef.current.pan.y + dy
        });
      }
    } else if (e.touches.length === 2 && touchPinchDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const factor = dist / touchPinchDistRef.current;
      touchPinchDistRef.current = dist;
      setZoomLevel((prev) => Math.max(0.4, Math.min(250, prev * factor)));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchPinchDistRef.current = null;
  };

  // Double click to zoom in centered on point
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Pan towards clicked point and zoom
    const dx = (width / 2 - clickX) * 0.4;
    const dy = (height / 2 - clickY) * 0.4;

    setPanOffset((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy
    }));
    setZoomLevel((prev) => Math.min(250, prev * 2));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      rot: [...orthoRotation],
      pan: { ...panOffset }
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      if (projectionType === 'orthographic') {
        const sensitivity = 0.4 / Math.min(10, zoomLevel);
        setOrthoRotation([
          dragStartRef.current.rot[0] + dx * sensitivity,
          Math.max(-80, Math.min(80, dragStartRef.current.rot[1] - dy * sensitivity))
        ]);
      } else {
        setPanOffset({
          x: dragStartRef.current.pan.x + dx,
          y: dragStartRef.current.pan.y + dy
        });
      }
    }

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Color styles based on active map theme
  const themeStyles = useMemo(() => {
    switch (mapStyle) {
      case 'political':
        return {
          oceanBg: '#091e3a',
          graticuleStroke: 'rgba(255, 255, 255, 0.12)',
          landFill: '#1e3a8a',
          landStroke: '#ffffff',
          hoverFill: '#f59e0b',
          selectedFill: '#d97706',
          selectedStroke: '#ffffff',
          isLight: false
        };
      case 'satellite':
        return {
          oceanBg: '#081c36',
          graticuleStroke: 'rgba(56, 189, 248, 0.15)',
          landFill: '#22543d',
          landStroke: '#ffffff',
          hoverFill: '#38a169',
          selectedFill: '#d97706',
          selectedStroke: '#ffffff',
          isLight: false
        };
      case 'night':
        return {
          oceanBg: '#020617',
          graticuleStroke: 'rgba(56, 189, 248, 0.12)',
          landFill: '#09132c',
          landStroke: '#ffffff',
          hoverFill: '#1e3a8a',
          selectedFill: '#ca8a04',
          selectedStroke: '#ffffff',
          isLight: false
        };
      case 'topography':
        return {
          oceanBg: '#082f49',
          graticuleStroke: 'rgba(217, 119, 6, 0.2)',
          landFill: '#2d6a4f',
          landStroke: '#ffffff',
          hoverFill: '#40916c',
          selectedFill: '#e11d48',
          selectedStroke: '#ffffff',
          isLight: false
        };
      case 'minimal_blue':
        return {
          oceanBg: '#ffffff',
          graticuleStroke: 'rgba(91, 164, 229, 0.2)',
          landFill: '#5ba4e5',
          landStroke: '#ffffff',
          hoverFill: '#3888d8',
          selectedFill: '#005ba3',
          selectedStroke: '#ffffff',
          isLight: true
        };
      case 'subdivision_bw':
        return {
          oceanBg: '#f8fafc',
          graticuleStroke: 'rgba(15, 23, 42, 0.12)',
          landFill: '#ffffff',
          landStroke: '#ffffff',
          hoverFill: '#f1f5f9',
          selectedFill: '#e2e8f0',
          selectedStroke: '#ffffff',
          isLight: true
        };
      case 'royal_blue':
        return {
          oceanBg: '#005ba3',
          graticuleStroke: 'rgba(255, 255, 255, 0.18)',
          landFill: '#ffffff',
          landStroke: '#ffffff',
          hoverFill: '#f8fafc',
          selectedFill: '#e0f2fe',
          selectedStroke: '#ffffff',
          isLight: false
        };
      case 'ice_slate':
        return {
          oceanBg: '#d9e6eb',
          graticuleStroke: 'rgba(26, 54, 74, 0.15)',
          landFill: '#1a364a',
          landStroke: '#ffffff',
          hoverFill: '#244862',
          selectedFill: '#0f2230',
          selectedStroke: '#ffffff',
          isLight: true
        };
      case 'continental_spectrum':
        return {
          oceanBg: '#dbe9f2',
          graticuleStroke: 'rgba(15, 23, 42, 0.12)',
          landFill: '#0284c7',
          landStroke: '#ffffff',
          hoverFill: '#0369a1',
          selectedFill: '#d97706',
          selectedStroke: '#ffffff',
          isLight: true
        };
      case 'geodetic':
      default:
        return {
          oceanBg: '#031726',
          graticuleStroke: 'rgba(56, 189, 248, 0.18)',
          landFill: '#0a304e',
          landStroke: '#ffffff',
          hoverFill: '#0284c7',
          selectedFill: '#0284c7',
          selectedStroke: '#ffffff',
          isLight: false
        };
    }
  }, [mapStyle]);

  // Distinct Geopolitical Palette for Countries, Islands & Overseas Territories
  const getPoliticalCountryColor = useCallback((country: Country | undefined) => {
    if (!country) return '#1e293b';

    if (mapStyle === 'continental_spectrum') {
      const spectrumColors: Record<string, string> = {
        'América': '#0284c7',
        'América del Norte': '#0284c7',
        'América del Sur': '#8b5cf6',
        'Europa': '#2563eb',
        'Asia': '#e11d48',
        'África': '#10b981',
        'Oceanía': '#ea580c',
        'Antártida': '#94a3b8'
      };
      return spectrumColors[country.continent] || '#6366f1';
    }

    if (mapStyle === 'subdivision_bw' || mapStyle === 'royal_blue') {
      return '#ffffff';
    }

    if (mapStyle === 'minimal_blue') {
      return '#5ba4e5';
    }

    if (mapStyle === 'ice_slate') {
      return '#1a364a';
    }

    const continent = country.continent;
    const charCode = ((country.id.charCodeAt(0) || 0) * 7 + (country.id.charCodeAt(1) || 0) * 13) % 6;
    const palettes: Record<string, string[]> = {
      'América': ['#1d4ed8', '#059669', '#d97706', '#7c3aed', '#0891b2', '#c2410c'],
      'Europa': ['#4338ca', '#16a34a', '#ea580c', '#9333ea', '#0d9488', '#ca8a04'],
      'Asia': ['#1e40af', '#15803d', '#b45309', '#6b21a8', '#0e7490', '#be123c'],
      'África': ['#ca8a04', '#047857', '#b91c1c', '#581c87', '#155e75', '#a16207'],
      'Oceanía': ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#14b8a6', '#e11d48'],
    };
    const list = palettes[continent] || ['#1d4ed8', '#059669', '#d97706', '#7c3aed'];
    return list[charCode % list.length];
  }, [mapStyle]);

  // Export 100% Real SVG File
  const handleDownloadSVG = useCallback(() => {
    if (!svgRef.current) return;
    const filename = `mapamundi_${projectionType}_${mapStyle}_vectorial.svg`;
    DownloadHelper.downloadSvgElement(svgRef.current, filename);
    setDownloadSuccess('svg');
    setTimeout(() => setDownloadSuccess(null), 3000);
    setIsDownloadMenuOpen(false);
  }, [projectionType, mapStyle]);

  // Export High Definition PNG Map (8K Ultra HD / 4K)
  const handleDownloadPNG = useCallback(async (resType: '8k' | '4k' = '8k') => {
    if (!svgRef.current || isRenderingPng) return;
    setIsRenderingPng(true);
    try {
      const is8k = resType === '8k';
      const w = is8k ? 7680 : 3840;
      const h = is8k ? 4320 : 2160;
      const filename = `mapamundi_${projectionType}_${mapStyle}_${is8k ? '8k_ultra_hd' : '4k_hd'}.png`;
      await DownloadHelper.downloadSvgAsPng(svgRef.current, filename, w, h);
      setDownloadSuccess(is8k ? 'png8k' : 'png');
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (err) {
      console.error('Error al generar PNG:', err);
    } finally {
      setIsRenderingPng(false);
      setIsDownloadMenuOpen(false);
    }
  }, [projectionType, mapStyle, isRenderingPng]);

  // Export Cartographic GeoJSON Dataset
  const handleDownloadGeoJSON = useCallback(() => {
    const filename = `mapa_mundial_fronteras_natural_earth.geojson`;
    DownloadHelper.downloadText(JSON.stringify(geojson, null, 2), filename, 'application/geo+json');
    setDownloadSuccess('geo');
    setTimeout(() => setDownloadSuccess(null), 3000);
    setIsDownloadMenuOpen(false);
  }, [geojson]);

  return (
    <div className="relative w-full h-full min-h-[580px] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col select-none">
      {/* Top Controls Toolbar */}
      <div className="p-4 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-20">
        {/* Left: Projection selector chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-sky-400 mr-1 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            <span>Proyección:</span>
          </span>

          <button
            onClick={() => { setProjectionType('naturalEarth'); setPanOffset({ x: 0, y: 0 }); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              projectionType === 'naturalEarth'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Natural Earth (Real 2D)
          </button>

          <button
            onClick={() => { setProjectionType('mercator'); setPanOffset({ x: 0, y: 0 }); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              projectionType === 'mercator'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Mercator
          </button>

          <button
            onClick={() => { setProjectionType('equirectangular'); setPanOffset({ x: 0, y: 0 }); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              projectionType === 'equirectangular'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Placa Carrée (WGS84)
          </button>

          <div className="w-[1px] h-5 bg-slate-800 mx-1" />

          {/* Political Divisions Layer Toggle Chip */}
          <button
            onClick={() => setLayers((prev) => ({ ...prev, showSubdivisions: !prev.showSubdivisions }))}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
              layers.showSubdivisions
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-950/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Activar / Desactivar capa de divisiones políticas (estados, provincias, departamentos)"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Divisiones Políticas</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              {layers.showSubdivisions ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Quick Political Sheet trigger if country selected */}
          {selectedCountry && onOpenPoliticalSheet && (
            <button
              onClick={() => onOpenPoliticalSheet(selectedCountry)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-950/30 font-bold"
              title={`Abrir Ficha Política Completa de ${selectedCountry.nameEs}`}
            >
              <Landmark className="w-3.5 h-3.5 text-amber-400" />
              <span>Ficha del Mapa: {selectedCountry.nameEs}</span>
            </button>
          )}
        </div>

        {/* Right: Map style tabs & Automatic Download Menu */}
        <div className="flex items-center gap-2">
          {/* Map Style Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setMapStyle('political')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                mapStyle === 'political' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
              }`}
              title="Mapa Político con colores geopolíticos distintivos para cada país, isla y territorio"
            >
              <Building2 className="w-3 h-3" />
              <span className="hidden sm:inline">Político</span>
            </button>
            <button
              onClick={() => setMapStyle('geodetic')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                mapStyle === 'geodetic' ? 'bg-sky-500 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="hidden sm:inline">Geodésico</span>
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                mapStyle === 'satellite' ? 'bg-emerald-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="hidden sm:inline">Satélite</span>
            </button>
            <button
              onClick={() => setMapStyle('night')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                mapStyle === 'night' ? 'bg-indigo-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="hidden sm:inline">Nocturno</span>
            </button>

            {/* Presentation Themes Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsStylesMenuOpen(!isStylesMenuOpen)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                  ['minimal_blue', 'subdivision_bw', 'royal_blue', 'ice_slate', 'continental_spectrum'].includes(mapStyle)
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Temas y Estilos de Presentación"
              >
                <Palette className="w-3 h-3 text-violet-400" />
                <span className="hidden sm:inline">Temas</span>
                <ChevronDown className="w-2.5 h-2.5" />
              </button>

              {isStylesMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 border-b border-slate-800">
                    Temas de Presentación
                  </div>
                  <button
                    onClick={() => { setMapStyle('minimal_blue'); setIsStylesMenuOpen(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                      mapStyle === 'minimal_blue' ? 'bg-sky-500 text-white font-bold' : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>Minimalista Celeste</span>
                    {mapStyle === 'minimal_blue' && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => { setMapStyle('subdivision_bw'); setIsStylesMenuOpen(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                      mapStyle === 'subdivision_bw' ? 'bg-slate-200 text-slate-950 font-bold' : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>División B&W</span>
                    {mapStyle === 'subdivision_bw' && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => { setMapStyle('royal_blue'); setIsStylesMenuOpen(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                      mapStyle === 'royal_blue' ? 'bg-blue-600 text-white font-bold' : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>Azul Real & Blanco</span>
                    {mapStyle === 'royal_blue' && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => { setMapStyle('ice_slate'); setIsStylesMenuOpen(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                      mapStyle === 'ice_slate' ? 'bg-slate-700 text-cyan-200 font-bold' : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>Pizarra & Azul Hielo</span>
                    {mapStyle === 'ice_slate' && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => { setMapStyle('continental_spectrum'); setIsStylesMenuOpen(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                      mapStyle === 'continental_spectrum' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>Espectro Continental</span>
                    {mapStyle === 'continental_spectrum' && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Layers Configuration Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLayersPanelOpen(!isLayersPanelOpen)}
              className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                isLayersPanelOpen
                  ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/30'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
              }`}
              title="Configurar Capas del Mapa"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Capas</span>
            </button>

            {isLayersPanelOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1 flex items-center justify-between">
                  <span>Capas Cartográficas</span>
                  <button onClick={() => setIsLayersPanelOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer">
                  <span className="flex items-center gap-2 text-slate-200">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Divisiones Políticas</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.showSubdivisions !== false}
                    onChange={(e) => setLayers((prev) => ({ ...prev, showSubdivisions: e.target.checked }))}
                    className="rounded border-slate-700 text-sky-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer">
                  <span className="flex items-center gap-2 text-slate-200">
                    <GlobeIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Islas y Territorios</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.showIslands !== false}
                    onChange={(e) => setLayers((prev) => ({ ...prev, showIslands: e.target.checked }))}
                    className="rounded border-slate-700 text-sky-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer">
                  <span className="flex items-center gap-2 text-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>Nombres de Países</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.showCountryLabels !== false}
                    onChange={(e) => setLayers((prev) => ({ ...prev, showCountryLabels: e.target.checked }))}
                    className="rounded border-slate-700 text-sky-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer">
                  <span className="flex items-center gap-2 text-slate-200">
                    <Compass className="w-3.5 h-3.5 text-sky-400" />
                    <span>Red Geodésica (WGS84)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.showGraticule}
                    onChange={(e) => setLayers((prev) => ({ ...prev, showGraticule: e.target.checked }))}
                    className="rounded border-slate-700 text-sky-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer">
                  <span className="flex items-center gap-2 text-slate-200">
                    <Plane className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Rutas Geodésicas de Vuelo</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.showGreatCircleArc}
                    onChange={(e) => setLayers((prev) => ({ ...prev, showGreatCircleArc: e.target.checked }))}
                    className="rounded border-slate-700 text-sky-500 focus:ring-0"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Automatic Download Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
              className={`px-3 py-1.5 rounded-xl text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer ${
                downloadSuccess
                  ? 'bg-emerald-600 shadow-emerald-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
              }`}
              title="Opciones de Descarga Automática del Mapa"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-200" />
                  <span>¡Descargado!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Descargar Mapa</span>
                  <ChevronDown className="w-3 h-3 text-emerald-200" />
                </>
              )}
            </button>

            {/* Dropdown Menu */}
            {isDownloadMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  Descarga Automática Instantánea
                </div>

                <button
                  onClick={handleDownloadSVG}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition-all cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Mapa SVG Vectorial</p>
                      <p className="text-[10px] text-slate-400">Escalable 100% sin pérdida de calidad</p>
                    </div>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                </button>

                <button
                  onClick={() => handleDownloadPNG('8k')}
                  disabled={isRenderingPng}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition-all cursor-pointer group text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                      <FileImage className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-white">Imagen 8K Ultra HD (PNG)</p>
                        <span className="text-[9px] font-mono font-bold bg-sky-950 text-sky-300 border border-sky-500/30 px-1 rounded">
                          7680×4320
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">Máxima resolución para impresión y cartelería</p>
                    </div>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                </button>

                <button
                  onClick={() => handleDownloadPNG('4k')}
                  disabled={isRenderingPng}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition-all cursor-pointer group text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                      <FileImage className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-white">Imagen 4K UHD (PNG)</p>
                        <span className="text-[9px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30 px-1 rounded">
                          3840×2160
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">Ideal para monitores y presentaciones</p>
                    </div>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                </button>

                <button
                  onClick={handleDownloadGeoJSON}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition-all cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      <FileJson className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Fronteras GeoJSON</p>
                      <p className="text-[10px] text-slate-400">Dataset cartográfico WGS84</p>
                    </div>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main SVG Vector Canvas */}
      <div
        ref={mapContainerRef}
        className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden flex items-center justify-center touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full select-none block mx-auto my-auto object-contain"
          shapeRendering="geometricPrecision"
          textRendering="geometricPrecision"
          imageRendering="optimizeQuality"
          style={{ background: themeStyles.oceanBg }}
        >
          <defs>
            {/* Orthographic Sphere Clip & Shading */}
            <radialGradient id="sphereShading" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
              <stop offset="60%" stopColor="#000000" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
            </radialGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Country Precise Boundary ClipPaths for Internal Subdivision Division Lines */}
            {geojson.features.map((feature, idx) => {
              const alpha2 = (feature.properties?.alpha2 || '').toLowerCase();
              const numericId = String(feature.properties?.numericId || feature.id || `c-${idx}`);
              const d = pathGenerator(feature);
              if (!d) return null;
              return (
                <React.Fragment key={`clip-frag-${idx}`}>
                  {alpha2 && (
                    <clipPath id={`country-clip-${alpha2}`}>
                      <path d={d} />
                    </clipPath>
                  )}
                  <clipPath id={`country-clip-${numericId}`}>
                    <path d={d} />
                  </clipPath>
                </React.Fragment>
              );
            })}
          </defs>

          {/* Orthographic Globe Background Circle */}
          {projectionType === 'orthographic' && (
            <circle
              cx={width / 2 + panOffset.x}
              cy={height / 2 + panOffset.y}
              r={230 * zoomLevel}
              fill={themeStyles.oceanBg}
              stroke="#38bdf8"
              strokeWidth="2"
              strokeOpacity="0.4"
            />
          )}

          {/* Graticule Grid (Parallels & Meridians) */}
          {layers.showGraticule && (
            <g className="graticule-layer">
              <path
                d={graticuleLines}
                fill="none"
                stroke={themeStyles.graticuleStroke}
                strokeWidth="0.75"
                strokeDasharray="2,2"
              />
              {/* Equator (Línea Divisoria del Ecuador en blanco fino) */}
              <path
                d={equatorPath}
                fill="none"
                stroke="#ffffff"
                strokeWidth="0.75"
                strokeOpacity="0.8"
              />
              {/* Tropics (Líneas Divisorias de los Trópicos en blanco fino) */}
              <path
                d={tropicCancerPath}
                fill="none"
                stroke="#ffffff"
                strokeWidth="0.5"
                strokeDasharray="3,2"
                strokeOpacity="0.6"
              />
              <path
                d={tropicCapricornPath}
                fill="none"
                stroke="#ffffff"
                strokeWidth="0.5"
                strokeDasharray="3,2"
                strokeOpacity="0.6"
              />
            </g>
          )}

          {/* 100% Real High-Definition GeoJSON Countries Vector Polygons */}
          <g className="countries-layer">
            {geojson.features.map((feature, idx) => {
              const alpha2 = feature.properties?.alpha2 || '';
              const country = countryByAlpha2.get(alpha2);
              const isSelected = country && selectedCountry?.id === country.id;
              const isHovered = country && hoveredCountry?.id === country.id;
              const d = pathGenerator(feature);
              if (!d) return null;

              const fillColor = isSelected
                ? themeStyles.selectedFill
                : isHovered
                ? themeStyles.hoverFill
                : mapStyle === 'political'
                ? getPoliticalCountryColor(country)
                : themeStyles.landFill;

              return (
                <path
                  key={`country-feature-${idx}-${feature.id || alpha2 || 'poly'}`}
                  d={d}
                  fill={fillColor}
                  stroke="#ffffff"
                  strokeWidth="0.3"
                  strokeOpacity={isSelected ? '0.9' : '0.35'}
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className="transition-colors duration-150 cursor-pointer"
                  onMouseEnter={() => {
                    if (country) setHoveredCountry(country);
                  }}
                  onMouseLeave={() => setHoveredCountry(null)}
                  onClick={() => {
                    if (country) onSelectCountry(country);
                  }}
                />
              );
            })}
          </g>

          {/* Unified High-Fidelity Cartographic Boundaries Mesh (No overlaps, crisp thin stroke) */}
          {bordersMeshPath && (
            <path
              d={bordersMeshPath}
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.5"
              strokeOpacity="0.85"
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              strokeLinecap="round"
              pointerEvents="none"
              className="boundaries-mesh"
            />
          )}

          {/* Political Subdivisions Dynamic Layer (States, Provinces, Departments in Ultra HD SVG Style) */}
          {layers.showSubdivisions !== false && (
            <g className="subdivisions-layer">
              {(() => {
                // Focus subdivisions strictly on selected and hovered country to avoid artificial global mesh clutter
                const countriesToRender = new Set<Country>();
                if (selectedCountry) countriesToRender.add(selectedCountry);
                if (hoveredCountry && hoveredCountry.id !== selectedCountry?.id) countriesToRender.add(hoveredCountry);

                // Dynamic inverse scale factor for zoom-adaptive sharpness
                const lineWidth = Math.max(0.4, Math.min(1.0, 0.7 / Math.pow(zoomLevel, 0.35)));

                return Array.from(countriesToRender).map((cntry) => {
                  const isCountrySelected = cntry.id === selectedCountry?.id;
                  const isCountryHovered = cntry.id === hoveredCountry?.id;
                  const clipId = `country-clip-${cntry.id.toLowerCase()}`;

                  // Compute 2D territorial boundaries for departments, states, provinces
                  const boundaries = subdivisionBoundaryService.generate2DBoundaries(
                    cntry,
                    (coords) => projection(coords),
                    [-200, -200, width + 200, height + 200]
                  );

                  if (!boundaries) return null;

                  return (
                    <g key={`sub-group-${cntry.id}`} className="country-subdivisions">
                      {/* Department / State Territorial Polygons & Dividing Lines clipped cleanly to Country Borders */}
                      <g clipPath={`url(#${clipId})`} className="subdivision-boundaries">
                        {/* 1. Interactive Territorially Colored Region Cells */}
                        {boundaries.cells.map((cell, cIdx) => {
                          if (!cell.cellPath) return null;
                          const isSubHovered =
                            hoveredSubdivision?.sub.name === cell.subdivision.name &&
                            hoveredSubdivision?.country.id === cntry.id;
                          const baseColor = getSubdivisionColor(cell.subdivision.id, cIdx);

                          return (
                            <path
                              key={`sub-cell-${cntry.id}-${cell.subdivision.id || cIdx}`}
                              d={cell.cellPath}
                              fill={baseColor}
                              fillOpacity={isSubHovered ? 1 : isCountrySelected ? 0.92 : 0.82}
                              stroke="#ffffff"
                              strokeWidth={isSubHovered ? lineWidth * 1.2 : lineWidth * 0.6}
                              strokeLinejoin="round"
                              strokeLinecap="round"
                              className="cursor-pointer transition-all duration-150"
                              onMouseEnter={(e) => {
                                e.stopPropagation();
                                setHoveredSubdivision({ sub: cell.subdivision, country: cntry });
                              }}
                              onMouseLeave={() => setHoveredSubdivision(null)}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectCountry(cntry);
                              }}
                            />
                          );
                        })}

                        {/* 2. Crisp High-Definition Internal Dividing Boundary Lines */}
                        {boundaries.dividingLinesPath && (
                          <path
                            d={boundaries.dividingLinesPath}
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth={lineWidth * 0.75}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeOpacity={0.9}
                            pointerEvents="none"
                          />
                        )}
                      </g>

                      {/* 3. Administrative Capital Pins & Territorial Badges for Selected Country */}
                      {isCountrySelected && (
                        <g className="subdivision-pins pointer-events-none">
                          {boundaries.cells.map((cell, cIdx) => {
                            const sub = cell.subdivision;
                            const pt = cell.centerPt;
                            if (!pt || pt[0] < -20 || pt[0] > width + 20 || pt[1] < -20 || pt[1] > height + 20) return null;
                            const isSubHovered =
                              hoveredSubdivision?.sub.name === sub.name &&
                              hoveredSubdivision?.country.id === cntry.id;
                            const pinScale = Math.max(0.5, Math.min(1.15, 1.1 / Math.pow(zoomLevel, 0.35)));

                            return (
                              <g
                                key={`sub-pin-node-${cntry.id}-${sub.id || cIdx}`}
                                transform={`translate(${pt[0]}, ${pt[1]}) scale(${pinScale})`}
                              >
                                <circle
                                  r={isSubHovered ? 8 : 4.5}
                                  fill={isSubHovered ? '#facc15' : '#ffffff'}
                                  stroke={isSubHovered ? '#78350f' : '#0284c7'}
                                  strokeWidth={1.4}
                                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.85))' }}
                                />
                                {sub.capital && (
                                  <circle
                                    r={1.8}
                                    fill={isSubHovered ? '#78350f' : '#0369a1'}
                                  />
                                )}
                              </g>
                            );
                          })}
                        </g>
                      )}
                    </g>
                  );
                });
              })()}
            </g>
          )}

          {/* Island Nations & Overseas Territories Interactive Markers Layer */}
          {layers.showIslands !== false && (
            <g className="islands-territories-layer">
              {countries
                .filter((c) => c.isIsland || c.isTerritory)
                .map((island) => {
                  const pt = projection([island.lng, island.lat]);
                  if (!pt) return null;
                  if (pt[0] < -30 || pt[0] > width + 30 || pt[1] < -30 || pt[1] > height + 30) return null;

                  const isSelected = selectedCountry?.id === island.id;
                  const isHovered = hoveredCountry?.id === island.id;
                  const markerScale = Math.max(0.5, Math.min(1.0, 1.1 / Math.pow(zoomLevel, 0.3)));

                  return (
                    <g
                      key={`island-${island.id}`}
                      transform={`translate(${pt[0]}, ${pt[1]})`}
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredCountry(island)}
                      onMouseLeave={() => setHoveredCountry(null)}
                      onClick={() => onSelectCountry(island)}
                    >
                      <circle
                        r={(isSelected ? 6 : isHovered ? 4.8 : 3.2) * markerScale}
                        fill={isSelected ? '#facc15' : island.isTerritory ? '#ec4899' : '#10b981'}
                        stroke="#ffffff"
                        strokeWidth={(isSelected ? 1.6 : 0.8) * markerScale}
                        opacity={isSelected ? 1 : 0.9}
                      />
                      {(isSelected || isHovered) && (
                        <circle
                          r={10 * markerScale}
                          fill="none"
                          stroke={isSelected ? '#facc15' : island.isTerritory ? '#ec4899' : '#10b981'}
                          strokeWidth={1 * markerScale}
                          opacity={0.6}
                          className="animate-ping"
                        />
                      )}
                    </g>
                  );
                })}
            </g>
          )}

          {/* Dedicated National Capitals Star Markers Layer */}
          <g className="national-capitals-layer">
            {countries.map((c) => {
              if (!c.capitalEs) return null;
              const pt = projection([c.lng, c.lat]);
              if (!pt) return null;
              if (pt[0] < -30 || pt[0] > width + 30 || pt[1] < -30 || pt[1] > height + 30) return null;

              const isSelected = selectedCountry?.id === c.id;
              const isHovered = hoveredCountry?.id === c.id;
              const starScale = Math.max(0.3, Math.min(1.0, 1.0 / Math.pow(zoomLevel, 0.4)));

              return (
                <g
                  key={`capital-star-${c.id}`}
                  transform={`translate(${pt[0]}, ${pt[1]})`}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCountry(c);
                  }}
                  onMouseEnter={() => setHoveredCountry(c)}
                  onMouseLeave={() => setHoveredCountry(null)}
                >
                  {/* Glowing halo when selected */}
                  {isSelected && (
                    <circle
                      r={14 * starScale}
                      fill="rgba(250, 204, 21, 0.25)"
                      stroke="#facc15"
                      strokeWidth={1 * starScale}
                      className="animate-pulse"
                    />
                  )}
                  {/* Capital Pin Point */}
                  <circle
                    r={(isSelected ? 5.5 : isHovered ? 4.5 : 3.0) * starScale}
                    fill={isSelected ? '#facc15' : '#38bdf8'}
                    stroke="#ffffff"
                    strokeWidth={(isSelected ? 1.5 : 0.8) * starScale}
                    style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.7))' }}
                  />
                  {/* Star Icon Glyph */}
                  <text
                    textAnchor="middle"
                    dy={2.5 * starScale}
                    fontSize={6 * starScale}
                    fill={isSelected ? '#78350f' : '#0f172a'}
                    fontWeight="900"
                    className="select-none pointer-events-none"
                  >
                    ★
                  </text>
                </g>
              );
            })}
          </g>

          {/* Zoom-Adaptive, Anti-Collision Smart Label Engine for Countries, National Capitals & Political Divisions */}
          {layers.showCountryLabels !== false && (
            <g className="smart-labels-layer pointer-events-none">
              {(() => {
                interface PlacedBox {
                  x1: number;
                  y1: number;
                  x2: number;
                  y2: number;
                  priority: number;
                }
                const placedBoxes: PlacedBox[] = [];

                // Check spatial bounding box collision
                const hasCollision = (b: PlacedBox, buffer: number = 3) => {
                  for (const p of placedBoxes) {
                    if (
                      b.x1 - buffer < p.x2 &&
                      b.x2 + buffer > p.x1 &&
                      b.y1 - buffer < p.y2 &&
                      b.y2 + buffer > p.y1
                    ) {
                      return true;
                    }
                  }
                  return false;
                };

                const elementsToRender: React.ReactNode[] = [];
                const labelScale = Math.max(0.42, Math.min(1.25, 1.2 / Math.pow(zoomLevel, 0.35)));

                // 1. Build Candidate Country Labels
                interface CountryCandidate {
                  type: 'country';
                  country: Country;
                  pt: [number, number];
                  priority: number;
                }
                const countryCandidates: CountryCandidate[] = [];

                countries.forEach((c) => {
                  const centroid = geoDataService.getCountryCentroid(c.id);
                  const lng = centroid ? centroid[0] : c.lng;
                  const lat = centroid ? centroid[1] : c.lat;
                  const pt = projection([lng, lat]);
                  if (!pt || !Number.isFinite(pt[0]) || !Number.isFinite(pt[1])) return;
                  if (pt[0] < -40 || pt[0] > width + 40 || pt[1] < -40 || pt[1] > height + 40) return;

                  const isSelected = selectedCountry?.id === c.id;
                  const isHovered = hoveredCountry?.id === c.id;

                  let priority = isSelected ? 1200 : isHovered ? 1000 : 150;
                  if (!isSelected && !isHovered) {
                    priority += Math.min(250, Math.sqrt(c.areaKm2) / 80) + Math.min(150, c.population / 8000000);
                  }

                  countryCandidates.push({
                    type: 'country',
                    country: c,
                    pt,
                    priority
                  });
                });

                // Sort countries by priority descending
                countryCandidates.sort((a, b) => b.priority - a.priority);

                // 2. Build Candidate Political Subdivision Labels (Only for selected/hovered or when zoomed in)
                interface SubCandidate {
                  type: 'subdivision';
                  sub: PoliticalSubdivision;
                  country: Country;
                  pt: [number, number];
                  priority: number;
                }
                const subCandidates: SubCandidate[] = [];

                if (layers.showSubdivisions !== false) {
                  const targetCountries = new Set<Country>();
                  if (selectedCountry) targetCountries.add(selectedCountry);
                  if (hoveredCountry) targetCountries.add(hoveredCountry);

                  // Only include additional countries if sufficiently zoomed in to avoid clutter
                  if (zoomLevel >= 2.0) {
                    const sorted = [...countries].sort((a, b) => b.areaKm2 - a.areaKm2);
                    const limit = zoomLevel >= 4.0 ? 90 : 35;
                    sorted.slice(0, limit).forEach((c) => targetCountries.add(c));
                  }

                  targetCountries.forEach((cntry) => {
                    const structure = getCountryPoliticalStructure(cntry);
                    const isParentSelected = cntry.id === selectedCountry?.id;

                    structure.subdivisions.forEach((sub) => {
                      const pt = projection([sub.lng, sub.lat]);
                      if (!pt) return;
                      if (pt[0] < -40 || pt[0] > width + 40 || pt[1] < -40 || pt[1] > height + 40) return;

                      const isSubHovered = hoveredSubdivision?.sub.name === sub.name && hoveredSubdivision?.country.id === cntry.id;
                      let priority = isSubHovered ? 980 : isParentSelected ? 800 : 300;
                      if (sub.isCapitalRegion) priority += 120;

                      subCandidates.push({
                        type: 'subdivision',
                        sub,
                        country: cntry,
                        pt,
                        priority
                      });
                    });
                  });
                }

                // Sort subdivisions by priority descending
                subCandidates.sort((a, b) => b.priority - a.priority);

                // --- Place Country Labels with Anti-Collision ---
                countryCandidates.forEach(({ country: c, pt, priority }) => {
                  const isSelected = selectedCountry?.id === c.id;
                  const isHovered = hoveredCountry?.id === c.id;

                  // High-contrast badge dimensions: Clear, readable, non-crowded
                  const showCapital = Boolean(c.capitalEs) && (isSelected || isHovered || zoomLevel >= 2.2);
                  const fontSize = (isSelected ? 13.5 : 11.5) * labelScale;
                  const capFontSize = (isSelected ? 10.0 : 9.0) * labelScale;
                  const charWidth = 6.2 * labelScale;
                  const labelWidth = Math.max(c.nameEs.length + 2, showCapital ? c.capitalEs.length + 4 : 0) * charWidth + 16 * labelScale;
                  const labelHeight = (showCapital ? 32 : 19) * labelScale;

                  const box: PlacedBox = {
                    x1: pt[0] - labelWidth / 2,
                    y1: pt[1] - labelHeight / 2,
                    x2: pt[0] + labelWidth / 2,
                    y2: pt[1] + labelHeight / 2,
                    priority
                  };

                  // Generous buffer to prevent crowding across all countries
                  const collisionBuffer = (zoomLevel < 1.3 ? 8 : 5) * labelScale;
                  if (!isSelected && hasCollision(box, collisionBuffer)) {
                    return; // Skip overlapping country label to maintain spacious, pristine layout
                  }

                  placedBoxes.push(box);

                  elementsToRender.push(
                    <g
                      key={`lbl-c-${c.id}`}
                      transform={`translate(${pt[0]}, ${pt[1]})`}
                      className="cursor-pointer group select-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCountry(c);
                      }}
                      onMouseEnter={() => setHoveredCountry(c)}
                      onMouseLeave={() => setHoveredCountry(null)}
                    >
                      {/* Pill Badge Container */}
                      <rect
                        x={-labelWidth / 2}
                        y={-labelHeight / 2}
                        width={labelWidth}
                        height={labelHeight}
                        rx={6 * labelScale}
                        fill={
                          isSelected
                            ? 'rgba(250, 204, 21, 0.98)'
                            : isHovered
                            ? 'rgba(14, 165, 233, 0.98)'
                            : 'rgba(2, 6, 23, 0.92)'
                        }
                        stroke={isSelected ? '#ffffff' : isHovered ? '#38bdf8' : 'rgba(250, 204, 21, 0.45)'}
                        strokeWidth={(isSelected ? 2.0 : 1.2) * labelScale}
                        style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.7))' }}
                      />
                      {/* Country Name */}
                      <text
                        textAnchor="middle"
                        dy={showCapital ? -3.5 * labelScale : 4.5 * labelScale}
                        fontSize={fontSize}
                        fontWeight="900"
                        fill={isSelected ? '#0f172a' : '#ffffff'}
                        className="select-none font-sans tracking-wide"
                      >
                        {c.nameEs}
                      </text>
                      {/* National Capital with Gold Star */}
                      {showCapital && (
                        <text
                          textAnchor="middle"
                          dy={11.5 * labelScale}
                          fontSize={capFontSize}
                          fontWeight="700"
                          fill={isSelected ? '#78350f' : '#facc15'}
                          className="select-none font-sans"
                        >
                          ★ {c.capitalEs}
                        </text>
                      )}
                    </g>
                  );
                });

                // --- Place Political Subdivision Labels with Anti-Collision ---
                subCandidates.forEach(({ sub, country: cntry, pt, priority }) => {
                  const isSubHovered = hoveredSubdivision?.sub.name === sub.name && hoveredSubdivision?.country.id === cntry.id;
                  const isParentSelected = cntry.id === selectedCountry?.id;

                  const showSubCapital = Boolean(sub.capital);
                  const subFontSize = (isParentSelected || isSubHovered ? 12.0 : 10.8) * labelScale;
                  const subCapFontSize = (isParentSelected || isSubHovered ? 9.8 : 8.8) * labelScale;
                  const charWidth = 6.0 * labelScale;

                  // Label text with department/state name
                  const subLabelText = `${sub.badge ? sub.badge + ' ' : ''}${sub.name}`;
                  const labelWidth = Math.max(subLabelText.length + 2, showSubCapital ? (sub.capital?.length || 0) + 4 : 0) * charWidth + 16 * labelScale;
                  const labelHeight = (showSubCapital ? 30 : 18) * labelScale;

                  const box: PlacedBox = {
                    x1: pt[0] - labelWidth / 2,
                    y1: pt[1] - labelHeight - 5 * labelScale,
                    x2: pt[0] + labelWidth / 2,
                    y2: pt[1] - 5 * labelScale,
                    priority
                  };

                  if (priority < 850 && hasCollision(box, 4 * labelScale)) {
                    return; // Skip overlapping subdivision label to maintain pristine clarity
                  }

                  placedBoxes.push(box);

                  elementsToRender.push(
                    <g
                      key={`lbl-sub-${cntry.id}-${sub.id}`}
                      transform={`translate(${pt[0]}, ${pt[1] - 8 * labelScale})`}
                      className="cursor-pointer select-none"
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        setHoveredSubdivision({ sub, country: cntry });
                      }}
                      onMouseLeave={() => setHoveredSubdivision(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCountry(cntry);
                        if (onOpenPoliticalSheet) onOpenPoliticalSheet(cntry);
                      }}
                    >
                      {/* Subdivision Pill Box */}
                      <rect
                        x={-labelWidth / 2}
                        y={-labelHeight}
                        width={labelWidth}
                        height={labelHeight}
                        rx={5 * labelScale}
                        fill={
                          isSubHovered
                            ? 'rgba(56, 189, 248, 0.98)'
                            : isParentSelected
                            ? sub.isCapitalRegion
                              ? 'rgba(250, 204, 21, 0.95)'
                              : 'rgba(30, 41, 59, 0.95)'
                            : sub.isCapitalRegion
                            ? 'rgba(30, 41, 59, 0.92)'
                            : 'rgba(15, 23, 42, 0.88)'
                        }
                        stroke={
                          isParentSelected && sub.isCapitalRegion
                            ? '#ffffff'
                            : sub.isCapitalRegion
                            ? '#facc15'
                            : isSubHovered
                            ? '#ffffff'
                            : 'rgba(56, 189, 248, 0.45)'
                        }
                        strokeWidth={(isParentSelected || isSubHovered ? 1.2 : 0.8) * labelScale}
                        style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.65))' }}
                      />
                      {/* Subdivision Name (Department, State, Province) */}
                      <text
                        textAnchor="middle"
                        y={showSubCapital ? -labelHeight + 11 * labelScale : -labelHeight + 12.5 * labelScale}
                        fontSize={subFontSize}
                        fontWeight="bold"
                        fill={isSubHovered ? '#0f172a' : isParentSelected && sub.isCapitalRegion ? '#0f172a' : '#f8fafc'}
                        className="select-none font-sans"
                      >
                        {subLabelText}
                      </text>
                      {/* Regional Department Capital (e.g. ★ Sevilla, ★ Guadalajara, ★ Sacramento, ★ Medellín) */}
                      {showSubCapital && (
                        <text
                          textAnchor="middle"
                          y={-labelHeight + 23 * labelScale}
                          fontSize={subCapFontSize}
                          fontWeight="600"
                          fill={isSubHovered ? '#082f49' : isParentSelected && sub.isCapitalRegion ? '#78350f' : sub.isCapitalRegion ? '#fde047' : '#93c5fd'}
                          className="select-none font-sans"
                        >
                          ★ {sub.capital}
                        </text>
                      )}
                    </g>
                  );
                });

                return elementsToRender;
              })()}
            </g>
          )}

          {/* Geodesic Great Circle Flight Arc */}
          {routePath && layers.showGreatCircleArc && (
            <g className="flight-route-layer">
              <path
                d={routePath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeDasharray="6,4"
                filter="url(#glow)"
                className="animate-pulse"
              />
            </g>
          )}

          {/* Selected Country & Destination Markers */}
          {selectedCountry && (
            <g className="markers-layer">
              {(() => {
                const pt = projection([selectedCountry.lng, selectedCountry.lat]);
                if (!pt) return null;
                return (
                  <g transform={`translate(${pt[0]}, ${pt[1]})`}>
                    <circle r="7" fill="#facc15" opacity="0.4" className="animate-ping" />
                    <circle r="4" fill="#facc15" stroke="#ffffff" strokeWidth="1.5" />
                  </g>
                );
              })()}
            </g>
          )}

          {targetDestinationCountry && (
            <g className="dest-marker-layer">
              {(() => {
                const pt = projection([targetDestinationCountry.lng, targetDestinationCountry.lat]);
                if (!pt) return null;
                return (
                  <g transform={`translate(${pt[0]}, ${pt[1]})`}>
                    <circle r="7" fill="#38bdf8" opacity="0.4" className="animate-ping" />
                    <circle r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                  </g>
                );
              })()}
            </g>
          )}

          {/* Orthographic 3D Atmosphere Shading */}
          {projectionType === 'orthographic' && (
            <circle
              cx={width / 2 + panOffset.x}
              cy={height / 2 + panOffset.y}
              r={230 * zoomLevel}
              fill="url(#sphereShading)"
              pointerEvents="none"
            />
          )}
        </svg>

        {/* Hover Country Tooltip (Intelligently offset to avoid obstructing the hovered country or cursor) */}
        {hoveredCountry && !hoveredSubdivision && tooltipPos && (() => {
          const isNearRight = tooltipPos.x > width - 240;
          const isNearBottom = tooltipPos.y > height - 80;
          const isNearTop = tooltipPos.y < 60;
          const posX = isNearRight ? tooltipPos.x - 16 : tooltipPos.x + 16;
          const posY = isNearTop ? tooltipPos.y + 16 : isNearBottom ? tooltipPos.y - 16 : tooltipPos.y;
          const transformClass = isNearRight
            ? isNearBottom ? '-translate-x-full -translate-y-full' : isNearTop ? '-translate-x-full translate-y-0' : '-translate-x-full -translate-y-1/2'
            : isNearBottom ? 'translate-x-0 -translate-y-full' : isNearTop ? 'translate-x-0 translate-y-0' : 'translate-x-0 -translate-y-1/2';

          return (
            <div
              className={`absolute z-30 pointer-events-none transform ${transformClass} bg-slate-950/85 backdrop-blur-md text-white px-3 py-2 rounded-xl border border-sky-500/40 shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in duration-150 whitespace-nowrap`}
              style={{ left: posX, top: posY }}
            >
              <img
                src={`https://flagcdn.com/${hoveredCountry.id}.svg`}
                alt={hoveredCountry.nameEs}
                className="w-6 h-4 object-cover rounded shadow border border-white/20 flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="font-bold text-white leading-tight">{hoveredCountry.nameEs}</p>
                <p className="text-sky-400 font-medium text-[11px] leading-tight">
                  {hoveredCountry.capitalEs} • {hoveredCountry.continent}
                </p>
                <p className="text-[9px] text-slate-400 font-mono leading-tight mt-0.5">
                  {countryService.formatCoordinatesDMS(hoveredCountry.lat, hoveredCountry.lng)}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Hover Political Subdivision Detailed Tooltip (Intelligently offset to avoid obstructing territory) */}
        {hoveredSubdivision && tooltipPos && (() => {
          const isNearRight = tooltipPos.x > width - 280;
          const isNearBottom = tooltipPos.y > height - 160;
          const isNearTop = tooltipPos.y < 80;
          const posX = isNearRight ? tooltipPos.x - 16 : tooltipPos.x + 16;
          const posY = isNearTop ? tooltipPos.y + 16 : isNearBottom ? tooltipPos.y - 16 : tooltipPos.y;
          const transformClass = isNearRight
            ? isNearBottom ? '-translate-x-full -translate-y-full' : isNearTop ? '-translate-x-full translate-y-0' : '-translate-x-full -translate-y-1/2'
            : isNearBottom ? 'translate-x-0 -translate-y-full' : isNearTop ? 'translate-x-0 translate-y-0' : 'translate-x-0 -translate-y-1/2';

          return (
            <div
              className={`absolute z-40 pointer-events-none transform ${transformClass} bg-slate-950/90 backdrop-blur-md text-white p-2.5 rounded-xl border border-amber-500/50 shadow-2xl text-xs max-w-xs animate-in fade-in duration-150 space-y-1.5`}
              style={{ left: posX, top: posY }}
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <img
                    src={`https://flagcdn.com/${hoveredSubdivision.country.id}.svg`}
                    alt={hoveredSubdivision.country.nameEs}
                    className="w-4 h-3 object-cover rounded border border-white/20 flex-shrink-0"
                  />
                  <span className="font-bold text-white text-xs truncate">{hoveredSubdivision.sub.name}</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded font-semibold border border-amber-500/30 flex-shrink-0">
                  {hoveredSubdivision.sub.code}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                <div>
                  <span className="text-slate-400">Tipo: </span>
                  <span className="text-slate-200 font-medium">{hoveredSubdivision.sub.type}</span>
                </div>
                <div>
                  <span className="text-slate-400">Capital: </span>
                  <span className="text-amber-300 font-bold">★ {hoveredSubdivision.sub.capital}</span>
                </div>
                <div>
                  <span className="text-slate-400">Población: </span>
                  <span className="text-slate-200 font-mono">{hoveredSubdivision.sub.population.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400">Superficie: </span>
                  <span className="text-slate-200 font-mono">{hoveredSubdivision.sub.areaKm2.toLocaleString()} km²</span>
                </div>
              </div>

              {hoveredSubdivision.sub.triviaEs && (
                <p className="text-[9px] text-sky-300 bg-sky-950/40 p-1 rounded border border-sky-500/20 italic">
                  "{hoveredSubdivision.sub.triviaEs}"
                </p>
              )}
            </div>
          );
        })()}

        {/* Real-time Flight Route HUD Badge */}
        {routeInfo && (
          <div className="absolute top-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md border border-sky-500/30 rounded-2xl p-3 shadow-2xl text-xs max-w-xs">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5 mb-1.5">
              <div className="flex items-center gap-1.5 text-sky-400 font-bold">
                <Plane className="w-3.5 h-3.5" />
                <span>Ruta Geodésica Vectorial</span>
              </div>
              {onSelectDestinationCountry && (
                <button
                  onClick={() => onSelectDestinationCountry(null)}
                  className="text-slate-400 hover:text-white text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>
            <p className="font-semibold text-white truncate">
              {routeInfo.from.nameEs} ➔ {routeInfo.to.nameEs}
            </p>
            <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono text-sky-300">
              <span>{routeInfo.distanceKm.toLocaleString()} km</span>
              <span>•</span>
              <span>{routeInfo.initialBearingDeg}° {routeInfo.initialBearingCardinal}</span>
            </div>
          </div>
        )}

        {/* Floating Zoom Controls & Reset with Infinite Zoom Presets */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1 rounded-2xl shadow-2xl">
          <button
            onClick={() => {
              setZoomLevel(1);
              setPanOffset({ x: 0, y: 0 });
              setOrthoRotation([0, 0]);
            }}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700 hover:text-white hover:bg-slate-700 transition-all text-xs font-semibold flex items-center gap-1"
            title="Restablecer Vista Centrada"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Centrar</span>
          </button>

          <div className="w-[1px] h-4 bg-slate-800" />

          {/* Quick Presets */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => setZoomLevel(1)}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                zoomLevel <= 1.5 ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-white'
              }`}
              title="Escala 1x Global"
            >
              1x
            </button>
            <button
              onClick={() => setZoomLevel(5)}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                zoomLevel > 1.5 && zoomLevel <= 10 ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-white'
              }`}
              title="Escala 5x Continental"
            >
              5x
            </button>
            <button
              onClick={() => setZoomLevel(25)}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                zoomLevel > 10 && zoomLevel < 50 ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-white'
              }`}
              title="Escala 25x Regional"
            >
              25x
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1 ${
                zoomLevel >= 50 ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-white shadow-md' : 'text-cyan-400 hover:bg-cyan-500/10'
              }`}
              title="Zoom Infinito 100x"
            >
              <InfinityIcon className="w-3 h-3" />
              <span>Infinito</span>
            </button>
          </div>

          <div className="w-[1px] h-4 bg-slate-800" />

          {/* Live Zoom Multiplier Pill */}
          <div className="px-2 py-1 text-[11px] font-mono text-cyan-300 font-bold hidden md:inline">
            {zoomLevel < 10 ? `${zoomLevel.toFixed(1)}x` : `${Math.round(zoomLevel)}x`}
          </div>

          <button
            onClick={() => setZoomLevel((z) => Math.min(250, z * 1.35))}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700 hover:text-white hover:bg-slate-700 transition-all"
            title="Acercar (Zoom In - o usa Rueda del Ratón / Doble Click)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setZoomLevel((z) => Math.max(0.4, z / 1.35))}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700 hover:text-white hover:bg-slate-700 transition-all"
            title="Alejar (Zoom Out)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 100% Real Cartography Seal */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-slate-800/90 text-slate-300 px-3.5 py-1.5 rounded-2xl shadow-xl text-xs">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-semibold text-white">Cartografía Vectorial 100% Real</span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">Natural Earth WGS84 TopoJSON</span>
        </div>
      </div>
    </div>
  );
};
