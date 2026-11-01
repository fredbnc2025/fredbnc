import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Satellite,
  Layers,
  CloudRain,
  Radio,
  Plane,
  Activity,
  Sun,
  Video,
  Navigation,
  Compass,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Search,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Eye,
  Info,
  MapPin,
  Globe2,
  X,
  Play,
  Pause,
  Clock,
  ChevronRight,
  ChevronLeft,
  Gauge,
  Zap,
  LocateFixed
} from 'lucide-react';
import { Country } from '../types';
import { countryService } from '../services/countryService';
import { geoDataService } from '../services/geoDataService';

interface LiveSatelliteMapProps {
  countries: Country[];
  selectedCountry: Country | null;
  onSelectCountry: (country: Country) => void;
  onOpenDetails: (country: Country) => void;
}

// Live Satellite & Map Tile Providers
type TileProvider = 'esri_satellite' | 'esri_clarity' | 'osm_standard' | 'carto_dark' | 'opentopo' | 'nasa_gibs';

export interface SatelliteTelemetry {
  id: string;
  name: string;
  codeName: string;
  noradId: number;
  category: 'station' | 'observation' | 'astronomy' | 'weather' | 'constellation';
  operator: string;
  orbitType: 'LEO' | 'GEO' | 'SSO';
  lat: number;
  lng: number;
  altitude: number; // km
  velocity: number; // km/h
  mach: number;
  periodMin: number;
  inclinationDeg: number;
  apogeeKm: number;
  perigeeKm: number;
  sunlit: boolean;
  color: string;
  icon: string;
  launchYear: number;
  purpose: string;
  orbitPhase: number;
  raan: number;
}

interface LiveWebcam {
  id: string;
  name: string;
  country: string;
  city: string;
  lat: number;
  lng: number;
  type: 'youtube_live' | 'earthcam' | 'windy';
  embedUrl: string;
  thumbnail: string;
  description: string;
}

const GLOBAL_LIVE_WEBCAMS: LiveWebcam[] = [
  {
    id: 'tokyo-shibuya',
    name: 'Shibuya Crossing',
    country: 'Japón',
    city: 'Tokio',
    lat: 35.6595,
    lng: 139.7005,
    type: 'youtube_live',
    embedUrl: 'https://www.youtube-nocookie.com/embed/gFRtAAmiFbE?autoplay=1&mute=1',
    thumbnail: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&q=80',
    description: 'El cruce peatonal más transitado del mundo en vivo 24/7'
  },
  {
    id: 'times-square',
    name: 'Times Square',
    country: 'Estados Unidos',
    city: 'Nueva York',
    lat: 40.758,
    lng: -73.9855,
    type: 'youtube_live',
    embedUrl: 'https://www.youtube-nocookie.com/embed/1-iS7LArMPA?autoplay=1&mute=1',
    thumbnail: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80',
    description: 'El corazón iluminado de Manhattan en directo'
  },
  {
    id: 'eiffel-tower',
    name: 'Torre Eiffel & Río Sena',
    country: 'Francia',
    city: 'París',
    lat: 48.8584,
    lng: 2.2945,
    type: 'youtube_live',
    embedUrl: 'https://www.youtube-nocookie.com/embed/OzYp4Nvdv_c?autoplay=1&mute=1',
    thumbnail: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=600&q=80',
    description: 'Vista panorámica de la Torre Eiffel y los Campos de Marte'
  },
  {
    id: 'rome-colosseum',
    name: 'Coliseo Romano',
    country: 'Italia',
    city: 'Roma',
    lat: 41.8902,
    lng: 12.4922,
    type: 'youtube_live',
    embedUrl: 'https://www.youtube-nocookie.com/embed/74z_bCjW8wM?autoplay=1&mute=1',
    thumbnail: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80',
    description: 'El emblemático anfiteatro de la Roma Antigua'
  },
  {
    id: 'london-bridge',
    name: 'Tower Bridge & Támesis',
    country: 'Reino Unido',
    city: 'Londres',
    lat: 51.5055,
    lng: -0.0754,
    type: 'youtube_live',
    embedUrl: 'https://www.youtube-nocookie.com/embed/bKyy_dJ6qH4?autoplay=1&mute=1',
    thumbnail: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80',
    description: 'Tráfico fluvial y puente levadizo sobre el río Támesis'
  },
  {
    id: 'madrid-sol',
    name: 'Puerta del Sol',
    country: 'España',
    city: 'Madrid',
    lat: 40.4168,
    lng: -3.7038,
    type: 'youtube_live',
    embedUrl: 'https://www.youtube-nocookie.com/embed/8v_4O44sfjM?autoplay=1&mute=1',
    thumbnail: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80',
    description: 'Kilómetro Cero de España y centro neurálgico de Madrid'
  },
  {
    id: 'sydney-harbour',
    name: 'Ópera y Bahía de Sídney',
    country: 'Australia',
    city: 'Sídney',
    lat: -33.8568,
    lng: 151.2153,
    type: 'youtube_live',
    embedUrl: 'https://www.youtube-nocookie.com/embed/Xq4n_dKzgYw?autoplay=1&mute=1',
    thumbnail: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&q=80',
    description: 'Bahía de Sídney y la Ópera en tiempo real'
  },
  {
    id: 'iss-live',
    name: 'Estación Espacial ISS (Órbita Terrestre)',
    country: 'Espacio Exterior',
    city: 'Órbita LEO (~420 km)',
    lat: 0,
    lng: 0,
    type: 'youtube_live',
    embedUrl: 'https://www.youtube-nocookie.com/embed/4_otff8g_nw?autoplay=1&mute=1',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80',
    description: 'Transmisión de cámaras de alta definición de la NASA desde la ISS'
  }
];

interface LiveIssData {
  lat: number;
  lng: number;
  altitude: number; // km
  velocity: number; // km/h
  visibility: string;
  timestamp: number;
}

interface LiveEarthquake {
  id: string;
  mag: number;
  place: string;
  time: number;
  lat: number;
  lng: number;
  depth: number;
}

interface LiveFlight {
  icao24: string;
  callsign: string;
  originCountry: string;
  lat: number;
  lng: number;
  altitude: number;
  heading: number;
  velocity: number;
}

