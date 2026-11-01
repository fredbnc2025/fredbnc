import { Delaunay } from 'd3-delaunay';
import { Country, PoliticalSubdivision } from '../types';
import { getCountryPoliticalStructure } from '../data/politicalDivisions';

export interface SubdivisionBoundaryCell {
  subdivision: PoliticalSubdivision;
  country: Country;
  cellPath: string;
  centerPt: [number, number];
  polygonPoints?: [number, number][];
}

export interface CountrySubdivisionBoundaries {
  country: Country;
  dividingLinesPath: string;
  cells: SubdivisionBoundaryCell[];
}

export class SubdivisionBoundaryService {
  /**
   * Generates 2D SVG dividing line paths and interactive cells for a country's subdivisions.
   */
  public generate2DBoundaries(
    country: Country,
    project: (coords: [number, number]) => [number, number] | null,
    bounds: [number, number, number, number] = [-100, -100, 2000, 1200]
  ): CountrySubdivisionBoundaries | null {
    const structure = getCountryPoliticalStructure(country);
    if (!structure || !structure.subdivisions || structure.subdivisions.length === 0) {
      return null;
    }

    const subs = structure.subdivisions;
    const projectedPoints: [number, number][] = [];
    const validSubs: PoliticalSubdivision[] = [];

    subs.forEach((s) => {
      const pt = project([s.lng, s.lat]);
      if (pt && Number.isFinite(pt[0]) && Number.isFinite(pt[1])) {
        projectedPoints.push(pt);
        validSubs.push(s);
      }
    });

    if (validSubs.length === 0) return null;

    // Single subdivision: entire area is one cell, no internal dividing line
    if (validSubs.length === 1) {
      return {
        country,
        dividingLinesPath: '',
        cells: [
          {
            subdivision: validSubs[0],
            country,
            cellPath: '',
            centerPt: projectedPoints[0]
          }
        ]
      };
    }

    try {
      // Calculate local bounding box around projected points
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      projectedPoints.forEach(([x, y]) => {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      });

      const spanX = maxX - minX;
      const spanY = maxY - minY;
      const padX = Math.max(150, spanX * 1.0);
      const padY = Math.max(150, spanY * 1.0);

      const voronoiBounds: [number, number, number, number] = [
        Math.max(bounds[0], minX - padX),
        Math.max(bounds[1], minY - padY),
        Math.min(bounds[2], maxX + padX),
        Math.min(bounds[3], maxY + padY)
      ];

      const flatPoints = projectedPoints.flat();
      const delaunay = new Delaunay(flatPoints);
      const voronoi = delaunay.voronoi(voronoiBounds);

      const cells: SubdivisionBoundaryCell[] = [];
      const lineSegments: Array<[[number, number], [number, number]]> = [];
      const processedEdges = new Set<string>();

      const isOuterBoxPoint2D = (p: [number, number]) => {
        return (
          p[0] <= voronoiBounds[0] + 2 ||
          p[0] >= voronoiBounds[2] - 2 ||
          p[1] <= voronoiBounds[1] + 2 ||
          p[1] >= voronoiBounds[3] - 2
        );
      };

      const maxDist2D = Math.max(spanX, spanY) * 0.85;

      validSubs.forEach((sub, idx) => {
        const poly = voronoi.cellPolygon(idx);
        let cellPath = '';
        const polygonPoints: [number, number][] = [];

        if (poly && poly.length >= 3) {
          // Construct cell path
          for (let p = 0; p < poly.length; p++) {
            const pt = poly[p];
            if (pt) polygonPoints.push([pt[0], pt[1]]);
          }

          if (polygonPoints.length > 0) {
            cellPath = `M ${polygonPoints[0][0].toFixed(1)},${polygonPoints[0][1].toFixed(1)}`;
            for (let p = 1; p < polygonPoints.length; p++) {
              cellPath += ` L ${polygonPoints[p][0].toFixed(1)},${polygonPoints[p][1].toFixed(1)}`;
            }
            cellPath += ' Z';
          }

          // Extract ONLY internal shared boundary line segments (no outer bounding box edges)
          for (let p = 0; p < poly.length - 1; p++) {
            const p1 = poly[p];
            const p2 = poly[p + 1];
            if (!p1 || !p2) continue;

            // Strict outer box filter
            if (isOuterBoxPoint2D(p1) || isOuterBoxPoint2D(p2)) continue;

            // Strict length filter
            const edgeLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
            if (edgeLen > maxDist2D) continue;

            const key1 = `${p1[0].toFixed(1)},${p1[1].toFixed(1)}-${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
            const key2 = `${p2[0].toFixed(1)},${p2[1].toFixed(1)}-${p1[0].toFixed(1)},${p1[1].toFixed(1)}`;

            if (!processedEdges.has(key1) && !processedEdges.has(key2)) {
              processedEdges.add(key1);
              processedEdges.add(key2);
              lineSegments.push([[p1[0], p1[1]], [p2[0], p2[1]]]);
            }
          }
        }

        cells.push({
          subdivision: sub,
          country,
          cellPath,
          centerPt: projectedPoints[idx],
          polygonPoints
        });
      });

      // Build crisp dividing lines path
      let dividingLinesPath = '';
      if (lineSegments.length > 0) {
        dividingLinesPath = lineSegments
          .map(([p1, p2]) => `M ${p1[0].toFixed(1)},${p1[1].toFixed(1)} L ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`)
          .join(' ');
      }

      return {
        country,
        dividingLinesPath,
        cells
      };
    } catch (e) {
      console.warn(`Error generating subdivision boundaries for ${country.nameEs}:`, e);
      return null;
    }
  }

  /**
   * Generates spherical 3D line segment coordinates [x1, y1, z1, x2, y2, z2] for Three.js.
   */
  public generate3DBoundaries(
    country: Country,
    latLngToVector3: (lat: number, lng: number, radius: number) => { x: number; y: number; z: number },
    radius: number = 5.018
  ): [number, number, number, number, number, number][] {
    const structure = getCountryPoliticalStructure(country);
    if (!structure || !structure.subdivisions || structure.subdivisions.length < 2) {
      return [];
    }

    const subs = structure.subdivisions;
    // Build planar equirectangular Voronoi representation in lat/lng space
    const points: [number, number][] = subs.map((s) => [s.lng, s.lat]);

    try {
      let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
      points.forEach(([lng, lat]) => {
        if (lng < minLng) minLng = lng;
        if (lat < minLat) minLat = lat;
        if (lng > maxLng) maxLng = lng;
        if (lat > maxLat) maxLat = lat;
      });

      const spanLng = Math.max(1, maxLng - minLng);
      const spanLat = Math.max(1, maxLat - minLat);
      const padLng = Math.max(3, spanLng * 0.8);
      const padLat = Math.max(3, spanLat * 0.8);

      const bMinLng = minLng - padLng;
      const bMinLat = minLat - padLat;
      const bMaxLng = maxLng + padLng;
      const bMaxLat = maxLat + padLat;

      const delaunay = new Delaunay(points.flat());
      const voronoi = delaunay.voronoi([bMinLng, bMinLat, bMaxLng, bMaxLat]);

      const segments: [number, number, number, number, number, number][] = [];
      const edgeSet = new Set<string>();

      const isOuterBoxPoint = (p: [number, number]) => {
        return (
          p[0] <= bMinLng + 0.02 ||
          p[0] >= bMaxLng - 0.02 ||
          p[1] <= bMinLat + 0.02 ||
          p[1] >= bMaxLat - 0.02
        );
      };

      const maxEdgeLength = Math.max(spanLng, spanLat) * 0.85;

      for (let i = 0; i < subs.length; i++) {
        const poly = voronoi.cellPolygon(i);
        if (!poly || poly.length < 3) continue;

        for (let j = 0; j < poly.length - 1; j++) {
          const p1 = poly[j];
          const p2 = poly[j + 1];
          if (!p1 || !p2) continue;

          // Exclude outer bounding box border edges
          if (isOuterBoxPoint(p1) || isOuterBoxPoint(p2)) continue;

          // Strict boundary check: both endpoints must be within the country's geographical area
          if (
            p1[0] < minLng - 1.5 || p1[0] > maxLng + 1.5 ||
            p1[1] < minLat - 1.5 || p1[1] > maxLat + 1.5 ||
            p2[0] < minLng - 1.5 || p2[0] > maxLng + 1.5 ||
            p2[1] < minLat - 1.5 || p2[1] > maxLat + 1.5
          ) {
            continue;
          }

          // Strict length check: do not draw oversized ray segments
          const edgeDist = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
          if (edgeDist > maxEdgeLength) continue;

          // Unique edge check
          const k1 = `${p1[0].toFixed(2)},${p1[1].toFixed(2)}-${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
          const k2 = `${p2[0].toFixed(2)},${p2[1].toFixed(2)}-${p1[0].toFixed(2)},${p1[1].toFixed(2)}`;
          if (edgeSet.has(k1) || edgeSet.has(k2)) continue;
          edgeSet.add(k1);
          edgeSet.add(k2);

          // Interpolate geodesic points along segment for sphere curvature
          const steps = Math.max(2, Math.min(8, Math.ceil(edgeDist / 2.5)));
          for (let s = 0; s < steps; s++) {
            const t1 = s / steps;
            const t2 = (s + 1) / steps;
            const lngA = p1[0] + (p2[0] - p1[0]) * t1;
            const latA = p1[1] + (p2[1] - p1[1]) * t1;
            const lngB = p1[0] + (p2[0] - p1[0]) * t2;
            const latB = p1[1] + (p2[1] - p1[1]) * t2;

            const v1 = latLngToVector3(latA, lngA, radius);
            const v2 = latLngToVector3(latB, lngB, radius);

            segments.push([v1.x, v1.y, v1.z, v2.x, v2.y, v2.z]);
          }
        }
      }

      return segments;
    } catch {
      return [];
    }
  }
}

export const subdivisionBoundaryService = new SubdivisionBoundaryService();
