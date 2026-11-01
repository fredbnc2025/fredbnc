import { Country } from '../types';
import { geoDataService } from './geoDataService';
import { geoPath, geoEquirectangular, geoMercator, geoEqualEarth } from 'd3-geo';

export interface SatelliteTrack {
  id: string;
  name: string;
  category: 'station' | 'weather' | 'earth_observation' | 'astronomy' | 'navigation';
  noradId: number;
  altitudeKm: number;
  speedKmh: number;
  inclinationDeg: number;
  periodMinutes: number;
  footprintKm: number;
  description: string;
  agency: string;
  color: string;
  launchYear: number;
}

export interface SatelliteLivePosition {
  satellite: SatelliteTrack;
  lat: number;
  lng: number;
  altitudeKm: number;
  speedKmh: number;
  footprintKm: number;
  azimuthDeg: number;
  elevationDeg: number;
  subsolarDistanceKm: number;
  orbitalProgress: number; // 0 to 1
  groundTrack: [number, number][]; // Array of [lng, lat]
}

export interface SVGExportOptions {
  width?: number;
  height?: number;
  projectionType?: 'equirectangular' | 'mercator' | 'equalEarth';
  theme?: 'satellite' | 'political' | 'topographic' | 'night' | 'minimal_dark';
  showGraticule?: boolean;
  showCountryLabels?: boolean;
  showCapitals?: boolean;
  showTropics?: boolean;
  showSatellites?: boolean;
  activeSatellites?: SatelliteLivePosition[];
  title?: string;
}

export const SATELLITE_CATALOG: SatelliteTrack[] = [
  {
    id: 'iss',
    name: 'ISS (Estación Espacial Internacional)',
    category: 'station',
    noradId: 25544,
    altitudeKm: 420,
    speedKmh: 27580,
    inclinationDeg: 51.64,
    periodMinutes: 92.9,
    footprintKm: 2200,
    description: 'Laboratorio orbital tripulado multinacional en órbita baja terrestre.',
    agency: 'NASA / ESA / JAXA / Roscosmos / CSA',
    color: '#38bdf8',
    launchYear: 1998
  },
  {
    id: 'sentinel2a',
    name: 'Sentinel-2A (Copernicus)',
    category: 'earth_observation',
    noradId: 40697,
    altitudeKm: 786,
    speedKmh: 26850,
    inclinationDeg: 98.62,
    periodMinutes: 100.7,
    footprintKm: 290,
    description: 'Satélite de teledetección multiespectral de alta resolución óptica para monitoreo ambiental y agrícola.',
    agency: 'ESA (Agencia Espacial Europea)',
    color: '#10b981',
    launchYear: 2015
  },
  {
    id: 'landsat9',
    name: 'Landsat 9',
    category: 'earth_observation',
    noradId: 49260,
    altitudeKm: 705,
    speedKmh: 27000,
    inclinationDeg: 98.2,
    periodMinutes: 98.9,
    footprintKm: 185,
    description: 'Misión conjunta NASA/USGS para la observación continua de la superficie terrestre en luz visible e infrarroja.',
    agency: 'NASA / USGS',
    color: '#f59e0b',
    launchYear: 2021
  },
  {
    id: 'goes16',
    name: 'GOES-16 (GOES-East)',
    category: 'weather',
    noradId: 41866,
    altitudeKm: 35786,
    speedKmh: 11070,
    inclinationDeg: 0.05,
    periodMinutes: 1436.1,
    footprintKm: 9800,
    description: 'Satélite meteorológico geoestacionario avanzado para pronóstico de huracanes y tormentas extremas.',
    agency: 'NOAA / NASA',
    color: '#ec4899',
    launchYear: 2016
  },
  {
    id: 'meteosat11',
    name: 'Meteosat-11 (MSG-4)',
    category: 'weather',
    noradId: 40732,
    altitudeKm: 35786,
    speedKmh: 11070,
    inclinationDeg: 0.08,
    periodMinutes: 1436.1,
    footprintKm: 9800,
    description: 'Satélite meteorológico geoestacionario europeo con cobertura continua de Europa, África y el Atlántico.',
    agency: 'EUMETSAT',
    color: '#a855f7',
    launchYear: 2015
  },
  {
    id: 'hst',
    name: 'Telescopio Espacial Hubble (HST)',
    category: 'astronomy',
    noradId: 20580,
    altitudeKm: 540,
    speedKmh: 27300,
    inclinationDeg: 28.47,
    periodMinutes: 95.4,
    footprintKm: 2500,
    description: 'Observatorio astronómico espacial en luz óptica, ultravioleta y cercano infrarrojo.',
    agency: 'NASA / ESA',
    color: '#3b82f6',
    launchYear: 1990
  }
];

