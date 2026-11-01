/**
 * Utilidades para la descarga automática instantánea de mapas (SVG, PNG, GeoJSON) y banderas (SVG, PNG, ZIP)
 */
import JSZip from 'jszip';

export class DownloadHelper {
  /**
   * Descarga un Blob de manera automática en el navegador
   */
  public static triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    // Retener la URL del Blob durante 60 segundos antes de revocarla.
    // En navegadores modernos (Chrome, Safari, Firefox), revocar el blob inmediatamente (200ms)
    // interrumpe la escritura en disco del archivo binario y corrompe el ZIP descargado.
    setTimeout(() => {
      try {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(url);
      } catch (err) {
        console.warn('Error al revocar ObjectURL:', err);
      }
    }, 60000);
  }

  /**
   * Descarga contenido de texto (JSON, SVG, TXT) automáticamente
   */
  public static downloadText(content: string, filename: string, mimeType: string = 'text/plain;charset=utf-8'): void {
    const blob = new Blob([content], { type: mimeType });
    this.triggerDownload(blob, filename);
  }

  /**
   * Descarga un archivo desde una URL externa (e.g. FlagCDN) convirtiéndolo en Blob para descarga directa sin abrir pestañas
   */
  public static async downloadRemoteFile(url: string, filename: string): Promise<boolean> {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error('Respuesta de red no válida');
      const blob = await response.blob();
      this.triggerDownload(blob, filename);
      return true;
    } catch (err) {
      console.warn('Fallback a enlace directo:', err);
      // Fallback si CORS bloquea el fetch
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return false;
    }
  }

  /**
   * Descarga un elemento SVGSVGElement como archivo .svg vectorial limpio
   */
  public static downloadSvgElement(svgElement: SVGSVGElement, filename: string): void {
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);

    // Asegurar namespaces XML válidos
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.match(/^<svg[^>]+xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"/)) {
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    const preface = '<?xml version="1.0" standalone="no"?>\r\n';
    const svgBlob = new Blob([preface, source], { type: 'image/svg+xml;charset=utf-8' });
    this.triggerDownload(svgBlob, filename);
  }

  /**
   * Convierte un SVGSVGElement a imagen PNG rasterizada en alta definición (2x o 4x) y la descarga automáticamente
   */
  public static async downloadSvgAsPng(
    svgElement: SVGSVGElement,
    filename: string,
    width: number = 2400,
    height: number = 1350
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            reject(new Error('No se pudo inicializar el contexto 2D del Canvas'));
            return;
          }

          // Fondo oscuro/transparente
          ctx.fillStyle = '#020617';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            URL.revokeObjectURL(url);
            if (blob) {
              DownloadHelper.triggerDownload(blob, filename);
              resolve();
            } else {
              reject(new Error('Error al generar blob PNG'));
            }
          }, 'image/png');
        };

        img.onerror = (e) => {
          URL.revokeObjectURL(url);
          reject(e);
        };

        img.src = url;
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Captura un HTMLCanvasElement (WebGL 3D o 2D) y lo descarga automáticamente en formato PNG / JPEG
   */
  public static downloadCanvasSnapshot(
    canvas: HTMLCanvasElement,
    filename: string = 'captura-globo-tierra-3d.png'
  ): void {
    canvas.toBlob((blob) => {
      if (blob) {
        this.triggerDownload(blob, filename);
      }
    }, 'image/png');
  }

  /**
   * Descarga un lote de banderas en un archivo ZIP automáticamente con progreso
   */
  public static async downloadFlagsBatchZip(
    flags: { id: string; nameEs: string; url: string }[],
    zipFilename: string = 'coleccion-banderas-svg.zip',
    onProgress?: (percent: number, current: string) => void
  ): Promise<void> {
    const zip = new JSZip();
    const folder = zip.folder('banderas_svg');

    let completed = 0;
    const total = flags.length;

    for (const flag of flags) {
      if (onProgress) {
        onProgress(Math.round((completed / total) * 100), flag.nameEs);
      }
      try {
        const response = await fetch(flag.url, { mode: 'cors' });
        if (response.ok) {
          const svgText = await response.text();
          const cleanName = flag.nameEs
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_');
          folder?.file(`${flag.id.toUpperCase()}_${cleanName}.svg`, svgText);
        }
      } catch (err) {
        console.warn(`No se pudo agregar bandera de ${flag.nameEs}:`, err);
      }
      completed++;
    }

    if (onProgress) {
      onProgress(100, 'Generando archivo comprimido ZIP...');
    }

    const zipContent = await zip.generateAsync({ type: 'blob' });
    this.triggerDownload(zipContent, zipFilename);
  }
}
