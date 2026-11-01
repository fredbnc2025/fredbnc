import * as topojson from 'topojson-client';
import type { Topology, Objects } from 'topojson-specification';
import countries50m from 'world-atlas/countries-50m.json';
import land50m from 'world-atlas/land-50m.json';
import { FeatureCollection, Geometry, MultiLineString } from 'geojson';
import { geoCentroid, geoArea } from 'd3-geo';

// Accurate mainland focal centroids for countries with disparate overseas territories
const CENTROID_OVERRIDES: Record<string, [number, number]> = {
  us: [-98.5795, 39.8283],  // US Continental Mainland
  ca: [-106.3468, 56.1304], // Canada
  mx: [-102.5528, 23.6345], // Mexico
  br: [-51.9253, -14.2350], // Brazil
  ar: [-63.6167, -38.4161], // Argentina
  cl: [-71.5430, -35.6751], // Chile
  pe: [-75.0152, -9.1900],  // Peru
  co: [-74.2973, 4.5709],   // Colombia
  ve: [-66.5897, 6.4238],   // Venezuela
  ec: [-78.1834, -1.8312],  // Ecuador
  bo: [-64.6887, -16.2902], // Bolivia
  py: [-58.4438, -23.4425], // Paraguay
  uy: [-55.7658, -32.5228], // Uruguay
  cu: [-77.7812, 21.5218],  // Cuba
  do: [-70.1627, 18.7357],  // Dominican Republic
  ht: [-72.2852, 18.9712],  // Haiti
  gt: [-90.2308, 15.7835],  // Guatemala
  hn: [-86.2419, 15.2000],  // Honduras
  ni: [-85.2072, 12.8654],  // Nicaragua
  cr: [-83.7534, 9.7489],   // Costa Rica
  pa: [-80.7821, 8.5380],   // Panama
  fr: [2.2137, 46.2276],    // Metropolitan France
  es: [-3.7492, 40.4637],   // Spain
  pt: [-8.2245, 39.3999],   // Portugal
  gb: [-2.2446, 54.5000],   // United Kingdom
  de: [10.4515, 51.1657],   // Germany
  it: [12.5674, 41.8719],   // Italy
  ru: [95.0000, 60.0000],   // Russia Heart
  cn: [104.1954, 35.8617],  // China
  in: [78.9629, 20.5937],   // India
  jp: [138.2529, 36.2048],  // Japan
  au: [133.7751, -25.2744], // Australia
  nz: [174.8860, -40.9006], // New Zealand
  za: [22.9375, -30.5595],  // South Africa
  eg: [30.8025, 26.8206],   // Egypt
  ng: [8.6753, 9.0820],     // Nigeria
  no: [8.4689, 60.4720],    // Norway mainland
  gl: [-42.6043, 71.7069]   // Greenland
};

