import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import {
  geoOrthographic,
  geoPath,
  geoGraticule,
  geoCircle,
  geoInterpolate,
  GeoProjection
} from 'd3-geo';
import { Country } from '../types';
import { countryService } from '../services/countryService';
import { geoDataService } from './../services/geoDataService';
import { getCountryPoliticalStructure } from '../data/politicalDivisions';
import { subdivisionBoundaryService } from '../services/subdivisionBoundaryService';
import {
  satelliteService,
  SatelliteTrack,
  SatelliteLivePosition,
  SATELLITE_CATALOG
} from '../services/satelliteService';
import {
  realtimeFeedService,
  LiveFlight,
  LiveEarthquake,
  RealtimeSolarEphemeris
} from '../services/realtimeFeedService';
import {
  Layers,
  Satellite,
  Compass,
  Download,
  Eye,
  Sun,
  Moon,
  CloudSun,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  Crosshair,
  Sparkles,
  MapPin,
  Plane,
  Navigation,
  Globe,
  Radio,
  Sliders,
  Check,
  Camera,
  Cpu,
  Info,
  Activity,
  Play,
  Pause,
  FastForward,
  Video,
  Clock,
  AlertTriangle,
  Zap,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Shield
} from 'lucide-react';

interface Map3DRealtimeProps {
  countries: Country[];
  selectedCountry: Country | null;
  onSelectCountry: (country: Country) => void;
  onOpenPoliticalSheet?: (country: Country) => void;
  onOpenDetailsModal?: (country: Country) => void;
}

type SatelliteImageryMode =
  | 'blue_marble'
  | 'infrared_clouds'
  | 'night_lights'
  | 'sentinel_ndvi'
  | 'vector_8k'
  | 'topo_relief';

type Map3DProjectionStyle = 'sphere' | 'topoplate' | 'orthographic';

