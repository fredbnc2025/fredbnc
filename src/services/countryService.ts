import { Country, Continent } from '../types';
import { COUNTRIES, CONTINENTS } from '../data/countries';

export interface GeoPoint3D {
  x: number;
  y: number;
  z: number;
}

export interface GeographicExtreme {
  name: string;
  category: 'highest' | 'lowest_land' | 'deepest_ocean' | 'furthest_center' | 'point_nemo';
  description: string;
  lat: number;
  lng: number;
  value: string;
  countryOrOcean: string;
}

export interface GeodesicRouteInfo {
  from: Country;
  to: Country;
  distanceKm: number;
  distanceNauticalMiles: number;
  flightTimeFormatted: string;
  initialBearingDeg: number;
  initialBearingCardinal: string;
  midpoint: { lat: number; lng: number };
}

export interface CountryFilterOptions {
  continent?: Continent | 'Todos';
  color?: string | 'Todos';
  searchTerm?: string;
  sortBy?: 'name' | 'population' | 'area';
}

export interface DistanceResult {
  country: Country;
  distanceKm: number;
}

/**
 * CountryService: Servicio centralizado para la gestión, obtención y mapeo
 * de datos geográficos de países, banderas vectoriales SVG y coordenadas 3D para Three.js.
 */
class CountryService {
  private countriesCache: Country[] = [...COUNTRIES];
  private isLoaded: boolean = true;
  private customFlags: Map<string, string> = new Map();

  /**
   * Obtiene la lista completa de países con sus coordenadas y metadatos
   */
  public async getCountries(forceRefresh: boolean = false): Promise<Country[]> {
    if (this.isLoaded && !forceRefresh && this.countriesCache.length > 0) {
      return [...this.countriesCache];
    }

    if (forceRefresh && typeof window !== 'undefined' && 'fetch' in window) {
      try {
        const response = await window.fetch('https://restcountries.com/v3.1/all?fields=cca2,cca3,name,capital,latlng,flags,region,population,area,languages,currencies', {
          headers: { 'Accept': 'application/json' },
          signal: typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal ? AbortSignal.timeout(3000) : undefined
        });

        if (response && response.ok) {
          const remoteData = await response.json();
          if (Array.isArray(remoteData) && remoteData.length > 0) {
            const remoteMap = new Map<string, any>();
            remoteData.forEach((item: any) => {
              const id = (item.cca2 || '').toLowerCase();
              if (id) remoteMap.set(id, item);
            });

            const merged: Country[] = this.countriesCache.map((local) => {
              const remote = remoteMap.get(local.id);
              if (remote) {
                return {
                  ...local,
                  population: remote.population || local.population,
                  areaKm2: remote.area || local.areaKm2,
                  lat: remote.latlng?.[0] ?? local.lat,
                  lng: remote.latlng?.[1] ?? local.lng,
                };
              }
              return local;
            });

            this.countriesCache = merged;
          }
        }
      } catch (e) {
        // Fallback silencioso al catálogo local
      }
    }

    this.isLoaded = true;
    return [...this.countriesCache];
  }

  /**
   * Obtiene un país específico por su código ISO (alpha-2 o alpha-3) o nombre
   */
  public async getCountryById(idOrCode: string): Promise<Country | undefined> {
    const list = await this.getCountries();
    const query = idOrCode.toLowerCase().trim();
    return list.find(
      (c) => c.id.toLowerCase() === query || c.code3.toLowerCase() === query
    );
  }

  /**
   * Genera la URL directa de la bandera en formato SVG de alta calidad
   */
  public getFlagSvgUrl(countryId: string): string {
    const cleanId = countryId.toLowerCase().trim();
    return `https://flagcdn.com/${cleanId}.svg`;
  }

  /**
   * Retorna una URL alternativa o CDN de respaldo para la bandera
   */
  public getFlagAlternativeUrl(code2: string): string {
    const cleanId = code2.toLowerCase().trim();
    return `https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${cleanId}.svg`;
  }