// ISO 3166-1 Numeric code to Alpha-2 code mapping table
export const NUMERIC_TO_ALPHA2: Record<string, string> = {
  '004': 'af', '008': 'al', '012': 'dz', '020': 'ad', '024': 'ao', '028': 'ag',
  '032': 'ar', '051': 'am', '036': 'au', '040': 'at', '031': 'az', '044': 'bs',
  '048': 'bh', '050': 'bd', '052': 'bb', '112': 'by', '056': 'be', '084': 'bz',
  '204': 'bj', '064': 'bt', '068': 'bo', '070': 'ba', '072': 'bw', '076': 'br',
  '096': 'bn', '100': 'bg', '854': 'bf', '108': 'bi', '116': 'kh', '120': 'cm',
  '124': 'ca', '132': 'cv', '140': 'cf', '148': 'td', '152': 'cl', '156': 'cn',
  '170': 'co', '174': 'km', '178': 'cg', '180': 'cd', '188': 'cr', '384': 'ci',
  '191': 'hr', '192': 'cu', '196': 'cy', '203': 'cz', '208': 'dk', '262': 'dj',
  '212': 'dm', '214': 'do', '218': 'ec', '818': 'eg', '222': 'sv', '226': 'gq',
  '232': 'er', '233': 'ee', '748': 'sz', '231': 'et', '238': 'fk', '242': 'fj',
  '246': 'fi', '250': 'fr', '254': 'gf', '258': 'pf', '266': 'ga', '270': 'gm',
  '268': 'ge', '276': 'de', '288': 'gh', '292': 'gi', '300': 'gr', '304': 'gl',
  '308': 'gd', '312': 'gp', '316': 'gu', '320': 'gt', '324': 'gn', '624': 'gw',
  '328': 'gy', '332': 'ht', '340': 'hn', '348': 'hu', '352': 'is', '356': 'in',
  '360': 'id', '364': 'ir', '368': 'iq', '372': 'ie', '376': 'il', '380': 'it',
  '388': 'jm', '392': 'jp', '400': 'jo', '398': 'kz', '404': 'ke', '296': 'ki',
  '408': 'kp', '410': 'kr', '414': 'kw', '417': 'kg', '418': 'la', '428': 'lv',
  '422': 'lb', '426': 'ls', '430': 'lr', '434': 'ly', '438': 'li', '440': 'lt',
  '442': 'lu', '450': 'mg', '454': 'mw', '458': 'my', '462': 'mv', '466': 'ml',
  '470': 'mt', '584': 'mh', '474': 'mq', '478': 'mr', '480': 'mu', '175': 'yt',
  '484': 'mx', '583': 'fm', '498': 'md', '492': 'mc', '496': 'mn', '499': 'me',
  '500': 'ms', '504': 'ma', '508': 'mz', '104': 'mm', '516': 'na', '520': 'nr',
  '524': 'np', '528': 'nl', '540': 'nc', '554': 'nz', '558': 'ni', '562': 'ne',
  '566': 'ng', '570': 'nu', '574': 'nf', '807': 'mk', '580': 'mp', '578': 'no',
  '512': 'om', '586': 'pk', '585': 'pw', '275': 'ps', '591': 'pa', '598': 'pg',
  '600': 'py', '604': 'pe', '608': 'ph', '612': 'pn', '616': 'pl', '620': 'pt',
  '630': 'pr', '634': 'qa', '638': 're', '642': 'ro', '643': 'ru', '646': 'rw',
  '652': 'bl', '654': 'sh', '659': 'kn', '662': 'lc', '663': 'mf', '666': 'pm',
  '670': 'vc', '882': 'ws', '674': 'sm', '678': 'st', '682': 'sa', '686': 'sn',
  '688': 'rs', '690': 'sc', '694': 'sl', '702': 'sg', '534': 'sx', '703': 'sk',
  '705': 'si', '090': 'sb', '706': 'so', '710': 'za', '239': 'gs', '728': 'ss',
  '724': 'es', '144': 'lk', '729': 'sd', '740': 'sr', '744': 'sj', '752': 'se',
  '756': 'ch', '760': 'sy', '762': 'tj', '834': 'tz', '764': 'th', '626': 'tl',
  '768': 'tg', '772': 'tk', '776': 'to', '780': 'tt', '788': 'tn', '792': 'tr',
  '795': 'tm', '796': 'tc', '798': 'tv', '800': 'ug', '804': 'ua', '784': 'ae',
  '826': 'gb', '840': 'us', '858': 'uy', '860': 'uz', '548': 'vu', '336': 'va',
  '862': 've', '704': 'vn', '092': 'vg', '850': 'vi', '876': 'wf', '732': 'eh',
  '887': 'ye', '894': 'zm', '716': 'zw',
  // Additional Territories & Dependencies Mappings
  '016': 'as', '086': 'io', '660': 'ai', '136': 'ky', '060': 'bm', '832': 'je',
  '831': 'gg', '833': 'im', '158': 'tw', '184': 'ck', '533': 'aw', '531': 'cw',
  '260': 'tf', '248': 'ax', '234': 'fo', '446': 'mo', '344': 'hk', '334': 'hm',
  '010': 'aq'
};