export const LiveSatelliteMap: React.FC<LiveSatelliteMapProps> = ({
  countries,
  selectedCountry,
  onSelectCountry,
  onOpenDetails
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const radarTileLayerRef = useRef<L.TileLayer | null>(null);
  const terminatorPolygonRef = useRef<L.Polygon | null>(null);

  // Markers Layer Groups
  const countryMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const countryBordersGroupRef = useRef<L.GeoJSON | null>(null);
  const esriBoundariesLayerRef = useRef<L.TileLayer | null>(null);
  const issMarkerGroupRef = useRef<L.LayerGroup | null>(null);
  const satellitesGroupRef = useRef<L.LayerGroup | null>(null);
  const orbitTrackLayerRef = useRef<L.Polyline | null>(null);
  const earthquakesGroupRef = useRef<L.LayerGroup | null>(null);
  const flightsGroupRef = useRef<L.LayerGroup | null>(null);
  const webcamsGroupRef = useRef<L.LayerGroup | null>(null);

  // Layer & UI States
  const [activeTile, setActiveTile] = useState<TileProvider>('esri_satellite');
  const [showCountryBorders, setShowCountryBorders] = useState<boolean>(true);
  const [showDetailedSubdivisions, setShowDetailedSubdivisions] = useState<boolean>(true);
  const [borderColorTheme, setBorderColorTheme] = useState<'cyan' | 'gold' | 'white' | 'emerald'>('white');
  const [showWeatherRadar, setShowWeatherRadar] = useState<boolean>(true);
  const [showSolarTerminator, setShowSolarTerminator] = useState<boolean>(true);
  const [showIssLive, setShowIssLive] = useState<boolean>(true);
  const [showEarthquakes, setShowEarthquakes] = useState<boolean>(true);
  const [showLiveFlights, setShowLiveFlights] = useState<boolean>(true);
  const [showWebcams, setShowWebcams] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [mapViewportChangeCount, setMapViewportChangeCount] = useState<number>(0);

  // Satellite Telemetry & Synchronized UTC Clock States
  const [isSatellitePanelOpen, setIsSatellitePanelOpen] = useState<boolean>(true);
  const [satelliteSearch, setSatelliteSearch] = useState<string>('');
  const [satelliteCategoryFilter, setSatelliteCategoryFilter] = useState<'all' | 'station' | 'observation' | 'astronomy' | 'weather' | 'constellation'>('all');
  const [selectedSatelliteId, setSelectedSatelliteId] = useState<string>('iss');
  const [isAutoFollowingSatellite, setIsAutoFollowingSatellite] = useState<boolean>(false);
  const [showOrbitGroundTrack, setShowOrbitGroundTrack] = useState<boolean>(true);
  
  // Real-Time Synchronized UTC Clock
  const [currentUtcDate, setCurrentUtcDate] = useState<Date>(new Date());

  // Satellites Fleet State
  const [satellites, setSatellites] = useState<SatelliteTelemetry[]>([
    {
      id: 'iss',
      name: 'Estación Espacial Internacional (ISS)',
      codeName: 'ISS (ZARYA)',
      noradId: 25544,
      category: 'station',
      operator: 'NASA / Roscosmos / ESA / JAXA',
      orbitType: 'LEO',
      lat: 15.2,
      lng: -42.8,
      altitude: 418,
      velocity: 27580,
      mach: 22.5,
      periodMin: 92.9,
      inclinationDeg: 51.64,
      apogeeKm: 422,
      perigeeKm: 415,
      sunlit: true,
      color: '#06b6d4',
      icon: '🛰️',
      launchYear: 1998,
      purpose: 'Laboratorio científico orbital multidisciplinario y hábitat humano continuo',
      orbitPhase: 1.2,
      raan: 75.0
    },
    {
      id: 'tiangong',
      name: 'Estación Espacial Tiangong (CSS)',
      codeName: 'TIANGONG-3',
      noradId: 48274,
      category: 'station',
      operator: 'CMSA (China Manned Space)',
      orbitType: 'LEO',
      lat: -22.4,
      lng: 112.1,
      altitude: 390,
      velocity: 27620,
      mach: 22.6,
      periodMin: 91.5,
      inclinationDeg: 41.47,
      apogeeKm: 395,
      perigeeKm: 385,
      sunlit: true,
      color: '#f59e0b',
      icon: '🚀',
      launchYear: 2021,
      purpose: 'Estación espacial modular de investigación de microgravedad y física orbital',
      orbitPhase: 3.8,
      raan: 190.0
    },
    {
      id: 'hubble',
      name: 'Telescopio Espacial Hubble (HST)',
      codeName: 'HST-20580',
      noradId: 20580,
      category: 'astronomy',
      operator: 'NASA / ESA',
      orbitType: 'LEO',
      lat: 25.1,
      lng: -88.4,
      altitude: 535,
      velocity: 27200,
      mach: 22.2,
      periodMin: 95.4,
      inclinationDeg: 28.47,
      apogeeKm: 540,
      perigeeKm: 530,
      sunlit: false,
      color: '#818cf8',
      icon: '🔭',
      launchYear: 1990,
      purpose: 'Astrofísica de cielo profundo, espectroscopía ultravioleta y óptica cósmica',
      orbitPhase: 0.5,
      raan: 310.0
    },
    {
      id: 'sentinel2a',
      name: 'Sentinel-2A (Copernicus)',
      codeName: 'SENTINEL-2A',
      noradId: 40697,
      category: 'observation',
      operator: 'ESA / Unión Europea',
      orbitType: 'SSO',
      lat: 62.8,
      lng: 34.2,
      altitude: 786,
      velocity: 26850,
      mach: 21.9,
      periodMin: 100.6,
      inclinationDeg: 98.62,
      apogeeKm: 790,
      perigeeKm: 782,
      sunlit: true,
      color: '#10b981',
      icon: '🌍',
      launchYear: 2015,
      purpose: 'Imágenes multiespectrales de alta resolución para agricultura, biomasa y costas',
      orbitPhase: 2.1,
      raan: 40.0
    },
    {
      id: 'landsat9',
      name: 'Landsat 9',
      codeName: 'LANDSAT-9',
      noradId: 49260,
      category: 'observation',
      operator: 'NASA / USGS',
      orbitType: 'SSO',
      lat: -48.2,
      lng: -65.1,
      altitude: 705,
      velocity: 27010,
      mach: 22.0,
      periodMin: 98.8,
      inclinationDeg: 98.2,
      apogeeKm: 708,
      perigeeKm: 702,
      sunlit: true,
      color: '#38bdf8',
      icon: '🗺️',
      launchYear: 2021,
      purpose: 'Monitoreo ambiental terrestre global y balance hídrico de superficie',
      orbitPhase: 4.6,
      raan: 145.0
    },
    {
      id: 'noaa20',
      name: 'NOAA-20 (JPSS-1)',
      codeName: 'NOAA-20',
      noradId: 43013,
      category: 'weather',
      operator: 'NOAA / NESDIS',
      orbitType: 'SSO',
      lat: -12.3,
      lng: -160.4,
      altitude: 824,
      velocity: 26720,
      mach: 21.8,
      periodMin: 101.4,
      inclinationDeg: 98.74,
      apogeeKm: 828,
      perigeeKm: 820,
      sunlit: false,
      color: '#ec4899',
      icon: '🌪️',
      launchYear: 2017,
      purpose: 'Sondeo atmosférico global de microondas e infrarrojo para pronóstico numérico',
      orbitPhase: 5.3,
      raan: 260.0
    },
    {
      id: 'goes16',
      name: 'GOES-16 East (Geoestacionario)',
      codeName: 'GOES-16',
      noradId: 41866,
      category: 'weather',
      operator: 'NOAA / NASA',
      orbitType: 'GEO',
      lat: 0.04,
      lng: -75.2,
      altitude: 35786,
      velocity: 11070,
      mach: 9.0,
      periodMin: 1436.1,
      inclinationDeg: 0.03,
      apogeeKm: 35790,
      perigeeKm: 35782,
      sunlit: true,
      color: '#a855f7',
      icon: '🛰️',
      launchYear: 2016,
      purpose: 'Vigilancia meteorológica continua en tiempo real de todo el Hemisferio Occidental',
      orbitPhase: 0.0,
      raan: 0.0
    },
    {
      id: 'starlink',
      name: 'Constelación Starlink (SL-4592)',
      codeName: 'STARLINK-4592',
      noradId: 52891,
      category: 'constellation',
      operator: 'SpaceX',
      orbitType: 'LEO',
      lat: 38.6,
      lng: 14.8,
      altitude: 550,
      velocity: 27360,
      mach: 22.3,
      periodMin: 95.6,
      inclinationDeg: 53.2,
      apogeeKm: 555,
      perigeeKm: 545,
      sunlit: true,
      color: '#22c55e',
      icon: '📡',
      launchYear: 2022,
      purpose: 'Conectividad satelital global de banda ancha y baja latencia en banda Ku/Ka',
      orbitPhase: 2.8,
      raan: 110.0
    }
  ]);

  // Live Data States
  const [issData, setIssData] = useState<LiveIssData | null>(null);
  const [earthquakes, setEarthquakes] = useState<LiveEarthquake[]>([]);
  const [flights, setFlights] = useState<LiveFlight[]>([]);
  const [radarTimestamps, setRadarTimestamps] = useState<number[]>([]);
  const [radarIndex, setRadarIndex] = useState<number>(0);
  const [isRadarPlaying, setIsRadarPlaying] = useState<boolean>(true);
  const [activeWebcamModal, setActiveWebcamModal] = useState<LiveWebcam | null>(null);

  // Search & Navigation
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [cursorCoordinates, setCursorCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(3);

  // Tile URL Definitions (Full resolution without blur)
  const getTileConfig = (provider: TileProvider): { url: string; attribution: string; maxZoom: number } => {
    switch (provider) {
      case 'esri_satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; Esri, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
          maxZoom: 19
        };
      case 'esri_clarity':
        return {
          url: 'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; Esri Clarity High-Res Satellite Composite',
          maxZoom: 19
        };
      case 'osm_standard':
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
        };
      case 'carto_dark':
        return {
          url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          attribution: '&copy; CARTO &copy; OpenStreetMap contributors',
          maxZoom: 19
        };
      case 'opentopo':
        return {
          url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
          attribution: '&copy; OpenTopoMap contributors',
          maxZoom: 17
        };
      case 'nasa_gibs':
        return {
          url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg',
          attribution: '&copy; NASA Earth Science Data and Information System (ESDIS)',
          maxZoom: 9
        };
      default:
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; Esri World Imagery',
          maxZoom: 19
        };
    }
  };

  // 1. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = selectedCountry ? selectedCountry.lat : 20.0;
    const initialLng = selectedCountry ? selectedCountry.lng : 0.0;
    const initialZoom = selectedCountry ? 5 : 3;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      minZoom: 2,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true
    });

    // Create Base Tile Layer
    const cfg = getTileConfig(activeTile);
    const tileLayer = L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom,
      subdomains: ['a', 'b', 'c']
    }).addTo(map);
    baseTileLayerRef.current = tileLayer;

    // Create Marker Layer Groups
    countryMarkersGroupRef.current = L.layerGroup().addTo(map);
    issMarkerGroupRef.current = L.layerGroup().addTo(map);
    satellitesGroupRef.current = L.layerGroup().addTo(map);
    earthquakesGroupRef.current = L.layerGroup().addTo(map);
    flightsGroupRef.current = L.layerGroup().addTo(map);
    webcamsGroupRef.current = L.layerGroup().addTo(map);

    // Map Event Listeners
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoordinates({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    const handleMapMovement = () => {
      setCurrentZoom(map.getZoom());
      setMapViewportChangeCount((prev) => prev + 1);
    };

    map.on('zoomend', handleMapMovement);
    map.on('moveend', handleMapMovement);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Change Active Base Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const cfg = getTileConfig(activeTile);

    if (baseTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(baseTileLayerRef.current);
    }

    const newLayer = L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom,
      subdomains: ['a', 'b', 'c']
    }).addTo(mapInstanceRef.current);

    // Ensure it stays at the very bottom
    newLayer.bringToBack();
    baseTileLayerRef.current = newLayer;
  }, [activeTile]);

  // 3. RainViewer Real-time Weather Radar Fetching
  useEffect(() => {
    const fetchRadar = async () => {
      try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        if (res.ok) {
          const data = await res.json();
          if (data.radar && data.radar.past && data.radar.past.length > 0) {
            const timestamps = data.radar.past.map((item: { time: number }) => item.time);
            setRadarTimestamps(timestamps);
            setRadarIndex(timestamps.length - 1);
          }
        }
      } catch (err) {
        console.warn('Weather radar fetch error:', err);
      }
    };
    fetchRadar();
    const interval = setInterval(fetchRadar, 180000); // every 3 min
    return () => clearInterval(interval);
  }, []);

  // Update Radar Layer on map
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (!showWeatherRadar || radarTimestamps.length === 0) {
      if (radarTileLayerRef.current) {
        mapInstanceRef.current.removeLayer(radarTileLayerRef.current);
        radarTileLayerRef.current = null;
      }
      return;
    }

    const time = radarTimestamps[radarIndex] || radarTimestamps[radarTimestamps.length - 1];
    const radarUrl = `https://tilecache.rainviewer.com/v2/radar/${time}/256/{z}/{x}/{y}/2/1_1.png`;

    if (radarTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(radarTileLayerRef.current);
    }

    const newRadar = L.tileLayer(radarUrl, {
      opacity: 0.65,
      zIndex: 10
    }).addTo(mapInstanceRef.current);

    radarTileLayerRef.current = newRadar;
  }, [showWeatherRadar, radarTimestamps, radarIndex]);

  // Radar Animation Loop
  useEffect(() => {
    if (!isRadarPlaying || !showWeatherRadar || radarTimestamps.length <= 1) return;
    const interval = setInterval(() => {
      setRadarIndex((prev) => (prev + 1) % radarTimestamps.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [isRadarPlaying, showWeatherRadar, radarTimestamps]);

  // 4. Real-time Solar Terminator (Day / Night Shadow)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (!showSolarTerminator) {
      if (terminatorPolygonRef.current) {
        mapInstanceRef.current.removeLayer(terminatorPolygonRef.current);
        terminatorPolygonRef.current = null;
      }
      return;
    }

    const updateTerminator = () => {
      if (!mapInstanceRef.current) return;
      const now = new Date();
      const dayOfYear = Math.floor(
        (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
      );
      // Solar declination (degrees), avoid exact 0 to prevent division by zero
      let declination = -23.44 * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10));
      if (Math.abs(declination) < 0.15) {
        declination = Math.sign(declination || 1) * 0.15;
      }
      const declRad = declination * (Math.PI / 180);
      const tanDecl = Math.tan(declRad);

      const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
      const sunLng = 180 - utcHours * 15;

      const nightCoords: [number, number][] = [];
      // Generate smooth boundary curve clamped within Mercator limits [-85, 85]
      for (let lon = -180; lon <= 180; lon += 1.5) {
        const hourAngle = (lon - sunLng) * (Math.PI / 180);
        let rawLat = (Math.atan(-Math.cos(hourAngle) / tanDecl) * 180) / Math.PI;
        if (!Number.isFinite(rawLat) || isNaN(rawLat)) {
          rawLat = declination >= 0 ? -85 : 85;
        }
        const lat = Math.max(-85, Math.min(85, rawLat));
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          nightCoords.push([lat, lon]);
        }
      }

      // Close polygon at polar edge depending on solar hemisphere
      const polarLat = declination >= 0 ? -85 : 85;
      if (Number.isFinite(polarLat)) {
        nightCoords.push([polarLat, 180], [polarLat, -180]);
      }

      if (terminatorPolygonRef.current) {
        mapInstanceRef.current.removeLayer(terminatorPolygonRef.current);
      }

      if (nightCoords.length >= 3) {
        const poly = L.polygon(nightCoords, {
          color: '#020617',
          fillColor: '#020617',
          fillOpacity: 0.45,
          weight: 1.2,
          interactive: false
        }).addTo(mapInstanceRef.current);

        terminatorPolygonRef.current = poly;
      }
    };

    updateTerminator();
    const interval = setInterval(updateTerminator, 60000);
    return () => clearInterval(interval);
  }, [showSolarTerminator]);

  // Render Country Vector Borders GeoJSON Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (!showCountryBorders) {
      if (countryBordersGroupRef.current) {
        mapInstanceRef.current.removeLayer(countryBordersGroupRef.current);
        countryBordersGroupRef.current = null;
      }
      return;
    }

    const geojsonData = geoDataService.getAntimeridianSafeCountriesGeoJSON();
    const countriesMap = new Map<string, Country>(countries.map((c) => [c.id.toLowerCase(), c]));

    // Color theme configuration (White dividing lines by default)
    const themeColors = {
      white: { normal: '#ffffff', hover: '#f8fafc', fill: '#ffffff', fillHover: 0.15 },
      cyan: { normal: '#38bdf8', hover: '#7dd3fc', fill: '#0284c7', fillHover: 0.22 },
      gold: { normal: '#fbbf24', hover: '#fde047', fill: '#d97706', fillHover: 0.25 },
      emerald: { normal: '#10b981', hover: '#6ee7b7', fill: '#059669', fillHover: 0.22 }
    };
    const activeColorConfig = themeColors[borderColorTheme] || themeColors.white;

    if (countryBordersGroupRef.current) {
      mapInstanceRef.current.removeLayer(countryBordersGroupRef.current);
    }

    const borderLayer = L.geoJSON(geojsonData as any, {
      style: (feature: any) => {
        const alpha2 = feature?.properties?.alpha2?.toLowerCase();
        const isSelected = selectedCountry?.id.toLowerCase() === alpha2;

        if (isSelected) {
          return {
            color: '#fbbf24',
            weight: 1.8,
            opacity: 1.0,
            fillColor: '#f59e0b',
            fillOpacity: 0.35,
            dashArray: ''
          };
        }

        return {
          color: activeColorConfig.normal,
          weight: 0.85,
          opacity: 0.85,
          fillColor: activeColorConfig.fill,
          fillOpacity: 0.05,
          dashArray: ''
        };
      },
      onEachFeature: (feature: any, layer: L.Layer) => {
        const alpha2 = feature?.properties?.alpha2?.toLowerCase();
        const countryObj = countriesMap.get(alpha2);

        // Hover & click events
        layer.on({
          mouseover: (e: L.LeafletMouseEvent) => {
            const l = e.target;
            const isSelected = selectedCountry?.id.toLowerCase() === alpha2;
            if (!isSelected) {
              l.setStyle({
                weight: 1.4,
                color: activeColorConfig.hover,
                fillColor: activeColorConfig.normal,
                fillOpacity: activeColorConfig.fillHover
              });
              if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                l.bringToFront();
              }
            }
          },
          mouseout: (e: L.LeafletMouseEvent) => {
            const l = e.target;
            const isSelected = selectedCountry?.id.toLowerCase() === alpha2;
            if (!isSelected) {
              borderLayer.resetStyle(l);
            }
          },
          click: () => {
            if (countryObj && Number.isFinite(countryObj.lat) && Number.isFinite(countryObj.lng)) {
              onSelectCountry(countryObj);
              mapInstanceRef.current?.flyTo([countryObj.lat, countryObj.lng], 6, { duration: 1.2 });
            }
          }
        });

        // Bind country hover tooltip
        if (countryObj) {
          layer.bindTooltip(
            `
            <div class="flex items-center gap-2 font-sans py-0.5 px-1">
              <img src="https://flagcdn.com/${countryObj.id}.svg" class="w-4 h-3 object-cover rounded-xs" />
              <span class="font-bold text-white text-xs">${countryObj.nameEs}</span>
              <span class="text-[10px] text-slate-300">★ ${countryObj.capitalEs}</span>
            </div>
            `,
            {
              sticky: true,
              direction: 'top',
              className: 'leaflet-custom-tooltip'
            }
          );
        }
      }
    }).addTo(mapInstanceRef.current);

    countryBordersGroupRef.current = borderLayer;
  }, [showCountryBorders, borderColorTheme, selectedCountry, countries]);

  // Esri Reference Boundaries and Places Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (!showCountryBorders || !showDetailedSubdivisions) {
      if (esriBoundariesLayerRef.current) {
        mapInstanceRef.current.removeLayer(esriBoundariesLayerRef.current);
        esriBoundariesLayerRef.current = null;
      }
      return;
    }

    if (esriBoundariesLayerRef.current) {
      mapInstanceRef.current.removeLayer(esriBoundariesLayerRef.current);
    }

    const boundariesOverlay = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        opacity: 0.9,
        zIndex: 5
      }
    ).addTo(mapInstanceRef.current);

    esriBoundariesLayerRef.current = boundariesOverlay;
  }, [showCountryBorders, showDetailedSubdivisions]);

  // Synchronized UTC Master Clock Interval (100ms for smooth subsecond telemetry tracking)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentUtcDate(new Date());
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Ephemeris: Calculate Subsolar Point
  const getSubsolarPoint = (date: Date) => {
    const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
    const declination = -23.44 * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10));
    const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    let subsolarLng = (12 - utcHours) * 15;
    subsolarLng = ((((subsolarLng + 180) % 360) + 360) % 360) - 180;
    return { lat: declination, lng: subsolarLng };
  };

  // Check if satellite is sunlit (vs in Earth Umbra shadow)
  const isSatelliteSunlit = (satLat: number, satLng: number, satAlt: number, subsolar: { lat: number; lng: number }): boolean => {
    const toRad = Math.PI / 180;
    const phi1 = satLat * toRad;
    const phi2 = subsolar.lat * toRad;
    const dLambda = (satLng - subsolar.lng) * toRad;
    const cosDist = Math.sin(phi1) * Math.sin(phi2) + Math.cos(phi1) * Math.cos(phi2) * Math.cos(dLambda);
    const earthRadius = 6371;
    const maxSunlitAngleRad = Math.acos(earthRadius / (earthRadius + satAlt)) + Math.PI / 2;
    const angleRad = Math.acos(Math.max(-1, Math.min(1, cosDist)));
    return angleRad <= maxSunlitAngleRad;
  };

  // 5. Multi-Satellite Orbital Mechanics & Real-Time Live Propagator
  useEffect(() => {
    if (!showIssLive) {
      if (satellitesGroupRef.current) satellitesGroupRef.current.clearLayers();
      if (orbitTrackLayerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(orbitTrackLayerRef.current);
        orbitTrackLayerRef.current = null;
      }
      return;
    }

    // Live ISS API fetcher to keep ISS perfectly grounded in real NASA telemetry
    const fetchRealIss = async () => {
      try {
        const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
        if (res.ok) {
          const data = await res.json();
          const latNum = Number(data.latitude);
          const lngNum = Number(data.longitude);
          if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
            const iss: LiveIssData = {
              lat: latNum,
              lng: lngNum,
              altitude: Math.round(Number(data.altitude) || 420),
              velocity: Math.round(Number(data.velocity) || 27600),
              visibility: data.visibility || 'daylight',
              timestamp: Number(data.timestamp) || Date.now()
            };
            setIssData(iss);

            setSatellites((prev) =>
              prev.map((sat) => {
                if (sat.id === 'iss') {
                  return {
                    ...sat,
                    lat: Number(latNum.toFixed(4)),
                    lng: Number(lngNum.toFixed(4)),
                    altitude: Math.round(Number(data.altitude) || 420),
                    velocity: Math.round(Number(data.velocity) || 27600),
                    mach: Number(((Number(data.velocity) || 27600) / 1225).toFixed(1)),
                    sunlit: data.visibility === 'daylight'
                  };
                }
                return sat;
              })
            );
          }
        }
      } catch (err) {
        // Fallback gracefully
      }
    };

    fetchRealIss();
    const issApiInterval = setInterval(fetchRealIss, 4500);

    // High frequency orbital propagation for all satellites
    const propagateInterval = setInterval(() => {
      const now = new Date();
      const subsolar = getSubsolarPoint(now);

      setSatellites((prev) =>
        prev.map((sat) => {
          if (sat.orbitType === 'GEO') {
            const sunlit = isSatelliteSunlit(sat.lat, sat.lng, sat.altitude, subsolar);
            return { ...sat, sunlit };
          }

          // Advance orbital phase
          const period = sat.periodMin > 0 ? sat.periodMin : 90;
          const deltaPhase = (2 * Math.PI) / (period * 60);
          const newPhase = (sat.orbitPhase + deltaPhase) % (2 * Math.PI);

          const incRad = (sat.inclinationDeg * Math.PI) / 180;
          const sinVal = Math.max(-1, Math.min(1, Math.sin(incRad) * Math.sin(newPhase)));
          const lat = Math.asin(sinVal) * (180 / Math.PI);
          const alpha = Math.atan2(Math.cos(incRad) * Math.sin(newPhase), Math.cos(newPhase)) * (180 / Math.PI);

          // Earth rotation: 360 deg / 86400s = 0.004166 deg/s
          const earthRot = 0.004166;
          let newRaan = (sat.raan - earthRot) % 360;
          let lng = newRaan + alpha;
          lng = ((((lng + 180) % 360) + 360) % 360) - 180;

          const altDiff = sat.apogeeKm - sat.perigeeKm;
          const currentAlt = Math.round(sat.perigeeKm + (altDiff / 2) * (1 + Math.cos(newPhase)));
          const currentVel = Math.round(sat.velocity + Math.sin(newPhase) * 6);
          const safeLat = Number.isFinite(lat) ? Number(lat.toFixed(4)) : sat.lat;
          const safeLng = Number.isFinite(lng) ? Number(lng.toFixed(4)) : sat.lng;
          const sunlit = isSatelliteSunlit(safeLat, safeLng, currentAlt, subsolar);

          return {
            ...sat,
            lat: sat.id === 'iss' && issData && Number.isFinite(issData.lat) ? sat.lat : safeLat,
            lng: sat.id === 'iss' && issData && Number.isFinite(issData.lng) ? sat.lng : safeLng,
            altitude: Number.isFinite(currentAlt) ? currentAlt : sat.altitude,
            velocity: Number.isFinite(currentVel) ? currentVel : sat.velocity,
            mach: Number.isFinite(currentVel) ? Number((currentVel / 1225).toFixed(1)) : sat.mach,
            orbitPhase: newPhase,
            raan: newRaan,
            sunlit
          };
        })
      );
    }, 1000);

    return () => {
      clearInterval(issApiInterval);
      clearInterval(propagateInterval);
    };
  }, [showIssLive]);

  // Render Satellites on Leaflet Map
  useEffect(() => {
    if (!mapInstanceRef.current || !satellitesGroupRef.current) return;
    if (!showIssLive) {
      satellitesGroupRef.current.clearLayers();
      return;
    }

    satellitesGroupRef.current.clearLayers();

    satellites.forEach((sat) => {
      if (!Number.isFinite(sat.lat) || !Number.isFinite(sat.lng)) return;
      const isSelected = sat.id === selectedSatelliteId;

      const markerHtml = `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
          ${isSelected ? `<div class="absolute w-12 h-12 rounded-full animate-ping opacity-60" style="background-color: ${sat.color}"></div>` : ''}
          <div class="relative w-8 h-8 bg-slate-950 border-2 rounded-full flex items-center justify-center shadow-lg transition-transform transform group-hover:scale-125" style="border-color: ${sat.color}; box-shadow: 0 0 12px ${sat.color}">
            <span class="text-xs">${sat.icon}</span>
          </div>
          <div class="absolute left-9 top-0 bg-slate-950/95 backdrop-blur-md px-2.5 py-1 rounded-lg border text-[11px] text-white whitespace-nowrap shadow-2xl z-30 transition-all ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}" style="border-color: ${sat.color}">
            <div class="flex items-center gap-1.5 font-bold" style="color: ${sat.color}">
              <span>${sat.codeName}</span>
              <span class="text-[9px] px-1 py-0.2 bg-slate-800 rounded font-mono uppercase text-slate-300">${sat.orbitType}</span>
            </div>
            <p class="text-[10px] text-slate-300 font-mono">${sat.altitude} km • ${sat.velocity.toLocaleString()} km/h • Mach ${sat.mach}</p>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-satellite-icon',
        html: markerHtml,
        iconSize: [32, 32]
      });

      const marker = L.marker([sat.lat, sat.lng], { icon });

      marker.on('click', () => {
        setSelectedSatelliteId(sat.id);
        setIsSatellitePanelOpen(true);
        if (Number.isFinite(sat.lat) && Number.isFinite(sat.lng)) {
          mapInstanceRef.current?.flyTo([sat.lat, sat.lng], 5, { duration: 1.0 });
        }
      });

      marker.bindPopup(`
        <div class="p-2.5 text-xs space-y-1.5 font-sans min-w-[210px] text-white">
          <div class="flex items-center justify-between border-b border-slate-700 pb-1">
            <span class="font-bold text-sm" style="color: ${sat.color}">${sat.icon} ${sat.name}</span>
            <span class="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono uppercase">${sat.orbitType}</span>
          </div>
          <p class="text-slate-300"><b>Operador:</b> ${sat.operator}</p>
          <p class="text-slate-300"><b>Altitud orbital:</b> <span class="text-white font-mono font-bold">${sat.altitude} km</span></p>
          <p class="text-slate-300"><b>Velocidad:</b> <span class="text-white font-mono font-bold">${sat.velocity.toLocaleString()} km/h (Mach ${sat.mach})</span></p>
          <p class="text-slate-300"><b>Coordenadas:</b> <span class="font-mono text-cyan-300">${countryService.formatCoordinatesDMS(sat.lat, sat.lng)}</span></p>
          <p class="text-slate-300"><b>Inclinación / Período:</b> ${sat.inclinationDeg}° • ${sat.periodMin} min</p>
          <p class="text-xs font-semibold ${sat.sunlit ? 'text-amber-400' : 'text-slate-400'}">
            ${sat.sunlit ? '☀️ Iluminado por el Sol' : '🌑 En Sombra Umbra Terrestre'}
          </p>
        </div>
      `);

      satellitesGroupRef.current?.addLayer(marker);
    });

    // Auto-follow active satellite if enabled
    if (isAutoFollowingSatellite && selectedSatelliteId) {
      const activeSat = satellites.find((s) => s.id === selectedSatelliteId);
      if (activeSat && Number.isFinite(activeSat.lat) && Number.isFinite(activeSat.lng)) {
        mapInstanceRef.current.panTo([activeSat.lat, activeSat.lng], { animate: true, duration: 0.5 });
      }
    }
  }, [satellites, selectedSatelliteId, isAutoFollowingSatellite, showIssLive]);

  // Draw ground track for the selected satellite
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (!showOrbitGroundTrack || !selectedSatelliteId || !showIssLive) {
      if (orbitTrackLayerRef.current) {
        mapInstanceRef.current.removeLayer(orbitTrackLayerRef.current);
        orbitTrackLayerRef.current = null;
      }
      return;
    }

    const activeSat = satellites.find((s) => s.id === selectedSatelliteId);
    if (!activeSat) return;

    if (orbitTrackLayerRef.current) {
      mapInstanceRef.current.removeLayer(orbitTrackLayerRef.current);
    }

    // Generate ground track orbit points for 1 orbital period with Antimeridian wrapping protection
    const segments: [number, number][][] = [];
    let currentSegment: [number, number][] = [];
    const incRad = (activeSat.inclinationDeg * Math.PI) / 180;
    const period = activeSat.periodMin > 0 ? activeSat.periodMin : 90;
    const earthRotRate = 360 / (24 * 60);

    for (let m = 0; m <= period; m += 0.8) {
      const phase = activeSat.orbitPhase + (m / period) * 2 * Math.PI;
      const sinVal = Math.max(-1, Math.min(1, Math.sin(incRad) * Math.sin(phase)));
      const lat = Math.asin(sinVal) * (180 / Math.PI);
      const alpha = Math.atan2(Math.cos(incRad) * Math.sin(phase), Math.cos(phase)) * (180 / Math.PI);
      let lng = activeSat.raan + alpha - earthRotRate * m;
      lng = ((((lng + 180) % 360) + 360) % 360) - 180;

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

      if (currentSegment.length > 0) {
        const prevLng = currentSegment[currentSegment.length - 1][1];
        // Antimeridian crossing detection: jump between +180 and -180
        if (Math.abs(lng - prevLng) > 180) {
          const prevLat = currentSegment[currentSegment.length - 1][0];
          const frac = (180 - Math.abs(prevLng)) / (180 - Math.abs(prevLng) + (180 - Math.abs(lng)) || 1);
          const crossLat = prevLat + (lat - prevLat) * frac;
          const crossLngSign = prevLng > 0 ? 179.99 : -179.99;
          if (Number.isFinite(crossLat)) {
            currentSegment.push([crossLat, crossLngSign]);
            if (currentSegment.length >= 2) segments.push(currentSegment);
            currentSegment = [[crossLat, -crossLngSign]];
          }
        }
      }
      currentSegment.push([lat, lng]);
    }
    if (currentSegment.length >= 2) {
      segments.push(currentSegment);
    }

    const validSegments = segments
      .map(seg => seg.filter(([lt, lg]) => Number.isFinite(lt) && Number.isFinite(lg)))
      .filter(seg => seg.length >= 2);

    if (validSegments.length > 0 && mapInstanceRef.current) {
      const trackPolyline = L.polyline(validSegments, {
        color: activeSat.color,
        weight: 2.4,
        opacity: 0.9,
        dashArray: '6, 6',
        lineCap: 'round'
      }).addTo(mapInstanceRef.current);

      orbitTrackLayerRef.current = trackPolyline;
    }
  }, [selectedSatelliteId, showOrbitGroundTrack, satellites, showIssLive]);

  // 6. Live Earthquakes Feed (USGS Feed M2.5+)
  useEffect(() => {
    if (!showEarthquakes) {
      if (earthquakesGroupRef.current) earthquakesGroupRef.current.clearLayers();
      return;
    }

    const fetchEarthquakes = async () => {
      try {
        const res = await fetch(
          'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson'
        );
        if (res.ok) {
          const data = await res.json();
          const quakes: LiveEarthquake[] = (data.features || [])
            .filter((f: any) =>
              f?.geometry?.coordinates &&
              Array.isArray(f.geometry.coordinates) &&
              Number.isFinite(f.geometry.coordinates[1]) &&
              Number.isFinite(f.geometry.coordinates[0])
            )
            .slice(0, 45)
            .map((f: any) => ({
              id: f.id,
              mag: Number(f.properties?.mag) || 0,
              place: f.properties?.place || 'Desconocido',
              time: Number(f.properties?.time) || Date.now(),
              lat: Number(f.geometry.coordinates[1]),
              lng: Number(f.geometry.coordinates[0]),
              depth: Number(f.geometry.coordinates[2]) || 10
            }));
          setEarthquakes(quakes);

          if (earthquakesGroupRef.current) {
            earthquakesGroupRef.current.clearLayers();
            quakes.forEach((q) => {
              if (!Number.isFinite(q.lat) || !Number.isFinite(q.lng)) return;
              const radius = Math.max(5, q.mag * 3.5);
              const color = q.mag >= 6.0 ? '#ef4444' : q.mag >= 4.5 ? '#f97316' : '#eab308';

              const circle = L.circleMarker([q.lat, q.lng], {
                radius,
                fillColor: color,
                color: '#ffffff',
                weight: 1,
                opacity: 0.9,
                fillOpacity: 0.65
              });

              circle.bindPopup(`
                <div class="p-2 text-xs space-y-1">
                  <p class="font-bold text-amber-400 text-sm flex items-center gap-1">⚡ Sismo M${q.mag.toFixed(1)}</p>
                  <p class="text-slate-200"><b>Lugar:</b> ${q.place}</p>
                  <p class="text-slate-300"><b>Profundidad:</b> ${q.depth} km</p>
                  <p class="text-slate-400 text-[10px]">Registrado hace ${Math.round((Date.now() - q.time) / 60000)} min por USGS</p>
                </div>
              `);

              earthquakesGroupRef.current?.addLayer(circle);
            });
          }
        }
      } catch (err) {
        console.warn('Earthquakes fetch error:', err);
      }
    };

    fetchEarthquakes();
    const interval = setInterval(fetchEarthquakes, 120000);
    return () => clearInterval(interval);
  }, [showEarthquakes]);

  // 7. Live Flight Radar Feeds (Simulated Global Air Traffic with Real Trajectories)
  useEffect(() => {
    if (!showLiveFlights) {
      if (flightsGroupRef.current) flightsGroupRef.current.clearLayers();
      return;
    }

    // Seed realistic real-time commercial international flights
    const initialFlights: LiveFlight[] = [
      { icao24: 'a01', callsign: 'IB6251', originCountry: 'España', lat: 40.48, lng: -20.5, altitude: 11200, heading: 250, velocity: 880 },
      { icao24: 'a02', callsign: 'AA904', originCountry: 'Estados Unidos', lat: -5.2, lng: -55.8, altitude: 10800, heading: 335, velocity: 895 },
      { icao24: 'a03', callsign: 'AF118', originCountry: 'Francia', lat: 55.4, lng: 32.1, altitude: 11500, heading: 85, velocity: 910 },
      { icao24: 'a04', callsign: 'EK201', originCountry: 'EAU', lat: 31.2, lng: 42.6, altitude: 12000, heading: 295, velocity: 920 },
      { icao24: 'a05', callsign: 'JL006', originCountry: 'Japón', lat: 45.1, lng: 165.2, altitude: 10500, heading: 70, velocity: 905 },
      { icao24: 'a06', callsign: 'QF011', originCountry: 'Australia', lat: -22.4, lng: 175.8, altitude: 11800, heading: 60, velocity: 930 },
      { icao24: 'a07', callsign: 'LA500', originCountry: 'Chile', lat: -23.5, lng: -70.4, altitude: 9900, heading: 350, velocity: 840 },
      { icao24: 'a08', callsign: 'LH510', originCountry: 'Alemania', lat: 10.5, lng: -25.2, altitude: 11400, heading: 210, velocity: 875 },
      { icao24: 'a09', callsign: 'SQ322', originCountry: 'Singapur', lat: 24.1, lng: 82.5, altitude: 11600, heading: 305, velocity: 890 },
      { icao24: 'a10', callsign: 'AM001', originCountry: 'México', lat: 26.8, lng: -95.4, altitude: 10200, heading: 45, velocity: 860 }
    ];
    setFlights(initialFlights);

    const updateFlightPositions = () => {
      setFlights((prev) =>
        prev.map((f) => {
          const heading = Number.isFinite(f.heading) ? f.heading : 0;
          const rad = (heading * Math.PI) / 180;
          const dLat = (Math.cos(rad) * 0.15);
          const dLng = (Math.sin(rad) * 0.15);
          let nLat = (Number.isFinite(f.lat) ? f.lat : 0) + dLat;
          let nLng = (Number.isFinite(f.lng) ? f.lng : 0) + dLng;
          if (nLng > 180) nLng -= 360;
          if (nLng < -180) nLng += 360;
          return { ...f, lat: Number(nLat.toFixed(4)), lng: Number(nLng.toFixed(4)) };
        })
      );
    };

    const interval = setInterval(updateFlightPositions, 3000);
    return () => clearInterval(interval);
  }, [showLiveFlights]);

  // Render Flights on Leaflet
  useEffect(() => {
    if (!flightsGroupRef.current || !showLiveFlights) return;
    flightsGroupRef.current.clearLayers();

    flights.forEach((f) => {
      if (!Number.isFinite(f.lat) || !Number.isFinite(f.lng)) return;
      const planeIcon = L.divIcon({
        className: 'custom-plane-icon',
        html: `
          <div style="transform: rotate(${f.heading || 0}deg)" class="flex items-center justify-center text-amber-400 drop-shadow-md cursor-pointer hover:scale-125 transition-transform">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
          </div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const marker = L.marker([f.lat, f.lng], { icon: planeIcon });
      marker.bindPopup(`
        <div class="p-2 text-xs space-y-1">
          <p class="font-bold text-amber-300 text-sm flex items-center gap-1">✈️ Vuelo Comercial ${f.callsign}</p>
          <p class="text-slate-200"><b>Aerolínea / Origen:</b> ${f.originCountry}</p>
          <p class="text-slate-300"><b>Altitud:</b> ${f.altitude.toLocaleString()} m (~${Math.round(f.altitude * 3.28)} ft)</p>
          <p class="text-slate-300"><b>Velocidad:</b> ${f.velocity} km/h</p>
          <p class="text-slate-300"><b>Rumbo:</b> ${f.heading}°</p>
        </div>
      `);
      flightsGroupRef.current?.addLayer(marker);
    });
  }, [flights, showLiveFlights]);

  // 8. Render Global Live Webcams
  useEffect(() => {
    if (!webcamsGroupRef.current || !showWebcams) {
      if (webcamsGroupRef.current) webcamsGroupRef.current.clearLayers();
      return;
    }
    webcamsGroupRef.current.clearLayers();

    GLOBAL_LIVE_WEBCAMS.forEach((cam) => {
      if (!Number.isFinite(cam.lat) || !Number.isFinite(cam.lng)) return;
      const camIcon = L.divIcon({
        className: 'custom-cam-icon',
        html: `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
            <div class="absolute w-6 h-6 bg-red-500/30 rounded-full animate-ping"></div>
            <div class="w-6 h-6 bg-red-600 border border-white rounded-full flex items-center justify-center shadow-lg text-[10px] text-white font-bold">
              📹
            </div>
          </div>
        `,
        iconSize: [24, 24]
      });

      const marker = L.marker([cam.lat, cam.lng], { icon: camIcon });
      marker.on('click', () => {
        setActiveWebcamModal(cam);
      });
      webcamsGroupRef.current?.addLayer(marker);
    });
  }, [showWebcams]);

  // 9. Intelligent Anti-Collision & Zoom-Progressive Country Labels
  useEffect(() => {
    if (!countryMarkersGroupRef.current || !mapInstanceRef.current) return;
    countryMarkersGroupRef.current.clearLayers();

    if (!showLabels) return;

    const map = mapInstanceRef.current;
    const zoom = map.getZoom();
    const mapSize = map.getSize();

    interface PlacedBox {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }
    const placedBoxes: PlacedBox[] = [];

    const hasCollision = (box: PlacedBox, margin: number = 8): boolean => {
      for (const p of placedBoxes) {
        if (
          box.x1 - margin < p.x2 &&
          box.x2 + margin > p.x1 &&
          box.y1 - margin < p.y2 &&
          box.y2 + margin > p.y1
        ) {
          return true;
        }
      }
      return false;
    };

    // Sort countries by importance: Selected first, then area & population
    const candidates = countries
      .map((c) => {
        const isSelected = selectedCountry?.id === c.id;
        const centroid = geoDataService.getCountryCentroid(c.id);
        const lat = centroid && Number.isFinite(centroid[1]) ? centroid[1] : (Number.isFinite(c.lat) ? c.lat : 0);
        const lng = centroid && Number.isFinite(centroid[0]) ? centroid[0] : (Number.isFinite(c.lng) ? c.lng : 0);

        // Level of Detail (LOD) visibility threshold
        let isEligible = isSelected;
        if (!isEligible) {
          if (zoom <= 3) {
            // Global view: Only major vast or highly populated countries
            isEligible = (c.population || 0) >= 45000000 || (c.areaKm2 || 0) >= 1200000;
          } else if (zoom === 4) {
            // Continental view: Medium to large countries
            isEligible = (c.population || 0) >= 10000000 || (c.areaKm2 || 0) >= 250000;
          } else if (zoom === 5) {
            // Regional view: Most countries
            isEligible = (c.population || 0) >= 2000000 || (c.areaKm2 || 0) >= 40000;
          } else {
            // Local view: All countries and territories
            isEligible = true;
          }
        }

        let score = isSelected ? 1000000 : 0;
        score += Math.min(500, Math.sqrt(c.areaKm2 || 0) / 10) + Math.min(300, (c.population || 0) / 1000000);

        return { country: c, lat, lng, isSelected, isEligible, score };
      })
      .filter((item) => item.isEligible && Number.isFinite(item.lat) && Number.isFinite(item.lng))
      .sort((a, b) => b.score - a.score);

    candidates.forEach(({ country, lat, lng, isSelected }) => {
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      // Calculate 2D pixel coordinates on the current map viewport
      const pt = map.latLngToContainerPoint([lat, lng]);
      if (!pt || !Number.isFinite(pt.x) || !Number.isFinite(pt.y)) return;

      // Viewport culling with 60px outer padding
      if (pt.x < -60 || pt.x > mapSize.x + 60 || pt.y < -60 || pt.y > mapSize.y + 60) {
        return;
      }

      // Compact, responsive label dimensions
      const showCapital = zoom >= 6 && Boolean(country.capitalEs);
      const textLen = (country.nameEs || '').length;
      const pillWidth = Math.max(70, Math.min(160, textLen * 7.5 + (showCapital ? 34 : 26)));
      const pillHeight = showCapital ? 34 : 22;

      const box: PlacedBox = {
        x1: pt.x - pillWidth / 2,
        y1: pt.y - pillHeight / 2,
        x2: pt.x + pillWidth / 2,
        y2: pt.y + pillHeight / 2
      };

      // Spatial collision check: never overlap two labels on screen
      if (!isSelected && hasCollision(box, zoom <= 4 ? 12 : 8)) {
        return;
      }

      placedBoxes.push(box);

      const pinIcon = L.divIcon({
        className: 'custom-country-pin',
        html: `
          <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold select-none cursor-pointer transition-all duration-150 ${
            isSelected
              ? 'bg-amber-400 text-slate-950 border-2 border-white shadow-xl scale-110 z-40'
              : 'bg-slate-950/85 backdrop-blur-md text-white border border-slate-700/80 hover:border-cyan-400 hover:bg-slate-900 shadow-md hover:scale-105'
          }" style="max-width: ${pillWidth + 10}px;">
            <img src="https://flagcdn.com/${country.id}.svg" alt="" class="w-3.5 h-2.5 object-cover rounded-xs flex-shrink-0 shadow-xs" />
            <div class="truncate text-left leading-tight">
              <p class="truncate text-[11px] font-bold ${isSelected ? 'text-slate-950' : 'text-slate-100'}">${country.nameEs}</p>
              ${
                showCapital
                  ? `<p class="truncate text-[9px] font-medium ${isSelected ? 'text-slate-900 font-semibold' : 'text-amber-300'}">★ ${country.capitalEs}</p>`
                  : ''
              }
            </div>
          </div>
        `,
        iconSize: [pillWidth, pillHeight],
        iconAnchor: [pillWidth / 2, pillHeight / 2]
      });

      const marker = L.marker([lat, lng], { icon: pinIcon, zIndexOffset: isSelected ? 1000 : 0 });
      marker.on('click', () => {
        onSelectCountry(country);
        if (Number.isFinite(country.lat) && Number.isFinite(country.lng)) {
          mapInstanceRef.current?.flyTo([country.lat, country.lng], 6, { duration: 1.2 });
        }
      });

      countryMarkersGroupRef.current?.addLayer(marker);
    });
  }, [countries, selectedCountry, showLabels, mapViewportChangeCount]);

  // Fly to selected country if changed externally
  useEffect(() => {
    if (selectedCountry && mapInstanceRef.current) {
      if (Number.isFinite(selectedCountry.lat) && Number.isFinite(selectedCountry.lng)) {
        mapInstanceRef.current.flyTo([selectedCountry.lat, selectedCountry.lng], 6, {
          duration: 1.4
        });
      }
    }
  }, [selectedCountry]);

  // Handle Search Selection
  const handleCountrySearch = (country: Country) => {
    onSelectCountry(country);
    setIsSearching(false);
    setSearchQuery('');
    if (Number.isFinite(country.lat) && Number.isFinite(country.lng)) {
      mapInstanceRef.current?.flyTo([country.lat, country.lng], 7, { duration: 1.5 });
    }
  };

  const filteredCountries = searchQuery.trim()
    ? countries.filter(
        (c) =>
          c.nameEs.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.capitalEs.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.id.toLowerCase() === searchQuery.toLowerCase()
      )
    : [];

  return (
    <div className="relative w-full h-[calc(100vh-80px)] bg-slate-950 select-none overflow-hidden font-sans">
      {/* 1. Leaflet Interactive Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-grab active:cursor-grabbing" />

      {/* 2. Top Header HUD with Status, Coordinates & Real-Time Telemetry */}
      <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none flex flex-wrap items-center justify-between gap-3">
        {/* Left Side: Live Badge & Search Bar */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-950/85 backdrop-blur-md rounded-xl border border-emerald-500/50 shadow-2xl text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-emerald-400 tracking-wide">VISTA SATELITAL EN VIVO HD</span>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">| SUB-METER CLARITY</span>
          </div>

          {/* Quick Country / Capital Live Fly-To Search */}
          <div className="relative">
            <div className="flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-xl text-xs text-white w-48 sm:w-64 focus-within:border-sky-400 focus-within:w-72 transition-all">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="Buscar país, capital o isla..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearching(true);
                }}
                onFocus={() => setIsSearching(true)}
                className="bg-transparent border-none outline-none w-full text-white placeholder-slate-400 text-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearching(false);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Search Dropdown Results */}
            {isSearching && filteredCountries.length > 0 && (
              <div className="absolute top-full left-0 mt-1.5 w-72 max-h-60 overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl z-50 p-1.5 space-y-1">
                {filteredCountries.slice(0, 10).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleCountrySearch(c)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-sky-600/20 text-left text-xs transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={`https://flagcdn.com/${c.id}.svg`}
                        alt=""
                        className="w-5 h-3.5 object-cover rounded shadow-xs"
                      />
                      <div className="truncate">
                        <p className="font-semibold text-white group-hover:text-sky-300">{c.nameEs}</p>
                        <p className="text-[10px] text-slate-400">★ {c.capitalEs} • {c.continent}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">{c.id}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Synchronized UTC Clock Pill & Satellite Telemetry Toggle */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Real-Time Synchronized UTC Clock Mini Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-950/90 backdrop-blur-md rounded-xl border border-slate-700/80 text-xs shadow-xl text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <div className="flex items-baseline gap-1 font-mono">
              <span className="font-bold text-white tracking-wider">
                {currentUtcDate.toISOString().substring(11, 19)}
              </span>
              <span className="text-[10px] text-cyan-400 font-semibold">UTC</span>
            </div>
          </div>

          {/* Satellite Telemetry Panel Toggle Button */}
          <button
            onClick={() => setIsSatellitePanelOpen(!isSatellitePanelOpen)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold shadow-xl transition-all ${
              isSatellitePanelOpen
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-cyan-500/20'
                : 'bg-slate-950/90 hover:bg-slate-900 border-cyan-500/40 text-cyan-300 hover:border-cyan-400'
            }`}
          >
            <span>🛰️</span>
            <span>Telemetría Satelital</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
              isSatellitePanelOpen ? 'bg-slate-900 text-cyan-300' : 'bg-slate-800 text-slate-300'
            }`}>
              {satellites.length}
            </span>
          </button>

          {cursorCoordinates && (
            <div className="px-3 py-1.5 bg-slate-950/85 backdrop-blur-md rounded-xl border border-slate-700/80 text-[11px] font-mono text-slate-300 shadow-xl hidden xl:flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>{cursorCoordinates.lat.toFixed(3)}°, {cursorCoordinates.lng.toFixed(3)}°</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">Z:{currentZoom}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Floating Left Toolbar: Tile Providers & Real-Time Layer Controls */}
      <div className="absolute left-4 top-24 z-20 flex flex-col gap-3 pointer-events-auto">
        {/* Tile Provider Selector Card */}
        <div className="bg-slate-950/90 backdrop-blur-md p-2.5 rounded-2xl border border-slate-800 shadow-2xl space-y-1.5 w-44">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1.5 flex items-center gap-1">
            <Layers className="w-3 h-3 text-sky-400" /> Capa Satelital
          </p>

          <button
            onClick={() => setActiveTile('esri_satellite')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTile === 'esri_satellite'
                ? 'bg-sky-500 text-white shadow-lg'
                : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Satellite className="w-3.5 h-3.5" /> Esri HD Satélite
            </span>
            <span className="text-[9px] font-mono opacity-80">19x</span>
          </button>

          <button
            onClick={() => setActiveTile('esri_clarity')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTile === 'esri_clarity'
                ? 'bg-sky-500 text-white shadow-lg'
                : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Esri Clarity
            </span>
            <span className="text-[9px] font-mono opacity-80">19x</span>
          </button>

          <button
            onClick={() => setActiveTile('carto_dark')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTile === 'carto_dark'
                ? 'bg-sky-500 text-white shadow-lg'
                : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" /> Telemetría Dark
            </span>
          </button>

          <button
            onClick={() => setActiveTile('osm_standard')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTile === 'osm_standard'
                ? 'bg-sky-500 text-white shadow-lg'
                : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-emerald-400" /> Calles OSM
            </span>
          </button>

          <button
            onClick={() => setActiveTile('opentopo')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTile === 'opentopo'
                ? 'bg-sky-500 text-white shadow-lg'
                : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-amber-400" /> Topográfico
            </span>
          </button>
        </div>

        {/* Real-Time Live Overlays Toggle Card */}
        <div className="bg-slate-950/90 backdrop-blur-md p-2.5 rounded-2xl border border-slate-800 shadow-2xl space-y-1.5 w-44">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1.5 flex items-center gap-1">
            <Globe2 className="w-3 h-3 text-sky-400" /> Límites & Capas
          </p>

          {/* Country Borders Master Toggle */}
          <button
            onClick={() => setShowCountryBorders(!showCountryBorders)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showCountryBorders
                ? 'bg-sky-500/25 text-sky-200 border border-sky-400/50 shadow-md'
                : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-sky-400" /> Límites de Países
            </span>
            <span className="text-[10px] font-bold">{showCountryBorders ? 'ON' : 'OFF'}</span>
          </button>

          {/* Border Color Theme Selector (if borders active) */}
          {showCountryBorders && (
            <div className="p-1.5 bg-slate-900/90 rounded-lg border border-slate-800/80 space-y-1">
              <p className="text-[9px] text-slate-400 font-semibold uppercase px-1">Color Límites</p>
              <div className="grid grid-cols-4 gap-1">
                <button
                  onClick={() => setBorderColorTheme('cyan')}
                  className={`h-5 rounded flex items-center justify-center border transition-all ${
                    borderColorTheme === 'cyan'
                      ? 'border-white bg-sky-500 shadow-xs'
                      : 'border-slate-700 bg-sky-950 hover:border-sky-500'
                  }`}
                  title="Cian Neón"
                >
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                </button>
                <button
                  onClick={() => setBorderColorTheme('gold')}
                  className={`h-5 rounded flex items-center justify-center border transition-all ${
                    borderColorTheme === 'gold'
                      ? 'border-white bg-amber-500 shadow-xs'
                      : 'border-slate-700 bg-amber-950 hover:border-amber-500'
                  }`}
                  title="Dorado Oro"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                </button>
                <button
                  onClick={() => setBorderColorTheme('emerald')}
                  className={`h-5 rounded flex items-center justify-center border transition-all ${
                    borderColorTheme === 'emerald'
                      ? 'border-white bg-emerald-500 shadow-xs'
                      : 'border-slate-700 bg-emerald-950 hover:border-emerald-500'
                  }`}
                  title="Esmeralda"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </button>
                <button
                  onClick={() => setBorderColorTheme('white')}
                  className={`h-5 rounded flex items-center justify-center border transition-all ${
                    borderColorTheme === 'white'
                      ? 'border-white bg-slate-300 shadow-xs'
                      : 'border-slate-700 bg-slate-800 hover:border-slate-400'
                  }`}
                  title="Blanco Puro"
                >
                  <span className="w-2 h-2 rounded-full bg-white" />
                </button>
              </div>

              {/* Toggle Esri Detailed Subdivisions */}
              <button
                onClick={() => setShowDetailedSubdivisions(!showDetailedSubdivisions)}
                className={`w-full text-left px-1.5 py-1 rounded text-[10px] font-medium transition-colors flex items-center justify-between ${
                  showDetailedSubdivisions
                    ? 'text-sky-300 bg-sky-950/60'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <span>Fronteras Esri HD</span>
                <span>{showDetailedSubdivisions ? '✓' : '—'}</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setShowWeatherRadar(!showWeatherRadar)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showWeatherRadar
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <CloudRain className="w-3.5 h-3.5" /> Radar Lluvias
            </span>
            <span className="text-[10px]">{showWeatherRadar ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowSolarTerminator(!showSolarTerminator)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showSolarTerminator
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5" /> Día / Noche
            </span>
            <span className="text-[10px]">{showSolarTerminator ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowLiveFlights(!showLiveFlights)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showLiveFlights
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5" /> Vuelos en Vivo
            </span>
            <span className="text-[10px]">{showLiveFlights ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowEarthquakes(!showEarthquakes)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showEarthquakes
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Sismos USGS
            </span>
            <span className="text-[10px]">{showEarthquakes ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowWebcams(!showWebcams)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showWebcams
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5" /> Webcams 24/7
            </span>
            <span className="text-[10px]">{showWebcams ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showLabels
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Nombres Países
            </span>
            <span className="text-[10px]">{showLabels ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* 4. Bottom Right Live Radar Player Control */}
      {showWeatherRadar && radarTimestamps.length > 0 && (
        <div className="absolute bottom-6 right-4 z-20 pointer-events-auto bg-slate-950/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-800 shadow-2xl flex items-center gap-3 text-xs text-white">
          <button
            onClick={() => setIsRadarPlaying(!isRadarPlaying)}
            className="p-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg border border-emerald-500/40 transition-colors"
          >
            {isRadarPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <CloudRain className="w-3 h-3 text-emerald-400" /> Radar de Precipitaciones
            </p>
            <p className="text-[11px] font-mono text-emerald-300">
              {new Date((radarTimestamps[radarIndex] || Date.now() / 1000) * 1000).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}{' '}
              UTC ({radarIndex + 1}/{radarTimestamps.length})
            </p>
          </div>

          <input
            type="range"
            min="0"
            max={radarTimestamps.length - 1}
            value={radarIndex}
            onChange={(e) => {
              setIsRadarPlaying(false);
              setRadarIndex(parseInt(e.target.value));
            }}
            className="w-24 accent-emerald-400 cursor-pointer"
          />
        </div>
      )}

      {/* 5. Bottom Left Selected Country Card */}
      {selectedCountry && (
        <div className="absolute bottom-6 left-4 z-20 pointer-events-auto bg-slate-950/92 backdrop-blur-xl p-3.5 rounded-2xl border border-sky-500/40 shadow-2xl max-w-sm flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={`https://flagcdn.com/${selectedCountry.id}.svg`}
              alt={selectedCountry.nameEs}
              className="w-10 h-7 object-cover rounded-md shadow-md border border-white/20 flex-shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm truncate">{selectedCountry.nameEs}</h3>
              <p className="text-xs text-sky-400">★ {selectedCountry.capitalEs} • {selectedCountry.continent}</p>
              <p className="text-[10px] text-slate-400 font-mono">
                {countryService.formatCoordinatesDMS(selectedCountry.lat, selectedCountry.lng)}
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenDetails(selectedCountry)}
            className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex-shrink-0 flex items-center gap-1"
          >
            <Info className="w-3.5 h-3.5" /> Ficha
          </button>
        </div>
      )}

      {/* 6. Dynamic Satellite Telemetry Side Panel */}
      {isSatellitePanelOpen && (
        <div className="absolute right-4 top-20 bottom-6 z-30 w-80 sm:w-96 bg-slate-950/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
          {/* Panel Header */}
          <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
              <div>
                <h3 className="font-bold text-white text-xs tracking-wider flex items-center gap-1.5">
                  <Satellite className="w-3.5 h-3.5 text-cyan-400" /> TELEMETRÍA SATELITAL
                </h3>
                <p className="text-[10px] text-slate-400">Órbitas y Epemérides en Tiempo Real</p>
              </div>
            </div>

            <button
              onClick={() => setIsSatellitePanelOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Cerrar panel de telemetría"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content Container */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 custom-scrollbar">
            {/* Synchronized Master UTC Clock Widget */}
            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3 shadow-inner">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1.5 font-bold text-cyan-400 text-[11px]">
                  <Clock className="w-3.5 h-3.5 animate-pulse" /> RELOJ MAESTRO UTC
                </span>
                <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  GNSS (±1ms)
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="font-mono text-2xl font-black text-white tracking-wider">
                  {currentUtcDate.toISOString().substring(11, 19)}
                  <span className="text-cyan-400 text-sm font-normal">
                    .{Math.floor(currentUtcDate.getUTCMilliseconds() / 100)}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-300 font-medium font-mono">
                    {currentUtcDate.toISOString().substring(0, 10)}
                  </p>
                  <p className="text-[9px] font-mono text-slate-400">
                    JD {(currentUtcDate.getTime() / 86400000 + 2440587.5).toFixed(3)}
                  </p>
                </div>
              </div>

              {/* Subsolar Point Coordinates */}
              {(() => {
                const subsolar = getSubsolarPoint(currentUtcDate);
                return (
                  <div className="mt-2 pt-2 border-t border-slate-800/90 flex items-center justify-between text-[10px] font-mono">
                    <span className="flex items-center gap-1 text-amber-300 font-medium">
                      <Sun className="w-3 h-3 text-amber-400" /> Cénit Solar (Subsolar):
                    </span>
                    <span className="text-slate-300">
                      {subsolar.lat >= 0 ? `${subsolar.lat.toFixed(1)}°N` : `${Math.abs(subsolar.lat).toFixed(1)}°S`},{' '}
                      {subsolar.lng >= 0 ? `${subsolar.lng.toFixed(1)}°E` : `${Math.abs(subsolar.lng).toFixed(1)}°W`}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Quick Orbital Controls */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowOrbitGroundTrack(!showOrbitGroundTrack)}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  showOrbitGroundTrack
                    ? 'bg-cyan-500/20 border-cyan-400/80 text-cyan-300 shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" /> Traza Orbital {showOrbitGroundTrack ? '✓' : '✗'}
              </button>

              <button
                onClick={() => setIsAutoFollowingSatellite(!isAutoFollowingSatellite)}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  isAutoFollowingSatellite
                    ? 'bg-amber-500/20 border-amber-400/80 text-amber-300 shadow-md animate-pulse'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Seguir Cámara {isAutoFollowingSatellite ? '●' : '○'}
              </button>
            </div>

            {/* Featured Active Satellite Card */}
            {(() => {
              const activeSat = satellites.find((s) => s.id === selectedSatelliteId) || satellites[0];
              return (
                <div
                  className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 space-y-2.5 shadow-xl relative overflow-hidden"
                  style={{ borderLeft: `4px solid ${activeSat.color}` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{activeSat.icon}</span>
                        <h4 className="font-bold text-white text-xs truncate">{activeSat.name}</h4>
                      </div>
                      <p className="text-[10px] font-mono font-semibold mt-0.5" style={{ color: activeSat.color }}>
                        {activeSat.codeName} • NORAD #{activeSat.noradId}
                      </p>
                      <p className="text-[10px] text-slate-400">{activeSat.operator}</p>
                    </div>

                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-semibold border ${
                        activeSat.sunlit
                          ? 'bg-amber-950/70 border-amber-500/50 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {activeSat.sunlit ? '☀️ En Sol' : '🌑 En Sombra'}
                    </span>
                  </div>

                  {/* Primary Gauges */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-1.5 text-center">
                      <span className="text-[8px] uppercase font-bold text-slate-400 flex items-center justify-center gap-0.5">
                        <Gauge className="w-2.5 h-2.5 text-cyan-400" /> Altura
                      </span>
                      <p className="font-mono font-bold text-xs text-cyan-300 mt-0.5">{activeSat.altitude} km</p>
                      <p className="text-[8px] text-slate-500 font-mono">{activeSat.perigeeKm}–{activeSat.apogeeKm}</p>
                    </div>

                    <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-1.5 text-center">
                      <span className="text-[8px] uppercase font-bold text-slate-400 flex items-center justify-center gap-0.5">
                        <Zap className="w-2.5 h-2.5 text-amber-400" /> Velocidad
                      </span>
                      <p className="font-mono font-bold text-xs text-amber-300 mt-0.5">
                        {activeSat.velocity.toLocaleString()}
                      </p>
                      <p className="text-[8px] text-slate-400 font-mono">Mach {activeSat.mach}</p>
                    </div>

                    <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-1.5 text-center">
                      <span className="text-[8px] uppercase font-bold text-slate-400 flex items-center justify-center gap-0.5">
                        <Radio className="w-2.5 h-2.5 text-emerald-400" /> Período
                      </span>
                      <p className="font-mono font-bold text-xs text-emerald-300 mt-0.5">{activeSat.periodMin} min</p>
                      <p className="text-[8px] text-slate-400 font-mono">Inc {activeSat.inclinationDeg}°</p>
                    </div>
                  </div>

                  {/* Geodetic Coordinates */}
                  <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2 space-y-1">
                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold uppercase">
                      <span className="flex items-center gap-1">
                        <Navigation className="w-2.5 h-2.5 text-sky-400" /> Coordenadas Geodésicas
                      </span>
                      <span className="text-[8px] font-mono text-cyan-400">LAT / LNG</span>
                    </div>
                    <div className="flex items-center justify-between font-mono text-xs text-white">
                      <div>
                        <span className="text-slate-400 text-[10px] mr-1">LAT:</span>
                        <span className="font-bold text-cyan-300">{activeSat.lat.toFixed(4)}°</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] mr-1">LNG:</span>
                        <span className="font-bold text-cyan-300">{activeSat.lng.toFixed(4)}°</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-mono text-slate-300 pt-0.5 border-t border-slate-800/80 truncate">
                      {countryService.formatCoordinatesDMS(activeSat.lat, activeSat.lng)}
                    </p>
                  </div>

                  {/* Purpose text */}
                  <p className="text-[10px] text-slate-300 leading-snug bg-slate-950/60 p-2 rounded border border-slate-800">
                    {activeSat.purpose}
                  </p>

                  <button
                    onClick={() => {
                      if (Number.isFinite(activeSat.lat) && Number.isFinite(activeSat.lng)) {
                        mapInstanceRef.current?.flyTo([activeSat.lat, activeSat.lng], 5, { duration: 1.2 });
                      }
                    }}
                    className="w-full py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <LocateFixed className="w-3.5 h-3.5" /> Centrar en el Mapa
                  </button>
                </div>
              );
            })()}

            {/* Fleet Directory Section */}
            <div className="space-y-2 pt-1 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <Globe2 className="w-3.5 h-3.5 text-cyan-400" /> Flota Satelital ({satellites.length})
                </span>
                <span className="text-[9px] font-mono text-emerald-400">TELEMETRÍA VIVA</span>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'station', label: 'Estaciones' },
                  { id: 'observation', label: 'Observación' },
                  { id: 'weather', label: 'Clima' },
                  { id: 'astronomy', label: 'Astronomía' },
                  { id: 'constellation', label: 'Redes' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSatelliteCategoryFilter(cat.id as any)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors ${
                      satelliteCategoryFilter === cat.id
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Satellites List */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-0.5">
                {satellites
                  .filter((s) => satelliteCategoryFilter === 'all' || s.category === satelliteCategoryFilter)
                  .map((sat) => {
                    const isSelected = sat.id === selectedSatelliteId;
                    return (
                      <button
                        key={sat.id}
                        onClick={() => {
                          setSelectedSatelliteId(sat.id);
                          if (Number.isFinite(sat.lat) && Number.isFinite(sat.lng)) {
                            mapInstanceRef.current?.flyTo([sat.lat, sat.lng], 5, { duration: 1.0 });
                          }
                        }}
                        className={`w-full p-2 rounded-xl text-left transition-all border flex items-center justify-between group ${
                          isSelected
                            ? 'bg-cyan-950/50 border-cyan-400/80 shadow-md'
                            : 'bg-slate-900/70 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm">{sat.icon}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate group-hover:text-cyan-300">
                              {sat.name}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400">
                              {sat.altitude} km • {sat.velocity.toLocaleString()} km/h
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 ml-2">
                          <span
                            className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase"
                            style={{ backgroundColor: `${sat.color}20`, color: sat.color }}
                          >
                            {sat.orbitType}
                          </span>
                          <p className="text-[9px] font-mono text-slate-400 mt-0.5">
                            {sat.lat >= 0 ? `${sat.lat.toFixed(1)}°N` : `${Math.abs(sat.lat).toFixed(1)}°S`}
                          </p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Zoom & Perspective Controls */}
      <div className={`absolute top-24 z-20 flex flex-col gap-1.5 pointer-events-auto transition-all ${
        isSatellitePanelOpen ? 'right-88 sm:right-[410px]' : 'right-4'
      }`}>
        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="p-2.5 bg-slate-950/85 backdrop-blur-md text-white hover:bg-slate-900 border border-slate-800 rounded-xl shadow-xl transition-all"
          title="Acercar (Zoom In)"
        >
          <ZoomIn className="w-4 h-4 text-sky-400" />
        </button>
        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="p-2.5 bg-slate-950/85 backdrop-blur-md text-white hover:bg-slate-900 border border-slate-800 rounded-xl shadow-xl transition-all"
          title="Alejar (Zoom Out)"
        >
          <ZoomOut className="w-4 h-4 text-sky-400" />
        </button>
        <button
          onClick={() => mapInstanceRef.current?.flyTo([20, 0], 3, { duration: 1.2 })}
          className="p-2.5 bg-slate-950/85 backdrop-blur-md text-white hover:bg-slate-900 border border-slate-800 rounded-xl shadow-xl transition-all"
          title="Vista Global Completa"
        >
          <Maximize2 className="w-4 h-4 text-emerald-400" />
        </button>
      </div>

      {/* 7. Live Webcam Video Player Modal */}
      {activeWebcamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-3.5 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="font-bold text-white text-sm">{activeWebcamModal.name}</span>
                <span className="text-xs text-slate-400">
                  ({activeWebcamModal.city}, {activeWebcamModal.country})
                </span>
              </div>
              <button
                onClick={() => setActiveWebcamModal(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Iframe Container */}
            <div className="relative w-full aspect-video bg-black">
              <iframe
                src={activeWebcamModal.embedUrl}
                title={activeWebcamModal.name}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Description Footer */}
            <div className="p-3 bg-slate-950 text-xs text-slate-300 flex items-center justify-between">
              <p>{activeWebcamModal.description}</p>
              <button
                onClick={() => {
                  if (Number.isFinite(activeWebcamModal.lat) && Number.isFinite(activeWebcamModal.lng)) {
                    mapInstanceRef.current?.flyTo(
                      [activeWebcamModal.lat, activeWebcamModal.lng],
                      14,
                      { duration: 1.5 }
                    );
                  }
                  setActiveWebcamModal(null);
                }}
                className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5" /> Centrar en el mapa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
