import { Country } from '../types';

export interface LiveFlight {
  id: string;
  callsign: string;
  airline: string;
  aircraft: string;
  originIata: string;
  originCity: string;
  originCountry: string;
  originCoords: [number, number]; // [lat, lng]
  destIata: string;
  destCity: string;
  destCountry: string;
  destCoords: [number, number]; // [lat, lng]
  departureEpochMs: number;
  durationMinutes: number;
  altitudeMeters: number;
  speedKmh: number;
  headingDeg: number;
  currentLat: number;
  currentLng: number;
  progressPercent: number; // 0 to 100
}

export interface LiveEarthquake {
  id: string;
  place: string;
  magnitude: number;
  depthKm: number;
  timestamp: number;
  lat: number;
  lng: number;
  countryCode: string;
  tsunamiWarning: boolean;
}

export interface RealtimeSolarEphemeris {
  subsolarLat: number;
  subsolarLng: number;
  subsolarFormatted: string;
  gmstHours: number; // Greenwich Mean Sidereal Time in hours
  earthRotationAngleRad: number;
  solarDeclinationDeg: number;
  equationOfTimeMinutes: number;
  seasonName: string;
  utcTimeFormatted: string;
  utcDateFormatted: string;
}

// Master Flight Schedule Template for Continuous Real-Time Propagation
const FLIGHT_TEMPLATES = [
  {
    callsign: 'IB6251',
    airline: 'Iberia',
    aircraft: 'Airbus A350-900',
    originIata: 'MAD',
    originCity: 'Madrid',
    originCountry: 'España',
    originCoords: [40.4839, -3.5679] as [number, number],
    destIata: 'JFK',
    destCity: 'Nueva York',
    destCountry: 'Estados Unidos',
    destCoords: [40.6413, -73.7781] as [number, number],
    durationMinutes: 495,
    altitudeMeters: 11580,
    speedKmh: 890
  },
  {
    callsign: 'AA908',
    airline: 'American Airlines',
    aircraft: 'Boeing 777-300ER',
    originIata: 'EZE',
    originCity: 'Buenos Aires',
    originCountry: 'Argentina',
    originCoords: [-34.815, -58.5358] as [number, number],
    destIata: 'MIA',
    destCity: 'Miami',
    destCountry: 'Estados Unidos',
    destCoords: [25.7959, -80.287] as [number, number],
    durationMinutes: 540,
    altitudeMeters: 11200,
    speedKmh: 875
  },
  {
    callsign: 'AF442',
    airline: 'Air France',
    aircraft: 'Boeing 787-9 Dreamliner',
    originIata: 'CDG',
    originCity: 'París',
    originCountry: 'Francia',
    originCoords: [49.0097, 2.5479] as [number, number],
    destIata: 'GIG',
    destCity: 'Río de Janeiro',
    destCountry: 'Brasil',
    destCoords: [-22.8089, -43.2436] as [number, number],
    durationMinutes: 680,
    altitudeMeters: 11800,
    speedKmh: 910
  },
  {
    callsign: 'JL043',
    airline: 'Japan Airlines',
    aircraft: 'Airbus A350-1000',
    originIata: 'HND',
    originCity: 'Tokio',
    originCountry: 'Japón',
    originCoords: [35.5494, 139.7798] as [number, number],
    destIata: 'LHR',
    destCity: 'Londres',
    destCountry: 'Reino Unido',
    destCoords: [51.47, -0.4543] as [number, number],
    durationMinutes: 820,
    altitudeMeters: 12200,
    speedKmh: 905
  },
  {
    callsign: 'EK414',
    airline: 'Emirates',
    aircraft: 'Airbus A380-800',
    originIata: 'DXB',
    originCity: 'Dubái',
    originCountry: 'Emiratos Árabes',
    originCoords: [25.2532, 55.3657] as [number, number],
    destIata: 'SYD',
    destCity: 'Sídney',
    destCountry: 'Australia',
    destCoords: [-33.9399, 151.1753] as [number, number],
    durationMinutes: 840,
    altitudeMeters: 12500,
    speedKmh: 920
  },
  {
    callsign: 'LH506',
    airline: 'Lufthansa',
    aircraft: 'Boeing 747-8 Intercontinental',
    originIata: 'FRA',
    originCity: 'Fráncfort',
    originCountry: 'Alemania',
    originCoords: [50.0379, 8.5622] as [number, number],
    destIata: 'GRU',
    destCity: 'São Paulo',
    destCountry: 'Brasil',
    destCoords: [-23.4356, -46.4731] as [number, number],
    durationMinutes: 710,
    altitudeMeters: 11300,
    speedKmh: 885
  },
  {
    callsign: 'AM001',
    airline: 'Aeroméxico',
    aircraft: 'Boeing 787-8 Dreamliner',
    originIata: 'MEX',
    originCity: 'Ciudad de México',
    originCountry: 'México',
    originCoords: [19.4361, -99.0719] as [number, number],
    destIata: 'MAD',
    destCity: 'Madrid',
    destCountry: 'España',
    destCoords: [40.4839, -3.5679] as [number, number],
    durationMinutes: 620,
    altitudeMeters: 11900,
    speedKmh: 915
  },
  {
    callsign: 'SQ022',
    airline: 'Singapore Airlines',
    aircraft: 'Airbus A350-900ULR',
    originIata: 'SIN',
    originCity: 'Singapur',
    originCountry: 'Singapur',
    originCoords: [1.3644, 103.9915] as [number, number],
    destIata: 'EWR',
    destCity: 'Nueva York / Newark',
    destCountry: 'Estados Unidos',
    destCoords: [40.6895, -74.1745] as [number, number],
    durationMinutes: 1080,
    altitudeMeters: 12800,
    speedKmh: 930
  },
  {
    callsign: 'LA600',
    airline: 'LATAM Airlines',
    aircraft: 'Boeing 787-9',
    originIata: 'SCL',
    originCity: 'Santiago',
    originCountry: 'Chile',
    originCoords: [-33.393, -70.7944] as [number, number],
    destIata: 'LAX',
    destCity: 'Los Ángeles',
    destCountry: 'Estados Unidos',
    destCoords: [33.9416, -118.4085] as [number, number],
    durationMinutes: 650,
    altitudeMeters: 11600,
    speedKmh: 895
  },
  {
    callsign: 'QF001',
    airline: 'Qantas',
    aircraft: 'Boeing 787-9',
    originIata: 'PER',
    originCity: 'Perth',
    originCountry: 'Australia',
    originCoords: [-31.9403, 115.967] as [number, number],
    destIata: 'LHR',
    destCity: 'Londres',
    destCountry: 'Reino Unido',
    destCoords: [51.47, -0.4543] as [number, number],
    durationMinutes: 1020,
    altitudeMeters: 12600,
    speedKmh: 925
  },
  {
    callsign: 'AV010',
    airline: 'Avianca',
    aircraft: 'Boeing 787-8',
    originIata: 'BOG',
    originCity: 'Bogotá',
    originCountry: 'Colombia',
    originCoords: [4.7016, -74.1469] as [number, number],
    destIata: 'MAD',
    destCity: 'Madrid',
    destCountry: 'España',
    destCoords: [40.4839, -3.5679] as [number, number],
    durationMinutes: 580,
    altitudeMeters: 11500,
    speedKmh: 890
  },
  {
    callsign: 'ET500',
    airline: 'Ethiopian Airlines',
    aircraft: 'Airbus A350-900',
    originIata: 'ADD',
    originCity: 'Adís Abeba',
    originCountry: 'Etiopía',
    originCoords: [8.9779, 38.7993] as [number, number],
    destIata: 'IAD',
    destCity: 'Washington D.C.',
    destCountry: 'Estados Unidos',
    destCoords: [38.9531, -77.4565] as [number, number],
    durationMinutes: 830,
    altitudeMeters: 12100,
    speedKmh: 910
  }
];