class GeoDataService {
  private countriesGeoJSON: FeatureCollection<Geometry> | null = null;
  private safeCountriesGeoJSON: FeatureCollection<Geometry> | null = null;
  private landGeoJSON: FeatureCollection<Geometry> | null = null;
  private allBoundariesMesh: MultiLineString | null = null;
  private safeBoundariesMesh: MultiLineString | null = null;
  private internalBordersMesh: MultiLineString | null = null;
  private coastlinesMesh: MultiLineString | null = null;
  private centroidsMap: Map<string, [number, number]> = new Map();
  private featuresByAlpha2: Map<string, FeatureCollection<Geometry>['features'][0]> = new Map();
  private focalFeaturesByAlpha2: Map<string, FeatureCollection<Geometry>['features'][0]> = new Map();

  public getCountriesGeoJSON(): FeatureCollection<Geometry> {
    if (!this.countriesGeoJSON) {
      const topology = countries50m as unknown as Topology<Objects>;
      const geojson = topojson.feature(topology, topology.objects.countries) as FeatureCollection<Geometry>;
      const extraFeatures: FeatureCollection<Geometry>['features'] = [];
      
      // Attach alpha-2 code to properties & compute precise polygon centroids
      geojson.features.forEach((feature) => {
        const numericId = String(feature.id).padStart(3, '0');
        let alpha2 = NUMERIC_TO_ALPHA2[numericId] || '';
        
        // Name-based fallbacks for features with undefined ID
        if (!alpha2 && (feature.properties as any)?.name) {
          const name = (feature.properties as any).name;
          if (name === 'Kosovo') alpha2 = 'xk';
          else if (name === 'Somaliland') alpha2 = 'so';
          else if (name === 'N. Cyprus') alpha2 = 'cy';
          else if (name === 'Indian Ocean Ter.') alpha2 = 'io';
        }

        if (!feature.properties) feature.properties = {};
        feature.properties.alpha2 = alpha2;
        feature.properties.numericId = numericId;

        if (alpha2) {
          const existing = this.featuresByAlpha2.get(alpha2);
          if (!existing || geoArea(feature) > geoArea(existing)) {
            this.featuresByAlpha2.set(alpha2, feature);
          }

          // Save primary focal feature for mainland (filtering out disparate overseas territories for zoom/fitting)
          if (feature.geometry.type === 'MultiPolygon') {
            const coords = (feature.geometry as any).coordinates;
            if (alpha2 === 'fr') {
              // Metropolitan France is polygon index 1 and 0 (Corsica)
              const metroCoords = [coords[0], coords[1], coords[2]].filter(Boolean);
              this.focalFeaturesByAlpha2.set(alpha2, {
                type: 'Feature',
                id: '250-metro',
                properties: { ...feature.properties, alpha2: 'fr', name: 'France Metropolitaine' },
                geometry: { type: 'MultiPolygon', coordinates: metroCoords }
              });

              // Extract French Guiana (index 9)
              if (coords[9]) {
                const gfFeat: any = {
                  type: 'Feature',
                  id: '254',
                  properties: { alpha2: 'gf', name: 'Guayana Francesa' },
                  geometry: { type: 'Polygon', coordinates: coords[9] }
                };
                extraFeatures.push(gfFeat);
                this.featuresByAlpha2.set('gf', gfFeat);
                this.focalFeaturesByAlpha2.set('gf', gfFeat);
              }

              // Extract Martinique (index 5)
              if (coords[5]) {
                const mqFeat: any = {
                  type: 'Feature',
                  id: '474',
                  properties: { alpha2: 'mq', name: 'Martinica' },
                  geometry: { type: 'Polygon', coordinates: coords[5] }
                };
                extraFeatures.push(mqFeat);
                this.featuresByAlpha2.set('mq', mqFeat);
                this.focalFeaturesByAlpha2.set('mq', mqFeat);
              }

              // Extract Guadeloupe (indices 6, 7, 8)
              if (coords[6] && coords[7]) {
                const gpFeat: any = {
                  type: 'Feature',
                  id: '312',
                  properties: { alpha2: 'gp', name: 'Guadalupe' },
                  geometry: { type: 'MultiPolygon', coordinates: [coords[6], coords[7], coords[8]].filter(Boolean) }
                };
                extraFeatures.push(gpFeat);
                this.featuresByAlpha2.set('gp', gpFeat);
                this.focalFeaturesByAlpha2.set('gp', gpFeat);
              }

              // Extract Réunion (index 4)
              if (coords[4]) {
                const reFeat: any = {
                  type: 'Feature',
                  id: '638',
                  properties: { alpha2: 're', name: 'Reunión' },
                  geometry: { type: 'Polygon', coordinates: coords[4] }
                };
                extraFeatures.push(reFeat);
                this.featuresByAlpha2.set('re', reFeat);
                this.focalFeaturesByAlpha2.set('re', reFeat);
              }

              // Extract Mayotte (index 3)
              if (coords[3]) {
                const ytFeat: any = {
                  type: 'Feature',
                  id: '175',
                  properties: { alpha2: 'yt', name: 'Mayotte' },
                  geometry: { type: 'Polygon', coordinates: coords[3] }
                };
                extraFeatures.push(ytFeat);
                this.featuresByAlpha2.set('yt', ytFeat);
                this.focalFeaturesByAlpha2.set('yt', ytFeat);
              }
            } else if (alpha2 === 'us') {
              // Continental USA (mainland 48 states is polygon index 75)
              if (coords[75]) {
                this.focalFeaturesByAlpha2.set(alpha2, {
                  type: 'Feature',
                  id: '840-main',
                  properties: { ...feature.properties, alpha2: 'us' },
                  geometry: { type: 'Polygon', coordinates: coords[75] }
                });
              }
            } else if (alpha2 === 'no') {
              // Mainland Norway is polygon index 0..21
              if (coords[0]) {
                const mainlandPolys = coords.slice(0, 22);
                this.focalFeaturesByAlpha2.set(alpha2, {
                  type: 'Feature',
                  id: '578-main',
                  properties: { ...feature.properties, alpha2: 'no' },
                  geometry: { type: 'MultiPolygon', coordinates: mainlandPolys }
                });

                // Extract Svalbard and Jan Mayen (indices 22..31)
                const svalbardPolys = coords.slice(22);
                if (svalbardPolys.length > 0) {
                  const sjFeat: any = {
                    type: 'Feature',
                    id: '744',
                    properties: { alpha2: 'sj', name: 'Svalbard y Jan Mayen' },
                    geometry: { type: 'MultiPolygon', coordinates: svalbardPolys }
                  };
                  extraFeatures.push(sjFeat);
                  this.featuresByAlpha2.set('sj', sjFeat);
                  this.focalFeaturesByAlpha2.set('sj', sjFeat);
                  this.centroidsMap.set('sj', [15.6353, 78.2232]);
                }
              }
            }
          }

          if (CENTROID_OVERRIDES[alpha2]) {
            this.centroidsMap.set(alpha2, CENTROID_OVERRIDES[alpha2]);
          } else {
            try {
              const centroid = geoCentroid(feature);
              if (centroid && Number.isFinite(centroid[0]) && Number.isFinite(centroid[1])) {
                this.centroidsMap.set(alpha2, centroid);
              }
            } catch {
              // fallback
            }
          }
        }
      });

      // Special high-definition vector geometries for microstates and dependencies
      const SPECIAL_TERRITORIES: Record<string, { lat: number; lng: number; radius: number; points: [number, number][] }> = {
        gi: {
          lat: 36.1408,
          lng: -5.3536,
          radius: 0.03,
          points: [
            [-5.368, 36.158], [-5.340, 36.158], [-5.337, 36.142], [-5.342, 36.120],
            [-5.348, 36.110], [-5.356, 36.115], [-5.362, 36.135], [-5.368, 36.158]
          ]
        },
        tv: {
          lat: -7.1095,
          lng: 177.6493,
          radius: 0.05,
          points: [
            [177.620, -7.080], [177.660, -7.090], [177.670, -7.130],
            [177.640, -7.145], [177.610, -7.120], [177.620, -7.080]
          ]
        },
        tk: {
          lat: -9.2002,
          lng: -171.8484,
          radius: 0.04,
          points: [
            [-171.860, -9.180], [-171.830, -9.190], [-171.825, -9.220],
            [-171.850, -9.230], [-171.870, -9.210], [-171.860, -9.180]
          ]
        },
        cc: {
          lat: -12.1642,
          lng: 96.8710,
          radius: 0.06,
          points: [
            [96.840, -12.140], [96.900, -12.150], [96.910, -12.190],
            [96.860, -12.200], [96.830, -12.170], [96.840, -12.140]
          ]
        },
        cx: {
          lat: -10.4475,
          lng: 105.6904,
          radius: 0.06,
          points: [
            [105.650, -10.420], [105.730, -10.430], [105.740, -10.480],
            [105.680, -10.500], [105.640, -10.460], [105.650, -10.420]
          ]
        },
        bq: {
          lat: 12.1784,
          lng: -68.2385,
          radius: 0.08,
          points: [
            [-68.280, 12.220], [-68.220, 12.210], [-68.190, 12.150],
            [-68.240, 12.120], [-68.300, 12.160], [-68.280, 12.220]
          ]
        },
        bv: {
          lat: -54.4208,
          lng: 3.3464,
          radius: 0.06,
          points: [
            [3.310, -54.400], [3.370, -54.410], [3.390, -54.440],
            [3.340, -54.450], [3.300, -54.430], [3.310, -54.400]
          ]
        }
      };

      Object.entries(SPECIAL_TERRITORIES).forEach(([alpha, data]) => {
        if (!this.featuresByAlpha2.has(alpha)) {
          const specFeat: any = {
            type: 'Feature',
            id: `spec-${alpha}`,
            properties: { alpha2: alpha },
            geometry: {
              type: 'Polygon',
              coordinates: [data.points]
            }
          };
          extraFeatures.push(specFeat);
          this.featuresByAlpha2.set(alpha, specFeat);
          this.focalFeaturesByAlpha2.set(alpha, specFeat);
          this.centroidsMap.set(alpha, [data.lng, data.lat]);
        }
      });

      if (extraFeatures.length > 0) {
        geojson.features.push(...extraFeatures);
      }

      this.countriesGeoJSON = geojson;
    }
    return this.countriesGeoJSON;
  }

