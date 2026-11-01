import React, { useMemo, useId, useState } from 'react';
import { Country, PoliticalSubdivision } from '../types';
import { geoMercator, geoOrthographic, geoPath, geoGraticule } from 'd3-geo';
import { geoDataService } from '../services/geoDataService';
import { subdivisionBoundaryService } from '../services/subdivisionBoundaryService';
import { getCountryPoliticalStructure } from '../data/politicalDivisions';
import { COUNTRIES } from '../data/countries';

interface CountryPdfMapProps {
  country: Country;
  theme?: 'light' | 'dark';
  width?: number;
  height?: number;
}

// Harmonious palette for target country subdivisions
const TARGET_SUBDIVISION_PALETTE_LIGHT = [
  '#0284c7', // Sky Blue
  '#0d9488', // Teal
  '#16a34a', // Emerald
  '#d97706', // Amber
  '#ea580c', // Orange
  '#7c3aed', // Purple
  '#2563eb', // Royal Blue
  '#db2777', // Rose
  '#0891b2', // Cyan
  '#4f46e5', // Indigo
  '#ca8a04', // Yellow-gold
  '#059669', // Mint
  '#e11d48', // Crimson
  '#9333ea', // Violet
  '#0369a1'  // Deep Ocean
];

const TARGET_SUBDIVISION_PALETTE_DARK = [
  '#0284c7',
  '#0f766e',
  '#15803d',
  '#b45309',
  '#c2410c',
  '#6d28d9',
  '#1d4ed8',
  '#be185d',
  '#0e7490',
  '#4338ca',
  '#a16207',
  '#047857',
  '#be123c',
  '#7e22ce',
  '#0369a1'
];

// Subtle, elegant muted palette for neighboring countries subdivisions
const NEIGHBOR_SUBDIVISION_PALETTES_LIGHT = [
  ['#cbd5e1', '#e2e8f0', '#94a3b8', '#d1d5db', '#e5e7eb'], // Slate
  ['#dcfce7', '#bbf7d0', '#86efac', '#d1fae5', '#a7f3d0'], // Soft Sage
  ['#fef3c7', '#fde68a', '#fef08a', '#fed7aa', '#ffedd5'], // Soft Warm
  ['#f1f5f9', '#e2e8f0', '#cbd5e1', '#e0e7ff', '#c7d2fe'], // Soft Periwinkle
  ['#ccfbf1', '#99f6e4', '#e0f2fe', '#bae6fd', '#cffafe'], // Soft Cyan
  ['#fce7f3', '#fbcfe8', '#f5d0fe', '#fae8ff', '#ede9fe']  // Soft Lilac
];

const NEIGHBOR_SUBDIVISION_PALETTES_DARK = [
  ['#1e293b', '#334155', '#1e293b', '#27272a', '#3f3f46'],
  ['#064e3b', '#065f46', '#047857', '#022c22', '#0f766e'],
  ['#451a03', '#78350f', '#713f12', '#431407', '#581c87'],
  ['#1e1b4b', '#312e81', '#172554', '#1e3a8a', '#1e293b'],
  ['#164e63', '#155e75', '#0c4a6e', '#082f49', '#134e4a'],
  ['#4c0519', '#701a75', '#581c87', '#3b0764', '#4a044e']
];