class SatelliteService {
  /**
   * Calcula la posición orbital en tiempo real para un satélite dado un instante Date
   */
  public getLiveSatellitePosition(sat: SatelliteTrack, date: Date = new Date()): SatelliteLivePosition {
    const epochMs = date.getTime();
    const periodMs = sat.periodMinutes * 60 * 1000;
    
    // Phase offset unique per satellite
    const phaseOffset = (sat.noradId % 1000) / 1000;
    const progress = ((epochMs / periodMs) + phaseOffset) % 1.0;
    const meanAnomaly = progress * 2 * Math.PI;

    let lat = 0;
    let lng = 0;

    if (sat.altitudeKm > 30000) {
      // Geoestacionario: lat ~ 0°, lng fija con leve libración
      const baseLng = sat.id === 'goes16' ? -75.2 : 0.0;
      lat = Math.sin(meanAnomaly) * sat.inclinationDeg;
      lng = baseLng + Math.cos(meanAnomaly) * 0.15;
    } else {
      // Órbita baja inclinada
      const incRad = (sat.inclinationDeg * Math.PI) / 180;
      lat = (Math.asin(Math.sin(incRad) * Math.sin(meanAnomaly)) * 180) / Math.PI;
      
      // Longitude takes into account orbital progression + Earth's sidereal rotation
      const earthRotDegPerMin = 360 / 1440; // 0.25 deg/min
      const nodeDrift = (epochMs / (60 * 1000)) * earthRotDegPerMin;
      const rawLng = (Math.atan2(Math.cos(incRad) * Math.sin(meanAnomaly), Math.cos(meanAnomaly)) * 180) / Math.PI;
      lng = ((rawLng - nodeDrift + 180 * phaseOffset + 540) % 360) - 180;
    }

    // Generate Ground Track (previous 45 min and next 45 min)
    const groundTrack: [number, number][] = [];
    const steps = 48;
    for (let i = -steps / 2; i <= steps / 2; i++) {
      const tDeltaMin = (i / (steps / 2)) * (sat.periodMinutes * 0.5);
      const tMs = epochMs + tDeltaMin * 60 * 1000;
      const p = ((tMs / periodMs) + phaseOffset) % 1.0;
      const mA = p * 2 * Math.PI;
      
      let tLat = 0;
      let tLng = 0;
      if (sat.altitudeKm > 30000) {
        const baseLng = sat.id === 'goes16' ? -75.2 : 0.0;
        tLat = Math.sin(mA) * sat.inclinationDeg;
        tLng = baseLng;
      } else {
        const incRad = (sat.inclinationDeg * Math.PI) / 180;
        tLat = (Math.asin(Math.sin(incRad) * Math.sin(mA)) * 180) / Math.PI;
        const earthRot = (tMs / (60 * 1000)) * (360 / 1440);
        const rLng = (Math.atan2(Math.cos(incRad) * Math.sin(mA), Math.cos(mA)) * 180) / Math.PI;
        tLng = ((rLng - earthRot + 180 * phaseOffset + 540) % 360) - 180;
      }
      groundTrack.push([tLng, tLat]);
    }

    return {
      satellite: sat,
      lat,
      lng,
      altitudeKm: sat.altitudeKm,
      speedKmh: sat.speedKmh,
      footprintKm: sat.footprintKm,
      azimuthDeg: Math.round(((lng + 180) % 360)),
      elevationDeg: Math.round(90 - Math.abs(lat)),
      subsolarDistanceKm: Math.round(sat.altitudeKm * 1.05),
      orbitalProgress: progress,
      groundTrack
    };
  }

  /**
   * Obtiene la telemetría en tiempo real de todos los satélites activos en catálogo
   */
  public getAllLiveSatellites(date: Date = new Date()): SatelliteLivePosition[] {
    return SATELLITE_CATALOG.map((sat) => this.getLiveSatellitePosition(sat, date));
  }