  /**
   * Topologically unified boundary mesh containing all national borders and coastlines with 0 duplicate lines.
   */
  public getAllBoundariesMesh(): MultiLineString {
    if (!this.allBoundariesMesh) {
      const topology = countries50m as unknown as Topology<Objects>;
      this.allBoundariesMesh = topojson.mesh(topology, topology.objects.countries) as MultiLineString;
    }
    return this.allBoundariesMesh;
  }

  /**
   * Antimeridian-Safe Boundary Mesh with line segments split cleanly at 180°/-180° longitude.
   * Completely eliminates horizontal artifacts across Alaska, Russia, and the Pacific.
   */
  public getAntimeridianSafeBoundariesMesh(): MultiLineString {
    if (!this.safeBoundariesMesh) {
      const rawMesh = this.getAllBoundariesMesh();
      const safeLines: number[][][] = [];

      rawMesh.coordinates.forEach((line: number[][]) => {
        let current: number[][] = [];
        for (let i = 0; i < line.length; i++) {
          const pt = line[i];
          if (!Array.isArray(pt) || !Number.isFinite(pt[0]) || !Number.isFinite(pt[1])) continue;
          if (current.length > 0) {
            const prev = current[current.length - 1];
            if (Math.abs(pt[0] - prev[0]) > 180) {
              if (current.length >= 2) safeLines.push(current);
              current = [pt];
              continue;
            }
          }
          current.push(pt);
        }
        if (current.length >= 2) safeLines.push(current);
      });

      this.safeBoundariesMesh = {
        type: 'MultiLineString',
        coordinates: safeLines
      };
    }
    return this.safeBoundariesMesh;
  }