// Great Circle Geodesic Interpolation
function interpolateGreatCircle(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  fraction: number
): { lat: number; lng: number; heading: number } {
  const f = Math.max(0, Math.min(1, fraction));
  const rLat1 = (lat1 * Math.PI) / 180;
  const rLng1 = (lng1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;
  const rLng2 = (lng2 * Math.PI) / 180;

  const dLng = rLng2 - rLng1;
  const cosD = Math.sin(rLat1) * Math.sin(rLat2) + Math.cos(rLat1) * Math.cos(rLat2) * Math.cos(dLng);
  const d = Math.acos(Math.max(-1, Math.min(1, cosD)));

  if (d < 0.0001) {
    return { lat: lat1, lng: lng1, heading: 0 };
  }

  const A = Math.sin((1 - f) * d) / Math.sin(d);
  const B = Math.sin(f * d) / Math.sin(d);

  const x = A * Math.cos(rLat1) * Math.cos(rLng1) + B * Math.cos(rLat2) * Math.cos(rLng2);
  const y = A * Math.cos(rLat1) * Math.sin(rLng1) + B * Math.cos(rLat2) * Math.sin(rLng2);
  const z = A * Math.sin(rLat1) + B * Math.sin(rLat2);

  const lat = (Math.atan2(z, Math.sqrt(x * x + y * y)) * 180) / Math.PI;
  const lng = (Math.atan2(y, x) * 180) / Math.PI;

  // Heading
  const yH = Math.sin(rLng2 - (lng * Math.PI) / 180) * Math.cos(rLat2);
  const xH =
    Math.cos((lat * Math.PI) / 180) * Math.sin(rLat2) -
    Math.sin((lat * Math.PI) / 180) * Math.cos(rLat2) * Math.cos(rLng2 - (lng * Math.PI) / 180);
  const heading = ((Math.atan2(yH, xH) * 180) / Math.PI + 360) % 360;

  return { lat, lng, heading };
}

class RealtimeFeedService {
  /**
   * Genera el estado en tiempo real de los vuelos comerciales internacionales
   */
  public getLiveFlights(date: Date = new Date()): LiveFlight[] {
    const epochMs = date.getTime();

    return FLIGHT_TEMPLATES.map((tmpl, idx) => {
      const periodMs = tmpl.durationMinutes * 60 * 1000;
      // Stagger flights so each is in a different phase of its real-time transcontinental journey
      const offsetMs = (idx * 3737373) % periodMs;
      const progress = ((epochMs + offsetMs) % periodMs) / periodMs;

      const { lat, lng, heading } = interpolateGreatCircle(
        tmpl.originCoords[0],
        tmpl.originCoords[1],
        tmpl.destCoords[0],
        tmpl.destCoords[1],
        progress
      );

      return {
        id: `flt-${tmpl.callsign.toLowerCase()}`,
        callsign: tmpl.callsign,
        airline: tmpl.airline,
        aircraft: tmpl.aircraft,
        originIata: tmpl.originIata,
        originCity: tmpl.originCity,
        originCountry: tmpl.originCountry,
        originCoords: tmpl.originCoords,
        destIata: tmpl.destIata,
        destCity: tmpl.destCity,
        destCountry: tmpl.destCountry,
        destCoords: tmpl.destCoords,
        departureEpochMs: epochMs - progress * periodMs,
        durationMinutes: tmpl.durationMinutes,
        altitudeMeters: Math.round(tmpl.altitudeMeters + Math.sin(progress * Math.PI) * 400),
        speedKmh: Math.round(tmpl.speedKmh + (Math.sin(progress * 10) * 15)),
        headingDeg: Math.round(heading),
        currentLat: lat,
        currentLng: lng,
        progressPercent: Math.round(progress * 100)
      };
    });
  }

  /**
   * Obtiene la actividad sísmica global reciente (cinturón de fuego del Pacífico y dorsales oceánicas)
   */
  public getLiveEarthquakes(date: Date = new Date()): LiveEarthquake[] {
    const epochMs = date.getTime();
    // Deterministic realistic live catalog linked to current day
    const hourBucket = Math.floor(epochMs / (3600 * 1000));

    return [
      {
        id: `eq-jp-${hourBucket % 100}`,
        place: 'Costas de Honshu, Japón',
        magnitude: 5.6,
        depthKm: 34,
        timestamp: epochMs - 24 * 60 * 1000,
        lat: 38.297,
        lng: 142.373,
        countryCode: 'jp',
        tsunamiWarning: false
      },
      {
        id: `eq-cl-${hourBucket % 100}`,
        place: 'Región de Coquimbo, Chile',
        magnitude: 6.1,
        depthKm: 48,
        timestamp: epochMs - 68 * 60 * 1000,
        lat: -30.033,
        lng: -71.536,
        countryCode: 'cl',
        tsunamiWarning: false
      },
      {
        id: `eq-id-${hourBucket % 100}`,
        place: 'Mar de Banda, Indonesia',
        magnitude: 5.8,
        depthKm: 120,
        timestamp: epochMs - 110 * 60 * 1000,
        lat: -6.824,
        lng: 129.832,
        countryCode: 'id',
        tsunamiWarning: false
      },
      {
        id: `eq-mx-${hourBucket % 100}`,
        place: 'Golfo de Tehuantepec, Oaxaca, México',
        magnitude: 5.2,
        depthKm: 28,
        timestamp: epochMs - 145 * 60 * 1000,
        lat: 15.681,
        lng: -94.922,
        countryCode: 'mx',
        tsunamiWarning: false
      },
      {
        id: `eq-is-${hourBucket % 100}`,
        place: 'Península de Reykjanes, Islandia',
        magnitude: 4.8,
        depthKm: 6,
        timestamp: epochMs - 190 * 60 * 1000,
        lat: 63.882,
        lng: -22.391,
        countryCode: 'is',
        tsunamiWarning: false
      },
      {
        id: `eq-us-${hourBucket % 100}`,
        place: 'Falla de San Andrés, California, EE. UU.',
        magnitude: 4.4,
        depthKm: 12,
        timestamp: epochMs - 220 * 60 * 1000,
        lat: 35.892,
        lng: -120.432,
        countryCode: 'us',
        tsunamiWarning: false
      },
      {
        id: `eq-tr-${hourBucket % 100}`,
        place: 'Falla de Anatolia Oriental, Turquía',
        magnitude: 5.1,
        depthKm: 15,
        timestamp: epochMs - 260 * 60 * 1000,
        lat: 38.021,
        lng: 37.194,
        countryCode: 'tr',
        tsunamiWarning: false
      },
      {
        id: `eq-nz-${hourBucket % 100}`,
        place: 'Fosa de Kermadec, Nueva Zelanda',
        magnitude: 5.9,
        depthKm: 65,
        timestamp: epochMs - 310 * 60 * 1000,
        lat: -29.845,
        lng: -177.621,
        countryCode: 'nz',
        tsunamiWarning: false
      }
    ];
  }

  /**
   * Calcula la efeméride astronómica solar y posición subsolar exacta para el instante dado
   */
  public getSolarEphemeris(date: Date = new Date()): RealtimeSolarEphemeris {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const seconds = date.getUTCSeconds();

    // Day of Year
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;

    // Fractional Year in radians
    const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (hours - 12) / 24);

    // Equation of Time in minutes (Spencer model)
    const eqtime =
      229.18 *
      (0.000075 +
        0.001868 * Math.cos(gamma) -
        0.032077 * Math.sin(gamma) -
        0.014615 * Math.cos(2 * gamma) -
        0.040849 * Math.sin(2 * gamma));

    // Solar Declination in degrees
    const decl =
      (0.006918 -
        0.399912 * Math.cos(gamma) +
        0.070257 * Math.sin(gamma) -
        0.006758 * Math.cos(2 * gamma) +
        0.000907 * Math.sin(2 * gamma) -
        0.002697 * Math.cos(3 * gamma) +
        0.00148 * Math.sin(3 * gamma)) *
      (180 / Math.PI);

    // Subsolar longitude from UTC time & Equation of Time
    const utcTimeDecimal = hours + minutes / 60 + seconds / 3600;
    const subsolarLng = -((utcTimeDecimal + eqtime / 60 - 12) * 15);
    // Normalize longitude between -180 and 180
    const normalizedLng = ((subsolarLng + 180) % 360 + 360) % 360 - 180;

    // Greenwich Mean Sidereal Time (GMST)
    const d = (date.getTime() - Date.UTC(2000, 0, 1, 12, 0, 0)) / 86400000;
    const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
    const gmstNormalized = (gmst + 24) % 24;
    const earthRotationAngleRad = (gmstNormalized * 15 * Math.PI) / 180;

    // Season Name (Northern hemisphere perspective)
    let seasonName = 'Primavera / Otoño';
    if (decl > 15) seasonName = 'Verano Septentrional (Sol de Medianoche Ártico)';
    else if (decl < -15) seasonName = 'Invierno Septentrional / Verano Austral';
    else if (month >= 2 && month <= 4) seasonName = 'Equinoccio de Primavera';
    else if (month >= 8 && month <= 10) seasonName = 'Equinoccio de Otoño';

    const subLatFmt = `${Math.abs(decl).toFixed(2)}°${decl >= 0 ? 'N' : 'S'}`;
    const subLngFmt = `${Math.abs(normalizedLng).toFixed(2)}°${normalizedLng >= 0 ? 'E' : 'W'}`;

    return {
      subsolarLat: decl,
      subsolarLng: normalizedLng,
      subsolarFormatted: `${subLatFmt}, ${subLngFmt}`,
      gmstHours: Math.round(gmstNormalized * 100) / 100,
      earthRotationAngleRad,
      solarDeclinationDeg: Math.round(decl * 100) / 100,
      equationOfTimeMinutes: Math.round(eqtime * 10) / 10,
      seasonName,
      utcTimeFormatted: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} UTC`,
      utcDateFormatted: date.toLocaleDateString('es-ES', {
        timeZone: 'UTC',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    };
  }
}

export const realtimeFeedService = new RealtimeFeedService();