  /**
   * Generador Maestro de Mapa Vectorial 8K Ultra HD SVG (8192 × 4320)
   * Produce un documento SVG 100% puro y escalable de nivel profesional cartográfico.
   */
  public generate8KSVGVectorMap(options: SVGExportOptions = {}, countries: Country[] = []): string {
    const width = options.width || 8192;
    const height = options.height || 4320;
    const theme = options.theme || 'satellite';
    const showGraticule = options.showGraticule !== false;
    const showCountryLabels = options.showCountryLabels !== false;
    const showTropics = options.showTropics !== false;
    const showSatellites = options.showSatellites !== false;
    const title = options.title || 'ATLAS CARTOGRÁFICO VECTORIAL ULTRA HD 8K - WGS84';

    // Projection setup
    const projection = geoEquirectangular()
      .scale(width / (2 * Math.PI))
      .translate([width / 2, height / 2]);

    const pathGen = geoPath().projection(projection);
    const geojson = geoDataService.getCountriesGeoJSON();

    // Color palettes with white dividing lines
    const palettes = {
      satellite: {
        oceanBg: '#08192e',
        oceanGlow: '#0f3156',
        landFill: '#244e29',
        landStroke: '#ffffff',
        graticule: 'rgba(255, 255, 255, 0.18)',
        equator: '#ffffff',
        tropics: 'rgba(255, 255, 255, 0.65)',
        text: '#f8fafc',
        accent: '#38bdf8'
      },
      political: {
        oceanBg: '#091322',
        oceanGlow: '#10233d',
        landFill: '#1e293b',
        landStroke: '#ffffff',
        graticule: 'rgba(255, 255, 255, 0.18)',
        equator: '#ffffff',
        tropics: 'rgba(255, 255, 255, 0.65)',
        text: '#ffffff',
        accent: '#facc15'
      },
      topographic: {
        oceanBg: '#051b2c',
        oceanGlow: '#0a3656',
        landFill: '#57534e',
        landStroke: '#ffffff',
        graticule: 'rgba(255, 255, 255, 0.18)',
        equator: '#ffffff',
        tropics: 'rgba(255, 255, 255, 0.65)',
        text: '#f5f5f4',
        accent: '#22c55e'
      },
      night: {
        oceanBg: '#020617',
        oceanGlow: '#0f172a',
        landFill: '#0b132b',
        landStroke: '#ffffff',
        graticule: 'rgba(255, 255, 255, 0.18)',
        equator: '#ffffff',
        tropics: 'rgba(255, 255, 255, 0.65)',
        text: '#f1f5f9',
        accent: '#fbbf24'
      },
      minimal_dark: {
        oceanBg: '#090d16',
        oceanGlow: '#111827',
        landFill: '#1f2937',
        landStroke: '#ffffff',
        graticule: 'rgba(255, 255, 255, 0.18)',
        equator: '#ffffff',
        tropics: 'rgba(255, 255, 255, 0.65)',
        text: '#e2e8f0',
        accent: '#60a5fa'
      }
    };

    const curPalette = palettes[theme] || palettes.satellite;

    // Build SVG paths for countries
    let countryPathsSVG = '';
    const politicalColors = [
      '#1e3a8a', '#14532d', '#713f12', '#701a75', '#831843', '#1e293b', '#312e81', '#065f46', '#7c2d12', '#374151'
    ];

    geojson.features.forEach((feat, idx) => {
      const d = pathGen(feat);
      if (!d) return;
      const alpha2 = ((feat.properties as any)?.alpha2 || '').toLowerCase();
      const countryObj = countries.find((c) => c.id === alpha2);
      const name = countryObj ? countryObj.nameEs : (feat.properties as any)?.name || 'País';
      
      let fill = curPalette.landFill;
      if (theme === 'political') {
        fill = politicalColors[idx % politicalColors.length];
      }

      countryPathsSVG += `
        <path id="country-${alpha2 || idx}" d="${d}" fill="${fill}" stroke="${curPalette.landStroke}" stroke-width="1.8" stroke-linejoin="round" opacity="0.95">
          <title>${name}</title>
        </path>`;
    });

    // Build Graticule SVG (Parallels & Meridians)
    let graticuleSVG = '';
    if (showGraticule) {
      // Parallels every 15°
      for (let lat = -80; lat <= 80; lat += 15) {
        if (lat === 0) continue;
        const coords: [number, number][] = [];
        for (let lng = -180; lng <= 180; lng += 5) {
          coords.push([lng, lat]);
        }
        const lineGeo: any = { type: 'LineString', coordinates: coords };
        const d = pathGen(lineGeo);
        if (d) {
          graticuleSVG += `<path d="${d}" fill="none" stroke="${curPalette.graticule}" stroke-width="1.2" stroke-dasharray="8,6" />`;
          const textPos = projection([176, lat]);
          if (textPos) {
            graticuleSVG += `<text x="${textPos[0]}" y="${textPos[1] - 4}" fill="${curPalette.text}" opacity="0.45" font-size="28" font-family="monospace">${lat > 0 ? `${lat}°N` : `${Math.abs(lat)}°S`}</text>`;
          }
        }
      }

      // Meridians every 15°
      for (let lng = -180; lng <= 180; lng += 15) {
        if (lng === 0) continue;
        const coords: [number, number][] = [];
        for (let lat = -85; lat <= 85; lat += 5) {
          coords.push([lng, lat]);
        }
        const lineGeo: any = { type: 'LineString', coordinates: coords };
        const d = pathGen(lineGeo);
        if (d) {
          graticuleSVG += `<path d="${d}" fill="none" stroke="${curPalette.graticule}" stroke-width="1.2" stroke-dasharray="8,6" />`;
          const textPos = projection([lng, 84]);
          if (textPos) {
            graticuleSVG += `<text x="${textPos[0]}" y="${textPos[1] + 28}" fill="${curPalette.text}" opacity="0.45" font-size="28" font-family="monospace" text-anchor="middle">${lng > 0 ? `${lng}°E` : `${Math.abs(lng)}°W`}</text>`;
          }
        }
      }

      // Greenwich Prime Meridian (0°)
      const pmCoords: [number, number][] = [];
      for (let lat = -85; lat <= 85; lat += 5) pmCoords.push([0, lat]);
      const pmGeo: any = { type: 'LineString', coordinates: pmCoords };
      const pmD = pathGen(pmGeo);
      if (pmD) {
        graticuleSVG += `<path d="${pmD}" fill="none" stroke="#38bdf8" stroke-width="2.5" opacity="0.8" />`;
      }
    }

    // Equator Line (0° Latitude)
    let equatorSVG = '';
    const eqCoords: [number, number][] = [];
    for (let lng = -180; lng <= 180; lng += 2) eqCoords.push([lng, 0]);
    const eqGeo: any = { type: 'LineString', coordinates: eqCoords };
    const eqD = pathGen(eqGeo);
    if (eqD) {
      equatorSVG = `
        <path d="${eqD}" fill="none" stroke="${curPalette.equator}" stroke-width="3.5" opacity="0.9" />
        <text x="${width / 2}" y="${height / 2 - 12}" fill="${curPalette.equator}" font-size="34" font-weight="bold" font-family="system-ui" text-anchor="middle" letter-spacing="4">
          ECUADOR TERRESTRE (0° 00' 00")
        </text>`;
    }

    // Tropics of Cancer & Capricorn
    let tropicsSVG = '';
    if (showTropics) {
      [23.436, -23.436].forEach((tLat) => {
        const tCoords: [number, number][] = [];
        for (let lng = -180; lng <= 180; lng += 2) tCoords.push([lng, tLat]);
        const tGeo: any = { type: 'LineString', coordinates: tCoords };
        const tD = pathGen(tGeo);
        if (tD) {
          const isCancer = tLat > 0;
          tropicsSVG += `
            <path d="${tD}" fill="none" stroke="${curPalette.tropics}" stroke-width="2.2" stroke-dasharray="14,8" />
            <text x="140" y="${projection([-170, tLat])?.[1] || 0}" fill="${curPalette.tropics}" font-size="28" font-family="system-ui" font-weight="600">
              ${isCancer ? 'TRÓPICO DE CÁNCER (+23°26′12″)' : 'TRÓPICO DE CAPRICORNIO (-23°26′12″)'}
            </text>`;
        }
      });
    }

    // Active Satellite Tracks & Live Icons
    let satellitesSVG = '';
    if (showSatellites) {
      const activeSats = options.activeSatellites || this.getAllLiveSatellites();
      activeSats.forEach((s) => {
        const pt = projection([s.lng, s.lat]);
        if (!pt) return;

        // Ground track
        if (s.groundTrack && s.groundTrack.length > 2) {
          const trackGeo: any = { type: 'LineString', coordinates: s.groundTrack };
          const trD = pathGen(trackGeo);
          if (trD) {
            satellitesSVG += `<path d="${trD}" fill="none" stroke="${s.satellite.color}" stroke-width="2.0" stroke-dasharray="10,6" opacity="0.6" />`;
          }
        }

        // Satellite Marker Pin
        satellitesSVG += `
          <g transform="translate(${pt[0]}, ${pt[1]})">
            <circle r="36" fill="${s.satellite.color}" opacity="0.25" />
            <circle r="18" fill="${s.satellite.color}" stroke="#ffffff" stroke-width="3" />
            <rect x="26" y="-32" width="340" height="64" rx="14" fill="#0f172a" fill-opacity="0.9" stroke="${s.satellite.color}" stroke-width="2" />
            <text x="44" y="-8" fill="#ffffff" font-size="22" font-weight="bold" font-family="system-ui">${s.satellite.name}</text>
            <text x="44" y="16" fill="${s.satellite.color}" font-size="18" font-family="monospace">ALT: ${s.altitudeKm}km | VEL: ${s.speedKmh.toLocaleString()}km/h</text>
          </g>`;
      });
    }

    // Country Labels & Capital Stars
    let labelsSVG = '';
    if (showCountryLabels && countries.length > 0) {
      countries.forEach((country) => {
        const centroid = geoDataService.getCountryCentroid(country.id) || [country.lng, country.lat];
        const pt = projection([centroid[0], centroid[1]]);
        if (!pt) return;

        labelsSVG += `
          <g transform="translate(${pt[0]}, ${pt[1]})">
            <text x="0" y="0" fill="${curPalette.text}" font-size="26" font-weight="700" font-family="system-ui" text-anchor="middle" stroke="#020617" stroke-width="5" paint-order="stroke fill">
              ${country.nameEs}
            </text>
            <text x="0" y="24" fill="${curPalette.accent}" font-size="18" font-weight="500" font-family="system-ui" text-anchor="middle" stroke="#020617" stroke-width="4" paint-order="stroke fill">
              ★ ${country.capitalEs}
            </text>
          </g>`;
      });
    }

    const timestamp = new Date().toISOString();

    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" version="1.1">
  <defs>
    <linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${curPalette.oceanBg}" />
      <stop offset="30%" stop-color="${curPalette.oceanGlow}" />
      <stop offset="70%" stop-color="${curPalette.oceanGlow}" />
      <stop offset="100%" stop-color="${curPalette.oceanBg}" />
    </linearGradient>
    <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Ocean Background -->
  <rect width="${width}" height="${height}" fill="url(#oceanGrad)" />

  <!-- Geographic Graticule Grid -->
  <g id="graticule-layer">
    ${graticuleSVG}
    ${equatorSVG}
    ${tropicsSVG}
  </g>

  <!-- Sovereign Country Polygons -->
  <g id="countries-layer">
    ${countryPathsSVG}
  </g>

  <!-- Real-Time Satellites & Orbital Trajectories -->
  <g id="satellites-layer">
    ${satellitesSVG}
  </g>

  <!-- Cartographic Country Labels & Capitals -->
  <g id="labels-layer">
    ${labelsSVG}
  </g>

  <!-- Header & Cartographic Metadata Watermark -->
  <g id="cartographic-header" transform="translate(80, 100)">
    <rect width="1380" height="150" rx="24" fill="#0b1329" fill-opacity="0.85" stroke="#38bdf8" stroke-width="2.5" />
    <text x="40" y="58" fill="#ffffff" font-size="38" font-weight="900" font-family="system-ui" letter-spacing="2">
      ${title}
    </text>
    <text x="40" y="102" fill="#38bdf8" font-size="24" font-family="monospace">
      RESOLUCIÓN: 8192 × 4320 (8K ULTRA HD) | DATUM: WGS84 | GENERADO: ${timestamp}
    </text>
  </g>

  <!-- Cartographic Scale Bar & Legend (Bottom Right) -->
  <g id="cartographic-legend" transform="translate(${width - 1200}, ${height - 180})">
    <rect width="1120" height="120" rx="20" fill="#0b1329" fill-opacity="0.9" stroke="#38bdf8" stroke-width="2" />
    <text x="30" y="45" fill="#f8fafc" font-size="24" font-weight="bold" font-family="system-ui">
      ESCALA CARTOGRÁFICA ECUATORIAL: 1 : 5,000,000 | PROYECCIÓN CILÍNDRICA EQUIDISTANTE
    </text>
    <g transform="translate(30, 65)">
      <rect x="0" y="0" width="160" height="12" fill="#ffffff" />
      <rect x="160" y="0" width="160" height="12" fill="#0284c7" />
      <rect x="320" y="0" width="160" height="12" fill="#ffffff" />
      <rect x="480" y="0" width="160" height="12" fill="#0284c7" />
      <text x="0" y="32" fill="#cbd5e1" font-size="18" font-family="monospace">0 km</text>
      <text x="160" y="32" fill="#cbd5e1" font-size="18" font-family="monospace">1,250</text>
      <text x="320" y="32" fill="#cbd5e1" font-size="18" font-family="monospace">2,500</text>
      <text x="480" y="32" fill="#cbd5e1" font-size="18" font-family="monospace">3,750</text>
      <text x="640" y="32" fill="#cbd5e1" font-size="18" font-family="monospace">5,000 km</text>
    </g>
  </g>
</svg>`;
  }

  /**
   * Dispara la descarga del archivo SVG 8K generado directamente en el navegador
   */
  public download8KSVG(svgString: string, filename: string = 'mapa_mundial_3d_8k_wgs84.svg') {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const satelliteService = new SatelliteService();