  /**
   * Antimeridian-Safe Countries GeoJSON with line rings split cleanly at 180°/-180° longitude.
   * Perfect for 2D Leaflet map overlays without horizontal lines.
   */
  public getAntimeridianSafeCountriesGeoJSON(): FeatureCollection<Geometry> {
    if (!this.safeCountriesGeoJSON) {
      const raw = this.getCountriesGeoJSON();
      const cutRing = (ring: number[][]): number[][][] => {
        const parts: number[][][] = [];
        let cur: number[][] = [];
        for (let i = 0; i < ring.length; i++) {
          const pt = ring[i];
          if (!Array.isArray(pt) || !Number.isFinite(pt[0]) || !Number.isFinite(pt[1])) continue;
          if (cur.length > 0) {
            const prev = cur[cur.length - 1];
            if (Math.abs(pt[0] - prev[0]) > 180) {
              if (cur.length >= 2) parts.push(cur);
              cur = [pt];
              continue;
            }
          }
          cur.push(pt);
        }
        if (cur.length >= 2) parts.push(cur);
        return parts;
      };

      const safeFeatures = raw.features.map((f, idx) => {
        const geom = f.geometry as any;
        const lines: number[][][] = [];

        if (geom && geom.type === 'Polygon') {
          geom.coordinates.forEach((ring: any) => {
            if (Array.isArray(ring)) {
              cutRing(ring).forEach(p => {
                if (p.length >= 2) lines.push(p);
              });
            }
          });
        } else if (geom && geom.type === 'MultiPolygon') {
          geom.coordinates.forEach((poly: any) => {
            if (Array.isArray(poly)) {
              poly.forEach((ring: any) => {
                if (Array.isArray(ring)) {
                  cutRing(ring).forEach(p => {
                    if (p.length >= 2) lines.push(p);
                  });
                }
              });
            }
          });
        }

        return {
          type: 'Feature' as const,
          id: f.id || `safe-feat-${idx}`,
          properties: f.properties,
          geometry: {
            type: 'MultiLineString' as const,
            coordinates: lines
          }
        };
      });

      this.safeCountriesGeoJSON = {
        type: 'FeatureCollection',
        features: safeFeatures
      };
    }
    return this.safeCountriesGeoJSON;
  }