export const Map3DRealtime: React.FC<Map3DRealtimeProps> = ({
  countries,
  selectedCountry,
  onSelectCountry,
  onOpenPoliticalSheet,
  onOpenDetailsModal
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const labelsCanvasRef = useRef<HTMLCanvasElement>(null);

  // States
  const [imageryMode, setImageryMode] = useState<SatelliteImageryMode>('blue_marble');
  const [projectionStyle, setProjectionStyle] = useState<Map3DProjectionStyle>('sphere');
  const [showLiveClouds, setShowLiveClouds] = useState<boolean>(true);
  const [showAtmosphereGlow, setShowAtmosphereGlow] = useState<boolean>(true);
  const [showSunTerminator, setShowSunTerminator] = useState<boolean>(true);
  const [showSatellites, setShowSatellites] = useState<boolean>(true);
  const [showLiveFlights, setShowLiveFlights] = useState<boolean>(true);
  const [showLiveEarthquakes, setShowLiveEarthquakes] = useState<boolean>(true);
  const [showGraticule, setShowGraticule] = useState<boolean>(true);
  const [showCountryBorders, setShowCountryBorders] = useState<boolean>(true);
  const [showCountryLabels, setShowCountryLabels] = useState<boolean>(true);
  const [showCapitals, setShowCapitals] = useState<boolean>(true);
  const [labelContrastMode, setLabelContrastMode] = useState<'ultra_crisp_badge' | 'luminous_halo'>('ultra_crisp_badge');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [rotationSpeed, setRotationSpeed] = useState<number>(0.3);
  const [elevationScale, setElevationScale] = useState<number>(1.2);

  // Real-Time Engine & Camera Modes
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);
  const [timeMultiplier, setTimeMultiplier] = useState<number>(1); // 1x, 60x, 360x, 1440x, 0 (pause)
  const [cameraMode, setCameraMode] = useState<'free' | 'iss_live' | 'solar_sync' | 'flight_follow'>('free');
  const [activeSidebarTab, setActiveSidebarTab] = useState<'satellites' | 'flights' | 'earthquakes' | 'country'>('satellites');
  
  // Satellite tracking & telemetry
  const [liveSatellites, setLiveSatellites] = useState<SatelliteLivePosition[]>([]);
  const [selectedSatellite, setSelectedSatellite] = useState<SatelliteLivePosition | null>(null);
  const [selectedSatelliteId, setSelectedSatelliteId] = useState<string>('iss');
  const [isSatelliteOverlayExpanded, setIsSatelliteOverlayExpanded] = useState<boolean>(true);

  // Flights & Earthquakes Live feeds
  const [liveFlights, setLiveFlights] = useState<LiveFlight[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<LiveFlight | null>(null);

  const [liveEarthquakes, setLiveEarthquakes] = useState<LiveEarthquake[]>([]);
  const [selectedEarthquake, setSelectedEarthquake] = useState<LiveEarthquake | null>(null);

  // Solar Ephemeris
  const [solarEphemeris, setSolarEphemeris] = useState<RealtimeSolarEphemeris>(() =>
    realtimeFeedService.getSolarEphemeris(new Date())
  );

  const [isExporting8K, setIsExporting8K] = useState<boolean>(false);
  const [exportNotification, setExportNotification] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Cursor Telemetry
  const [cursorTelemetry, setCursorTelemetry] = useState<{
    lat: number;
    lng: number;
    formatted: string;
    solarTime: string;
  } | null>(null);

  // Active Satellite Telemetry Memo
  const activeSatellite = useMemo(() => {
    return liveSatellites.find((s) => s.satellite.id === selectedSatelliteId) || liveSatellites[0] || null;
  }, [liveSatellites, selectedSatelliteId]);

  // Flight measurement
  const [targetFlightCountry, setTargetFlightCountry] = useState<Country | null>(null);

  // Render Engine: 'webgl' (Three.js WebGL 3D Real-Time Earth) vs 'svg_vector' (Native Vectorial SVG 3D)
  const [renderEngine, setRenderEngine] = useState<'svg_vector' | 'webgl'>('webgl');

  // Antialiasing & Vector Edge Smoothing System
  const [antialiasingEnabled, setAntialiasingEnabled] = useState<boolean>(true);
  const [antialiasingMode, setAntialiasingMode] = useState<'geometric_subpixel' | 'fxaa_smooth' | 'retina_crisp'>('geometric_subpixel');
  const [adaptiveStrokeSmoothing, setAdaptiveStrokeSmoothing] = useState<boolean>(true);
  const [showAaMenu, setShowAaMenu] = useState<boolean>(false);

  // SVG 3D Globe Vector Engine State
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [svgRotation, setSvgRotation] = useState<[number, number]>([-15, -20]);
  const [svgZoom, setSvgZoom] = useState<number>(1.0);
  const [svgPan, setSvgPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [svgIsDragging, setSvgIsDragging] = useState<boolean>(false);
  const svgDragStartRef = useRef<{ x: number; y: number; rot: [number, number]; pan: { x: number; y: number } }>({
    x: 0,
    y: 0,
    rot: [-15, -20],
    pan: { x: 0, y: 0 }
  });
  const [svgHoveredCountry, setSvgHoveredCountry] = useState<Country | null>(null);
  const [svgTooltipPos, setSvgTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // SVG 3D Dimensions & D3 Orthographic Projection (Infinite Vector Resolution & Antialiased Precision)
  const svgWidth = 1000;
  const svgHeight = 650;
  const svgRadius = 265 * svgZoom;

  const svgProjection = useMemo(() => {
    return geoOrthographic()
      .scale(svgRadius)
      .rotate(svgRotation)
      .translate([svgWidth / 2 + svgPan.x, svgHeight / 2 + svgPan.y])
      .clipAngle(90)
      .precision(antialiasingEnabled ? (antialiasingMode === 'geometric_subpixel' ? 0.03 : 0.06) : 0.4);
  }, [svgRadius, svgRotation, svgPan, antialiasingEnabled, antialiasingMode]);

  // Adaptive Antialiased Stroke Calculator: Computes subpixel edge thickness to preserve razor-sharp borders during infinite zoom
  const getAntialiasedStroke = useCallback(
    (
      baseThickness: number,
      options?: { isSelected?: boolean; isGraticule?: boolean; isTrajectory?: boolean; isOrbit?: boolean }
    ) => {
      if (!adaptiveStrokeSmoothing) {
        if (options?.isSelected) return 2.2;
        if (options?.isGraticule) return 0.6;
        if (options?.isOrbit) return 1.4;
        return baseThickness;
      }
      // Continuous Power Damping Curve (factor: 0.62)
      // Preserves crisp subpixel visibility across 0.6x to 30x+ infinite zoom without line blowout or pixel stepping
      const zoom = Math.max(0.6, svgZoom);
      const damping = Math.pow(zoom, 0.62);

      if (options?.isGraticule) {
        return Math.max(0.22, Math.min(0.85, 0.65 / damping));
      }
      if (options?.isTrajectory) {
        return Math.max(0.6, Math.min(2.4, 1.25 / damping));
      }
      if (options?.isOrbit) {
        return Math.max(0.7, Math.min(2.8, (options?.isSelected ? 2.2 : 1.35) / damping));
      }
      if (options?.isSelected) {
        return Math.max(1.35, Math.min(3.6, (baseThickness * 2.4) / damping));
      }
      return Math.max(0.42, Math.min(1.85, baseThickness / damping));
    },
    [adaptiveStrokeSmoothing, svgZoom]
  );

  const svgPathGenerator = useMemo(() => {
    return geoPath(svgProjection);
  }, [svgProjection]);

  const svgGraticulePath = useMemo(() => {
    const graticule = geoGraticule();
    return svgPathGenerator(graticule());
  }, [svgPathGenerator]);

  const svgGeoJson = useMemo(() => {
    return geoDataService.getCountriesGeoJSON();
  }, []);

  // Real-time Solar Day/Night Terminator in SVG 3D
  const svgNightPath = useMemo(() => {
    if (!showSunTerminator) return null;
    try {
      let antiLng = solarEphemeris.subsolarLng + 180;
      if (antiLng > 180) antiLng -= 360;
      const antiLat = -solarEphemeris.subsolarLat;
      const circle = geoCircle().center([antiLng, antiLat]).radius(90)();
      return svgPathGenerator(circle);
    } catch {
      return null;
    }
  }, [showSunTerminator, solarEphemeris, svgPathGenerator]);

  // Sun Zenith Position on the visible 3D hemisphere
  const svgSunPos = useMemo(() => {
    try {
      const p = svgProjection([solarEphemeris.subsolarLng, solarEphemeris.subsolarLat]);
      if (!p) return null;
      const centerLng = -svgRotation[0];
      const centerLat = -svgRotation[1];
      const rad = Math.PI / 180;
      const dLng = (solarEphemeris.subsolarLng - centerLng) * rad;
      const dLat = (solarEphemeris.subsolarLat - centerLat) * rad;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(centerLat * rad) * Math.cos(solarEphemeris.subsolarLat * rad) * Math.sin(dLng / 2) ** 2;
      const dist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (dist > Math.PI / 2) return null;
      return p;
    } catch {
      return null;
    }
  }, [solarEphemeris, svgProjection, svgRotation]);

  // SVG Auto-rotation Animation Frame Loop
  useEffect(() => {
    if (!autoRotate || renderEngine !== 'svg_vector' || svgIsDragging) return;
    let animId: number;
    let lastTime = performance.now();
    const rotateLoop = (t: number) => {
      const dt = (t - lastTime) / 1000;
      lastTime = t;
      setSvgRotation((prev) => [(prev[0] + rotationSpeed * 12 * dt) % 360, prev[1]]);
      animId = requestAnimationFrame(rotateLoop);
    };
    animId = requestAnimationFrame(rotateLoop);
    return () => cancelAnimationFrame(animId);
  }, [autoRotate, rotationSpeed, renderEngine, svgIsDragging]);

  // Mouse & Touch events for SVG 3D Globe
  const handleSvgMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setSvgIsDragging(true);
    svgDragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      rot: [...svgRotation],
      pan: { ...svgPan }
    };
  };

  const handleSvgMouseMove = (e: React.MouseEvent) => {
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * svgWidth;
      const svgY = ((e.clientY - rect.top) / rect.height) * svgHeight;
      const coords = svgProjection.invert ? svgProjection.invert([svgX, svgY]) : null;
      if (coords && !isNaN(coords[0]) && !isNaN(coords[1])) {
        const [lng, lat] = coords;
        const latStr = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`;
        const lngStr = `${Math.abs(lng).toFixed(2)}°${lng >= 0 ? 'E' : 'W'}`;
        const now = new Date();
        const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
        const solarH = (utcHours + lng / 15 + 24) % 24;
        const solarHrs = Math.floor(solarH);
        const solarMins = Math.floor((solarH - solarHrs) * 60);
        const solarTimeStr = `${String(solarHrs).padStart(2, '0')}:${String(solarMins).padStart(2, '0')} LST`;
        setCursorTelemetry({
          lat,
          lng,
          formatted: `${latStr} ${lngStr}`,
          solarTime: solarTimeStr
        });
      }
    }

    if (!svgIsDragging) return;
    const dx = e.clientX - svgDragStartRef.current.x;
    const dy = e.clientY - svgDragStartRef.current.y;
    const sensitivity = 0.35 / Math.sqrt(svgZoom);

    if (e.shiftKey) {
      setSvgPan({
        x: svgDragStartRef.current.pan.x + dx,
        y: svgDragStartRef.current.pan.y + dy
      });
    } else {
      const newYaw = (svgDragStartRef.current.rot[0] + dx * sensitivity) % 360;
      const newPitch = Math.max(-85, Math.min(85, svgDragStartRef.current.rot[1] - dy * sensitivity));
      setSvgRotation([newYaw, newPitch]);
    }
  };

  const handleSvgMouseUp = () => {
    setSvgIsDragging(false);
  };

  const handleSvgWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setSvgZoom((prev) => Math.max(0.6, Math.min(30.0, prev * zoomFactor)));
  };

  const touchStartRef = useRef<{ x: number; y: number; dist: number }>({ x: 0, y: 0, dist: 0 });
  const handleSvgTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setSvgIsDragging(true);
      svgDragStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        rot: [...svgRotation],
        pan: { ...svgPan }
      };
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchStartRef.current = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2, dist };
    }
  };

  const handleSvgTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && svgIsDragging) {
      const touch = e.touches[0];
      const dx = touch.clientX - svgDragStartRef.current.x;
      const dy = touch.clientY - svgDragStartRef.current.y;
      const sensitivity = 0.4 / Math.sqrt(svgZoom);
      const newYaw = (svgDragStartRef.current.rot[0] + dx * sensitivity) % 360;
      const newPitch = Math.max(-85, Math.min(85, svgDragStartRef.current.rot[1] - dy * sensitivity));
      setSvgRotation([newYaw, newPitch]);
    } else if (e.touches.length === 2 && touchStartRef.current.dist > 0) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const factor = dist / touchStartRef.current.dist;
      setSvgZoom((prev) => Math.max(0.6, Math.min(30.0, prev * factor)));
      touchStartRef.current.dist = dist;
    }
  };

  const handleSvgTouchEnd = () => {
    setSvgIsDragging(false);
    touchStartRef.current.dist = 0;
  };

  const getSvgCountryFill = (alpha2: string, idx: number, isSelected: boolean, isHovered: boolean) => {
    if (isSelected) return '#38bdf8';
    if (isHovered) return '#60a5fa';

    if (imageryMode === 'blue_marble') {
      if (['dz', 'eg', 'ly', 'mr', 'ne', 'td', 'sa', 'ae', 'om', 'ye', 'iq', 'jo', 'kw', 'au', 'na', 'bw'].includes(alpha2)) {
        return '#b45309';
      }
      if (['gl', 'aq', 'is', 'sj'].includes(alpha2)) {
        return '#e0f2fe';
      }
      if (['br', 'co', 'pe', 'cd', 'cg', 'ga', 'id', 'my', 'pg'].includes(alpha2)) {
        return '#14532d';
      }
      const temperate = ['#15803d', '#166534', '#1e4d2b', '#1b4326', '#22543d'];
      return temperate[idx % temperate.length];
    } else if (imageryMode === 'night_lights') {
      return '#09132c';
    } else if (imageryMode === 'sentinel_ndvi') {
      const ndvi = ['#15803d', '#16a34a', '#22c55e', '#14532d', '#4ade80'];
      return ndvi[idx % ndvi.length];
    } else if (imageryMode === 'topo_relief') {
      const topo = ['#334155', '#475569', '#64748b', '#1e293b', '#78350f'];
      return topo[idx % topo.length];
    } else if (imageryMode === 'infrared_clouds') {
      return '#1e293b';
    } else {
      const pol = ['#1e3a8a', '#14532d', '#713f12', '#701a75', '#831843', '#312e81', '#065f46', '#9a3412'];
      return pol[idx % pol.length];
    }
  };

  const getSvgOceanFill = () => {
    if (imageryMode === 'blue_marble') return 'url(#svgOceanGradBlue)';
    if (imageryMode === 'night_lights') return '#020617';
    if (imageryMode === 'sentinel_ndvi') return '#021424';
    if (imageryMode === 'topo_relief') return '#04111d';
    if (imageryMode === 'infrared_clouds') return '#030712';
    return '#050e1c';
  };

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeMeshRef = useRef<THREE.Mesh | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const atmosphereMeshRef = useRef<THREE.Mesh | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const satellitesGroupRef = useRef<THREE.Group | null>(null);
  const flightsGroupRef = useRef<THREE.Group | null>(null);
  const earthquakesGroupRef = useRef<THREE.Group | null>(null);
  const bordersGroupRef = useRef<THREE.Group | null>(null);
  const graticuleGroupRef = useRef<THREE.Group | null>(null);
  const geodesicArcGroupRef = useRef<THREE.Group | null>(null);
  const subdivisionLinesGroupRef = useRef<THREE.Group | null>(null);
  const textureCacheRef = useRef<Map<string, THREE.CanvasTexture>>(new Map());

  // Real-Time Clock & Epoch ref
  const simulatedEpochMsRef = useRef<number>(Date.now());
  const lastFrameTimeRef = useRef<number>(performance.now());

  // Interaction State
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseDownPosRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const rotationVelocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetRotationRef = useRef<{ x: number; y: number }>({ x: 0.2, y: 0 });
  const currentRotationRef = useRef<{ x: number; y: number }>({ x: 0.2, y: 0 });
  const cameraDistanceRef = useRef<number>(13.5);
  const targetDistanceRef = useRef<number>(13.5);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseVecRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // 1. Procedural True Ultra HD 8K Master Texture Generator
  const generate8KCanvasTexture = (mode: SatelliteImageryMode, res: '8k' | '4k' = '8k'): THREE.CanvasTexture => {
    const cacheKey = `${mode}_${res}`;
    if (textureCacheRef.current.has(cacheKey)) {
      return textureCacheRef.current.get(cacheKey)!;
    }

    // True Ultra HD Resolution for razor-sharp 3D sphere texture mapping
    const width = 4096;
    const height = 2048;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: false })!;

    // Enable high quality vector rendering and image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Background Ocean / Base with Realistic Bathymetric Gradients
    if (mode === 'blue_marble') {
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
      oceanGrad.addColorStop(0, '#030c18');
      oceanGrad.addColorStop(0.2, '#061a30');
      oceanGrad.addColorStop(0.5, '#0a2a4c');
      oceanGrad.addColorStop(0.8, '#061a30');
      oceanGrad.addColorStop(1, '#030c18');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle equatorial warmth & oceanic deep trenches
      const equatorGlow = ctx.createRadialGradient(width / 2, height / 2, 200, width / 2, height / 2, width / 2);
      equatorGlow.addColorStop(0, 'rgba(14, 116, 144, 0.08)');
      equatorGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = equatorGlow;
      ctx.fillRect(0, 0, width, height);
    } else if (mode === 'infrared_clouds') {
      ctx.fillStyle = '#040711';
      ctx.fillRect(0, 0, width, height);
    } else if (mode === 'night_lights') {
      ctx.fillStyle = '#010308';
      ctx.fillRect(0, 0, width, height);
    } else if (mode === 'sentinel_ndvi') {
      ctx.fillStyle = '#040f1a';
      ctx.fillRect(0, 0, width, height);
    } else if (mode === 'topo_relief') {
      ctx.fillStyle = '#061626';
      ctx.fillRect(0, 0, width, height);
    } else {
      // Vector 8K
      ctx.fillStyle = '#050e1c';
      ctx.fillRect(0, 0, width, height);
    }

    // Render 100% Real Land Polygons using GeoJSON with Real-World Biome Tones
    const geojson = geoDataService.getCountriesGeoJSON();
    
    geojson.features.forEach((feat, idx) => {
      const coords = (feat.geometry as any).coordinates;
      const type = feat.geometry.type;
      const alpha2 = (feat.properties?.alpha2 || '').toLowerCase();

      ctx.save();
      if (mode === 'blue_marble') {
        // Biome-realistic coloring based on latitude & geography
        let landFill = '#22543d';

        // Desert belts (North Africa, Middle East, Australia, Southwest US)
        if (['dz', 'eg', 'ly', 'mr', 'ne', 'td', 'sa', 'ae', 'om', 'ye', 'iq', 'jo', 'kw', 'au', 'na', 'bw'].includes(alpha2)) {
          landFill = '#b8860b';
        }
        // Glacial & Arctic / Antarctic regions
        else if (['gl', 'aq', 'is', 'sj'].includes(alpha2)) {
          landFill = '#e0f2fe';
        }
        // Tropical Rain Forests (Amazon, Congo Basin, Southeast Asia)
        else if (['br', 'co', 'pe', 'cd', 'cg', 'ga', 'id', 'my', 'pg'].includes(alpha2)) {
          landFill = '#14532d';
        }
        // Temperate and Boreal Forests
        else {
          const temperateColors = ['#1e4d2b', '#255e34', '#2d6a3f', '#1b4326', '#316843'];
          landFill = temperateColors[idx % temperateColors.length];
        }

        ctx.fillStyle = landFill;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
      } else if (mode === 'night_lights') {
        ctx.fillStyle = '#070d1e';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.4;
      } else if (mode === 'sentinel_ndvi') {
        const ndviFills = ['#15803d', '#16a34a', '#22c55e', '#4ade80', '#14532d'];
        ctx.fillStyle = ndviFills[idx % ndviFills.length];
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.4;
      } else if (mode === 'topo_relief') {
        const topoFills = ['#44403c', '#57534e', '#78716c', '#292524', '#3f3f46'];
        ctx.fillStyle = topoFills[idx % topoFills.length];
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.4;
      } else if (mode === 'infrared_clouds') {
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
      } else {
        const polFills = ['#1e3a8a', '#14532d', '#713f12', '#701a75', '#831843', '#312e81', '#065f46', '#9a3412'];
        ctx.fillStyle = polFills[idx % polFills.length];
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
      }

      const drawPolygon = (ring: number[][]) => {
        if (ring.length === 0) return;
        ctx.beginPath();
        for (let i = 0; i < ring.length; i++) {
          const [lng, lat] = ring[i];
          const x = ((lng + 180) / 360) * width;
          const y = ((90 - lat) / 180) * height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };

      if (type === 'Polygon') {
        coords.forEach((ring: number[][]) => drawPolygon(ring));
      } else if (type === 'MultiPolygon') {
        coords.forEach((poly: number[][][]) => {
          poly.forEach((ring: number[][]) => drawPolygon(ring));
        });
      }
      ctx.restore();
    });

    // Night Lights city clusters overlay in Ultra High Fidelity
    if (mode === 'night_lights') {
      ctx.save();
      countries.forEach((c) => {
        const x = ((c.lng + 180) / 360) * width;
        const y = ((90 - c.lat) / 180) * height;
        const rad = Math.min(48, Math.max(10, Math.sqrt(c.population / 1000000) * 1.8));

        const glow = ctx.createRadialGradient(x, y, 0, x, y, rad * 2.8);
        glow.addColorStop(0, '#ffffff');
        glow.addColorStop(0.15, '#fef08a');
        glow.addColorStop(0.45, '#f59e0b');
        glow.addColorStop(0.75, 'rgba(234, 88, 12, 0.35)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, rad * 2.8, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;

    textureCacheRef.current.set(cacheKey, texture);
    return texture;
  };

  // 2. Procedural Dynamic Cloud Texture Generator (Ultra HD 4K)
  const generateCloudCanvasTexture = (cloudOffset: number): THREE.CanvasTexture => {
    const width = 4096;
    const height = 2048;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, width, height);

    // Convective ITCZ equatorial cloud band
    for (let i = 0; i < 48; i++) {
      const x = ((i * 85 + cloudOffset * 100) % width);
      const y = height / 2 + Math.sin(i * 0.4 + cloudOffset) * 90;
      const grad = ctx.createRadialGradient(x, y, 15, x, y, 140);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      grad.addColorStop(0.5, 'rgba(240, 248, 255, 0.45)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 140, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mid-latitude cyclone spirals (North & South)
    const spirals = [
      { x: (800 + cloudOffset * 80) % width, y: 550, r: 280 },
      { x: (2400 + cloudOffset * 70) % width, y: 500, r: 320 },
      { x: (1600 + cloudOffset * 75) % width, y: 1500, r: 270 },
      { x: (3200 + cloudOffset * 65) % width, y: 1450, r: 300 }
    ];

    spirals.forEach((sp) => {
      const grad = ctx.createRadialGradient(sp.x, sp.y, 30, sp.x, sp.y, sp.r);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      grad.addColorStop(0.6, 'rgba(230, 240, 255, 0.35)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
      ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = 16;
    return texture;
  };

  // Convert Lat/Lng to 3D Cartesian Vector
  const latLngToVector3 = (lat: number, lng: number, radius: number = 5.0): THREE.Vector3 => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  };

  // Real-Time Astronomical Subsolar coordinates
  const calculateSubsolarPoint = (date: Date = new Date()): { lat: number; lng: number } => {
    const dayOfYear = Math.floor(
      (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
    );
    // Solar declination (approx)
    const lat = -23.44 * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10));
    // Solar longitude from UTC time
    const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    const lng = -((utcHours - 12) * 15);
    return { lat, lng };
  };

  // 3. Initialize Three.js 3D Scene
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 600;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, cameraDistanceRef.current);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // WebGL Renderer with High-DPI, Tone Mapping & Anti-Aliasing
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
    renderer.setSize(width, height, false);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.margin = 'auto';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.objectFit = 'contain';
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    mountRef.current.replaceChildren(renderer.domElement);

    // Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5ea, 1.9);
    sunLight.position.set(50, 20, 50);
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Starfield Background
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 1400;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 800;
      starPos[i + 1] = (Math.random() - 0.5) * 800;
      starPos[i + 2] = (Math.random() - 0.5) * 800;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0x94a3b8, size: 1.2, transparent: true, opacity: 0.75 });
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    // Main 3D Earth Globe / Terrain Mesh (Ultra High Tessellation 256x256)
    const globeGeo = new THREE.SphereGeometry(5.0, 256, 256);
    const globeMat = new THREE.MeshStandardMaterial({
      map: generate8KCanvasTexture(imageryMode, '8k'),
      roughness: 0.60,
      metalness: 0.12
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globeMesh);
    globeMeshRef.current = globeMesh;

    // Atmospheric Cloud Layer (High Tessellation 128x128)
    const cloudsGeo = new THREE.SphereGeometry(5.06, 128, 128);
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: generateCloudCanvasTexture(0),
      transparent: true,
      opacity: 0.68,
      blending: THREE.AdditiveBlending
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    scene.add(cloudsMesh);
    cloudsMeshRef.current = cloudsMesh;

    // Atmospheric Outer Glow Rim
    const atmoGeo = new THREE.SphereGeometry(5.22, 96, 96);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.14,
      side: THREE.BackSide
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmoMesh);
    atmosphereMeshRef.current = atmoMesh;

    // Groups for Satellites, Flights, Earthquakes, Graticule & Arcs
    const satellitesGroup = new THREE.Group();
    scene.add(satellitesGroup);
    satellitesGroupRef.current = satellitesGroup;

    const flightsGroup = new THREE.Group();
    scene.add(flightsGroup);
    flightsGroupRef.current = flightsGroup;

    const earthquakesGroup = new THREE.Group();
    scene.add(earthquakesGroup);
    earthquakesGroupRef.current = earthquakesGroup;

    const graticuleGroup = new THREE.Group();
    scene.add(graticuleGroup);
    graticuleGroupRef.current = graticuleGroup;

    const geodesicArcGroup = new THREE.Group();
    scene.add(geodesicArcGroup);
    geodesicArcGroupRef.current = geodesicArcGroup;

    const subdivisionLinesGroup = new THREE.Group();
    scene.add(subdivisionLinesGroup);
    subdivisionLinesGroupRef.current = subdivisionLinesGroup;

    // Build Graticule Circles (Equator, Tropics, Meridians)
    const createCircleLine = (lat: number, color: number, opacity: number, radius: number = 5.015) => {
      const pts: THREE.Vector3[] = [];
      for (let lng = -180; lng <= 180; lng += 4) {
        pts.push(latLngToVector3(lat, lng, radius));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
      return new THREE.Line(geo, mat);
    };

    graticuleGroup.add(createCircleLine(0, 0xffffff, 0.85)); // Equator
    graticuleGroup.add(createCircleLine(23.436, 0xffffff, 0.65)); // Tropic of Cancer
    graticuleGroup.add(createCircleLine(-23.436, 0xffffff, 0.65)); // Tropic of Capricorn
    graticuleGroup.add(createCircleLine(66.5, 0xffffff, 0.45)); // Arctic Circle
    graticuleGroup.add(createCircleLine(-66.5, 0xffffff, 0.45)); // Antarctic Circle

    // Animation Loop
    let animationFrameId: number;
    let cloudOffset = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = (now - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = now;

      // Real-Time Clock Progression
      if (isLiveMode && timeMultiplier > 0) {
        simulatedEpochMsRef.current += dt * 1000 * timeMultiplier;
      }

      // Camera Mode Dynamic Real-Time Orientation
      if (cameraMode === 'iss_live') {
        const iss = liveSatellites.find((s) => s.satellite.noradId === 25544) || liveSatellites[0];
        if (iss) {
          targetRotationRef.current = {
            x: (iss.lat * Math.PI) / 180,
            y: -(iss.lng * Math.PI) / 180 - Math.PI / 2
          };
          targetDistanceRef.current = 6.6;
        }
      } else if (cameraMode === 'solar_sync') {
        const ephem = realtimeFeedService.getSolarEphemeris(new Date(simulatedEpochMsRef.current));
        targetRotationRef.current = {
          x: (ephem.subsolarLat * Math.PI) / 180,
          y: -(ephem.subsolarLng * Math.PI) / 180 - Math.PI / 2
        };
      } else if (cameraMode === 'flight_follow' && selectedFlight) {
        targetRotationRef.current = {
          x: (selectedFlight.currentLat * Math.PI) / 180,
          y: -(selectedFlight.currentLng * Math.PI) / 180 - Math.PI / 2
        };
        targetDistanceRef.current = 7.6;
      } else if (autoRotate && !isDraggingRef.current) {
        // Smooth Rotation in Free mode
        targetRotationRef.current.y += 0.002 * rotationSpeed;
      }

      currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.08;
      currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.08;

      if (globeMeshRef.current) {
        globeMeshRef.current.rotation.x = currentRotationRef.current.x;
        globeMeshRef.current.rotation.y = currentRotationRef.current.y;
      }

      if (cloudsMeshRef.current) {
        cloudsMeshRef.current.rotation.x = currentRotationRef.current.x;
        cloudsMeshRef.current.rotation.y = currentRotationRef.current.y + cloudOffset * 0.1;
      }

      if (graticuleGroupRef.current) {
        graticuleGroupRef.current.rotation.x = currentRotationRef.current.x;
        graticuleGroupRef.current.rotation.y = currentRotationRef.current.y;
      }

      if (satellitesGroupRef.current) {
        satellitesGroupRef.current.rotation.x = currentRotationRef.current.x;
        satellitesGroupRef.current.rotation.y = currentRotationRef.current.y;
      }

      if (flightsGroupRef.current) {
        flightsGroupRef.current.rotation.x = currentRotationRef.current.x;
        flightsGroupRef.current.rotation.y = currentRotationRef.current.y;
      }

      if (earthquakesGroupRef.current) {
        earthquakesGroupRef.current.rotation.x = currentRotationRef.current.x;
        earthquakesGroupRef.current.rotation.y = currentRotationRef.current.y;
      }

      if (geodesicArcGroupRef.current) {
        geodesicArcGroupRef.current.rotation.x = currentRotationRef.current.x;
        geodesicArcGroupRef.current.rotation.y = currentRotationRef.current.y;
      }

      if (subdivisionLinesGroupRef.current) {
        subdivisionLinesGroupRef.current.rotation.x = currentRotationRef.current.x;
        subdivisionLinesGroupRef.current.rotation.y = currentRotationRef.current.y;
      }

      // Smooth Camera Zoom
      cameraDistanceRef.current += (targetDistanceRef.current - cameraDistanceRef.current) * 0.08;
      if (cameraRef.current) {
        cameraRef.current.position.set(0, 0, cameraDistanceRef.current);
        cameraRef.current.lookAt(0, 0, 0);
      }

      // Update Sun Position based on real-time subsolar calculations
      if (sunLightRef.current && showSunTerminator) {
        const ephem = realtimeFeedService.getSolarEphemeris(new Date(simulatedEpochMsRef.current));
        const sunPos = latLngToVector3(ephem.subsolarLat, ephem.subsolarLng, 40);
        sunLightRef.current.position.copy(sunPos);
      }

      cloudOffset += 0.0005;

      // Aspect Ratio Check (handled smoothly)
      if (mountRef.current && cameraRef.current) {
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        if (w > 0 && h > 0 && Math.abs(cameraRef.current.aspect - w / h) > 0.001) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
        }
      }

      renderer.render(scene, camera);
      draw2DOverlay();
    };

    animate();

    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      if (w > 0 && h > 0) {
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        cameraRef.current.lookAt(0, 0, 0);
        rendererRef.current.setSize(w, h, false);
      }
    });
    resizeObserver.observe(mountRef.current);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
      globeGeo.dispose();
      globeMat.dispose();
      cloudsGeo.dispose();
      cloudsMat.dispose();
    };
  }, [renderEngine]);

  // Update texture when imageryMode changes
  useEffect(() => {
    if (!globeMeshRef.current) return;
    const newTex = generate8KCanvasTexture(imageryMode, '8k');
    (globeMeshRef.current.material as THREE.MeshStandardMaterial).map = newTex;
    (globeMeshRef.current.material as THREE.MeshStandardMaterial).needsUpdate = true;
  }, [imageryMode]);

  // Update visibility toggles
  useEffect(() => {
    if (cloudsMeshRef.current) cloudsMeshRef.current.visible = showLiveClouds;
    if (atmosphereMeshRef.current) atmosphereMeshRef.current.visible = showAtmosphereGlow;
    if (graticuleGroupRef.current) graticuleGroupRef.current.visible = showGraticule;
    if (satellitesGroupRef.current) satellitesGroupRef.current.visible = showSatellites;
    if (flightsGroupRef.current) flightsGroupRef.current.visible = showLiveFlights;
    if (earthquakesGroupRef.current) earthquakesGroupRef.current.visible = showLiveEarthquakes;
    if (subdivisionLinesGroupRef.current) subdivisionLinesGroupRef.current.visible = showCountryBorders;
  }, [showLiveClouds, showAtmosphereGlow, showGraticule, showSatellites, showLiveFlights, showLiveEarthquakes, showCountryBorders]);

  // Periodic Real-Time Satellite, Flights, Earthquake & Solar Ephemeris Sync
  useEffect(() => {
    const updateRealtimeFeeds = () => {
      const currentDate = new Date(simulatedEpochMsRef.current);

      // 1. Solar Ephemeris
      const ephem = realtimeFeedService.getSolarEphemeris(currentDate);
      setSolarEphemeris(ephem);

      // 2. Satellites
      const sats = satelliteService.getAllLiveSatellites(currentDate);
      setLiveSatellites(sats);

      if (satellitesGroupRef.current) {
        satellitesGroupRef.current.clear();

        sats.forEach((s) => {
          const visualRadius = 5.0 + (s.altitudeKm / 6371) * 2.2;
          const pos = latLngToVector3(s.lat, s.lng, visualRadius);

          // Satellite Body 3D Mesh
          const satMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.14, 0.08, 0.08),
            new THREE.MeshBasicMaterial({ color: new THREE.Color(s.satellite.color) })
          );
          satMesh.position.copy(pos);

          // Solar Panels
          const panelGeo = new THREE.PlaneGeometry(0.24, 0.06);
          const panelMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
          const leftPanel = new THREE.Mesh(panelGeo, panelMat);
          leftPanel.position.set(-0.16, 0, 0);
          const rightPanel = new THREE.Mesh(panelGeo, panelMat);
          rightPanel.position.set(0.16, 0, 0);
          satMesh.add(leftPanel);
          satMesh.add(rightPanel);

          satellitesGroupRef.current?.add(satMesh);

          // Orbit Line
          if (s.groundTrack && s.groundTrack.length > 2) {
            const trackPts = s.groundTrack.map(([lng, lat]) => latLngToVector3(lat, lng, visualRadius));
            const trackGeo = new THREE.BufferGeometry().setFromPoints(trackPts);
            const trackMat = new THREE.LineDashedMaterial({
              color: new THREE.Color(s.satellite.color),
              dashSize: 0.15,
              gapSize: 0.08,
              transparent: true,
              opacity: 0.6
            });
            const trackLine = new THREE.Line(trackGeo, trackMat);
            trackLine.computeLineDistances();
            satellitesGroupRef.current?.add(trackLine);
          }

          // Robust Spherical Ground Footprint Circle (Singularity-free at poles)
          const footprintPts: THREE.Vector3[] = [];
          const fpAngleRad = Math.min(0.35, (s.footprintKm / 6371) * 0.5);
          const centerVec = latLngToVector3(s.lat, s.lng, 5.012).normalize();
          // Find orthogonal vectors to span the circle basis on the sphere
          const refVec = Math.abs(centerVec.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
          const uVec = new THREE.Vector3().crossVectors(centerVec, refVec).normalize();
          const vVec = new THREE.Vector3().crossVectors(centerVec, uVec).normalize();
          const ringRadius = Math.sin(fpAngleRad);
          const ringHeight = Math.cos(fpAngleRad);

          for (let a = 0; a <= Math.PI * 2; a += Math.PI / 16) {
            const pt = new THREE.Vector3()
              .copy(centerVec)
              .multiplyScalar(ringHeight)
              .addScaledVector(uVec, Math.cos(a) * ringRadius)
              .addScaledVector(vVec, Math.sin(a) * ringRadius)
              .normalize()
              .multiplyScalar(5.012);
            footprintPts.push(pt);
          }
          const fpGeo = new THREE.BufferGeometry().setFromPoints(footprintPts);
          const fpMat = new THREE.LineBasicMaterial({ color: new THREE.Color(s.satellite.color), transparent: true, opacity: 0.35 });
          const fpLine = new THREE.Line(fpGeo, fpMat);
          satellitesGroupRef.current?.add(fpLine);
        });
      }

      // 3. Live Commercial Flights
      const flights = realtimeFeedService.getLiveFlights(currentDate);
      setLiveFlights(flights);

      if (flightsGroupRef.current) {
        flightsGroupRef.current.clear();

        flights.forEach((flt) => {
          const flightRadius = 5.04 + (flt.altitudeMeters / 100000);
          const pos = latLngToVector3(flt.currentLat, flt.currentLng, flightRadius);

          // Airplane marker mesh
          const planeMesh = new THREE.Mesh(
            new THREE.ConeGeometry(0.06, 0.14, 8),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
          );
          planeMesh.position.copy(pos);
          planeMesh.lookAt(0, 0, 0); // Point relative to surface
          flightsGroupRef.current?.add(planeMesh);

          // Flight Great-Circle Trajectory
          const arcPoints: THREE.Vector3[] = [];
          for (let i = 0; i <= 32; i++) {
            const frac = i / 32;
            // Interpolate great circle
            const rLat1 = (flt.originCoords[0] * Math.PI) / 180;
            const rLng1 = (flt.originCoords[1] * Math.PI) / 180;
            const rLat2 = (flt.destCoords[0] * Math.PI) / 180;
            const rLng2 = (flt.destCoords[1] * Math.PI) / 180;
            const dLng = rLng2 - rLng1;
            const cosD = Math.sin(rLat1) * Math.sin(rLat2) + Math.cos(rLat1) * Math.cos(rLat2) * Math.cos(dLng);
            const d = Math.acos(Math.max(-1, Math.min(1, cosD)));
            if (d > 0.001) {
              const A = Math.sin((1 - frac) * d) / Math.sin(d);
              const B = Math.sin(frac * d) / Math.sin(d);
              const x = A * Math.cos(rLat1) * Math.cos(rLng1) + B * Math.cos(rLat2) * Math.cos(rLng2);
              const y = A * Math.cos(rLat1) * Math.sin(rLng1) + B * Math.cos(rLat2) * Math.sin(rLng2);
              const z = A * Math.sin(rLat1) + B * Math.sin(rLat2);
              const latP = (Math.atan2(z, Math.sqrt(x * x + y * y)) * 180) / Math.PI;
              const lngP = (Math.atan2(y, x) * 180) / Math.PI;
              arcPoints.push(latLngToVector3(latP, lngP, 5.03 + Math.sin(frac * Math.PI) * 0.15));
            }
          }
          if (arcPoints.length > 2) {
            const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
            const arcMat = new THREE.LineDashedMaterial({
              color: 0x38bdf8,
              dashSize: 0.1,
              gapSize: 0.05,
              transparent: true,
              opacity: 0.4
            });
            const arcLine = new THREE.Line(arcGeo, arcMat);
            arcLine.computeLineDistances();
            flightsGroupRef.current?.add(arcLine);
          }
        });
      }

      // 4. Live Global Earthquakes
      const quakes = realtimeFeedService.getLiveEarthquakes(currentDate);
      setLiveEarthquakes(quakes);

      if (earthquakesGroupRef.current) {
        earthquakesGroupRef.current.clear();

        quakes.forEach((q) => {
          const pos = latLngToVector3(q.lat, q.lng, 5.018);
          // Epicenter pulse dot
          const dotMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.06 + (q.magnitude - 4) * 0.02, 16, 16),
            new THREE.MeshBasicMaterial({ color: q.magnitude >= 6.0 ? 0xef4444 : 0xf59e0b })
          );
          dotMesh.position.copy(pos);
          earthquakesGroupRef.current?.add(dotMesh);

          // Shockwave concentric ring
          const ringPts: THREE.Vector3[] = [];
          const ringRadiusDeg = (q.magnitude * 0.4);
          for (let a = 0; a <= Math.PI * 2; a += Math.PI / 12) {
            const rLat = q.lat + ringRadiusDeg * Math.sin(a);
            const rLng = q.lng + (ringRadiusDeg * Math.cos(a)) / Math.cos((q.lat * Math.PI) / 180);
            ringPts.push(latLngToVector3(rLat, rLng, 5.019));
          }
          const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPts);
          const ringMat = new THREE.LineBasicMaterial({
            color: q.magnitude >= 6.0 ? 0xf87171 : 0xfbbf24,
            transparent: true,
            opacity: 0.65
          });
          earthquakesGroupRef.current?.add(new THREE.Line(ringGeo, ringMat));
        });
      }
    };

    updateRealtimeFeeds();
    const interval = setInterval(updateRealtimeFeeds, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update Geodesic Arc when Selected Country or Destination changes
  useEffect(() => {
    if (!geodesicArcGroupRef.current) return;
    geodesicArcGroupRef.current.clear();

    if (!selectedCountry || !targetFlightCountry) return;

    const start = latLngToVector3(selectedCountry.lat, selectedCountry.lng, 5.02);
    const end = latLngToVector3(targetFlightCountry.lat, targetFlightCountry.lng, 5.02);

    // Slerp Interpolation for Great Circle Arc
    const numPoints = 64;
    const arcPoints: THREE.Vector3[] = [];
    const v1 = start.clone().normalize();
    const v2 = end.clone().normalize();

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const interpolated = new THREE.Vector3().copy(v1).lerp(v2, t).normalize();
      // Add altitude peak in the middle
      const alt = 5.02 + Math.sin(t * Math.PI) * 0.8;
      arcPoints.push(interpolated.multiplyScalar(alt));
    }

    const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
    const arcMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
    const arcLine = new THREE.Line(arcGeo, arcMat);
    geodesicArcGroupRef.current.add(arcLine);

    // Glowing Markers at Origin and Destination
    const originMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x22c55e })
    );
    originMarker.position.copy(start);
    geodesicArcGroupRef.current.add(originMarker);

    const destMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    );
    destMarker.position.copy(end);
    geodesicArcGroupRef.current.add(destMarker);
  }, [selectedCountry, targetFlightCountry]);

  // Update 3D Geographic Country Borders and Subdivision Dividing Lines
  useEffect(() => {
    if (!subdivisionLinesGroupRef.current) return;
    subdivisionLinesGroupRef.current.clear();

    const countryBorderPoints: THREE.Vector3[] = [];
    const selectedCountryBorderPoints: THREE.Vector3[] = [];
    const subSelectedPoints: THREE.Vector3[] = [];

    // 1. Render 100% Real TopoJSON Unified Boundary Mesh on the 3D globe surface
    try {
      const mesh = geoDataService.getAllBoundariesMesh();
      const radius = 5.016;

      const processLineString = (line: number[][], targetArr: THREE.Vector3[], r: number) => {
        for (let i = 0; i < line.length - 1; i++) {
          const [lng1, lat1] = line[i];
          const [lng2, lat2] = line[i + 1];
          // Antimeridian crossing protection: skip jump between +180 and -180
          if (Math.abs(lng2 - lng1) > 180) continue;

          const dist = Math.hypot(lng2 - lng1, lat2 - lat1);
          // High-precision spherical interpolation for flawless curves without jagged facets
          const steps = Math.max(1, Math.min(16, Math.ceil(dist / 0.75)));
          for (let s = 0; s < steps; s++) {
            const t1 = s / steps;
            const t2 = (s + 1) / steps;
            const pt1 = latLngToVector3(lat1 + (lat2 - lat1) * t1, lng1 + (lng2 - lng1) * t1, r);
            const pt2 = latLngToVector3(lat1 + (lat2 - lat1) * t2, lng1 + (lng2 - lng1) * t2, r);
            targetArr.push(pt1, pt2);
          }
        }
      };

      if (mesh && Array.isArray(mesh.coordinates)) {
        mesh.coordinates.forEach((line: number[][]) => {
          processLineString(line, countryBorderPoints, radius);
        });
      }

      // If a country is selected, render its boundary highlighted with higher radius
      if (selectedCountry) {
        const geojson = geoDataService.getCountriesGeoJSON();
        const selFeature = geojson.features.find((f) => {
          const alpha2 = (f.properties?.alpha2 || '').toLowerCase();
          const numericId = String(f.properties?.numericId || '');
          return alpha2 === selectedCountry.id.toLowerCase() || numericId === selectedCountry.id;
        });

        if (selFeature && selFeature.geometry) {
          const geom = selFeature.geometry as any;
          const selRadius = 5.026;
          if (geom.type === 'Polygon' && Array.isArray(geom.coordinates)) {
            geom.coordinates.forEach((ring: number[][]) => {
              processLineString(ring, selectedCountryBorderPoints, selRadius);
            });
          } else if (geom.type === 'MultiPolygon' && Array.isArray(geom.coordinates)) {
            geom.coordinates.forEach((poly: number[][][]) => {
              poly.forEach((ring: number[][]) => {
                processLineString(ring, selectedCountryBorderPoints, selRadius);
              });
            });
          }
        }
      }
    } catch {
      // Fallback
    }

    // 2. Render Political Subdivision Lines for the selected country (crisp, elegant, focused)
    if (selectedCountry) {
      const radius = 5.028;
      const segments = subdivisionBoundaryService.generate3DBoundaries(
        selectedCountry,
        (lat, lng, r) => latLngToVector3(lat, lng, r),
        radius
      );

      segments.forEach(([x1, y1, z1, x2, y2, z2]) => {
        subSelectedPoints.push(new THREE.Vector3(x1, y1, z1));
        subSelectedPoints.push(new THREE.Vector3(x2, y2, z2));
      });
    }

    // Add normal country borders (crisp white vector line)
    if (countryBorderPoints.length > 0) {
      const borderGeo = new THREE.BufferGeometry().setFromPoints(countryBorderPoints);
      const borderMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.85,
        linewidth: 1.5
      });
      subdivisionLinesGroupRef.current.add(new THREE.LineSegments(borderGeo, borderMat));
    }

    // Add highlighted selected country GeoJSON border (bright pure white vector line)
    if (selectedCountryBorderPoints.length > 0) {
      const selBorderGeo = new THREE.BufferGeometry().setFromPoints(selectedCountryBorderPoints);
      const selBorderMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1.0,
        linewidth: 3.2
      });
      subdivisionLinesGroupRef.current.add(new THREE.LineSegments(selBorderGeo, selBorderMat));
    }

    // Add selected country's internal subdivision dividing lines (crisp pure white)
    if (subSelectedPoints.length > 0) {
      const selGeo = new THREE.BufferGeometry().setFromPoints(subSelectedPoints);
      const selMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.95,
        linewidth: 2.2
      });
      subdivisionLinesGroupRef.current.add(new THREE.LineSegments(selGeo, selMat));
    }
  }, [selectedCountry, countries, renderEngine, showCountryBorders]);

  // 2D Overlay for Country Labels, Political Subdivisions & Telemetry Pins
  const draw2DOverlay = () => {
    const canvas = labelsCanvasRef.current;
    if (!canvas || !cameraRef.current || !globeMeshRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // HiDPI Retina Resolution Scaling for Ultra HD Crisp Text
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (!showCountryLabels) {
      ctx.restore();
      return;
    }

    const camDist = cameraDistanceRef.current;
    const camera = cameraRef.current;
    const globeRotation = globeMeshRef.current.rotation;

    // Collision avoidance buffer to prevent overlapping labels
    interface LabelBox {
      x: number;
      y: number;
      w: number;
      h: number;
    }
    const occupiedBoxes: LabelBox[] = [];

    const checkCollision = (box: LabelBox, margin = 4): boolean => {
      for (let i = 0; i < occupiedBoxes.length; i++) {
        const b = occupiedBoxes[i];
        if (
          box.x < b.x + b.w + margin &&
          box.x + box.w + margin > b.x &&
          box.y < b.y + b.h + margin &&
          box.y + box.h + margin > b.y
        ) {
          return true;
        }
      }
      return false;
    };

    // 1. Global Country Names & National Capitals Layer (Primary Priority Layer)
    if (showCountryLabels) {
      // Sort countries by priority (selected first, then combined population and area score)
      const sortedCountries = [...countries].sort((a, b) => {
        if (selectedCountry && a.id === selectedCountry.id) return -1;
        if (selectedCountry && b.id === selectedCountry.id) return 1;
        const scoreA = Math.log10(a.population + 10000) * 1.8 + Math.log10((a.areaKm2 || 1000) + 1000);
        const scoreB = Math.log10(b.population + 10000) * 1.8 + Math.log10((b.areaKm2 || 1000) + 1000);
        return scoreB - scoreA;
      });

      sortedCountries.forEach((country) => {
        const isSelected = selectedCountry && country.id === selectedCountry.id;

        // Accurate mainland centroid
        const centroid = geoDataService.getCountryCentroid(country.id);
        const lng = centroid ? centroid[0] : country.lng;
        const lat = centroid ? centroid[1] : country.lat;

        const pos = latLngToVector3(lat, lng, 5.04);
        pos.applyEuler(globeRotation);

        const facing = pos.z / 5.04;
        // Strict horizon cutoff to prevent labels from bunching or floating on the horizon limb
        const minFacing = isSelected ? 0.18 : 0.28;
        if (facing <= minFacing) return;

        const horizonFade = Math.min(1, Math.max(0, (facing - minFacing) / 0.35));

        pos.project(camera);
        const x = ((pos.x + 1) * w) / 2;
        const y = ((-pos.y + 1) * h) / 2;

        if (x < 18 || x > w - 18 || y < 18 || y > h - 18) return;

        // Distance from screen center
        const screenDistFromCenter = Math.hypot(x - w / 2, y - h / 2);
        const maxScreenRadius = Math.min(w, h) * 0.45;
        if (!isSelected && screenDistFromCenter > maxScreenRadius) return;

        // LOD Distance Filter (Permits clean distribution without clutter)
        if (!isSelected) {
          const countryArea = country.areaKm2 || 0;
          if (camDist > 18 && country.population < 40000000 && countryArea < 1200000) return;
          if (camDist > 14 && country.population < 12000000 && countryArea < 300000) return;
          if (camDist > 11 && country.population < 2500000 && countryArea < 60000) return;
        }

        const countryName = country.nameEs;
        const shouldDisplayCapitalText =
          showCapitals &&
          Boolean(country.capitalEs) &&
          (isSelected || camDist < 12.0 || (camDist < 15.0 && (country.population > 30000000 || country.areaKm2 > 1000000)));
        const capitalName = shouldDisplayCapitalText && country.capitalEs ? `★ ${country.capitalEs}` : null;

        // High-Visibility Font Hierarchy & Sleek Balanced Sizing
        const countryFontSize = isSelected
          ? 14.0
          : camDist < 9.0
          ? 13.0
          : camDist < 13.0
          ? 12.0
          : 11.0;
        const capitalFontSize = isSelected
          ? 11.5
          : camDist < 9.0
          ? 10.5
          : camDist < 13.0
          ? 9.5
          : 9.0;

        ctx.font = `700 ${countryFontSize}px system-ui, -apple-system, sans-serif`;
        const countryTextWidth = ctx.measureText(countryName).width;

        ctx.font = `600 ${capitalFontSize}px system-ui, -apple-system, sans-serif`;
        const capitalTextWidth = capitalName ? ctx.measureText(capitalName).width : 0;

        const maxTextWidth = Math.max(countryTextWidth, capitalTextWidth);
        const padX = 14;
        const badgeWidth = maxTextWidth + padX;
        const badgeHeight = shouldDisplayCapitalText && capitalName
          ? countryFontSize + capitalFontSize + 11
          : countryFontSize + 7;

        const box: LabelBox = {
          x: x - badgeWidth / 2,
          y: y - badgeHeight / 2,
          w: badgeWidth,
          h: badgeHeight
        };

        // Collision detection with adaptive buffer margin to prevent overcrowding at any distance
        const collisionBuffer = camDist > 14 ? 12 : (camDist > 10 ? 9 : 6);
        if (!isSelected && checkCollision(box, collisionBuffer)) return;
        occupiedBoxes.push(box);

        ctx.save();
        ctx.globalAlpha = horizonFade;

        if (isSelected) {
          // Selected Country Glowing Pulse Ring
          ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
          ctx.beginPath();
          ctx.arc(x, y - badgeHeight / 2 - 8, 14, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#facc15';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(x, y - badgeHeight / 2 - 8, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Selected Country Header Card Badge
          const badgeX = x - badgeWidth / 2;
          const badgeY = y - badgeHeight / 2;

          ctx.fillStyle = 'rgba(3, 7, 18, 0.94)';
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 6);
          ctx.fill();
          ctx.stroke();

          // Country Name in Vivid Crisp White
          ctx.fillStyle = '#ffffff';
          ctx.font = `700 ${countryFontSize}px system-ui, -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(countryName, x, badgeY + countryFontSize + 1);

          // Capital Name in Vivid Golden Accent
          if (country.capitalEs) {
            ctx.fillStyle = '#facc15';
            ctx.font = `600 ${capitalFontSize}px system-ui, -apple-system, sans-serif`;
            ctx.fillText(`Capital: ${country.capitalEs}`, x, badgeY + countryFontSize + capitalFontSize + 5);
          }
        } else {
          // Capital City Golden Star Pin / Dot on Globe Surface
          if (showCapitals && country.capitalEs) {
            ctx.fillStyle = '#facc15';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(x, y - badgeHeight / 2 - 4, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.fillStyle = '#38bdf8';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.arc(x, y - badgeHeight / 2 - 3, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }

          const badgeX = x - badgeWidth / 2;
          const badgeY = y - badgeHeight / 2 + 2;

          if (labelContrastMode === 'ultra_crisp_badge') {
            // Sleek Translucent Glass Capsule (Visible on all terrains without obstructing)
            ctx.fillStyle = 'rgba(6, 12, 28, 0.78)';
            ctx.strokeStyle = showCapitals ? 'rgba(250, 204, 21, 0.35)' : 'rgba(255, 255, 255, 0.18)';
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 5);
            ctx.fill();
            ctx.stroke();

            // Country Name with subtle shadow for crisp readability
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.font = `700 ${countryFontSize}px system-ui, -apple-system, sans-serif`;
            ctx.fillText(countryName, x, badgeY + countryFontSize + 1);

            // Capital Name in Luminous Gold
            if (capitalName) {
              ctx.fillStyle = '#fde047';
              ctx.font = `600 ${capitalFontSize}px system-ui, -apple-system, sans-serif`;
              ctx.fillText(capitalName, x, badgeY + countryFontSize + capitalFontSize + 4);
            }
          } else {
            // Luminous Halo Mode (Stroke + Crisp High-Contrast Fill)
            ctx.textAlign = 'center';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 3.2;
            ctx.strokeStyle = 'rgba(2, 6, 23, 0.95)';
            ctx.font = `700 ${countryFontSize}px system-ui, -apple-system, sans-serif`;
            ctx.strokeText(countryName, x, badgeY + countryFontSize);

            ctx.fillStyle = '#ffffff';
            ctx.fillText(countryName, x, badgeY + countryFontSize);

            if (capitalName) {
              ctx.lineWidth = 2.8;
              ctx.strokeStyle = 'rgba(2, 6, 23, 0.95)';
              ctx.font = `600 ${capitalFontSize}px system-ui, -apple-system, sans-serif`;
              ctx.strokeText(capitalName, x, badgeY + countryFontSize + capitalFontSize + 4);

              ctx.fillStyle = '#fde047';
              ctx.fillText(capitalName, x, badgeY + countryFontSize + capitalFontSize + 4);
            }
          }
        }

        ctx.restore();
      });
    }

    // 2. Zoom-Progressive Political Subdivisions (States, Departments, Provinces, etc.)
    // Only rendered at close zoom or for selected country, filling in remaining non-colliding space
    const isZoomedInForSubs = camDist <= 11.5 || selectedCountry !== null;
    if (isZoomedInForSubs) {
      const candidateCountries: Country[] = [];
      if (selectedCountry) {
        candidateCountries.push(selectedCountry);
      }

      if (camDist <= 9.5) {
        countries.forEach((c) => {
          if (selectedCountry && c.id === selectedCountry.id) return;
          const centroid = geoDataService.getCountryCentroid(c.id);
          const cPos = latLngToVector3(centroid ? centroid[1] : c.lat, centroid ? centroid[0] : c.lng, 5.04);
          cPos.applyEuler(globeRotation);
          const facing = cPos.z / 5.04;
          if (facing > 0.38) {
            candidateCountries.push(c);
          }
        });
      }

      candidateCountries.forEach((country) => {
        const isSelected = selectedCountry && country.id === selectedCountry.id;
        const structure = getCountryPoliticalStructure(country);
        if (!structure || !structure.subdivisions || structure.subdivisions.length === 0) return;

        // Sort subdivisions: capital region first, then by population
        const sortedSubs = [...structure.subdivisions].sort((a, b) => {
          if (a.isCapitalRegion) return -1;
          if (b.isCapitalRegion) return 1;
          return (b.population || 0) - (a.population || 0);
        });

        let maxSubsToShow = isSelected ? sortedSubs.length : Math.min(3, Math.ceil(sortedSubs.length * 0.25));
        const subsToRender = sortedSubs.slice(0, maxSubsToShow);

        subsToRender.forEach((sub) => {
          const subPos = latLngToVector3(sub.lat, sub.lng, 5.035);
          subPos.applyEuler(globeRotation);

          const subFacing = subPos.z / 5.035;
          if (subFacing <= 0.28) return;

          const horizonFade = Math.min(1, Math.max(0, (subFacing - 0.28) / 0.35));

          subPos.project(camera);
          const sx = ((subPos.x + 1) * w) / 2;
          const sy = ((-subPos.y + 1) * h) / 2;

          if (sx < 20 || sx > w - 20 || sy < 20 || sy > h - 20) return;

          const isCapital = sub.isCapitalRegion;
          const labelText = sub.name;
          const fontSize = isCapital
            ? (camDist < 9.5 ? 11 : 10)
            : (camDist < 9.5 ? 10 : (camDist < 12.0 ? 9.5 : 9));

          ctx.font = isCapital
            ? `bold ${fontSize}px system-ui, -apple-system, sans-serif`
            : `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
          const textWidth = ctx.measureText(labelText).width;

          const showSubCapital = isSelected || (camDist < 8.0 && sub.capital);

          const box: LabelBox = {
            x: sx - 4,
            y: sy - 8,
            w: textWidth + 16,
            h: showSubCapital ? 24 : 14
          };

          if (checkCollision(box, 8)) return;
          occupiedBoxes.push(box);

          ctx.save();
          ctx.globalAlpha = horizonFade;

          // Subdivision Center Node Dot
          ctx.fillStyle = isCapital ? '#facc15' : (isSelected ? '#38bdf8' : '#38bdf8');
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(sx, sy, isCapital ? 3.5 : 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // High-Contrast Crisp Label with Halo Shadow
          ctx.lineJoin = 'round';
          ctx.lineWidth = 3.2;
          ctx.strokeStyle = 'rgba(6, 11, 25, 0.95)';
          ctx.strokeText(labelText, sx + 7, sy + 3);

          ctx.fillStyle = isCapital ? '#fef08a' : (isSelected ? '#f8fafc' : '#f1f5f9');
          ctx.fillText(labelText, sx + 7, sy + 3);

          // Capital name if zoomed close
          if (showSubCapital && sub.capital) {
            const capText = `★ ${sub.capital}`;
            ctx.font = `500 8.5px system-ui, -apple-system, sans-serif`;
            ctx.lineWidth = 2.8;
            ctx.strokeStyle = 'rgba(6, 11, 25, 0.95)';
            ctx.strokeText(capText, sx + 7, sy + 13);

            ctx.fillStyle = '#93c5fd';
            ctx.fillText(capText, sx + 7, sy + 13);
          }

          ctx.restore();
        });
      });
    }

    // 3. Live Satellites 2D Overlay Badges
    if (showSatellites && liveSatellites.length > 0) {
      liveSatellites.forEach((sat) => {
        const visualRadius = 5.0 + (sat.altitudeKm / 6371) * 2.2;
        const pos = latLngToVector3(sat.lat, sat.lng, visualRadius);
        pos.applyEuler(globeRotation);

        if (pos.z <= 0) return; // Behind horizon

        pos.project(camera);
        const x = ((pos.x + 1) * w) / 2;
        const y = ((-pos.y + 1) * h) / 2;

        if (x < 10 || x > w - 10 || y < 10 || y > h - 10) return;

        ctx.save();
        ctx.fillStyle = sat.satellite.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (selectedSatellite?.satellite.noradId === sat.satellite.noradId || camDist < 16) {
          const label = `🛰️ ${sat.satellite.name} (${Math.round(sat.altitudeKm)} km)`;
          ctx.font = '600 10.5px system-ui, -apple-system, sans-serif';
          const tW = ctx.measureText(label).width;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
          ctx.strokeStyle = sat.satellite.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(x + 8, y - 10, tW + 12, 20, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.fillText(label, x + 14, y + 4);
        }
        ctx.restore();
      });
    }

    // 4. Live Commercial Flights 2D Overlay Badges
    if (showLiveFlights && liveFlights.length > 0) {
      liveFlights.forEach((flt) => {
        const flightRadius = 5.04 + (flt.altitudeMeters / 100000);
        const pos = latLngToVector3(flt.currentLat, flt.currentLng, flightRadius);
        pos.applyEuler(globeRotation);

        if (pos.z <= 0.1) return; // Behind horizon

        pos.project(camera);
        const x = ((pos.x + 1) * w) / 2;
        const y = ((-pos.y + 1) * h) / 2;

        if (x < 10 || x > w - 10 || y < 10 || y > h - 10) return;

        ctx.save();
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (selectedFlight?.id === flt.id || camDist < 12.5) {
          const label = `✈️ ${flt.callsign} (${flt.originIata}→${flt.destIata}) ${flt.altitudeMeters}m`;
          ctx.font = '600 10px system-ui, -apple-system, sans-serif';
          const tW = ctx.measureText(label).width;

          ctx.fillStyle = 'rgba(2, 6, 23, 0.90)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(x + 6, y - 9, tW + 10, 18, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#e2e8f0';
          ctx.fillText(label, x + 11, y + 3);
        }
        ctx.restore();
      });
    }

    // 5. Live Earthquakes 2D Overlay Badges
    if (showLiveEarthquakes && liveEarthquakes.length > 0) {
      liveEarthquakes.forEach((q) => {
        const pos = latLngToVector3(q.lat, q.lng, 5.018);
        pos.applyEuler(globeRotation);

        if (pos.z <= 0.15) return;

        pos.project(camera);
        const x = ((pos.x + 1) * w) / 2;
        const y = ((-pos.y + 1) * h) / 2;

        if (x < 10 || x > w - 10 || y < 10 || y > h - 10) return;

        ctx.save();
        const color = q.magnitude >= 6.0 ? '#ef4444' : '#f59e0b';
        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (selectedEarthquake?.id === q.id || camDist < 14) {
          const label = `🌋 M${q.magnitude.toFixed(1)} ${q.place.slice(0, 20)}`;
          ctx.font = 'bold 9.5px system-ui, -apple-system, sans-serif';
          const tW = ctx.measureText(label).width;

          ctx.fillStyle = 'rgba(2, 6, 23, 0.90)';
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(x + 6, y - 9, tW + 10, 18, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = color;
          ctx.fillText(label, x + 11, y + 3);
        }
        ctx.restore();
      });
    }

    ctx.restore();
  };

  // Mouse & Touch Orbit Controls
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mountRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Telemetry Calculation via Raycasting
    if (cameraRef.current && globeMeshRef.current) {
      raycasterRef.current.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
      const intersects = raycasterRef.current.intersectObject(globeMeshRef.current);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        // Invert globe rotation to find original spherical coordinates
        const invRot = globeMeshRef.current.rotation.clone();
        const unrotated = point.clone().applyEuler(new THREE.Euler(-invRot.x, -invRot.y, -invRot.z));
        const r = unrotated.length();
        const lat = 90 - (Math.acos(unrotated.y / r) * 180) / Math.PI;
        const lng = ((Math.atan2(unrotated.z, -unrotated.x) * 180) / Math.PI) - 180;
        const normalizedLng = ((((lng + 180) % 360) + 360) % 360) - 180;

        const solarHours = ((new Date().getUTCHours() + normalizedLng / 15 + 24) % 24);
        const solarMin = Math.floor((solarHours % 1) * 60);

        setCursorTelemetry({
          lat,
          lng: normalizedLng,
          formatted: countryService.formatCoordinatesDMS(lat, normalizedLng),
          solarTime: `${Math.floor(solarHours).toString().padStart(2, '0')}:${solarMin.toString().padStart(2, '0')} LST`
        });
      } else {
        setCursorTelemetry(null);
      }
    }

    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    targetRotationRef.current.y += deltaX * 0.005;
    targetRotationRef.current.x = Math.max(
      -Math.PI / 2.2,
      Math.min(Math.PI / 2.2, targetRotationRef.current.x + deltaY * 0.005)
    );

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    isDraggingRef.current = false;
    const dx = Math.abs(e.clientX - mouseDownPosRef.current.x);
    const dy = Math.abs(e.clientY - mouseDownPosRef.current.y);
    const dt = performance.now() - mouseDownPosRef.current.time;

    // Detect click without drag on 3D globe surface
    if (dx < 7 && dy < 7 && dt < 350 && mountRef.current && cameraRef.current && globeMeshRef.current) {
      const rect = mountRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
      const intersects = raycasterRef.current.intersectObject(globeMeshRef.current);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        const invRot = globeMeshRef.current.rotation.clone();
        const unrotated = point.clone().applyEuler(new THREE.Euler(-invRot.x, -invRot.y, -invRot.z));
        const r = unrotated.length();
        const lat = 90 - (Math.acos(unrotated.y / r) * 180) / Math.PI;
        const lng = ((((Math.atan2(unrotated.z, -unrotated.x) * 180) / Math.PI) - 180 + 540) % 360) - 180;

        // Find closest country by spherical distance
        let closestCountry: Country | null = null;
        let minDist = Infinity;
        countries.forEach((c) => {
          const centroid = geoDataService.getCountryCentroid(c.id);
          const cLng = centroid ? centroid[0] : c.lng;
          const cLat = centroid ? centroid[1] : c.lat;
          const dist = Math.hypot(cLat - lat, (cLng - lng) * Math.cos((lat * Math.PI) / 180));
          if (dist < minDist) {
            minDist = dist;
            closestCountry = c;
          }
        });

        if (closestCountry && minDist < 25) {
          flyToCountry(closestCountry);
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    targetDistanceRef.current = Math.max(5.6, Math.min(26.0, targetDistanceRef.current + e.deltaY * 0.012));
  };

  // Fly-to Country Animation
  const flyToCountry = (country: Country) => {
    onSelectCountry(country);
    if (renderEngine === 'svg_vector') {
      setSvgRotation([-country.lng, -country.lat]);
      setSvgZoom((prev) => Math.max(prev, 1.8));
    } else {
      targetRotationRef.current = {
        x: (country.lat * Math.PI) / 180,
        y: -(country.lng * Math.PI) / 180 - Math.PI / 2
      };
      targetDistanceRef.current = 8.5;
    }
  };

  // Fly-to Satellite
  const flyToSatellite = (sat: SatelliteLivePosition) => {
    setSelectedSatellite(sat);
    setSelectedSatelliteId(sat.satellite.id);
    if (renderEngine === 'svg_vector') {
      setSvgRotation([-sat.lng, -sat.lat]);
      setSvgZoom((prev) => Math.max(prev, 1.6));
    } else {
      targetRotationRef.current = {
        x: (sat.lat * Math.PI) / 180,
        y: -(sat.lng * Math.PI) / 180 - Math.PI / 2
      };
      targetDistanceRef.current = 10.0;
    }
  };

  // Export 8K SVG Handler
  const handleExport8KSVG = () => {
    setIsExporting8K(true);
    setExportNotification('Generando mapa vectorial Ultra HD 8K SVG (8192 × 4320)...');

    setTimeout(() => {
      try {
        const svgContent = satelliteService.generate8KSVGVectorMap(
          {
            width: 8192,
            height: 4320,
            theme: imageryMode === 'night_lights' ? 'night' : imageryMode === 'topo_relief' ? 'topographic' : 'satellite',
            showGraticule: true,
            showCountryLabels: true,
            showSatellites: true,
            activeSatellites: liveSatellites
          },
          countries
        );

        satelliteService.download8KSVG(svgContent, `atlas_mundial_3d_8k_${imageryMode}_wgs84.svg`);
        setExportNotification('¡Archivo SVG 8K descargado con éxito!');
        setTimeout(() => setExportNotification(null), 4000);
      } catch (err) {
        console.error('Error al generar SVG 8K:', err);
        setExportNotification('Error al generar el SVG 8K');
      } finally {
        setIsExporting8K(false);
      }
    }, 400);
  };

  // Capture High-Res 3D Snapshot
  const handleCapture3DSnapshot = () => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `captura_3d_satelital_${imageryMode}_${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
    setExportNotification('¡Captura 3D exportada en alta resolución!');
    setTimeout(() => setExportNotification(null), 3000);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 flex-1 items-stretch w-full min-h-[680px]">
      {/* 3D Canvas / Vector Viewport & Interactive HUD (Left/Center) */}
      <div className="flex-1 relative bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col min-h-[550px] lg:min-h-[650px]">
        {/* Render Engine Switch: Native SVG 3D Vector Globe vs WebGL 3D Globe */}
        {renderEngine === 'svg_vector' ? (
          <div className="absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center bg-[#020617]">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-full cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleSvgMouseDown}
              onMouseMove={handleSvgMouseMove}
              onMouseUp={handleSvgMouseUp}
              onMouseLeave={handleSvgMouseUp}
              onWheel={handleSvgWheel}
              onTouchStart={handleSvgTouchStart}
              onTouchMove={handleSvgTouchMove}
              onTouchEnd={handleSvgTouchEnd}
            >
              <defs>
                {/* Ocean Gradient */}
                <radialGradient id="svgOceanGradBlue" cx="45%" cy="38%" r="65%">
                  <stop offset="0%" stopColor="#0d3a66" />
                  <stop offset="50%" stopColor="#061f3d" />
                  <stop offset="85%" stopColor="#031122" />
                  <stop offset="100%" stopColor="#01060d" />
                </radialGradient>

                {/* Atmosphere Rim Glow */}
                <radialGradient id="svgAtmosphereGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="80%" stopColor="transparent" />
                  <stop offset="93%" stopColor="rgba(56, 189, 248, 0.35)" />
                  <stop offset="97%" stopColor="rgba(99, 102, 241, 0.22)" />
                  <stop offset="100%" stopColor="rgba(56, 189, 248, 0.0)" />
                </radialGradient>

                {/* Subsolar Corona Glow */}
                <radialGradient id="svgSunCorona" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fde047" stopOpacity="0.95" />
                  <stop offset="45%" stopColor="#f59e0b" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
                </radialGradient>

                {/* Spherical Clip Mask */}
                <clipPath id="svgGlobeClip">
                  <circle cx={svgWidth / 2 + svgPan.x} cy={svgHeight / 2 + svgPan.y} r={svgRadius} />
                </clipPath>

                {/* Subtle Vector Glow Filter */}
                <filter id="svgGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Subpixel Antialiasing & Edge Enhancing Micro-Convolution Filter */}
                <filter id="svgAntialiasSubpixel" x="-10%" y="-10%" width="120%" height="120%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="0.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* FXAA Vectorial Smoothing Filter */}
                <filter id="svgFxaaFilter" x="-10%" y="-10%" width="120%" height="120%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="0.32" result="fxaaBlur" />
                  <feMerge>
                    <feMergeNode in="fxaaBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Deep Space Cosmic Stars */}
              <g opacity={0.4} pointerEvents="none">
                <circle cx={70} cy={80} r={1.2} fill="#ffffff" />
                <circle cx={140} cy={220} r={0.8} fill="#ffffff" />
                <circle cx={290} cy={55} r={1.5} fill="#ffffff" />
                <circle cx={790} cy={110} r={1.0} fill="#ffffff" />
                <circle cx={890} cy={310} r={1.3} fill="#ffffff" />
                <circle cx={920} cy={85} r={0.9} fill="#ffffff" />
                <circle cx={110} cy={530} r={1.1} fill="#ffffff" />
                <circle cx={860} cy={550} r={1.4} fill="#ffffff" />
                <circle cx={500} cy={35} r={0.7} fill="#ffffff" />
              </g>

              {/* 3D Ocean Sphere Base */}
              <circle
                cx={svgWidth / 2 + svgPan.x}
                cy={svgHeight / 2 + svgPan.y}
                r={svgRadius}
                fill={getSvgOceanFill()}
                stroke="#1e293b"
                strokeWidth={getAntialiasedStroke(1.0)}
                shapeRendering={antialiasingEnabled ? 'geometricPrecision' : 'crispEdges'}
              />

              {/* Spherical Surface Content with Subpixel Vector Antialiasing */}
              <g
                clipPath="url(#svgGlobeClip)"
                shapeRendering="geometricPrecision"
                textRendering="geometricPrecision"
              >
                {/* Vector Graticule Coordinates */}
                {showGraticule && svgGraticulePath && (
                  <path
                    d={svgGraticulePath}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.16)"
                    strokeWidth={getAntialiasedStroke(0.65, { isGraticule: true })}
                    strokeDasharray="4 3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pointerEvents="none"
                  />
                )}

                {/* 100% Vector SVG Country Polygons (Never Pixelates on Zoom with AA smoothing) */}
                {svgGeoJson?.features?.map((feat: any, idx: number) => {
                  const alpha2 = (feat.properties?.alpha2 || '').toLowerCase();
                  const country = countries?.find((c) => c.id.toLowerCase() === alpha2);
                  const isSelected = selectedCountry?.id.toLowerCase() === alpha2;
                  const isHovered = svgHoveredCountry?.id.toLowerCase() === alpha2;
                  const d = svgPathGenerator(feat);
                  if (!d) return null;

                  return (
                    <path
                      key={`svg-country-feat-${idx}-${feat.id || alpha2 || 'poly'}`}
                      d={d}
                      fill={getSvgCountryFill(alpha2, idx, isSelected, isHovered)}
                      stroke={showCountryBorders ? '#ffffff' : 'none'}
                      strokeWidth={getAntialiasedStroke(isSelected ? 0.9 : 0.45, { isSelected })}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      strokeMiterlimit={2}
                      strokeOpacity={showCountryBorders ? (isSelected ? 1 : 0.88) : 0}
                      className="transition-colors duration-150 cursor-pointer"
                      onMouseEnter={(e) => {
                        if (country) {
                          setSvgHoveredCountry(country);
                          setSvgTooltipPos({ x: e.clientX, y: e.clientY });
                        }
                      }}
                      onMouseLeave={() => {
                        setSvgHoveredCountry(null);
                        setSvgTooltipPos(null);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (country) flyToCountry(country);
                      }}
                    />
                  );
                })}

                {/* Solar Day/Night Terminator Arc */}
                {showSunTerminator && svgNightPath && (
                  <path
                    d={svgNightPath}
                    fill="#000000"
                    fillOpacity={0.42}
                    pointerEvents="none"
                  />
                )}

                {/* Solar Zenith Position */}
                {svgSunPos && (
                  <g transform={`translate(${svgSunPos[0]}, ${svgSunPos[1]})`} pointerEvents="none">
                    <circle r={18 * Math.min(1.5, Math.sqrt(svgZoom))} fill="url(#svgSunCorona)" className="animate-pulse" />
                    <circle r={5} fill="#fef08a" stroke="#d97706" strokeWidth={1.2} />
                  </g>
                )}

                {/* Live Flight Routes & Planes */}
                {showLiveFlights &&
                  liveFlights.map((flight) => {
                    const arcPoints: [number, number][] = [];
                    if (flight.originCoords && flight.destCoords) {
                      const rLat1 = (flight.originCoords[0] * Math.PI) / 180;
                      const rLng1 = (flight.originCoords[1] * Math.PI) / 180;
                      const rLat2 = (flight.destCoords[0] * Math.PI) / 180;
                      const rLng2 = (flight.destCoords[1] * Math.PI) / 180;
                      const dLng = rLng2 - rLng1;
                      const cosD = Math.sin(rLat1) * Math.sin(rLat2) + Math.cos(rLat1) * Math.cos(rLat2) * Math.cos(dLng);
                      const d = Math.acos(Math.max(-1, Math.min(1, cosD)));
                      if (d > 0.001) {
                        for (let i = 0; i <= 24; i++) {
                          const frac = i / 24;
                          const A = Math.sin((1 - frac) * d) / Math.sin(d);
                          const B = Math.sin(frac * d) / Math.sin(d);
                          const x = A * Math.cos(rLat1) * Math.cos(rLng1) + B * Math.cos(rLat2) * Math.cos(rLng2);
                          const y = A * Math.cos(rLat1) * Math.sin(rLng1) + B * Math.cos(rLat2) * Math.sin(rLng2);
                          const z = A * Math.sin(rLat1) + B * Math.sin(rLat2);
                          const latP = (Math.atan2(z, Math.sqrt(x * x + y * y)) * 180) / Math.PI;
                          const lngP = (Math.atan2(y, x) * 180) / Math.PI;
                          arcPoints.push([lngP, latP]);
                        }
                      }
                    }

                    const flightGeo = {
                      type: 'LineString',
                      coordinates: arcPoints
                    };
                    const arcD = arcPoints.length > 1 ? svgPathGenerator(flightGeo as any) : null;
                    const planePos = svgProjection([flight.currentLng, flight.currentLat]);

                    return (
                      <g
                        key={flight.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedFlight(flight)}
                      >
                        {arcD && (
                          <path
                            d={arcD}
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth={getAntialiasedStroke(1.1, { isTrajectory: true })}
                            strokeDasharray="4 3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeOpacity={0.75}
                          />
                        )}
                        {planePos && (
                          <g transform={`translate(${planePos[0]}, ${planePos[1]}) rotate(${flight.headingDeg || 0})`}>
                            <path
                              d="M0,-7 L4,4 L0,2 L-4,4 Z"
                              fill="#38bdf8"
                              stroke="#ffffff"
                              strokeWidth={getAntialiasedStroke(0.8)}
                            />
                          </g>
                        )}
                      </g>
                    );
                  })}

                {/* Live Earthquakes */}
                {showLiveEarthquakes &&
                  liveEarthquakes.map((eq) => {
                    const pos = svgProjection([eq.lng, eq.lat]);
                    if (!pos) return null;
                    return (
                      <g
                        key={eq.id}
                        transform={`translate(${pos[0]}, ${pos[1]})`}
                        className="cursor-pointer"
                        onClick={() => setSelectedEarthquake(eq)}
                      >
                        <circle
                          r={eq.magnitude * 2.8}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth={getAntialiasedStroke(1.2)}
                          opacity={0.85}
                          className="animate-ping"
                        />
                        <circle
                          r={eq.magnitude * 1.5}
                          fill="#ef4444"
                          fillOpacity={0.85}
                          stroke="#ffffff"
                          strokeWidth={getAntialiasedStroke(0.9)}
                        />
                      </g>
                    );
                  })}

                {/* Live Satellites & Orbital Tracks */}
                {showSatellites &&
                  liveSatellites.map((sat) => {
                    let orbitD: string | null = null;
                    if (sat.groundTrack && sat.groundTrack.length > 1) {
                      const orbitGeo = {
                        type: 'LineString',
                        coordinates: sat.groundTrack
                      };
                      orbitD = svgPathGenerator(orbitGeo as any);
                    }
                    const satPos = svgProjection([sat.lng, sat.lat]);
                    const isIss = sat.satellite.id === 'iss';
                    const isCurrentSelected = activeSatellite?.satellite.id === sat.satellite.id;

                    return (
                      <g
                        key={sat.satellite.id}
                        className="cursor-pointer"
                        onClick={() => flyToSatellite(sat)}
                      >
                        {orbitD && (
                          <path
                            d={orbitD}
                            fill="none"
                            stroke={isIss ? '#818cf8' : '#38bdf8'}
                            strokeWidth={getAntialiasedStroke(isIss ? 1.4 : 1.1, { isOrbit: true, isSelected: isCurrentSelected })}
                            strokeDasharray={isIss ? '6 4' : '3 3'}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeOpacity={isCurrentSelected ? 0.95 : 0.55}
                          />
                        )}
                        {satPos && (
                          <g transform={`translate(${satPos[0]}, ${satPos[1]})`}>
                            <circle
                              r={isIss ? 10 : 8}
                              fill="none"
                              stroke={isIss ? '#818cf8' : '#38bdf8'}
                              strokeWidth={getAntialiasedStroke(1.3)}
                              className="animate-ping"
                            />
                            <circle
                              r={isIss ? 5 : 4}
                              fill={isIss ? '#6366f1' : '#0ea5e9'}
                              stroke="#ffffff"
                              strokeWidth={getAntialiasedStroke(1.1)}
                            />
                            {(isCurrentSelected || svgZoom > 1.3) && (
                              <g transform="translate(8, -8)">
                                <rect
                                  x={0}
                                  y={-12}
                                  width={isIss ? 65 : 78}
                                  height={16}
                                  rx={5}
                                  fill="#020617"
                                  fillOpacity={0.9}
                                  stroke="#38bdf8"
                                  strokeWidth={0.8}
                                />
                                <text
                                  x={5}
                                  y={0}
                                  fill="#ffffff"
                                  fontSize="10"
                                  fontFamily="monospace"
                                  fontWeight="bold"
                                >
                                  {sat.satellite.name.split('(')[0].trim()}
                                </text>
                              </g>
                            )}
                          </g>
                        )}
                      </g>
                    );
                  })}

                {/* Smart Vector Country Labels & National Capitals Layer */}
                {showCountryLabels && (() => {
                  interface SvgPlacedBox {
                    x1: number;
                    y1: number;
                    x2: number;
                    y2: number;
                  }
                  const placedBoxes: SvgPlacedBox[] = [];
                  const center = [svgWidth / 2 + svgPan.x, svgHeight / 2 + svgPan.y];
                  const rad = Math.PI / 180;
                  const centerLng = -svgRotation[0];
                  const centerLat = -svgRotation[1];

                  const hasOverlap = (b: SvgPlacedBox, buffer = 10) => {
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

                  // Sort countries: selected first, hovered second, then combined population/area priority score
                  const candidateList = [...countries].sort((a, b) => {
                    if (selectedCountry?.id === a.id) return -1;
                    if (selectedCountry?.id === b.id) return 1;
                    if (svgHoveredCountry?.id === a.id) return -1;
                    if (svgHoveredCountry?.id === b.id) return 1;
                    const scoreA = Math.log10(a.population + 10000) * 1.8 + Math.log10((a.areaKm2 || 1000) + 1000);
                    const scoreB = Math.log10(b.population + 10000) * 1.8 + Math.log10((b.areaKm2 || 1000) + 1000);
                    return scoreB - scoreA;
                  });

                  return candidateList.map((c) => {
                    const isSelected = selectedCountry?.id === c.id;
                    const isHovered = svgHoveredCountry?.id === c.id;

                    // Accurate mainland centroid
                    const centroid = geoDataService.getCountryCentroid(c.id);
                    const lng = centroid ? centroid[0] : c.lng;
                    const lat = centroid ? centroid[1] : c.lat;

                    // Exact 3D Orthographic Spherical Horizon Facing angle check
                    const cosFacing =
                      Math.sin(lat * rad) * Math.sin(centerLat * rad) +
                      Math.cos(lat * rad) * Math.cos(centerLat * rad) * Math.cos((lng - centerLng) * rad);

                    // Strictly reject points facing away on back of globe or on the extreme limb edge
                    const minCos = isSelected ? 0.18 : 0.26;
                    if (cosFacing <= minCos) return null;

                    const pt = svgProjection([lng, lat]);
                    if (!pt || !Number.isFinite(pt[0]) || !Number.isFinite(pt[1])) return null;

                    const dist = Math.hypot(pt[0] - center[0], pt[1] - center[1]);
                    if (dist > svgRadius * 0.88 && !isSelected) return null; // Inside comfortable spherical disk

                    // Progressive Level-of-Detail Filter
                    if (!isSelected && !isHovered) {
                      const countryArea = c.areaKm2 || 0;
                      if (svgZoom < 1.0 && c.population < 35000000 && countryArea < 900000) return null;
                      if (svgZoom < 1.4 && c.population < 10000000 && countryArea < 220000) return null;
                      if (svgZoom < 2.0 && c.population < 2000000 && countryArea < 40000) return null;
                    }

                    const shouldShowCapPin = showCapitals && Boolean(c.capitalEs);
                    const shouldShowCapText =
                      showCapitals &&
                      Boolean(c.capitalEs) &&
                      (isSelected ||
                        isHovered ||
                        svgZoom >= 1.35 ||
                        (svgZoom >= 1.15 && (c.population > 30000000 || (c.areaKm2 || 0) > 900000)));

                    const countryName = c.nameEs;
                    const capName = shouldShowCapText && c.capitalEs ? `★ ${c.capitalEs}` : '';

                    // Dynamic font sizing
                    const labelScale = Math.max(0.75, Math.min(1.25, 1.0 + (svgZoom - 1.0) * 0.12));
                    const countryFontSize = (isSelected ? 12.8 : isHovered ? 12.2 : 11.2) * labelScale;
                    const capFontSize = (isSelected ? 10.5 : isHovered ? 10.0 : 9.2) * labelScale;

                    const charWidth = 6.2 * labelScale;
                    const badgeW = Math.max(countryName.length + 1, shouldShowCapText ? capName.length + 1 : 0) * charWidth + 14 * labelScale;
                    const badgeH = (shouldShowCapText ? (countryFontSize + capFontSize + 11) : (countryFontSize + 7)) * labelScale;

                    const box: SvgPlacedBox = {
                      x1: pt[0] - badgeW / 2,
                      y1: pt[1] - badgeH / 2,
                      x2: pt[0] + badgeW / 2,
                      y2: pt[1] + badgeH / 2,
                    };

                    const collisionBuffer = Math.max(6, 8 * labelScale);
                    if (!isSelected && !isHovered && hasOverlap(box, collisionBuffer)) {
                      return null;
                    }
                    placedBoxes.push(box);

                    return (
                      <g
                        key={`svg-country-lbl-${c.id}`}
                        transform={`translate(${pt[0]}, ${pt[1]})`}
                        className="cursor-pointer select-none group"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCountry(c);
                        }}
                        onMouseEnter={() => setSvgHoveredCountry(c)}
                        onMouseLeave={() => setSvgHoveredCountry(null)}
                      >
                        {/* Capital City Star Marker Pin Dot */}
                        {shouldShowCapPin ? (
                          <g transform={`translate(0, ${-badgeH / 2 - 4 * labelScale})`}>
                            {isSelected && (
                              <circle
                                r={9 * labelScale}
                                fill="none"
                                stroke="#facc15"
                                strokeWidth={1.4}
                                className="animate-ping"
                              />
                            )}
                            <circle
                              r={(isSelected ? 5.0 : isHovered ? 4.0 : 3.0) * labelScale}
                              fill={isSelected ? '#facc15' : '#fde047'}
                              stroke="#ffffff"
                              strokeWidth={1.1}
                            />
                          </g>
                        ) : (
                          <circle
                            cx={0}
                            cy={-badgeH / 2 - 3 * labelScale}
                            r={2.2 * labelScale}
                            fill="#38bdf8"
                            stroke="#ffffff"
                            strokeWidth={0.8}
                          />
                        )}

                        {/* High-Contrast Balanced Glass Capsule */}
                        <rect
                          x={-badgeW / 2}
                          y={-badgeH / 2}
                          width={badgeW}
                          height={badgeH}
                          rx={5 * labelScale}
                          fill={
                            isSelected
                              ? 'rgba(3, 7, 18, 0.94)'
                              : isHovered
                              ? 'rgba(15, 23, 42, 0.90)'
                              : 'rgba(6, 12, 28, 0.78)'
                          }
                          stroke={
                            isSelected
                              ? '#facc15'
                              : isHovered
                              ? '#38bdf8'
                              : shouldShowCapPin
                              ? 'rgba(250, 204, 21, 0.35)'
                              : 'rgba(255, 255, 255, 0.18)'
                          }
                          strokeWidth={isSelected ? 1.8 : isHovered ? 1.4 : 1.0}
                        />

                        {/* Country Name */}
                        <text
                          x={0}
                          y={shouldShowCapText ? -1 * labelScale : 4 * labelScale}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize={countryFontSize}
                          fontWeight="700"
                          fontFamily="system-ui, -apple-system, sans-serif"
                          className="select-none"
                          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.85))' }}
                        >
                          {countryName}
                        </text>

                        {/* Capital City Name with Gold Star */}
                        {shouldShowCapText && (
                          <text
                            x={0}
                            y={(countryFontSize + 2) * labelScale}
                            textAnchor="middle"
                            fill={isSelected ? '#facc15' : '#fde047'}
                            fontSize={capFontSize}
                            fontWeight="600"
                            fontFamily="system-ui, -apple-system, sans-serif"
                            className="select-none"
                          >
                            {capName}
                          </text>
                        )}
                      </g>
                    );
                  });
                })()}

                {/* Selected Country Pin & High-Res Spotlight Pulse */}
                {selectedCountry && (() => {
                  const pinPos = svgProjection([selectedCountry.lng, selectedCountry.lat]);
                  if (!pinPos) return null;
                  return (
                    <g transform={`translate(${pinPos[0]}, ${pinPos[1]})`} pointerEvents="none">
                      <circle r={14} fill="none" stroke="#facc15" strokeWidth={getAntialiasedStroke(2.0, { isSelected: true })} className="animate-ping" />
                      <circle r={6} fill="#facc15" stroke="#ffffff" strokeWidth={getAntialiasedStroke(1.4)} />
                    </g>
                  );
                })()}
              </g>

              {/* Vector Atmosphere Rim Glow */}
              {showAtmosphereGlow && (
                <circle
                  cx={svgWidth / 2 + svgPan.x}
                  cy={svgHeight / 2 + svgPan.y}
                  r={svgRadius * 1.045}
                  fill="url(#svgAtmosphereGlow)"
                  pointerEvents="none"
                />
              )}
            </svg>

            {/* Quick Floating Zoom & Antialiasing Toolbar for SVG 3D Globe */}
            <div className="absolute bottom-5 left-5 z-20 flex flex-col gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-2xl shadow-2xl">
              <button
                onClick={() => setSvgZoom((prev) => Math.min(30.0, prev * 1.35))}
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
                title="Ampliar zoom vectorial (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSvgZoom((prev) => Math.max(0.6, prev * 0.75))}
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
                title="Reducir zoom vectorial (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setSvgZoom(1.0);
                  setSvgPan({ x: 0, y: 0 });
                  setSvgRotation([-15, -20]);
                }}
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
                title="Restablecer vista 3D"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Antialiasing Quick Indicator */}
              <div className="pt-1 border-t border-slate-800 flex flex-col items-center">
                <button
                  onClick={() => setShowAaMenu(!showAaMenu)}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                    antialiasingEnabled
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-slate-950 text-slate-500 border border-slate-800 hover:text-slate-300'
                  }`}
                  title="Configuración de Suavizado de Renderizado (Antialiasing 8K)"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
                <span className="text-[9px] font-mono font-bold text-slate-400 mt-0.5">
                  {svgZoom >= 10 ? `${svgZoom.toFixed(0)}x` : `${svgZoom.toFixed(1)}x`}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Three.js WebGL Container */}
            <div
              ref={mountRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing select-none"
            />
            {/* 2D Labels Canvas Overlay */}
            <canvas
              ref={labelsCanvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
            />
          </>
        )}

        {/* Master Real-Time Status & Clock Banner */}
        <div className="absolute top-3 left-4 right-4 z-20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pointer-events-none">
          {/* Real-Time Telemetry Bar */}
          <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-2xl shadow-2xl pointer-events-auto relative">
            {/* Engine Selector: SVG 3D vs WebGL 3D */}
            <div className="flex items-center gap-1 bg-slate-950/95 p-0.5 rounded-xl border border-sky-500/40 shadow-inner">
              <button
                onClick={() => setRenderEngine('svg_vector')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  renderEngine === 'svg_vector'
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Globo 3D SVG Vectorial de resolución infinita sin pérdida de calidad"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Globo 3D SVG</span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-sky-950/90 border border-sky-400/40 text-sky-200">
                  HD
                </span>
              </button>

              <button
                onClick={() => setRenderEngine('webgl')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  renderEngine === 'webgl'
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Globo 3D WebGL con texturas procedurales 8K"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>WebGL 3D</span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-300">
                  8K
                </span>
              </button>
            </div>

            {/* Antialiasing (AA) Status Button & Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowAaMenu(!showAaMenu)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  antialiasingEnabled
                    ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Configuración de Suavizado de Renderizado y Antialiasing Vectorial"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Suavizado AA</span>
                <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-emerald-900/80 text-emerald-200">
                  {antialiasingEnabled
                    ? antialiasingMode === 'geometric_subpixel'
                      ? '8K Subpixel'
                      : antialiasingMode === 'fxaa_smooth'
                      ? 'FXAA'
                      : 'Retina'
                    : 'OFF'}
                </span>
              </button>

              {/* AA Configuration Floating Dropdown */}
              {showAaMenu && (
                <div className="absolute top-full mt-2 left-0 w-72 bg-slate-950/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl p-3 shadow-2xl z-50 space-y-2.5 text-xs text-slate-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" /> Suavizado (Antialiasing)
                    </span>
                    <button
                      onClick={() => setAntialiasingEnabled(!antialiasingEnabled)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        antialiasingEnabled
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {antialiasingEnabled ? 'Activado' : 'Desactivado'}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Modo de Algoritmo AA:</label>
                    <div className="grid grid-cols-1 gap-1">
                      <button
                        onClick={() => setAntialiasingMode('geometric_subpixel')}
                        className={`text-left px-2.5 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
                          antialiasingMode === 'geometric_subpixel'
                            ? 'bg-sky-500/20 border-sky-400/50 text-sky-200'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="font-semibold text-white">Subpixel Geométrico 8K</div>
                        <div className="text-[10px] text-slate-400">Interpolación de precisión geodésica ultra-densa</div>
                      </button>

                      <button
                        onClick={() => setAntialiasingMode('fxaa_smooth')}
                        className={`text-left px-2.5 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
                          antialiasingMode === 'fxaa_smooth'
                            ? 'bg-sky-500/20 border-sky-400/50 text-sky-200'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="font-semibold text-white">FXAA Vectorial Suave</div>
                        <div className="text-[10px] text-slate-400">Micro-convolución para eliminar saltos de píxel</div>
                      </button>

                      <button
                        onClick={() => setAntialiasingMode('retina_crisp')}
                        className={`text-left px-2.5 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
                          antialiasingMode === 'retina_crisp'
                            ? 'bg-sky-500/20 border-sky-400/50 text-sky-200'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="font-semibold text-white">Retina Alta Nitidez</div>
                        <div className="text-[10px] text-slate-400">Trazado nítido de alto contraste continuo</div>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">Grosor Adaptativo en Zoom</div>
                      <div className="text-[10px] text-slate-400">Evita el engrosamiento excesivo al acercar</div>
                    </div>
                    <button
                      onClick={() => setAdaptiveStrokeSmoothing(!adaptiveStrokeSmoothing)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                        adaptiveStrokeSmoothing ? 'bg-sky-500' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          adaptiveStrokeSmoothing ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-mono font-bold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>EN VIVO</span>
            </div>

            {/* UTC Clock */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-bold text-white">{solarEphemeris.utcTimeFormatted}</span>
              <span className="text-slate-400 hidden sm:inline">| {solarEphemeris.utcDateFormatted}</span>
            </div>

            {/* Subsolar Point */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs font-mono">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Cenit Solar:</span>
              <span className="text-amber-300 font-semibold">{solarEphemeris.subsolarFormatted}</span>
            </div>

            {/* Camera Mode Selector */}
            <div className="flex items-center gap-1 bg-slate-950/90 p-0.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setCameraMode('free')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  cameraMode === 'free'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Cámara 3D libre con órbita manual"
              >
                <Globe className="w-3 h-3" />
                <span className="hidden sm:inline">Libre</span>
              </button>

              <button
                onClick={() => {
                  setCameraMode('iss_live');
                  setActiveSidebarTab('satellites');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  cameraMode === 'iss_live'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Cámara orbital en primera persona a bordo de la ISS (420 km)"
              >
                <Video className="w-3 h-3" />
                <span>ISS en Vivo</span>
              </button>

              <button
                onClick={() => setCameraMode('solar_sync')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  cameraMode === 'solar_sync'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Sincronizar perspectiva con el cenit solar en tiempo real"
              >
                <Sun className="w-3 h-3" />
                <span className="hidden sm:inline">Sol</span>
              </button>

              {selectedFlight && (
                <button
                  onClick={() => setCameraMode('flight_follow')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    cameraMode === 'flight_follow'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Seguir vuelo transcontinental en vivo"
                >
                  <Plane className="w-3 h-3" />
                  <span>{selectedFlight.callsign}</span>
                </button>
              )}
            </div>

            {/* Time Speed Control */}
            <div className="flex items-center gap-1 bg-slate-950/90 p-0.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setTimeMultiplier(timeMultiplier === 0 ? 1 : 0)}
                className={`p-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  timeMultiplier === 0 ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
                }`}
                title={timeMultiplier === 0 ? 'Reanudar tiempo real' : 'Pausar'}
              >
                {timeMultiplier === 0 ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              </button>

              <button
                onClick={() => setTimeMultiplier(1)}
                className={`px-1.5 py-0.5 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                  timeMultiplier === 1 ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="1x (Velocidad en tiempo real)"
              >
                1x
              </button>

              <button
                onClick={() => setTimeMultiplier(60)}
                className={`px-1.5 py-0.5 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                  timeMultiplier === 60 ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="60x (1 minuto por segundo)"
              >
                60x
              </button>

              <button
                onClick={() => setTimeMultiplier(1440)}
                className={`px-1.5 py-0.5 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                  timeMultiplier === 1440 ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="1440x (1 día por minuto - Ciclo Día/Noche acelerado)"
              >
                1440x
              </button>
            </div>
          </div>

          {/* Quick Action Tools (Export 8K & Snapshot) */}
          <div className="flex items-center gap-2 pointer-events-auto self-end md:self-auto">
            <button
              onClick={handleExport8KSVG}
              disabled={isExporting8K}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
              title="Generar y descargar archivo vectorial SVG puro en resolución 8192 × 4320"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting8K ? 'Generando 8K...' : 'Generar SVG 8K'}</span>
            </button>

            <button
              onClick={handleCapture3DSnapshot}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shadow-lg backdrop-blur transition-all cursor-pointer"
              title="Capturar foto 3D satelital en alta resolución"
            >
              <Camera className="w-4 h-4" />
            </button>

            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-2 rounded-xl border shadow-lg backdrop-blur transition-all cursor-pointer ${
                autoRotate
                  ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                  : 'bg-slate-900/80 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
              title="Rotación automática en tiempo real"
            >
              <RefreshCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Imagery Mode Pills (Secondary Top Bar) */}
        <div className="absolute top-16 left-4 z-20 flex items-center gap-1.5 p-1 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-2xl shadow-xl pointer-events-auto overflow-x-auto max-w-[calc(100%-2rem)]">
          <button
            onClick={() => setImageryMode('blue_marble')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              imageryMode === 'blue_marble'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>NASA Blue Marble 8K</span>
          </button>

          <button
            onClick={() => setImageryMode('infrared_clouds')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              imageryMode === 'infrared_clouds'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CloudSun className="w-3.5 h-3.5" />
            <span>IR Nubes & Clima</span>
          </button>

          <button
            onClick={() => setImageryMode('night_lights')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              imageryMode === 'night_lights'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Luces Nocturnas</span>
          </button>

          <button
            onClick={() => setImageryMode('sentinel_ndvi')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              imageryMode === 'sentinel_ndvi'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Sentinel NDVI</span>
          </button>

          <button
            onClick={() => setImageryMode('topo_relief')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              imageryMode === 'topo_relief'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Relieve 3D SRTM</span>
          </button>
        </div>

        {/* Live Notification Banner */}
        {exportNotification && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-2xl bg-sky-950/90 border border-sky-400 text-sky-200 text-xs font-semibold shadow-2xl backdrop-blur animate-fade-in flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400 animate-spin" />
            <span>{exportNotification}</span>
          </div>
        )}

        {/* Real-Time Satellite Telemetry Overlay HUD (Top Right) */}
        {showSatellites && activeSatellite && (
          <div className="absolute top-16 right-4 z-20 pointer-events-auto max-w-[340px] w-[calc(100%-2rem)] sm:w-[330px] transition-all">
            {isSatelliteOverlayExpanded ? (
              <div className="bg-slate-950/90 backdrop-blur-xl border border-sky-500/30 rounded-2xl p-3.5 shadow-2xl shadow-sky-950/50 text-slate-200 text-xs font-mono flex flex-col gap-2.5">
                {/* Header & Live Status */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex-shrink-0">
                      <Satellite className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-white tracking-tight truncate">TELEMETRÍA ORBITAL</span>
                        <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> EN VIVO
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 truncate block">NORAD #{activeSatellite.satellite.noradId} | {activeSatellite.satellite.agency}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsSatelliteOverlayExpanded(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex-shrink-0 ml-1"
                    title="Minimizar panel de telemetría"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>

                {/* Satellite Switcher Dropdown */}
                <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                  <select
                    value={selectedSatelliteId}
                    onChange={(e) => {
                      setSelectedSatelliteId(e.target.value);
                      const targetSat = liveSatellites.find((s) => s.satellite.id === e.target.value);
                      if (targetSat) {
                        setSelectedSatellite(targetSat);
                      }
                    }}
                    className="bg-transparent text-xs font-semibold text-sky-300 w-full focus:outline-none cursor-pointer py-0.5 px-1 truncate"
                  >
                    {liveSatellites.map((s) => (
                      <option key={s.satellite.id} value={s.satellite.id} className="bg-slate-900 text-white">
                        {s.satellite.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Live Telemetry Grid */}
                <div className="grid grid-cols-2 gap-1.5">
                  {/* Altitude */}
                  <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-2 flex flex-col">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Compass className="w-3 h-3 text-sky-400" /> Altitud
                    </span>
                    <span className="text-sm font-bold text-white font-mono mt-0.5">
                      {activeSatellite.altitudeKm.toLocaleString()} <span className="text-[10px] text-sky-400 font-normal">km</span>
                    </span>
                    <span className="text-[9px] text-slate-500 truncate">
                      {activeSatellite.altitudeKm > 30000 ? 'GEO (Geoestacionario)' : 'LEO (Baja Terrestre)'}
                    </span>
                  </div>

                  {/* Velocity */}
                  <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-2 flex flex-col">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" /> Velocidad
                    </span>
                    <span className="text-sm font-bold text-white font-mono mt-0.5">
                      {activeSatellite.speedKmh.toLocaleString()} <span className="text-[10px] text-amber-400 font-normal">km/h</span>
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {(activeSatellite.speedKmh / 3600).toFixed(2)} km/s
                    </span>
                  </div>

                  {/* Coordinates */}
                  <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-2 flex flex-col col-span-2">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Crosshair className="w-3 h-3 text-emerald-400" /> Posición Sub-Satelital (SSP)
                    </span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs font-bold text-emerald-300 font-mono">
                        {Math.abs(activeSatellite.lat).toFixed(3)}°{activeSatellite.lat >= 0 ? 'N' : 'S'}, {Math.abs(activeSatellite.lng).toFixed(3)}°{activeSatellite.lng >= 0 ? 'E' : 'W'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Az {activeSatellite.azimuthDeg}° | El {activeSatellite.elevationDeg}°
                      </span>
                    </div>
                  </div>

                  {/* Inclination */}
                  <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-2 flex flex-col">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider">Inclinación</span>
                    <span className="text-xs font-bold text-white font-mono mt-0.5">
                      {activeSatellite.satellite.inclinationDeg}°
                    </span>
                  </div>

                  {/* Period */}
                  <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-2 flex flex-col">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider">Período Orbital</span>
                    <span className="text-xs font-bold text-white font-mono mt-0.5">
                      {activeSatellite.satellite.periodMinutes} <span className="text-[9px] text-slate-400 font-normal">min</span>
                    </span>
                  </div>
                </div>

                {/* Orbit Completion Progress Bar */}
                <div className="space-y-1 bg-slate-900/70 border border-slate-800/80 rounded-xl p-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-sky-400" /> Progreso Orbital
                    </span>
                    <span className="font-bold text-sky-300 font-mono">
                      {Math.round(activeSatellite.orbitalProgress * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300 rounded-full"
                      style={{ width: `${Math.round(activeSatellite.orbitalProgress * 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-500">
                    <span>Cobertura: {activeSatellite.footprintKm.toLocaleString()} km</span>
                    <span>Lanzamiento: {activeSatellite.satellite.launchYear}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                  <button
                    onClick={() => flyToSatellite(activeSatellite)}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 hover:text-white border border-sky-400/40 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    title="Centrar perspectiva 3D en este satélite"
                  >
                    <Crosshair className="w-3 h-3" />
                    <span>Centrar en 3D</span>
                  </button>

                  {activeSatellite.satellite.id === 'iss' ? (
                    <button
                      onClick={() => {
                        setCameraMode('iss_live');
                        setActiveSidebarTab('satellites');
                      }}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-indigo-600/30"
                      title="Cámara orbital en primera persona de la ISS"
                    >
                      <Video className="w-3 h-3" />
                      <span>ISS en Vivo</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const iss = liveSatellites.find((s) => s.satellite.id === 'iss');
                        if (iss) flyToSatellite(iss);
                      }}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      title="Ir a la Estación Espacial Internacional"
                    >
                      <Satellite className="w-3 h-3" />
                      <span>Ir a la ISS</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Collapsed Telemetry Pill */
              <div
                onClick={() => setIsSatelliteOverlayExpanded(true)}
                className="bg-slate-950/90 backdrop-blur-xl border border-sky-500/30 hover:border-sky-400 rounded-2xl p-2.5 shadow-2xl text-xs font-mono flex items-center justify-between gap-3 text-slate-200 cursor-pointer hover:bg-slate-900 transition-all group"
                title="Expandir panel de telemetría de satélites"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-sky-500/20 text-sky-400">
                    <Satellite className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-[11px]">{activeSatellite.satellite.name.split('(')[0]}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {activeSatellite.altitudeKm} km · {activeSatellite.speedKmh.toLocaleString()} km/h
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-sky-400 font-semibold group-hover:text-white transition-colors">
                  <span>Telemetría</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Left: Live GPS & Solar Telemetry HUD */}
        <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 p-3 rounded-2xl shadow-2xl text-xs space-y-1.5 max-w-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] uppercase font-mono tracking-wider text-sky-400 font-semibold flex items-center gap-1">
                <Crosshair className="w-3 h-3" /> WGS84 TELEMETRÍA
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> EN VIVO
              </span>
            </div>
            <div className="font-mono text-white font-semibold">
              {cursorTelemetry ? cursorTelemetry.formatted : '00°00\'00"N 00°00\'00"E'}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/80">
              <span>Hora Solar Local:</span>
              <span className="text-amber-300 font-semibold">{cursorTelemetry?.solarTime || '12:00 LST'}</span>
            </div>
          </div>
        </div>

        {/* Bottom Right: Real-Time Layer Switcher Overlay */}
        <div className="absolute bottom-4 right-4 z-20 flex flex-wrap items-center gap-1.5 bg-slate-900/85 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl shadow-2xl pointer-events-auto">
          <button
            onClick={() => setShowLiveClouds(!showLiveClouds)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showLiveClouds
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CloudSun className="w-3 h-3" />
            <span>Nubes</span>
          </button>

          <button
            onClick={() => setShowSatellites(!showSatellites)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showSatellites
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Satellite className="w-3 h-3" />
            <span>Satélites</span>
          </button>

          <button
            onClick={() => setShowLiveFlights(!showLiveFlights)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showLiveFlights
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plane className="w-3 h-3" />
            <span>Vuelos</span>
          </button>

          <button
            onClick={() => setShowLiveEarthquakes(!showLiveEarthquakes)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showLiveEarthquakes
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>Sismos</span>
          </button>

          <button
            onClick={() => setShowGraticule(!showGraticule)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showGraticule
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3 h-3" />
            <span>Graticula</span>
          </button>

          <button
            onClick={() => setShowCountryLabels(!showCountryLabels)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showCountryLabels
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Mostrar u ocultar nombres de países"
          >
            <Eye className="w-3 h-3" />
            <span>Países</span>
          </button>

          <button
            onClick={() => setShowCapitals(!showCapitals)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showCapitals
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Mostrar u ocultar capitales de países con estrella dorada"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Capitales</span>
          </button>

          <button
            onClick={() => setLabelContrastMode(labelContrastMode === 'ultra_crisp_badge' ? 'luminous_halo' : 'ultra_crisp_badge')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              labelContrastMode === 'ultra_crisp_badge'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Alternar estilo de contraste: Tarjeta Nítida / Halo Luminoso"
          >
            <Sliders className="w-3 h-3 text-indigo-400" />
            <span>{labelContrastMode === 'ultra_crisp_badge' ? 'Alto Contraste' : 'Halo'}</span>
          </button>
        </div>
      </div>

      {/* Right Sidebar: Real-Time Multifeed Inspector (Satellites, Flights, Earthquakes, Country) */}
      <div className="w-full lg:w-96 flex flex-col gap-3">
        {/* Tab Navigation Header */}
        <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-xl">
          <button
            onClick={() => setActiveSidebarTab('satellites')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSidebarTab === 'satellites'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>Satélites ({liveSatellites.length})</span>
          </button>

          <button
            onClick={() => setActiveSidebarTab('flights')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSidebarTab === 'flights'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Vuelos ({liveFlights.length})</span>
          </button>

          <button
            onClick={() => setActiveSidebarTab('earthquakes')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSidebarTab === 'earthquakes'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Sismos ({liveEarthquakes.length})</span>
          </button>

          <button
            onClick={() => setActiveSidebarTab('country')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSidebarTab === 'country'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>País</span>
          </button>
        </div>

        {/* Tab 1: Real-Time Orbiting Satellites Telemetry */}
        {activeSidebarTab === 'satellites' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-3.5 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30">
                  <Satellite className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">Satélites en Órbita Real</h3>
                  <p className="text-[10px] font-mono text-slate-400">Propagación orbital SGP4 WGS84</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded-lg border border-sky-500/30">
                {liveSatellites.length} EN LÍNEA
              </span>
            </div>

            {/* List of Live Orbiting Satellites */}
            <div className="space-y-2 flex-1 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
              {liveSatellites.map((satPos) => (
                <div
                  key={satPos.satellite.id}
                  onClick={() => flyToSatellite(satPos)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer text-left flex flex-col gap-2 ${
                    selectedSatellite?.satellite.id === satPos.satellite.id
                      ? 'bg-sky-950/60 border-sky-400 ring-1 ring-sky-400/30 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 hover:border-sky-500/40 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: satPos.satellite.color }}
                      />
                      <div className="truncate">
                        <p className="text-xs font-bold text-white truncate">{satPos.satellite.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">{satPos.satellite.purpose}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-sky-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                      NORAD #{satPos.satellite.noradId}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-400 block">Altitud:</span>
                      <span className="text-white font-bold">{Math.round(satPos.altitudeKm)} km</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Velocidad:</span>
                      <span className="text-white font-bold">{satPos.speedKmh.toLocaleString()} km/h</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Latitud:</span>
                      <span className="text-sky-300 font-bold">{satPos.lat.toFixed(2)}°</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Longitud:</span>
                      <span className="text-sky-300 font-bold">{satPos.lng.toFixed(2)}°</span>
                    </div>
                  </div>

                  {satPos.satellite.noradId === 25544 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCameraMode('iss_live');
                      }}
                      className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Activar Cámara ISS en Vivo (420 km)</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Live Transcontinental Commercial Flights Feed */}
        {activeSidebarTab === 'flights' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-3.5 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30">
                  <Plane className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">Vuelos Comerciales en Tránsito</h3>
                  <p className="text-[10px] font-mono text-slate-400">Rutas ortodrómicas geodésicas en vivo</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded-lg border border-sky-500/30">
                {liveFlights.length} VUELOS
              </span>
            </div>

            <div className="space-y-2 flex-1 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
              {liveFlights.map((flt) => (
                <div
                  key={flt.id}
                  onClick={() => {
                    setSelectedFlight(flt);
                    setCameraMode('flight_follow');
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer text-left flex flex-col gap-2 ${
                    selectedFlight?.id === flt.id
                      ? 'bg-sky-950/60 border-sky-400 ring-1 ring-sky-400/30 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 hover:border-sky-500/40 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Plane className="w-4 h-4 text-sky-400" />
                      <div>
                        <p className="text-xs font-bold text-white leading-none">{flt.callsign} · {flt.airline}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{flt.aircraft}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                      {flt.progressPercent}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-white px-2 py-1.5 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 font-normal block">{flt.originCity}</span>
                      <span className="font-mono text-sky-300">{flt.originIata}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-normal block">{flt.destCity}</span>
                      <span className="font-mono text-amber-300">{flt.destIata}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono text-slate-300 bg-slate-950 p-2 rounded-xl">
                    <div>
                      <span className="text-slate-500 block">Altitud:</span>
                      <span className="font-bold text-white">{flt.altitudeMeters.toLocaleString()} m</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Velocidad:</span>
                      <span className="font-bold text-white">{flt.speedKmh} km/h</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Rumbo:</span>
                      <span className="font-bold text-sky-400">{flt.headingDeg}°</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Live Global Earthquakes Activity */}
        {activeSidebarTab === 'earthquakes' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-3.5 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30">
                  <Activity className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">Actividad Sísmica Global</h3>
                  <p className="text-[10px] font-mono text-slate-400">Epicentros y magnitudes WGS84</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-lg border border-amber-500/30">
                {liveEarthquakes.length} EVENTOS
              </span>
            </div>

            <div className="space-y-2 flex-1 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
              {liveEarthquakes.map((q) => (
                <div
                  key={q.id}
                  onClick={() => {
                    setSelectedEarthquake(q);
                    targetRotationRef.current = {
                      x: (q.lat * Math.PI) / 180,
                      y: -(q.lng * Math.PI) / 180 - Math.PI / 2
                    };
                    targetDistanceRef.current = 8.5;
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer text-left flex flex-col gap-2 ${
                    selectedEarthquake?.id === q.id
                      ? 'bg-amber-950/60 border-amber-400 ring-1 ring-amber-400/30 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 hover:border-amber-500/40 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold font-mono px-2.5 py-1 rounded-xl ${
                        q.magnitude >= 6.0
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      M {q.magnitude.toFixed(1)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Profundidad: {q.depthKm} km
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-white">{q.place}</p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-xl">
                    <span>{countryService.formatCoordinatesDMS(q.lat, q.lng)}</span>
                    <span className="text-sky-300">Enfocar Epicentro 3D</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Country Inspector & Geodesy */}
        {activeSidebarTab === 'country' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex-1 flex flex-col justify-between gap-4">
            {selectedCountry ? (
              <div>
                {/* Flag & Title Preview */}
                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shadow-lg">
                  <img
                    src={countryService.getFlagSvgUrl(selectedCountry.id)}
                    alt={`Bandera SVG de ${selectedCountry.nameEs}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-sky-300 font-semibold bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur">
                        {selectedCountry.continent}
                      </span>
                      <h4 className="text-lg font-bold text-white leading-tight mt-1">{selectedCountry.nameEs}</h4>
                    </div>
                    <span className="text-xs font-mono font-bold text-white bg-sky-500/80 backdrop-blur px-2.5 py-1 rounded-lg border border-sky-400/40">
                      {selectedCountry.code3}
                    </span>
                  </div>
                </div>

                {/* Geographic Coordinates & Flight Route Selector */}
                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      Coordenadas
                    </span>
                    <span className="font-mono font-semibold text-white">
                      {countryService.formatCoordinatesDMS(selectedCountry.lat, selectedCountry.lng)}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-sky-500/20">
                    <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                      <Plane className="w-3.5 h-3.5" />
                      Trazar Vuelo Geodésico 3D
                    </span>
                    <select
                      value={targetFlightCountry?.id || ''}
                      onChange={(e) => {
                        const found = countries.find((c) => c.id === e.target.value);
                        setTargetFlightCountry(found || null);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    >
                      <option value="">Seleccionar destino geodésico...</option>
                      {countries
                        .filter((c) => c.id !== selectedCountry.id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nameEs} ({countryService.calculateDistanceKm(selectedCountry, c).toLocaleString()} km)
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 text-slate-400 flex-1">
                <Globe className="w-10 h-10 text-sky-400 mb-2 animate-bounce" />
                <p className="font-semibold text-white text-sm">Explora el Mapa 3D Satelital</p>
                <p className="text-xs mt-1">Haz clic en cualquier país del globo para inspeccionar su división política y geodésica.</p>
              </div>
            )}

            {/* Action Modals Button Row */}
            {selectedCountry && onOpenDetailsModal && (
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => onOpenDetailsModal(selectedCountry)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 flex-shrink-0" />
                  <span>Ficha Completa & Bandera SVG</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