export const CountryPdfMap: React.FC<CountryPdfMapProps> = ({
  country,
  theme = 'light',
  width = 710,
  height = 370
}) => {
  const isLight = theme === 'light';
  const rawUid = useId();
  const uid = useMemo(() => rawUid.replace(/[^a-zA-Z0-9_-]/g, '_'), [rawUid]);
  const [hoveredSubdivision, setHoveredSubdivision] = useState<PoliticalSubdivision | null>(null);

  // Get GeoJSON features
  const geojson = useMemo(() => geoDataService.getCountriesGeoJSON(), []);

  // Find target country feature and focal mainland feature
  const countryFeature = useMemo(() => {
    return geoDataService.getCountryFeature(country.id);
  }, [country.id]);

  const focalFeature = useMemo(() => {
    return geoDataService.getFocalFeature(country.id) || countryFeature;
  }, [country.id, countryFeature]);

  // Centroid
  const centroid = useMemo(() => {
    return geoDataService.getCountryCentroid(country.id) || [country.lng, country.lat];
  }, [country.id, country.lat, country.lng]);

  // Main Regional/Country Projection (Mercator centered on target country with auto-fit)
  const countryProjection = useMemo(() => {
    const proj = geoMercator()
      .center(centroid)
      .translate([width / 2, height / 2 + 4]);

    if (focalFeature) {
      try {
        const testPath = geoPath().projection(proj);
        const bounds = testPath.bounds(focalFeature as any);
        if (bounds && Array.isArray(bounds) && bounds.length === 2) {
          const [[x0, y0], [x1, y1]] = bounds;
          const dx = x1 - x0;
          const dy = y1 - y0;
          if (dx > 0 && dy > 0 && Number.isFinite(dx) && Number.isFinite(dy)) {
            const padX = Math.max(32, width * 0.12);
            const padY = Math.max(28, height * 0.12);
            const maxW = width - padX * 2;
            const maxH = height - padY * 2;
            const scaleFactor = Math.min(maxW / dx, maxH / dy);
            const currentScale = proj.scale();
            const newScale = Math.max(40, Math.min(currentScale * scaleFactor, 32000));
            proj.scale(newScale);

            const updatedBounds = geoPath().projection(proj).bounds(focalFeature as any);
            const midX = (updatedBounds[0][0] + updatedBounds[1][0]) / 2;
            const midY = (updatedBounds[0][1] + updatedBounds[1][1]) / 2;
            const shiftX = width / 2 - midX;
            const shiftY = (height / 2 + 4) - midY;
            proj.translate([width / 2 + shiftX, height / 2 + 4 + shiftY]);
            return proj;
          }
        }
      } catch {
        // fallback
      }
    }

    let scale = 320;
    // Scale heuristic based on areaKm2 and aspect ratio
    if (country.areaKm2 > 8000000) scale = 140;
    else if (country.areaKm2 > 4000000) scale = 190;
    else if (country.areaKm2 > 1500000) scale = 320;
    else if (country.areaKm2 > 500000) scale = 580;
    else if (country.areaKm2 > 200000) scale = 950;
    else if (country.areaKm2 > 50000) scale = 1600;
    else if (country.areaKm2 > 10000) scale = 3200;
    else if (country.areaKm2 > 1000) scale = 6500;
    else scale = 12000;

    return geoMercator()
      .center(centroid)
      .scale(scale)
      .translate([width / 2, height / 2 + 6]);
  }, [centroid, focalFeature, country.areaKm2, width, height]);

  const countryPathGen = useMemo(() => geoPath().projection(countryProjection), [countryProjection]);

  // Project point safe helper
  const projectCoords = useMemo(() => {
    return (coords: [number, number]): [number, number] | null => {
      try {
        const pt = countryProjection(coords);
        if (pt && Number.isFinite(pt[0]) && Number.isFinite(pt[1])) {
          return pt;
        }
      } catch {
        // fallback
      }
      return null;
    };
  }, [countryProjection]);

  // Target Country Political Structure & Subdivisions Boundaries
  const targetStructure = useMemo(() => getCountryPoliticalStructure(country), [country]);

  const targetBoundaries = useMemo(() => {
    return subdivisionBoundaryService.generate2DBoundaries(
      country,
      projectCoords,
      [-100, -100, width + 100, height + 100]
    );
  }, [country, projectCoords, width, height]);

  // Target country unique clip path ID
  const targetClipId = `clip-target-${uid}-${country.id.toLowerCase()}`;

  // Target Country SVG Path with high-resolution vector fallback for microstates/islands
  const targetPathD = useMemo(() => {
    if (countryFeature) {
      const d = countryPathGen(countryFeature);
      if (d && d.length > 5) return d;
    }
    // High definition organic territorial/island vector boundary around center
    const cx = width / 2;
    const cy = height / 2 + 6;
    const r = Math.min(width, height) * 0.28;
    const points: [number, number][] = [];
    const total = 18;
    const seed = (country.id.charCodeAt(0) * 17 + (country.id.charCodeAt(1) || 0) * 31);
    for (let i = 0; i < total; i++) {
      const angle = (i / total) * Math.PI * 2;
      const noise = Math.sin(angle * 3 + seed) * 0.18 + Math.cos(angle * 5 + seed * 2) * 0.12;
      const rad = r * (0.88 + noise);
      points.push([cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad * 0.82]);
    }
    return 'M ' + points.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L ') + ' Z';
  }, [countryFeature, countryPathGen, width, height, country.id]);

  // Capital city screen position
  const capitalPos = useMemo(() => {
    const pt = projectCoords([country.lng, country.lat]);
    return pt || [width / 2, height / 2];
  }, [projectCoords, country.lat, country.lng, width, height]);

  // Surrounding / Neighboring Countries within viewport and their subdivisions
  const visibleNeighbors = useMemo(() => {
    const results: Array<{
      key: string;
      feature: typeof geojson.features[0];
      country: Country;
      structure: ReturnType<typeof getCountryPoliticalStructure>;
      boundaries: ReturnType<typeof subdivisionBoundaryService.generate2DBoundaries>;
      pathD: string;
      clipId: string;
      screenCentroid: [number, number] | null;
      colorPaletteIdx: number;
    }> = [];

    const targetAlpha = country.id.toLowerCase();
    let neighborIdx = 0;

    geojson.features.forEach((feat, fIdx) => {
      const propAlpha = (feat.properties?.alpha2 || '').toLowerCase();
      if (!propAlpha || propAlpha === targetAlpha) return;

      // Find matching Country object
      const matchedCountry = COUNTRIES.find(
        (c) => c.id.toLowerCase() === propAlpha || c.code3.toLowerCase() === (feat.properties?.alpha3 || '').toLowerCase()
      );
      if (!matchedCountry) return;

      const pathD = countryPathGen(feat);
      if (!pathD) return;

      // Check if feature intersects screen bounds
      let screenCentroid: [number, number] | null = null;
      try {
        const c = countryPathGen.centroid(feat);
        if (c && Number.isFinite(c[0]) && Number.isFinite(c[1])) {
          screenCentroid = [c[0], c[1]];
        }
      } catch {
        // ignore
      }

      // Compute subdivisions for this neighbor country
      const structure = getCountryPoliticalStructure(matchedCountry);
      const boundaries = subdivisionBoundaryService.generate2DBoundaries(
        matchedCountry,
        projectCoords,
        [-150, -150, width + 150, height + 150]
      );

      const uniqueKey = `${matchedCountry.id.toLowerCase()}-${neighborIdx}-${fIdx}`;
      const clipId = `clip-neighbor-${uid}-${uniqueKey}`;

      results.push({
        key: uniqueKey,
        feature: feat,
        country: matchedCountry,
        structure,
        boundaries,
        pathD,
        clipId,
        screenCentroid,
        colorPaletteIdx: neighborIdx % NEIGHBOR_SUBDIVISION_PALETTES_LIGHT.length
      });

      neighborIdx++;
    });

    return results;
  }, [geojson, country.id, countryPathGen, projectCoords, width, height, uid]);

  // World Locator Mini-Globe Projection (Orthographic centered on country)
  const miniGlobeWidth = 72;
  const miniGlobeHeight = 72;
  const globeProjection = useMemo(() => {
    return geoOrthographic()
      .rotate([-centroid[0], -centroid[1]])
      .scale(32)
      .translate([miniGlobeWidth / 2, miniGlobeHeight / 2]);
  }, [centroid]);

  const globePathGen = useMemo(() => geoPath().projection(globeProjection), [globeProjection]);

  // Regional graticule lines
  const graticuleLines = useMemo(() => {
    try {
      const graticule = geoGraticule().step([10, 10]);
      return countryPathGen(graticule()) || '';
    } catch {
      return '';
    }
  }, [countryPathGen]);

  return (
    <div
      className={`relative w-full h-full rounded-xl overflow-hidden border select-none ${
        isLight
          ? 'bg-slate-50 border-slate-300 text-slate-800'
          : 'bg-slate-950 border-slate-800 text-slate-100'
      }`}
      style={{ height: `${height}px` }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full block"
        style={{ background: isLight ? '#e0f2fe' : '#031726' }}
      >
        <defs>
          {/* Ocean Water Linear Gradient */}
          <linearGradient id={`mapOceanGrad-${uid}-${country.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isLight ? '#e0f2fe' : '#081c36'} />
            <stop offset="100%" stopColor={isLight ? '#bae6fd' : '#031726'} />
          </linearGradient>

          {/* Mini Globe Gloss */}
          <radialGradient id={`miniGlobeGlow-${uid}-${country.id}`} cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
          </radialGradient>

          {/* CLIP-PATH: Target Country Main Boundary */}
          <clipPath id={targetClipId}>
            <path d={targetPathD} />
          </clipPath>

          {/* CLIP-PATHS: Each Bordering / Neighboring Country Boundary */}
          {visibleNeighbors.map((nb) => (
            <clipPath key={nb.clipId} id={nb.clipId}>
              <path d={nb.pathD} />
            </clipPath>
          ))}
        </defs>

        {/* 1. Ocean Background */}
        <rect width={width} height={height} fill={`url(#mapOceanGrad-${uid}-${country.id})`} />

        {/* 2. Graticule Lat/Lng Coordinate Grid Lines */}
        {graticuleLines && (
          <path
            d={graticuleLines}
            fill="none"
            stroke={isLight ? '#93c5fd' : '#1e3a8a'}
            strokeWidth="0.5"
            strokeDasharray="2 3"
            strokeOpacity="0.65"
          />
        )}

        {/* 3. NEIGHBORING / BORDERING COUNTRIES DIVIDED INTO SUBDIVISIONS (DEPARTAMENTOS, ESTADOS, PROVINCIAS) */}
        <g id="neighboring-countries-layer">
          {visibleNeighbors.map((nb) => {
            const palette = isLight
              ? NEIGHBOR_SUBDIVISION_PALETTES_LIGHT[nb.colorPaletteIdx]
              : NEIGHBOR_SUBDIVISION_PALETTES_DARK[nb.colorPaletteIdx];

            return (
              <g key={`neighbor-group-${nb.key}`} className="neighbor-country-subdivisions">
                {/* Fallback Land Fill if subdivisions not available */}
                <path
                  d={nb.pathD}
                  fill={isLight ? '#cbd5e1' : '#1e293b'}
                  stroke="none"
                />

                {/* Neighbor Internal Subdivisions (Departamentos / Estados / Provincias) */}
                {nb.boundaries && nb.boundaries.cells.length > 0 && (
                  <g clipPath={`url(#${nb.clipId})`}>
                    {nb.boundaries.cells.map((cell, cIdx) => {
                      if (!cell.cellPath) return null;
                      const cellColor = palette[cIdx % palette.length];
                      return (
                        <path
                          key={`nb-cell-${nb.key}-${cell.subdivision.id || cIdx}`}
                          d={cell.cellPath}
                          fill={cellColor}
                          fillOpacity={isLight ? 0.85 : 0.75}
                          stroke={isLight ? '#94a3b8' : '#475569'}
                          strokeWidth="0.45"
                          strokeLinejoin="round"
                        />
                      );
                    })}

                    {/* Neighbor Internal Dividing Boundary Lines */}
                    {nb.boundaries.dividingLinesPath && (
                      <path
                        d={nb.boundaries.dividingLinesPath}
                        fill="none"
                        stroke={isLight ? '#ffffff' : '#64748b'}
                        strokeWidth="0.6"
                        strokeDasharray="2 2"
                        strokeOpacity={0.8}
                        pointerEvents="none"
                      />
                    )}
                  </g>
                )}

                {/* Neighbor Country Outer Border Outline */}
                <path
                  d={nb.pathD}
                  fill="none"
                  stroke={isLight ? '#64748b' : '#475569'}
                  strokeWidth="0.9"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {/* Neighbor Country Identification Badge & Subdivision Type */}
                {nb.screenCentroid &&
                  nb.screenCentroid[0] >= 35 &&
                  nb.screenCentroid[0] <= width - 35 &&
                  nb.screenCentroid[1] >= 25 &&
                  nb.screenCentroid[1] <= height - 25 && (
                    <g transform={`translate(${nb.screenCentroid[0]}, ${nb.screenCentroid[1]})`}>
                      <rect
                        x="-40"
                        y="-10"
                        width="80"
                        height="18"
                        rx="3.5"
                        fill={isLight ? '#ffffff' : '#0f172a'}
                        fillOpacity="0.92"
                        stroke={isLight ? '#cbd5e1' : '#334155'}
                        strokeWidth="0.6"
                        filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.12))"
                      />
                      <text
                        x="0"
                        y="-1"
                        textAnchor="middle"
                        fill={isLight ? '#1e293b' : '#f1f5f9'}
                        fontSize="6.5"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        {nb.country.nameEs.toUpperCase()}
                      </text>
                      <text
                        x="0"
                        y="5.8"
                        textAnchor="middle"
                        fill={isLight ? '#0284c7' : '#38bdf8'}
                        fontSize="5"
                        fontWeight="600"
                        fontFamily="sans-serif"
                      >
                        {nb.structure.divisionTypeName.split(' ')[0]} ({nb.structure.totalCount})
                      </text>
                    </g>
                  )}
              </g>
            );
          })}
        </g>

        {/* 4. TARGET COUNTRY DIVIDED INTO OFFICIAL SUBDIVISIONS (DEPARTAMENTOS, ESTADOS, PROVINCIAS, REGIONES) */}
        <g id="target-country-subdivisions-layer">
          {/* Target Country Base Fill */}
          <path
            d={targetPathD}
            fill={isLight ? '#0284c7' : '#0369a1'}
            stroke="none"
          />

          {/* Target Country Internal Political Subdivisions */}
          {targetBoundaries && targetBoundaries.cells.length > 0 && (
            <g clipPath={`url(#${targetClipId})`}>
              {/* 4.1. Distinctive Subdivision Polygons */}
              {targetBoundaries.cells.map((cell, cIdx) => {
                if (!cell.cellPath) return null;
                const palette = isLight ? TARGET_SUBDIVISION_PALETTE_LIGHT : TARGET_SUBDIVISION_PALETTE_DARK;
                const cellColor = palette[cIdx % palette.length];
                const isHovered = hoveredSubdivision?.id === cell.subdivision.id;

                return (
                  <path
                    key={`target-cell-${cell.subdivision.id || cIdx}`}
                    d={cell.cellPath}
                    fill={isHovered ? (isLight ? '#38bdf8' : '#0284c7') : cellColor}
                    fillOpacity={isHovered ? 1 : isLight ? 0.92 : 0.88}
                    stroke={isHovered ? '#ffffff' : '#ffffff'}
                    strokeWidth={isHovered ? '2' : '0.8'}
                    strokeLinejoin="round"
                    className="transition-colors duration-150 cursor-pointer"
                    onMouseEnter={() => setHoveredSubdivision(cell.subdivision)}
                    onMouseLeave={() => setHoveredSubdivision(null)}
                  />
                );
              })}

              {/* 4.2. Crisp High-Definition Internal Subdivision Boundary Lines */}
              {targetBoundaries.dividingLinesPath && (
                <path
                  d={targetBoundaries.dividingLinesPath}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity={0.95}
                  pointerEvents="none"
                />
              )}
            </g>
          )}

          {/* 4.3. Target Country Main Outer Sovereign Border Outline (Heavy & Prominent) */}
          <path
            d={targetPathD}
            fill="none"
            stroke={isLight ? '#0369a1' : '#38bdf8'}
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
            filter="drop-shadow(0px 2px 5px rgba(0,0,0,0.25))"
          />

            {/* 4.4. Subdivision Labels & Administrative Capitals (For Main Internal Regions) */}
            {targetBoundaries && targetBoundaries.cells.length > 1 && (
              <g id="target-subdivision-labels" pointerEvents="none">
                {targetBoundaries.cells.map((cell, cIdx) => {
                  const sub = cell.subdivision;
                  const pt = cell.centerPt || projectCoords([sub.lng, sub.lat]);
                  if (!pt || pt[0] < 20 || pt[0] > width - 20 || pt[1] < 20 || pt[1] > height - 20) {
                    return null;
                  }

                  // Capital of country gets special star marker
                  const isCapitalRegion = sub.type.toLowerCase().includes('capital') || sub.capital === country.capitalEs;
                  const isHovered = hoveredSubdivision?.id === sub.id;
                  const nameLen = sub.name.length;
                  const tagW = Math.max(36, Math.min(74, nameLen * 4.9 + 10));

                  return (
                    <g key={`sub-label-${sub.id || cIdx}`} transform={`translate(${pt[0]}, ${pt[1]})`}>
                      {/* Department / State Marker Dot */}
                      <circle
                        r={isCapitalRegion ? 3.8 : isHovered ? 3.5 : 2}
                        fill={isCapitalRegion ? '#ef4444' : isHovered ? '#38bdf8' : '#ffffff'}
                        stroke={isCapitalRegion ? '#ffffff' : '#0f172a'}
                        strokeWidth={0.9}
                      />
                      {/* Clean Responsive Subdivision Name Tag */}
                      <rect
                        x={-tagW / 2}
                        y="-10.5"
                        width={tagW}
                        height="10"
                        rx="2.5"
                        fill={isHovered ? '#0284c7' : isLight ? '#0f172a' : '#ffffff'}
                        fillOpacity={isHovered ? 0.98 : 0.84}
                        stroke={isHovered ? '#ffffff' : 'none'}
                        strokeWidth="0.6"
                      />
                      <text
                        x="0"
                        y="-3.2"
                        textAnchor="middle"
                        fill={isHovered ? '#ffffff' : isLight ? '#ffffff' : '#0f172a'}
                        fontSize="5.2"
                        fontWeight="700"
                        fontFamily="sans-serif"
                      >
                        {sub.name.length > 14 ? sub.name.substring(0, 13) + '…' : sub.name}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </g>

        {/* 5. Capital City Marker with Pin and Glow */}
        {capitalPos && (
          <g transform={`translate(${capitalPos[0]}, ${capitalPos[1]})`}>
            <circle
              r="7.5"
              fill={isLight ? '#ef4444' : '#f87171'}
              fillOpacity="0.28"
              stroke={isLight ? '#dc2626' : '#ef4444'}
              strokeWidth="0.8"
            />
            <circle
              r="3.2"
              fill={isLight ? '#b91c1c' : '#ffffff'}
              stroke="#ffffff"
              strokeWidth="0.9"
            />
            {/* Capital text badge */}
            <rect
              x="6"
              y="-13"
              width={Math.max(50, (country.capitalEs || country.capitalEn || '').length * 6.5 + 10)}
              height="15"
              rx="3"
              fill={isLight ? '#ffffff' : '#0f172a'}
              fillOpacity="0.95"
              stroke={isLight ? '#cbd5e1' : '#334155'}
              strokeWidth="0.7"
              filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.18))"
            />
            <text
              x="10"
              y="-2.5"
              fill={isLight ? '#0f172a' : '#f8fafc'}
              fontSize="8"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              ★ {country.capitalEs || country.capitalEn}
            </text>
          </g>
        )}

        {/* 6. TOP-LEFT: Political Organization Badge (Departamentos / Estados / Provincias) */}
        <g transform="translate(10, 10)">
          <rect
            width="240"
            height="34"
            rx="5"
            fill={isLight ? '#ffffff' : '#0f172a'}
            fillOpacity="0.92"
            stroke={isLight ? '#cbd5e1' : '#334155'}
            strokeWidth="0.75"
            filter="drop-shadow(0px 1px 3px rgba(0,0,0,0.1))"
          />
          <text
            x="8"
            y="13"
            fill={isLight ? '#0284c7' : '#38bdf8'}
            fontSize="7"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            🗺️ DIVISIÓN POLÍTICO-TERRITORIAL
          </text>
          <text
            x="8"
            y="23"
            fill={isLight ? '#0f172a' : '#f8fafc'}
            fontSize="8"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            {targetStructure.countryName}: {targetStructure.totalCount} {targetStructure.divisionTypeName}
          </text>
          <text
            x="8"
            y="30.5"
            fill={isLight ? '#64748b' : '#94a3b8'}
            fontSize="5.8"
            fontFamily="sans-serif"
          >
            Fronteras limítrofes y países vecinos divididos por estados/departamentos
          </text>
        </g>

        {/* 7. TOP-RIGHT: Mini Globe World Locator Inset */}
        <g transform={`translate(${width - miniGlobeWidth - 8}, 8)`}>
          <rect
            x="-4"
            y="-4"
            width={miniGlobeWidth + 8}
            height={miniGlobeHeight + 8}
            rx="6"
            fill={isLight ? '#ffffff' : '#0f172a'}
            fillOpacity="0.9"
            stroke={isLight ? '#cbd5e1' : '#334155'}
            strokeWidth="0.8"
          />
          {/* Globe ocean circle */}
          <circle
            cx={miniGlobeWidth / 2}
            cy={miniGlobeHeight / 2}
            r="32"
            fill={isLight ? '#bae6fd' : '#091e3a'}
            stroke={isLight ? '#0284c7' : '#38bdf8'}
            strokeWidth="0.8"
          />
          {/* Globe land */}
          {geojson.features.map((feat, idx) => {
            const isTarget =
              countryFeature &&
              (feat === countryFeature ||
                feat.properties?.alpha2 === country.id.toLowerCase());
            const d = globePathGen(feat);
            if (!d) return null;
            return (
              <path
                key={`mini-land-${idx}`}
                d={d}
                fill={
                  isTarget
                    ? '#ef4444'
                    : isLight
                    ? '#64748b'
                    : '#334155'
                }
                stroke={isLight ? '#ffffff' : '#1e293b'}
                strokeWidth="0.3"
              />
            );
          })}
          {/* Globe sphere gloss */}
          <circle
            cx={miniGlobeWidth / 2}
            cy={miniGlobeHeight / 2}
            r="32"
            fill={`url(#miniGlobeGlow-${uid}-${country.id})`}
            pointerEvents="none"
          />
          <text
            x={miniGlobeWidth / 2}
            y={miniGlobeHeight + 3}
            textAnchor="middle"
            fill={isLight ? '#64748b' : '#94a3b8'}
            fontSize="5.5"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            UBICACIÓN GLOBAL
          </text>
        </g>

        {/* 8. BOTTOM-LEFT: Compass Rose / Rosa de los Vientos (bajado para evitar interferencia) */}
        <g transform={`translate(22, ${height - 24})`}>
          <circle
            r="12"
            fill={isLight ? '#ffffff' : '#0f172a'}
            fillOpacity="0.9"
            stroke={isLight ? '#cbd5e1' : '#334155'}
            strokeWidth="0.75"
          />
          {/* North needle */}
          <polygon points="0,-10 3,-2 0,0 -3,-2" fill="#ef4444" />
          {/* South needle */}
          <polygon points="0,10 3,2 0,0 -3,2" fill={isLight ? '#64748b' : '#94a3b8'} />
          {/* East needle */}
          <polygon points="10,0 2,3 0,0 2,-3" fill={isLight ? '#94a3b8' : '#64748b'} />
          {/* West needle */}
          <polygon points="-10,0 -2,3 0,0 -2,-3" fill={isLight ? '#94a3b8' : '#64748b'} />
          <circle r="1.5" fill="#ffffff" stroke="#0f172a" strokeWidth="0.6" />
          <text x="0" y="-12" textAnchor="middle" fill="#ef4444" fontSize="5.5" fontWeight="bold">N</text>
          <text x="0" y="16" textAnchor="middle" fill={isLight ? '#64748b' : '#94a3b8'} fontSize="4.8" fontWeight="bold">S</text>
          <text x="16" y="1.5" textAnchor="middle" fill={isLight ? '#64748b' : '#94a3b8'} fontSize="4.8" fontWeight="bold">E</text>
          <text x="-16" y="1.5" textAnchor="middle" fill={isLight ? '#64748b' : '#94a3b8'} fontSize="4.8" fontWeight="bold">O</text>
        </g>

        {/* 9. BOTTOM-RIGHT: Geographic Coordinates & Cartographic Datum Footer Bar */}
        <g transform={`translate(${width - 240}, ${height - 20})`}>
          <rect
            width="232"
            height="14"
            rx="3"
            fill={isLight ? '#ffffff' : '#0f172a'}
            fillOpacity="0.9"
            stroke={isLight ? '#cbd5e1' : '#334155'}
            strokeWidth="0.5"
          />
          <text
            x="6"
            y="9.5"
            fill={isLight ? '#475569' : '#94a3b8'}
            fontSize="6.5"
            fontWeight="600"
            fontFamily="monospace"
          >
            LAT: {Math.abs(country.lat).toFixed(2)}°{country.lat >= 0 ? 'N' : 'S'} | LON: {Math.abs(country.lng).toFixed(2)}°{country.lng >= 0 ? 'E' : 'O'} • WGS84
          </text>
        </g>

        {/* 10. INTERACTIVE SUBDIVISION INSPECTOR BADGE (ON HOVER) */}
        {hoveredSubdivision && (
          <g transform={`translate(${Math.max(10, width / 2 - 130)}, ${height - 48})`} pointerEvents="none">
            <rect
              width="260"
              height="36"
              rx="6"
              fill={isLight ? '#0f172a' : '#020617'}
              fillOpacity="0.95"
              stroke="#38bdf8"
              strokeWidth="1.2"
              filter="drop-shadow(0px 4px 10px rgba(0,0,0,0.5))"
            />
            <text x="12" y="14" fill="#38bdf8" fontSize="8" fontWeight="bold">
              {hoveredSubdivision.badge || '📍'} {hoveredSubdivision.name}
            </text>
            <text x="12" y="24" fill="#e2e8f0" fontSize="6.5">
              {hoveredSubdivision.type} • Cap: {hoveredSubdivision.capital}
            </text>
            <text x="12" y="32" fill="#94a3b8" fontSize="5.5">
              Pob: {hoveredSubdivision.population > 0 ? hoveredSubdivision.population.toLocaleString('es-ES') : 'N/D'} | Sup: {hoveredSubdivision.areaKm2 ? `${hoveredSubdivision.areaKm2.toLocaleString('es-ES')} km²` : 'N/D'}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