  /**
   * Topologically unified internal borders between neighboring nations.
   */
  public getInternalBordersMesh(): MultiLineString {
    if (!this.internalBordersMesh) {
      const topology = countries50m as unknown as Topology<Objects>;
      this.internalBordersMesh = topojson.mesh(
        topology,
        topology.objects.countries,
        (a: any, b: any) => a !== b
      ) as MultiLineString;
    }
    return this.internalBordersMesh;
  }

  /**
   * Topologically unified external coastlines.
   */
  public getCoastlinesMesh(): MultiLineString {
    if (!this.coastlinesMesh) {
      const topology = countries50m as unknown as Topology<Objects>;
      this.coastlinesMesh = topojson.mesh(
        topology,
        topology.objects.countries,
        (a: any, b: any) => a === b
      ) as MultiLineString;
    }
    return this.coastlinesMesh;
  }

  public getCountryCentroid(alpha2: string): [number, number] | null {
    const key = alpha2.toLowerCase();
    if (CENTROID_OVERRIDES[key]) {
      return CENTROID_OVERRIDES[key];
    }
    if (this.centroidsMap.has(key)) {
      return this.centroidsMap.get(key)!;
    }
    // Ensure GeoJSON is loaded
    this.getCountriesGeoJSON();
    return this.centroidsMap.get(key) || null;
  }

  public getCountryFeature(alpha2: string): FeatureCollection<Geometry>['features'][0] | null {
    const key = alpha2.toLowerCase();
    this.getCountriesGeoJSON();
    return this.featuresByAlpha2.get(key) || null;
  }

  public getFocalFeature(alpha2: string): FeatureCollection<Geometry>['features'][0] | null {
    const key = alpha2.toLowerCase();
    this.getCountriesGeoJSON();
    return this.focalFeaturesByAlpha2.get(key) || this.featuresByAlpha2.get(key) || null;
  }

  public getLandGeoJSON(): FeatureCollection<Geometry> {
    if (!this.landGeoJSON) {
      const topology = land50m as unknown as Topology<Objects>;
      this.landGeoJSON = topojson.feature(topology, topology.objects.land) as FeatureCollection<Geometry>;
    }
    return this.landGeoJSON;
  }
}

export const geoDataService = new GeoDataService();
