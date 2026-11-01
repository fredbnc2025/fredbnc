import { Country } from '../types';
import { DownloadHelper } from './downloadHelper';

export interface SvgExportOptions {
  includeName?: boolean;
  theme?: 'light' | 'dark';
}

export class SvgExportHelper {
  /**
   * Genera el documento XML SVG vectorial completo de la bandera,
   * incorporando opcionalmente el nombre oficial del país y sus códigos.
   */
  public static async generateFlagSvgString(
    country: Country,
    options: SvgExportOptions = {}
  ): Promise<string> {
    const { includeName = true, theme = 'light' } = options;
    const isLight = theme === 'light';
    const flagUrl = `https://flagcdn.com/${country.id}.svg`;

    // Intentar obtener el SVG vectorial oficial desde FlagCDN
    let rawSvg = '';
    try {
      const resp = await fetch(flagUrl, { mode: 'cors' });
      if (resp.ok) {
        rawSvg = await resp.text();
      }
    } catch (e) {
      console.warn('Error al descargar SVG de FlagCDN, utilizando fallback vectorial:', e);
    }

    // Si no se pudo obtener de FlagCDN, generar geometría vectorial pura (sin imágenes raster)
    if (!rawSvg || !rawSvg.includes('<svg')) {
      const colorMap: Record<string, string> = {
        red: '#de2910',
        yellow: '#ffde00',
        blue: '#0038a8',
        white: '#ffffff',
        green: '#009b3a',
        black: '#000000',
        orange: '#ff8200',
        gold: '#ffd700',
        sky: '#70b5dc'
      };
      const colors = (country.colors && country.colors.length > 0)
        ? country.colors.map(c => colorMap[c.toLowerCase()] || '#0038a8')
        : ['#0038a8', '#ffffff', '#de2910'];
      
      const stripeHeight = 600 / colors.length;
      const rects = colors.map((col, idx) => 
        `<rect y="${idx * stripeHeight}" width="900" height="${stripeHeight}" fill="${col}" />`
      ).join('\n  ');

      rawSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" width="900" height="600">
  ${rects}
</svg>`;
    }

    // Si solo se solicita el archivo SVG de la bandera pura sin texto
    if (!includeName) {
      return rawSvg;
    }

    // Si se incluye el nombre del país en el SVG:
    let viewBox = '0 0 900 600';
    let innerContent = '';

    if (rawSvg && rawSvg.includes('<svg')) {
      const vbMatch = rawSvg.match(/viewBox=["']([^"']+)["']/i);
      const wMatch = rawSvg.match(/width=["']([^"']+)["']/i);
      const hMatch = rawSvg.match(/height=["']([^"']+)["']/i);

      if (vbMatch) {
        viewBox = vbMatch[1];
      } else if (wMatch && hMatch) {
        viewBox = `0 0 ${wMatch[1]} ${hMatch[1]}`;
      }

      // Limpiar etiquetas de envoltura para anidar limpiamente
      innerContent = rawSvg
        .replace(/<\?xml.*?\?>/gi, '')
        .replace(/<!DOCTYPE.*?>/gi, '')
        .replace(/<svg[^>]*>/i, '')
        .replace(/<\/svg>/i, '')
        .trim();
    }

    const bgColor = isLight ? '#ffffff' : '#020617';
    const textColor = isLight ? '#0f172a' : '#f8fafc';
    const subtextColor = isLight ? '#475569' : '#94a3b8';
    const borderColor = isLight ? '#cbd5e1' : '#334155';

    const escapeXml = (unsafe: string) =>
      unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });

    const safeNameEs = escapeXml(country.nameEs.toUpperCase());
    const safeNameEn = escapeXml(country.nameEn.toUpperCase());
    const safeContinent = escapeXml(country.continent.toUpperCase());
    const safeCode = escapeXml(country.code3.toUpperCase());

    const flagSvgBlock = innerContent
      ? `<svg x="80" y="50" width="840" height="520" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">
          ${innerContent}
        </svg>`
      : `<image href="${flagUrl}" x="80" y="50" width="840" height="520" preserveAspectRatio="xMidYMid meet" />`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 760" width="1000" height="760">
  <defs>
    <style>
      .country-name {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 38px;
        font-weight: 900;
        letter-spacing: 2px;
        text-anchor: middle;
      }
      .country-sub {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 15px;
        font-weight: 700;
        letter-spacing: 3px;
        text-anchor: middle;
      }
    </style>
  </defs>

  <!-- Fondo de la lámina -->
  <rect width="1000" height="760" fill="${bgColor}" />

  <!-- Pabellón Nacional y Marco de Contención -->
  <g id="flag-vector">
    ${flagSvgBlock}
    <rect x="80" y="50" width="840" height="520" fill="none" stroke="${borderColor}" stroke-width="2" rx="4" />
  </g>

  <!-- Nombre oficial y datos vexilológicos -->
  <g id="country-labels">
    <text x="500" y="635" class="country-name" fill="${textColor}">${safeNameEs}</text>
    <text x="500" y="675" class="country-sub" fill="${subtextColor}">${safeNameEn} • ${safeCode} • ${safeContinent}</text>
  </g>
</svg>`;
  }

  /**
   * Descarga el archivo .svg directamente en el navegador del usuario
   */
  public static async downloadCountrySvg(
    country: Country,
    options: SvgExportOptions = {}
  ): Promise<void> {
    const svgString = await this.generateFlagSvgString(country, options);
    const cleanName = country.nameEs
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');

    const suffix = options.includeName !== false ? 'con_nombre' : 'solo_bandera';
    const filename = `bandera_${country.id}_${cleanName}_${suffix}.svg`;

    DownloadHelper.downloadText(svgString, filename, 'image/svg+xml;charset=utf-8');
  }

  /**
   * Copia el código XML vectorial SVG directamente al portapapeles del sistema
   * para pegarlo al instante en Adobe Illustrator (Ctrl+V / Cmd+V)
   */
  public static async copyFlagSvgToClipboard(
    country: Country,
    options: SvgExportOptions = { includeName: false }
  ): Promise<boolean> {
    try {
      const svgString = await this.generateFlagSvgString(country, options);
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(svgString);
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Error al copiar SVG al portapapeles:', e);
      return false;
    }
  }

  /**
   * Alias de conveniencia para copiar SVG para Illustrator
   */
  public static async copySvgToClipboard(
    country: Country,
    options: SvgExportOptions = { includeName: false }
  ): Promise<boolean> {
    return this.copyFlagSvgToClipboard(country, options);
  }
}
