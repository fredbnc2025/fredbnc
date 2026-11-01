import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Country } from '../types';

export interface PdfExportOptions {
  paperSize?: 'letter' | 'a4';
  orientation?: 'portrait' | 'landscape';
  qualityScale?: number;
  onProgress?: (current: number, total: number, countryName: string, stage: string) => void;
}

export class PdfExportService {
  /**
   * Genera y descarga un PDF de 1 página tamaño Papel Bond (Carta/Letter) o A4 a partir de un elemento HTML
   */
  public static async exportElementToPdf(
    element: HTMLElement,
    filename: string,
    options: PdfExportOptions = {}
  ): Promise<void> {
    return this.exportMultipleElementsToPdf([element], filename, options);
  }

  /**
   * Genera y descarga un PDF multipágina (ej: 2 páginas - Pág 1: Bandera + Ficha, Pág 2: Mapa + Brújula)
   */
  public static async exportMultipleElementsToPdf(
    elements: HTMLElement[],
    filename: string,
    options: PdfExportOptions = {}
  ): Promise<void> {
    const {
      paperSize = 'letter',
      orientation = 'portrait',
      qualityScale = 2.5,
      onProgress
    } = options;

    if (!elements || elements.length === 0) {
      throw new Error('No se proporcionaron elementos para exportar.');
    }

    try {
      // Dimensiones de papel en milímetros
      const isLetter = paperSize === 'letter';
      const isLandscape = orientation === 'landscape';

      const baseWidth = isLetter ? 215.9 : 210.0;
      const baseHeight = isLetter ? 279.4 : 297.0;

      const pdfWidthMm = isLandscape ? baseHeight : baseWidth;
      const pdfHeightMm = isLandscape ? baseWidth : baseHeight;

      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: isLetter ? 'letter' : 'a4',
        compress: true
      });

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (onProgress) {
          onProgress(i + 1, elements.length, element.id, `Renderizando página ${i + 1} de ${elements.length}`);
        }

        if (i > 0) {
          pdf.addPage(isLetter ? 'letter' : 'a4', orientation);
        }

        // Renderizar el elemento en canvas con alta resolución y sin taint
        const canvas = await html2canvas(element, {
          scale: qualityScale,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false,
          imageTimeout: 10000,
          onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.getElementById(element.id);
            if (clonedElement) {
              clonedElement.style.transform = 'none';
              clonedElement.style.margin = '0';
            }
          }
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.92);

        pdf.addImage(
          imgData,
          'JPEG',
          0,
          0,
          pdfWidthMm,
          pdfHeightMm,
          undefined,
          'FAST'
        );
      }

      pdf.save(filename);
    } catch (error) {
      console.error('Error al exportar PDF multipágina:', error);
      throw error;
    }
  }

  /**
   * Genera el nombre de archivo estandarizado para la ficha del país
   */
  public static getCountryPdfFilename(country: Country, paperSize: string = 'bond'): string {
    const cleanName = country.nameEs
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    return `ficha_bandera_${country.id}_${cleanName}_${paperSize}.pdf`;
  }
}