  /**
   * Filtra y busca países con criterios de texto, continente y colores
   */
  public filterCountries(countries: Country[], options: CountryFilterOptions): Country[] {
    const { continent = 'Todos', color = 'Todos', searchTerm = '', sortBy = 'name' } = options;
    const cleanTerm = searchTerm.toLowerCase().trim();

    return countries
      .filter((c) => {
        const matchesSearch =
          !cleanTerm ||
          c.nameEs.toLowerCase().includes(cleanTerm) ||
          c.nameEn.toLowerCase().includes(cleanTerm) ||
          c.capitalEs.toLowerCase().includes(cleanTerm) ||
          c.code3.toLowerCase().includes(cleanTerm) ||
          c.id.toLowerCase().includes(cleanTerm);

        const matchesContinent = continent === 'Todos' || c.continent === continent;
        const matchesColor = color === 'Todos' || c.colors.includes(color);

        return matchesSearch && matchesContinent && matchesColor;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.nameEs.localeCompare(b.nameEs);
        if (sortBy === 'population') return b.population - a.population;
        if (sortBy === 'area') return b.areaKm2 - a.areaKm2;
        return 0;
      });
  }

  /**
   * Convierte coordenadas geográficas (Latitud, Longitud) a coordenadas Cartesianas 3D (X, Y, Z)
   * para posicionamiento exacto sobre la superficie de una esfera en Three.js
   */
  public latLngToVector3D(lat: number, lng: number, radius: number = 5): GeoPoint3D {
    // phi: ángulo desde el polo norte (latitud)
    const phi = (90 - lat) * (Math.PI / 180);
    // theta: ángulo longitudinal
    const theta = (lng + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return { x, y, z };
  }

  /**
   * Calcula la distancia del Gran Círculo (Great-Circle Distance) en kilómetros
   * entre dos países usando la fórmula del Haversine
   */
  public calculateDistanceKm(countryA: Country, countryB: Country): number {
    const earthRadiusKm = 6371;
    const dLat = ((countryB.lat - countryA.lat) * Math.PI) / 180;
    const dLng = ((countryB.lng - countryA.lng) * Math.PI) / 180;

    const lat1 = (countryA.lat * Math.PI) / 180;
    const lat2 = (countryB.lat * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(earthRadiusKm * c);
  }

  /**
   * Encuentra los países más cercanos geográficamente a un país objetivo
   */
  public getClosestCountries(targetCountry: Country, count: number = 4): DistanceResult[] {
    return this.countriesCache
      .filter((c) => c.id !== targetCountry.id)
      .map((c) => ({
        country: c,
        distanceKm: this.calculateDistanceKm(targetCountry, c)
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, count);
  }

  /**
   * Calcula el azimut inicial (bearing) en grados de navegación náutica/aeronáutica (0° a 360°)
   */
  public calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x =
      Math.cos(phi1) * Math.sin(phi2) -
      Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

    const theta = Math.atan2(y, x);
    const bearing = ((theta * 180) / Math.PI + 360) % 360;
    return Math.round(bearing * 10) / 10;
  }

  /**
   * Convierte grados de azimut a dirección cardinal aeronáutica (e.g. NNE, SSW)
   */
  public bearingToCardinal(deg: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(deg / 22.5) % 16;
    return directions[index];
  }

  /**
   * Calcula el punto antípoda exacto (diametralmente opuesto en la esfera terrestre)
   */
  public calculateAntipode(lat: number, lng: number): { lat: number; lng: number; description: string } {
    const antiLat = -lat;
    let antiLng = lng > 0 ? lng - 180 : lng + 180;
    if (antiLng === -180) antiLng = 180;

    const latCard = antiLat >= 0 ? `${antiLat.toFixed(2)}°N` : `${Math.abs(antiLat).toFixed(2)}°S`;
    const lngCard = antiLng >= 0 ? `${antiLng.toFixed(2)}°E` : `${Math.abs(antiLng).toFixed(2)}°W`;

    return {
      lat: antiLat,
      lng: antiLng,
      description: `${latCard}, ${lngCard}`
    };
  }

  /**
   * Genera información geodésica completa entre dos países
   */
  public getGeodesicRouteInfo(from: Country, to: Country): GeodesicRouteInfo {
    const distanceKm = this.calculateDistanceKm(from, to);
    const distanceNauticalMiles = Math.round(distanceKm * 0.539957);
    
    // Estimación aeronáutica crucero jet comercial (880 km/h + 30 min maniobras)
    const hours = (distanceKm / 880) + 0.5;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    const flightTimeFormatted = `${h}h ${m}m`;

    const bearing = this.calculateBearing(from.lat, from.lng, to.lat, to.lng);
    const cardinal = this.bearingToCardinal(bearing);

    // Punto medio geodésico
    const midLat = (from.lat + to.lat) / 2;
    const midLng = (from.lng + to.lng) / 2;

    return {
      from,
      to,
      distanceKm,
      distanceNauticalMiles,
      flightTimeFormatted,
      initialBearingDeg: bearing,
      initialBearingCardinal: cardinal,
      midpoint: { lat: midLat, lng: midLng }
    };
  }

  /**
   * Formatea coordenadas en Grados, Minutos, Segundos (DMS)
   */
  public formatCoordinatesDMS(lat: number, lng: number): string {
    const latDir = lat >= 0 ? 'N' : 'S';
    const absLat = Math.abs(lat);
    const latDeg = Math.floor(absLat);
    const latMin = Math.floor((absLat - latDeg) * 60);
    const latSec = Math.round(((absLat - latDeg) * 60 - latMin) * 60);

    const lngDir = lng >= 0 ? 'E' : 'O';
    const absLng = Math.abs(lng);
    const lngDeg = Math.floor(absLng);
    const lngMin = Math.floor((absLng - lngDeg) * 60);
    const lngSec = Math.round(((absLng - lngDeg) * 60 - lngMin) * 60);

    return `${latDeg}°${latMin.toString().padStart(2, '0')}'${latSec.toString().padStart(2, '0')}"${latDir} ${lngDeg}°${lngMin.toString().padStart(2, '0')}'${lngSec.toString().padStart(2, '0')}"${lngDir}`;
  }

  /**
   * Puntos geográficos extremos de la Tierra (Hitos Geodésicos)
   */
  public getExtremeGeographicPoints(): GeographicExtreme[] {
    return [
      {
        name: 'Monte Everest (Chomolungma)',
        category: 'highest',
        description: 'Punto más alto sobre el nivel del mar en la Tierra',
        lat: 27.9881,
        lng: 86.9250,
        value: '8.848,86 m',
        countryOrOcean: 'Nepal / China'
      },
      {
        name: 'Volcán Chimborazo',
        category: 'furthest_center',
        description: 'Punto de la superficie terrestre más alejado del centro de la Tierra (por el abultamiento ecuatorial)',
        lat: -1.4693,
        lng: -78.8169,
        value: '6.384,4 km del núcleo',
        countryOrOcean: 'Ecuador'
      },
      {
        name: 'Fosa de las Marianas (Abismo de Challenger)',
        category: 'deepest_ocean',
        description: 'Punto más profundo conocido en la hidrosfera terrestre',
        lat: 11.3733,
        lng: 142.5917,
        value: '-10.994 m',
        countryOrOcean: 'Océano Pacífico'
      },
      {
        name: 'Mar Muerto',
        category: 'lowest_land',
        description: 'Punto terrestre en tierra emergida más bajo del planeta',
        lat: 31.5590,
        lng: 35.4732,
        value: '-430 m',
        countryOrOcean: 'Jordania / Israel'
      },
      {
        name: 'Punto Nemo (Polo de Inaccesibilidad)',
        category: 'point_nemo',
        description: 'Lugar del océano más alejado de cualquier tierra firme (2.688 km a la isla más cercana)',
        lat: -48.8767,
        lng: -123.3933,
        value: '2.688 km a costa',
        countryOrOcean: 'Océano Pacífico Sur'
      }
    ];
  }

  /**
   * Calcula el punto subsolar y estado astronómico de la Tierra en tiempo real (UTC)
   */
  public calculateSubsolarPoint(date: Date = new Date()): { lat: number; lng: number } {
    const dayOfYear = Math.floor(
      (date.getTime() - new Date(Date.UTC(date.getUTCFullYear(), 0, 0)).getTime()) / (1000 * 60 * 60 * 24)
    );
    // Declinación solar precisa de Spencer/Cooper (oblicuidad ~23.44°)
    const b = (2 * Math.PI * (dayOfYear - 1)) / 365.25;
    const declination =
      (180 / Math.PI) *
      (0.006918 -
        0.399912 * Math.cos(b) +
        0.070257 * Math.sin(b) -
        0.006758 * Math.cos(2 * b) +
        0.000907 * Math.sin(2 * b) -
        0.002697 * Math.cos(3 * b) +
        0.00148 * Math.sin(3 * b));

    // Ecuación del Tiempo (EoT) en minutos
    const eotMinutes =
      229.18 *
      (0.000075 +
        0.001868 * Math.cos(b) -
        0.032077 * Math.sin(b) -
        0.014615 * Math.cos(2 * b) -
        0.040849 * Math.sin(2 * b));

    // Longitud subsolar exacta basada en UTC y Ecuación del Tiempo
    const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    const subsolarLng = -((utcHours + eotMinutes / 60 - 12) * 15);
    const normalizedLng = ((((subsolarLng + 180) % 360) + 360) % 360) - 180;

    return {
      lat: declination,
      lng: normalizedLng
    };
  }

  /**
   * Calcula el ángulo de elevación solar y estado de iluminación para cualquier coordenada en tiempo real
   */
  public calculateSolarElevation(lat: number, lng: number, date: Date = new Date()): {
    elevationDeg: number;
    status: 'day' | 'twilight_civil' | 'twilight_nautical' | 'twilight_astronomical' | 'night';
    statusLabel: string;
    solarTime: string;
  } {
    const subsolar = this.calculateSubsolarPoint(date);
    const phi1 = (lat * Math.PI) / 180;
    const phi2 = (subsolar.lat * Math.PI) / 180;
    const deltaLambda = ((lng - subsolar.lng) * Math.PI) / 180;

    // Altitud / Elevación solar cenital
    const sinElevation = Math.sin(phi1) * Math.sin(phi2) + Math.cos(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
    const elevationDeg = (Math.asin(Math.max(-1, Math.min(1, sinElevation))) * 180) / Math.PI;

    // Hora solar aparente local
    const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    const localSolarHours = (utcHours + lng / 15 + 24) % 24;
    const solarH = Math.floor(localSolarHours);
    const solarM = Math.floor((localSolarHours - solarH) * 60);
    const solarS = Math.floor(((localSolarHours - solarH) * 60 - solarM) * 60);
    const solarTime = `${solarH.toString().padStart(2, '0')}:${solarM.toString().padStart(2, '0')}:${solarS.toString().padStart(2, '0')}`;

    let status: 'day' | 'twilight_civil' | 'twilight_nautical' | 'twilight_astronomical' | 'night' = 'day';
    let statusLabel = 'Día pleno (Sol radiante)';

    if (elevationDeg > 0) {
      status = 'day';
      statusLabel = elevationDeg >= 60 ? 'Mediodía Solar / Sol Cenital' : 'Luz Diurna';
    } else if (elevationDeg > -6) {
      status = 'twilight_civil';
      statusLabel = 'Crepúsculo Civil (Amanecer / Atardecer)';
    } else if (elevationDeg > -12) {
      status = 'twilight_nautical';
      statusLabel = 'Crepúsculo Náutico';
    } else if (elevationDeg > -18) {
      status = 'twilight_astronomical';
      statusLabel = 'Crepúsculo Astronómico';
    } else {
      status = 'night';
      statusLabel = 'Noche Cerrada (Luces Urbanas)';
    }

    return {
      elevationDeg: Math.round(elevationDeg * 10) / 10,
      status,
      statusLabel,
      solarTime
    };
  }

  /**
   * Obtiene la rotación terrestre en radianes para alinear el globo 3D 1:1 con la realidad espacial actual
   */
  public getRealtimeEarthRotationY(date: Date = new Date()): number {
    const subsolar = this.calculateSubsolarPoint(date);
    // Para que la longitud subsolar apunte directamente a la cámara frontal o al sol en Three.js
    return -((subsolar.lng + 90) * Math.PI) / 180;
  }

  /**
   * Lista de continentes disponibles
   */
  public getContinents(): Continent[] {
    return CONTINENTS;
  }
}

export const countryService = new CountryService();
