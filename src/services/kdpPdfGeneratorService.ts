import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { svg2pdf } from 'svg2pdf.js';
import { geoMercator, geoPath } from 'd3-geo';
import { Country } from '../types';
import { getCountryPoliticalStructure } from '../data/politicalDivisions';
import { geoDataService } from './geoDataService';
import { subdivisionBoundaryService } from './subdivisionBoundaryService';
import { AmazonKdpService } from './amazonKdpService';
import { KdpTranslationService, CONTINENT_SECTION_METAS_EN } from './kdpTranslationService';
import { embedKdpCompliantFonts } from '../fonts/embeddedFonts';
import { SvgExportHelper } from '../utils/svgExportHelper';
import { CountryNarrativeService } from './countryNarrativeService';
import QRCode from 'qrcode';

export interface KdpProgressCallback {
  (current: number, total: number, stage: string, countryName: string): void;
}

export interface ContinentSectionMeta {
  id: string;
  name: 'Europa' | 'América' | 'Asia' | 'África' | 'Oceanía';
  roman: string;
  approxPop: string;
  approxArea: string;
  languages: string;
  heraldicCharacteristics: string;
  keyElements: string[];
}

export const CONTINENT_SECTION_METAS: Record<string, ContinentSectionMeta> = {
  'Europa': {
    id: 'europa',
    name: 'Europa',
    roman: 'I',
    approxPop: '~750 Millones de habitantes',
    approxArea: '10.180.000 km²',
    languages: 'Español, Francés, Alemán, Inglés, Italiano, Ruso',
    heraldicCharacteristics: 'Cuna de la vexilología reglada moderna. Destacan los tricolores revolucionarios inspirados en la Revolución Francesa y Holandesa, las Cruces Nórdicas escandinavas (Dinamarca, Suecia, Noruega, Finlandia, Islandia), las águilas imperiales bicéfalas y la Cruz de San Jorge.',
    keyElements: ['Tricolores Horizontales y Verticales', 'Cruces Nórdicas Escandinavas', 'Colores Paneslavos (Blanco, Azul, Rojo)', 'Heráldica Histórica y Cruz de San Jorge']
  },
  'América': {
    id: 'america',
    name: 'América',
    roman: 'II',
    approxPop: '~1.030 Millones de habitantes',
    approxArea: '42.550.000 km²',
    languages: 'Español, Inglés, Portugués, Francés y Lenguas Nativas',
    heraldicCharacteristics: 'Símbolos patrios forjados en las gestas de independencia republicana. Sobresalen los Soles de Mayo incaicos (Argentina y Uruguay), las barras y constelaciones de estrellas federales (EE.UU., Brasil, Venezuela), la hoja de arce y la tríada grancolombiana de Miranda (Amarillo, Azul y Rojo).',
    keyElements: ['Soles de Mayo de la Independencia', 'Franjas Libertadoras y Estrellas Federales', 'Tríada Grancolombiana (Amarillo, Azul, Rojo)', 'Símbolos de la Naturaleza y Soberanía']
  },
  'Asia': {
    id: 'asia',
    name: 'Asia',
    roman: 'III',
    approxPop: '~4.750 Millones de habitantes',
    approxArea: '44.580.000 km²',
    languages: 'Mandarín, Hindi, Árabe, Bengalí, Ruso, Japonés',
    heraldicCharacteristics: 'Milenaria confluencia de tradiciones dinásticas, filosóficas y espirituales. Predominan los Colores Panárabes (Negro, Blanco, Verde y Rojo), el Sol Naciente oriental, la Creciente Lunar con Estrella islámica, la Rueda del Dharma (Ashoka Chakra) y emblemas geométricos de armonía cósmica.',
    keyElements: ['Colores Panárabes de las Dinastías Históricas', 'Crecientes Lunares y Estrellas Islámicas', 'Soles Nacientes y Ruedas del Dharma', 'Patrones Tradicionales y Franjas de Estado']
  },
  'África': {
    id: 'africa',
    name: 'África',
    roman: 'IV',
    approxPop: '~1.400 Millones de habitantes',
    approxArea: '30.370.000 km²',
    languages: 'Árabe, Francés, Inglés, Suajili, Portugués',
    heraldicCharacteristics: 'Extraordinaria riqueza geométrica y fuerza identitaria. Inspiradas en la histórica bandera de Etiopía que resistió el colonialismo, imperan los Colores Panafricanos (Verde para la fertilidad agrícola, Amarillo para los recursos minerales, Rojo para la sangre de los libertadores y Negro para la población).',
    keyElements: ['Colores Panafricanos (Verde, Amarillo, Rojo, Negro)', 'Cuñas y Triángulos en la Vaina de la Driza', 'Águilas Pescadoras y Fauna Africana', 'Estrellas Negras de la Libertad']
  },
  'Oceanía': {
    id: 'oceania',
    name: 'Oceanía',
    roman: 'V',
    approxPop: '~45 Millones de habitantes',
    approxArea: '8.526.000 km²',
    languages: 'Inglés, Francés, Lenguas Polinesias y Melanesias',
    heraldicCharacteristics: 'Territorios insulares y continentales del Gran Océano Pacífico. Se caracterizan por sus fondos azules celestes y marinos, la constelación de la Cruz del Sur (Crux) que guía a los navegantes, la Unión Jack británica en el cantón y patrones tradicionales polinesios de navegación.',
    keyElements: ['Constelación de la Cruz del Sur (Crux)', 'Cantón Azul de Ultramar (Blue Ensign)', 'Estrellas Polinésicas de Navegación', 'Motivos Oceánicos y Soles del Pacífico']
  }
};

export class KdpPdfGeneratorService {
  /**
   * Genera el libro en PDF ultra-rápido usando diseño vectorial nativo de jsPDF clasificado por continentes.
   * Rápido, liviano, 100% libre de errores de memoria y compatible con imprenta Amazon KDP.
   */
  public static async generateInstantVectorPdf(
    countries: Country[],
    paperSize: 'letter' | 'a4' = 'letter',
    onProgress?: KdpProgressCallback,
    options: { bleed?: boolean; lang?: 'es' | 'en'; bookFormat?: 'paperback' | 'hardcover' } = { bleed: true, lang: 'es', bookFormat: 'paperback' }
  ): Promise<void> {
    const isBleed = options.bleed !== false;
    const lang = options.lang || 'es';
    const isEn = lang === 'en';
    const isHardcover = options.bookFormat === 'hardcover';
    const pdf = await this.buildInstantVectorPdfDocument(countries, paperSize, onProgress, options);
    const suffix = isBleed ? (isEn ? 'Bleed_8.625x11.25' : 'ConSangria_8.625x11.25') : (isEn ? 'NoBleed_8.5x11' : 'SinSangria_8.5x11');
    const filename = isEn
      ? `World_Flag_Atlas_${countries.length}_Countries_Interior_KDP_${isHardcover ? 'Hardcover' : 'Paperback'}_${suffix}_${paperSize}.pdf`
      : (isHardcover
          ? `Atlas_Mundial_Banderas_${countries.length}_Paises_Interior_Tapa_Dura_KDP_${suffix}_${paperSize}.pdf`
          : `Atlas_Mundial_Banderas_${countries.length}_Paises_Interior_KDP_${suffix}_${paperSize}.pdf`);
    pdf.save(filename);
  }

  /**
   * Genera el libro completo interior específicamente formateado para Tapa Dura (Case Laminate) de Amazon KDP
   */
  public static async generateHardcoverVectorPdf(
    countries: Country[],
    paperSize: 'letter' | 'a4' = 'letter',
    onProgress?: KdpProgressCallback,
    options: { bleed?: boolean; lang?: 'es' | 'en' } = { bleed: true, lang: 'es' }
  ): Promise<void> {
    return this.generateInstantVectorPdf(countries, paperSize, onProgress, { ...options, bookFormat: 'hardcover' });
  }

  /**
   * Generación legacy sin separación continental (mantenida por retrocompatibilidad)
   */
  public static async generateLegacyVectorPdf(
    countries: Country[],
    paperSize: 'letter' | 'a4' = 'letter',
    onProgress?: KdpProgressCallback
  ): Promise<void> {
    const isLetter = paperSize === 'letter';
    const width = isLetter ? 215.9 : 210.0;
    const height = isLetter ? 279.4 : 297.0;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: isLetter ? 'letter' : 'a4',
      compress: true
    });

    embedKdpCompliantFonts(pdf);

    // Cálculo editorial de páginas para Amazon KDP
    const countriesPerTocPage = 44; // 2 columnas de 22
    const tocPagesCount = Math.max(1, Math.ceil(countries.length / countriesPerTocPage));
    // Portada (1) + Copyright (1) + Índice (tocPagesCount) + Países (N) + Apéndice (1) + Contraportada (1)
    const totalPages = 1 + 1 + tocPagesCount + countries.length + 2;

    // ==========================================
    // PÁGINA 1: PORTADA EDITORIAL (Title Page)
    // ==========================================
    if (onProgress) onProgress(1, totalPages, 'Generando Portada Editorial...', 'Portada');

    // Fondo azul marino editorial
    pdf.setFillColor(10, 25, 47);
    pdf.rect(0, 0, width, height, 'F');

    // Marco dorado decorativo
    pdf.setDrawColor(217, 119, 6);
    pdf.setLineWidth(1.5);
    pdf.rect(8, 8, width - 16, height - 16);
    pdf.setLineWidth(0.5);
    pdf.rect(10, 10, width - 20, height - 20);

    // Encabezado institucional
    pdf.setTextColor(245, 158, 11);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('ENCICLOPEDIA GEOGRÁFICA & VEXILOLÓGICA INTERNACIONAL', width / 2, 28, { align: 'center' });

    // Título Principal
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(26);
    pdf.text('ATLAS MUNDIAL DE', width / 2, 44, { align: 'center' });
    pdf.setTextColor(56, 189, 248);
    pdf.setFontSize(30);
    pdf.text('BANDERAS Y NACIONES', width / 2, 56, { align: 'center' });

    // Subtítulo
    pdf.setTextColor(203, 213, 225);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.text('Pabellones Oficiales en Formato Vectorial SVG con Nombres y Datos de Soberanía', width / 2, 67, { align: 'center' });

    // Gran Rosa de los Vientos / Brújula en Portada
    this.drawVectorCompass(pdf, width / 2, 126, 40, true);

    // Bloque de especificaciones de portada
    pdf.setFillColor(15, 23, 42);
    pdf.roundedRect(20, 186, width - 40, 52, 4, 4, 'F');
    pdf.setDrawColor(51, 65, 85);
    pdf.roundedRect(20, 186, width - 40, 52, 4, 4, 'D');

    pdf.setTextColor(245, 158, 11);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(`EDICIÓN COMPLETA • ${countries.length} ESTADOS SOBERANOS`, width / 2, 197, { align: 'center' });

    pdf.setTextColor(226, 232, 240);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.8);
    pdf.text('• Gráficos Vectoriales SVG de Máxima Resolución (300+ DPI)', width / 2, 206, { align: 'center' });
    pdf.text('• Nombres Oficiales en Español e Inglés, Códigos ISO y Capitales', width / 2, 214, { align: 'center' });
    pdf.text('• Formato Estándar Amazon KDP (8.5" x 11") / Papel Bond Blanco Color', width / 2, 222, { align: 'center' });
    pdf.text('• Índice General Numerado y Apéndice de Heráldica Vexilológica', width / 2, 230, { align: 'center' });

    // Pie de Portada
    pdf.setTextColor(148, 163, 184);
    pdf.setFontSize(8);
    pdf.text('Editorial MundoBanderas • Amazon Kindle Direct Publishing • Print on Demand', width / 2, 260, { align: 'center' });

    // ==========================================
    // PÁGINA 2: DERECHOS DE AUTOR & ISBN (KDP)
    // ==========================================
    if (onProgress) onProgress(2, totalPages, 'Generando Página Legal y de Créditos...', 'Créditos');
    pdf.addPage(isLetter ? 'letter' : 'a4', 'portrait');

    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, width, height, 'F');

    // Marco legal sutil
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.4);
    pdf.rect(18, 18, width - 36, height - 36);

    const legalX = 26;
    let legalY = 36;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(15, 23, 42);
    pdf.text('ATLAS MUNDIAL DE BANDERAS Y NACIONES', legalX, legalY);

    legalY += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(71, 85, 105);
    pdf.text('Enciclopedia Vexilológica Oficial de los Estados Soberanos del Mundo', legalX, legalY);

    legalY += 14;
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.3);
    pdf.line(legalX, legalY, width - 26, legalY);

    legalY += 12;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(15, 23, 42);
    pdf.text('INFORMACIÓN DE PUBLICACIÓN & CRÉDITOS EDITORIALES', legalX, legalY);

    legalY += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.2);
    pdf.setTextColor(51, 65, 85);
    pdf.text('Editorial: MundoBanderas Vexillological Press', legalX, legalY);
    legalY += 6;
    pdf.text('Compilación y Edición Gráfica: Consejo de Investigación Vexilológica y Cartográfica', legalX, legalY);
    legalY += 6;
    pdf.text('Primera Edición Oficial: Septiembre 2026', legalX, legalY);
    legalY += 6;
    pdf.text('ISBN-13: 979-8-89240-512-6 (Asignado para Amazon KDP)', legalX, legalY);
    legalY += 6;
    pdf.text('Depósito Legal e Identificador Internacional: KDP-VEX-2026-01', legalX, legalY);

    legalY += 12;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(15, 23, 42);
    pdf.text('AVISO DE DERECHOS DE AUTOR & PROPIEDAD INTELECTUAL', legalX, legalY);

    legalY += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.8);
    pdf.setTextColor(71, 85, 105);
    const copyrightParagraphs = [
      '© 2026 Editorial MundoBanderas. Todos los derechos reservados.',
      'Queda rigurosamente prohibida, sin la autorización escrita de los titulares del copyright, bajo las sanciones establecidas por las leyes internacionales de propiedad intelectual, la reproducción total o parcial de esta obra por cualquier medio o procedimiento, comprendidos la reprografía y el tratamiento informático.',
      'Esta obra ha sido preparada y formateada especialmente para su publicación, distribución y comercialización global en la plataforma Amazon Kindle Direct Publishing (KDP).',
      'Impreso bajo demanda (Print on Demand - POD) por Amazon KDP en centros de producción de Estados Unidos, Reino Unido, Unión Europea, Japón, Australia y Canadá.',
      'Normativa Vexilológica: Los pabellones nacionales y proporciones de estado siguen las normativas ISO 3166-1 y los registros oficiales de la Organización de las Naciones Unidas (ONU).'
    ];

    copyrightParagraphs.forEach((para) => {
      const split = pdf.splitTextToSize(para, width - 52);
      pdf.text(split, legalX, legalY);
      legalY += split.length * 4.5 + 4;
    });

    // Bloque inferior de especificaciones de imprenta
    legalY = height - 52;
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(legalX, legalY, width - 52, 22, 2, 2, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(legalX, legalY, width - 52, 22, 2, 2, 'D');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(2, 132, 199);
    pdf.text('ESPECIFICACIONES DE FABRICACIÓN AMAZON KDP:', legalX + 5, legalY + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(71, 85, 105);
    pdf.text('• Formato de corte (Trim Size): 8.5 x 11 pulgadas (21.59 x 27.94 cm) - Carta / Letter', legalX + 5, legalY + 11);
    pdf.text('• Tipo de interior: Color Premium sobre Papel Bond Blanco (55-60 lb / 90 gsm)', legalX + 5, legalY + 16);

    // ==========================================
    // PÁGINAS 3..N: ÍNDICE GENERAL (TOC)
    // ==========================================
    const countryStartPageNumber = 2 + tocPagesCount + 1;

    for (let tocPage = 0; tocPage < tocPagesCount; tocPage++) {
      const pageIndex = 3 + tocPage;
      if (onProgress) onProgress(pageIndex, totalPages, `Generando Índice General (Pág. ${tocPage + 1} de ${tocPagesCount})...`, 'Índice');

      pdf.addPage(isLetter ? 'letter' : 'a4', 'portrait');
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, width, height, 'F');

      // Encabezado del Índice
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text('ATLAS MUNDIAL DE BANDERAS • TABLA DE CONTENIDOS', 18, 14);
      pdf.text(`PARTE ${tocPage + 1} DE ${tocPagesCount}`, width - 18, 14, { align: 'right' });

      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.line(18, 16.5, width - 18, 16.5);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42);
      pdf.text('ÍNDICE GENERAL DE BANDERAS NACIONALES', width / 2, 27, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Relación alfabética y número de página de los estados soberanos catalogados`, width / 2, 33, { align: 'center' });

      // Listado en 2 columnas
      const pageCountries = countries.slice(tocPage * countriesPerTocPage, (tocPage + 1) * countriesPerTocPage);
      const colWidth = (width - 44) / 2;
      const rowsPerCol = Math.ceil(countriesPerTocPage / 2);

      pageCountries.forEach((c, idx) => {
        const globalIdx = tocPage * countriesPerTocPage + idx;
        const col = idx < rowsPerCol ? 0 : 1;
        const row = idx % rowsPerCol;
        const colX = 18 + col * (colWidth + 8);
        const rowY = 43 + row * 9.8;
        const targetPage = countryStartPageNumber + globalIdx;

        // 1. Número de orden
        const numStr = `${globalIdx + 1}.`;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.2);
        pdf.setTextColor(2, 132, 199);
        pdf.text(numStr, colX, rowY);

        // 2. Cálculo milimétrico de coordenadas anti-superposición
        const nameStartX = colX + 7.2;
        const pageNumStr = `Pág. ${targetPage}`;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.2);
        const pageNumW = pdf.getTextWidth(pageNumStr);
        const pageStartX = colX + colWidth - pageNumW;

        // Ancho máximo disponible para Nombre + (ISO)
        const maxRightForText = pageStartX - 3.0;
        const totalAvailableW = Math.max(30, maxRightForText - nameStartX);

        const isoStr = `(${c.code3 || c.id.toUpperCase()})`;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.5);
        const isoW = pdf.getTextWidth(isoStr);

        // Ancho máximo reservado para el nombre del país solo
        const maxNameWidth = Math.max(20, totalAvailableW - isoW - 2.2);

        // 3. Nombre del país (medido con la fuente exacta con la que se imprime)
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.2);
        pdf.setTextColor(15, 23, 42);

        let displayName = c.nameEs;
        if (pdf.getTextWidth(displayName) > maxNameWidth) {
          while (displayName.length > 4 && pdf.getTextWidth(displayName + '…') > maxNameWidth) {
            displayName = displayName.slice(0, -1);
          }
          displayName = displayName + '…';
        }
        const nameW = pdf.getTextWidth(displayName);
        pdf.text(displayName, nameStartX, rowY);

        // 4. Código ISO colocado exactamente DESPUÉS del nombre sin posibilidad de superponerse
        const isoX = nameStartX + nameW + 2.0;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.5);
        pdf.setTextColor(100, 116, 139);
        pdf.text(isoStr, isoX, rowY);
        const textEndX = isoX + isoW;

        // 5. Línea guía de puntos vectorial milimétrica (nunca invade el texto ni el número de página)
        const leaderStartX = textEndX + 2.5;
        const leaderEndX = pageStartX - 2.0;
        if (leaderEndX > leaderStartX + 3.0) {
          pdf.setDrawColor(203, 213, 225);
          pdf.setLineWidth(0.2);
          pdf.setLineDashPattern([0.5, 1.2], 0);
          pdf.line(leaderStartX, rowY - 0.7, leaderEndX, rowY - 0.7);
          pdf.setLineDashPattern([], 0);
        }

        // 6. Número de página de destino
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.2);
        pdf.setTextColor(15, 23, 42);
        pdf.text(pageNumStr, colX + colWidth, rowY, { align: 'right' });
      });

      // Pie del Índice
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.line(18, height - 15, width - 18, height - 15);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text('MundoBanderas • Tabla de Contenidos', 18, height - 10.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Página ${pageIndex}`, width - 18, height - 10.5, { align: 'right' });
    }

    // ==========================================
    // PÁGINAS DE PAÍSES: BANDERA SVG + NOMBRE
    // ==========================================
    const marginInside = 18; // Margen de encuadernación KDP (Gutter)
    const marginOutside = 16;
    const contentWidth = width - marginInside - marginOutside;
    const centerX = marginInside + contentWidth / 2;

    for (let i = 0; i < countries.length; i++) {
      const country = countries[i];
      const pageIndex = countryStartPageNumber + i;

      if (onProgress) {
        onProgress(pageIndex, totalPages, `Compilando Bandera SVG de ${country.nameEs}...`, country.nameEs);
      }

      pdf.addPage(isLetter ? 'letter' : 'a4', 'portrait');

      // Fondo blanco limpio para imprenta KDP
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, width, height, 'F');

      // 1. ENCABEZADO SUPERIOR (Running Head)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text('ENCICLOPEDIA VEXILOLÓGICA • ATLAS MUNDIAL', marginInside, 13);
      pdf.text(country.continent.toUpperCase(), width - marginOutside, 13, { align: 'right' });

      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.line(marginInside, 15, width - marginOutside, 15);

      // 2. TÍTULO SUPERIOR: NOMBRE OFICIAL DEL PAÍS (Destacado arriba de la bandera)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(2, 132, 199);
      pdf.text('PABELLÓN NACIONAL SOBERANO', centerX, 20.5, { align: 'center' });

      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.setFont('helvetica', 'bold');
      const countryUpper = country.nameEs.toUpperCase();
      const headerFontSize = countryUpper.length > 25 ? 15 : countryUpper.length > 18 ? 17.5 : 21;
      pdf.setFontSize(headerFontSize);
      pdf.text(countryUpper, centerX, 28, { align: 'center' });

      // Subtítulo: Nombre en Inglés • Código ISO • Continente
      pdf.setTextColor(71, 85, 105); // slate-600
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(
        `${country.nameEn}   •   CÓDIGO ISO: ${country.code3 || country.id.toUpperCase()}   •   ${country.continent.toUpperCase()}`,
        centerX,
        33.5,
        { align: 'center' }
      );

      // 3. BANDERA VECTORIAL SVG INCRUSTADA A 300+ DPI
      const flagAreaW = contentWidth;
      const flagAreaH = 106; // Altura generosa proporcional
      const flagAreaX = marginInside;
      const flagAreaY = 36.5;

      await this.embedFlagImageOrVector(pdf, country, flagAreaX, flagAreaY, flagAreaW, flagAreaH);

      // Cartela Oficial con el Nombre del País en la Bandera
      const cartoucheY = flagAreaY + flagAreaH + 3.5;
      const cartoucheW = Math.min(140, contentWidth);
      const cartoucheX = centerX - cartoucheW / 2;
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(cartoucheX, cartoucheY, cartoucheW, 8, 2, 2, 'F');
      pdf.setDrawColor(203, 213, 225);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(cartoucheX, cartoucheY, cartoucheW, 8, 2, 2, 'D');

      const cartoucheText = `BANDERA OFICIAL DE ${country.nameEs.toUpperCase()} • ${country.code3 || country.id.toUpperCase()}`;
      pdf.setFont('helvetica', 'bold');
      let cartoucheFontSize = 8;
      pdf.setFontSize(cartoucheFontSize);
      while (pdf.getTextWidth(cartoucheText) > cartoucheW - 8 && cartoucheFontSize > 5.5) {
        cartoucheFontSize -= 0.4;
        pdf.setFontSize(cartoucheFontSize);
      }
      pdf.setTextColor(15, 23, 42);
      pdf.text(cartoucheText, centerX, cartoucheY + 5.4, { align: 'center' });

      // 4. TARJETAS DE DATOS DEMOGRÁFICOS Y DE SOBERANÍA (Grid 2x2)
      const infoStartY = cartoucheY + 12;
      const cardW = (contentWidth - 6) / 2;
      const cardH = 15;
      const cardRow1Y = infoStartY;
      const cardRow2Y = cardRow1Y + cardH + 3.5;

      // Tarjeta 1: Capital
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(marginInside, cardRow1Y, cardW, cardH, 2, 2, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(marginInside, cardRow1Y, cardW, cardH, 2, 2, 'D');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.2);
      pdf.setTextColor(2, 132, 199);
      pdf.text('★ CAPITAL NACIONAL', marginInside + 5, cardRow1Y + 5.2);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.8);
      pdf.setTextColor(15, 23, 42);
      const rawCap = country.capitalEs || country.capitalEn || 'Capital oficial';
      const cleanCap = pdf.getTextWidth(rawCap) > cardW - 10 ? pdf.splitTextToSize(rawCap, cardW - 10)[0] : rawCap;
      pdf.text(cleanCap, marginInside + 5, cardRow1Y + 11.2);

      // Tarjeta 2: Continente / Región
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(marginInside + cardW + 6, cardRow1Y, cardW, cardH, 2, 2, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(marginInside + cardW + 6, cardRow1Y, cardW, cardH, 2, 2, 'D');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.2);
      pdf.setTextColor(16, 185, 129);
      pdf.text('REGIÓN GEOGRÁFICA', marginInside + cardW + 11, cardRow1Y + 5.2);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.8);
      pdf.setTextColor(15, 23, 42);
      pdf.text(country.continent, marginInside + cardW + 11, cardRow1Y + 11.2);

      // Tarjeta 3: Población y Superficie
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(marginInside, cardRow2Y, cardW, cardH, 2, 2, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(marginInside, cardRow2Y, cardW, cardH, 2, 2, 'D');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.2);
      pdf.setTextColor(217, 119, 6);
      pdf.text('POBLACIÓN Y SUPERFICIE', marginInside + 5, cardRow2Y + 5.2);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.2);
      pdf.setTextColor(15, 23, 42);
      const popStr = country.population
        ? (country.population >= 1000000 ? `${(country.population / 1000000).toFixed(1)}M hab.` : `${country.population.toLocaleString()} hab.`)
        : 'Soberanía oficial';
      const areaStr = country.areaKm2 ? ` • ${country.areaKm2.toLocaleString()} km²` : '';
      const rawPopArea = `${popStr}${areaStr}`;
      const cleanPopArea = pdf.getTextWidth(rawPopArea) > cardW - 10 ? pdf.splitTextToSize(rawPopArea, cardW - 10)[0] : rawPopArea;
      pdf.text(cleanPopArea, marginInside + 5, cardRow2Y + 11.2);

      // Tarjeta 4: Moneda e Idioma oficial
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(marginInside + cardW + 6, cardRow2Y, cardW, cardH, 2, 2, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(marginInside + cardW + 6, cardRow2Y, cardW, cardH, 2, 2, 'D');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.2);
      pdf.setTextColor(139, 92, 246);
      pdf.text('MONEDA E IDIOMA OFICIAL', marginInside + cardW + 11, cardRow2Y + 5.2);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.2);
      pdf.setTextColor(15, 23, 42);
      const langStr = country.language ? country.language : 'Idioma oficial';
      const currStr = country.currency ? ` • ${country.currency}` : '';
      const rawLangCurr = `${langStr}${currStr}`;
      const cleanLangCurr = pdf.getTextWidth(rawLangCurr) > cardW - 14 ? pdf.splitTextToSize(rawLangCurr, cardW - 14)[0] : rawLangCurr;
      pdf.text(cleanLangCurr, marginInside + cardW + 11, cardRow2Y + 11.2);

      // 5. CAJA DE HERÁLDICA & SIMBOLISMO DE LA BANDERA
      const symbolY = cardRow2Y + cardH + 4.5;
      pdf.setFillColor(254, 252, 232); // Fondo cálido heráldico
      pdf.roundedRect(marginInside, symbolY, contentWidth, 19, 2, 2, 'F');
      pdf.setDrawColor(253, 230, 138);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(marginInside, symbolY, contentWidth, 19, 2, 2, 'D');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.2);
      pdf.setTextColor(180, 83, 9);
      pdf.text('SIGNIFICADO HERÁLDICO Y PROPORCIÓN OFICIAL', marginInside + 6, symbolY + 5.2);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.8);
      pdf.setTextColor(71, 85, 105);
      const symbolText = country.flagSymbolismEs || `Pabellón nacional oficial con proporción geométrica reglamentaria. Colores de estado aprobados constitucionalmente y registrados de conformidad con las normativas internacionales de vexilología.`;
      const splitLines = pdf.splitTextToSize(symbolText, contentWidth - 12);
      pdf.text(splitLines.slice(0, 2), marginInside + 6, symbolY + 10.5);

      // 6. PIE DE PÁGINA (Running Footer con Folio KDP)
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.line(marginInside, height - 15, width - marginOutside, height - 15);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`MundoBanderas • Pabellón Nacional de ${country.nameEs}`, marginInside, height - 10.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text(`Página ${pageIndex}`, width - marginOutside, height - 10.5, { align: 'right' });
    }

    // ==========================================
    // APÉNDICE VEXILOLÓGICO & GLOSARIO
    // ==========================================
    const appendixPageIndex = countryStartPageNumber + countries.length;
    if (onProgress) onProgress(appendixPageIndex, totalPages, 'Generando Apéndice Vexilológico...', 'Apéndice');

    pdf.addPage(isLetter ? 'letter' : 'a4', 'portrait');
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, width, height, 'F');

    // Encabezado
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text('ENCICLOPEDIA VEXILOLÓGICA • APÉNDICE TÉCNICO', 18, 14);
    pdf.text('GLOSARIO', width - 18, 14, { align: 'right' });
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.line(18, 16.5, width - 18, 16.5);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(15, 23, 42);
    pdf.text('GLOSARIO Y CONCEPTOS FUNDAMENTALES DE VEXILOLOGÍA', width / 2, 28, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text('Guía rápida para la correcta interpretación de los pabellones y estandartes de estado', width / 2, 34, { align: 'center' });

    // Cuadros temáticos del Glosario
    let glossY = 44;
    const glossBoxW = (width - 44) / 2;

    // Cuadro 1: Anatomía
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(18, glossY, glossBoxW, 58, 2, 2, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(18, glossY, glossBoxW, 58, 2, 2, 'D');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(2, 132, 199);
    pdf.text('1. PARTES DE UNA BANDERA', 24, glossY + 7);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.8);
    pdf.setTextColor(51, 65, 85);
    pdf.text('• Vaina / Driza: Lado junto al mástil por donde se iza.', 24, glossY + 16);
    pdf.text('• Cantón: Cuadrante superior izquierdo de honor.', 24, glossY + 24);
    pdf.text('• Mosca: Extremo flotante opuesto a la driza.', 24, glossY + 32);
    pdf.text('• Paño / Vexilo: Cuerpo textil general del estandarte.', 24, glossY + 40);
    pdf.text('• Escudo heráldico: Emblema nacional de estado.', 24, glossY + 48);

    // Cuadro 2: Proporciones
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(18 + glossBoxW + 8, glossY, glossBoxW, 58, 2, 2, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(18 + glossBoxW + 8, glossY, glossBoxW, 58, 2, 2, 'D');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(16, 185, 129);
    pdf.text('2. PROPORCIONES REGLAMENTARIAS', 26 + glossBoxW, glossY + 7);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.8);
    pdf.setTextColor(51, 65, 85);
    pdf.text('• 2:3 (La más común): España, Francia, Italia, Japón.', 26 + glossBoxW, glossY + 16);
    pdf.text('• 1:2 (Británica e insular): Reino Unido, Australia, Canadá.', 26 + glossBoxW, glossY + 24);
    pdf.text('• 3:5 (Centroeuropea): Alemania, El Salvador, Nicaragua.', 26 + glossBoxW, glossY + 32);
    pdf.text('• 1:1 (Cuadrada): Suiza y Estado de la Ciudad del Vaticano.', 26 + glossBoxW, glossY + 40);
    pdf.text('• Caso único no rectangular: Pabellón doble de Nepal.', 26 + glossBoxW, glossY + 48);

    // Cuadro 3: Familias Vexilológicas
    glossY += 66;
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(18, glossY, width - 36, 68, 2, 2, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(18, glossY, width - 36, 68, 2, 2, 'D');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(217, 119, 6);
    pdf.text('3. PRINCIPALES FAMILIAS Y PATRONES CROMÁTICOS EN EL MUNDO', 24, glossY + 8);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(51, 65, 85);
    pdf.text('• Colores Panafricanos (Verde, Amarillo, Rojo): Inspirados en la bandera etíope, simbolizan tierra, riquezas y sangre.', 24, glossY + 18);
    pdf.text('• Colores Panárabes (Negro, Blanco, Verde, Rojo): Dinastías abasí, omeya, fatimí y hachemí del mundo árabe.', 24, glossY + 28);
    pdf.text('• Colores Paneslavos (Rojo, Blanco, Azul): Adoptados en el Congreso Eslavo de Praga de 1848 para Europa del Este.', 24, glossY + 38);
    pdf.text('• Cruces Nórdicas: Tradición escandinava compartida (Dinamarca, Suecia, Noruega, Finlandia e Islandia).', 24, glossY + 48);
    pdf.text('• Soles de Mayo / Banderas Libertadores: Tradición rioplatense y andina en Sudamérica (Argentina y Uruguay).', 24, glossY + 58);

    // Pie del Apéndice
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.line(18, height - 15, width - 18, height - 15);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text('MundoBanderas • Apéndice Vexilológico', 18, height - 10.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Página ${appendixPageIndex}`, width - 18, height - 10.5, { align: 'right' });

    // ==========================================
    // CONTRAPORTADA / CIERRE EDITORIAL (KDP)
    // ==========================================
    const backCoverPageIndex = totalPages;
    if (onProgress) onProgress(backCoverPageIndex, totalPages, 'Generando Contraportada Editorial con Código de Barras KDP...', 'Contraportada');

    pdf.addPage(isLetter ? 'letter' : 'a4', 'portrait');
    pdf.setFillColor(10, 25, 47);
    pdf.rect(0, 0, width, height, 'F');

    pdf.setDrawColor(217, 119, 6);
    pdf.setLineWidth(1.5);
    pdf.rect(8, 8, width - 16, height - 16);
    pdf.setLineWidth(0.5);
    pdf.rect(10, 10, width - 20, height - 20);

    pdf.setTextColor(245, 158, 11);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('ATLAS MUNDIAL DE BANDERAS Y NACIONES', width / 2, 34, { align: 'center' });

    pdf.setTextColor(226, 232, 240);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.2);
    pdf.text('La Guía Vexilológica y Geográfica Definitiva para Coleccionistas, Docentes y Estudiantes', width / 2, 42, { align: 'center' });

    // Sinopsis para Amazon KDP
    pdf.setFillColor(15, 23, 42);
    pdf.roundedRect(20, 52, width - 40, 68, 3, 3, 'F');
    pdf.setDrawColor(51, 65, 85);
    pdf.roundedRect(20, 52, width - 40, 68, 3, 3, 'D');

    pdf.setTextColor(245, 158, 11);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('¿QUÉ HACE ÚNICO A ESTE VOLUMEN EDITORIAL?', 28, 64);

    pdf.setTextColor(203, 213, 225);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.2);
    const blurb = [
      '• Catálogo íntegro con la bandera oficial de cada estado soberano en gráfico vectorial de alta definición.',
      '• Incorpora el nombre oficial en español, denominación internacional en inglés, código ISO y capital.',
      '• Datos geográficos y demográficos verificados de población, superficie territorial, moneda e idiomas.',
      '• Ficha heráldica con explicación del significado cívico de colores y proporción reglamentaria.',
      '• Formateado estrictamente bajo normativas de márgenes seguros de Amazon Kindle Direct Publishing.'
    ];
    blurb.forEach((line, lIdx) => {
      pdf.text(line, 28, 74 + lIdx * 8.5);
    });

    this.drawVectorCompass(pdf, width / 2, 168, 24, true);

    // Caja reglamentaria para Código de Barras de Amazon KDP (50.8 mm x 31.8 mm en blanco)
    const barcodeW = 50.8;
    const barcodeH = 31.8;
    const barcodeX = width - 26 - barcodeW;
    const barcodeY = height - 26 - barcodeH;

    pdf.setFillColor(255, 255, 255);
    pdf.rect(barcodeX, barcodeY, barcodeW, barcodeH, 'F');
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.3);
    pdf.rect(barcodeX, barcodeY, barcodeW, barcodeH, 'D');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(15, 23, 42);
    pdf.text('AMAZON KDP BARCODE', barcodeX + barcodeW / 2, barcodeY + 8, { align: 'center' });

    pdf.setFont('courier', 'bold');
    pdf.setFontSize(8);
    pdf.text('||| | | |||| || ||| |', barcodeX + barcodeW / 2, barcodeY + 16, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(100, 116, 139);
    pdf.text('ISBN-13: 979-8-89240-512-6', barcodeX + barcodeW / 2, barcodeY + 22, { align: 'center' });
    pdf.text('Área reglamentaria KDP (50.8x31.8mm)', barcodeX + barcodeW / 2, barcodeY + 27, { align: 'center' });

    // Créditos pie de contraportada
    pdf.setTextColor(148, 163, 184);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text('MundoBanderas Editorial • Edición Internacional Amazon KDP', 26, height - 32);
    pdf.text('Impreso bajo demanda en Papel Bond Blanco • Interior a Todo Color', 26, height - 26);
    pdf.text('Todos los derechos reservados © 2026', 26, height - 20);

    const filename = `Atlas_Mundial_Banderas_${countries.length}_Paises_Amazon_KDP_${paperSize}.pdf`;
    pdf.save(filename);
  }

  /**
   * Normaliza la denominación de continente a las 5 grandes regiones estándar
   */
  public static normalizeContinent(continent: string): 'Europa' | 'América' | 'Asia' | 'África' | 'Oceanía' {
    if (continent.includes('América')) return 'América';
    if (continent.includes('Europa')) return 'Europa';
    if (continent.includes('Asia')) return 'Asia';
    if (continent.includes('África')) return 'África';
    if (continent.includes('Oceanía')) return 'Oceanía';
    return 'América';
  }

  /**
   * Agrupa y ordena los países por continentes de manera canónica
   */
  public static groupCountriesByContinent(countries: Country[]): Array<{
    continentName: 'Europa' | 'América' | 'Asia' | 'África' | 'Oceanía';
    meta: ContinentSectionMeta;
    countries: Country[];
  }> {
    const canonicalOrder: Array<'Europa' | 'América' | 'Asia' | 'África' | 'Oceanía'> = [
      'Europa',
      'América',
      'Asia',
      'África',
      'Oceanía'
    ];

    const result: Array<{
      continentName: 'Europa' | 'América' | 'Asia' | 'África' | 'Oceanía';
      meta: ContinentSectionMeta;
      countries: Country[];
    }> = [];

    canonicalOrder.forEach((contName) => {
      const match = countries
        .filter((c) => this.normalizeContinent(c.continent) === contName)
        .sort((a, b) => a.nameEs.localeCompare(b.nameEs));

      if (match.length > 0) {
        result.push({
          continentName: contName,
          meta: CONTINENT_SECTION_METAS[contName],
          countries: match
        });
      }
    });

    return result;
  }

  /**
   * Construye el documento interior jsPDF con clasificación continental completa
   */
  public static async buildInstantVectorPdfDocument(
    countries: Country[],
    paperSize: 'letter' | 'a4' = 'letter',
    onProgress?: KdpProgressCallback,
    options: { bleed?: boolean; lang?: 'es' | 'en'; bookFormat?: 'paperback' | 'hardcover' } = { bleed: true, lang: 'es', bookFormat: 'paperback' }
  ): Promise<jsPDF> {
    const isLetter = paperSize === 'letter';
    const isBleed = options.bleed !== false;
    const lang = options.lang || 'es';
    const isEn = lang === 'en';
    const isHardcover = options.bookFormat === 'hardcover';

    // Dimensiones milimétricas exactas según Amazon KDP
    const width = isLetter ? (isBleed ? 219.075 : 215.9) : (isBleed ? 213.175 : 210.0);
    const height = isLetter ? (isBleed ? 285.75 : 279.4) : (isBleed ? 303.35 : 297.0);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [width, height],
      compress: true
    });

    // Incrustar fuentes TrueType físicas (Liberation Sans / Helvetica) para pase 100% limpio en Amazon KDP
    embedKdpCompliantFonts(pdf);

    const grouped = this.groupCountriesByContinent(countries);

    // ==============================================================
    // CONFIGURACIÓN DE MÁRGENES ESTRICTA SEGÚN GUÍA AMAZON KDP
    // ==============================================================
    const gutterMargin = isHardcover ? 22.0 : 20.0;
    const outsideMargin = isBleed ? 19.0 : 16.0;
    const topMargin = isBleed ? 20.0 : 16.0;
    const bottomMargin = isBleed ? 24.0 : 20.0;
    const contentWidth = width - gutterMargin - outsideMargin;

    // Helper para cálculo exacto de márgenes alternados (páginas pares vs impares)
    const getPageMargins = (pageNumber: number) => {
      const isOdd = pageNumber % 2 !== 0;
      const leftMargin = isOdd ? gutterMargin : outsideMargin;
      const rightMargin = isOdd ? outsideMargin : gutterMargin;
      const pageCenterX = leftMargin + contentWidth / 2;
      return { isOdd, leftMargin, rightMargin, pageCenterX };
    };

    // Cálculo editorial de páginas para Amazon KDP
    const countriesPerTocPage = 40;
    const tocPagesCount = Math.max(1, Math.ceil(countries.length / countriesPerTocPage));
    const continentDividerPagesCount = grouped.length;
    const totalPages = 1 + 1 + tocPagesCount + continentDividerPagesCount + countries.length + 1 + 1;

    // ==========================================
    // PÁGINA 1: PORTADA EDITORIAL (Title Page)
    // ==========================================
    if (onProgress) onProgress(1, totalPages, isEn ? 'Generando Portada Editorial (English)...' : 'Generando Portada Editorial...', isEn ? 'Title' : 'Portada');

    const p1 = getPageMargins(1);

    if (isBleed) {
      pdf.setFillColor(11, 19, 41); // #0b1329
      pdf.rect(0, 0, width, height, 'F');
    } else {
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, width, height, 'F');
      pdf.setFillColor(11, 19, 41);
      pdf.rect(p1.leftMargin, topMargin, contentWidth, height - topMargin - bottomMargin, 'F');
    }

    // Doble marco dorado decorativo dentro de los márgenes seguros KDP
    const p1FrameX = p1.leftMargin + 1.5;
    const p1FrameY = topMargin + 1.5;
    const p1FrameW = contentWidth - 3.0;
    const p1FrameH = height - topMargin - bottomMargin - 3.0;
    pdf.setDrawColor(217, 119, 6);
    pdf.setLineWidth(1.4);
    pdf.rect(p1FrameX, p1FrameY, p1FrameW, p1FrameH);
    pdf.setLineWidth(0.5);
    pdf.rect(p1FrameX + 1.8, p1FrameY + 1.8, p1FrameW - 3.6, p1FrameH - 3.6);

    // Encabezado institucional en oro brillante
    pdf.setTextColor(245, 158, 11);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.text(isEn ? 'OFFICIAL GEOGRAPHICAL & VEXILLOLOGICAL ENCYCLOPEDIA' : 'ENCICLOPEDIA GEOGRÁFICA & VEXILOLÓGICA OFICIAL', p1.pageCenterX, 30, { align: 'center' });

    // Título Principal en blanco puro y azul cielo brillante
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(26);
    pdf.text(isEn ? 'WORLD FLAG ATLAS' : 'ATLAS MUNDIAL DE BANDERAS', p1.pageCenterX, 45, { align: 'center' });
    pdf.setTextColor(56, 189, 248);
    pdf.setFontSize(21);
    pdf.text(isEn ? 'CLASSIFIED BY CONTINENTS' : 'CLASIFICADO POR CONTINENTES', p1.pageCenterX, 56, { align: 'center' });

    // Subtítulo en tono gris claro elegante
    pdf.setTextColor(148, 163, 184);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(
      isEn
        ? 'Official Sovereign Flags in SVG Vector Format with Names, Heraldry, and Sovereign Data'
        : 'Pabellones Oficiales en Formato Vectorial SVG con Nombres, Heráldica y Datos de Soberanía',
      p1.pageCenterX,
      66,
      { align: 'center' }
    );

    // Gran Rosa de los Vientos en Portada
    this.drawVectorCompass(pdf, p1.pageCenterX, 118, 36, true);

    // Bloque de especificaciones de portada
    const p1BoxW = contentWidth - 12;
    const p1BoxX = p1.leftMargin + 6;
    pdf.setFillColor(15, 23, 42); // slate-900 / dark card
    pdf.roundedRect(p1BoxX, 172, p1BoxW, 60, 4, 4, 'F');
    pdf.setDrawColor(51, 65, 85); // slate-700
    pdf.setLineWidth(0.4);
    pdf.roundedRect(p1BoxX, 172, p1BoxW, 60, 4, 4, 'D');

    pdf.setTextColor(245, 158, 11);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.5);
    const p1TitleText = isEn
      ? (isHardcover ? `HARDCOVER COLLECTOR'S EDITION • ${countries.length} SOVEREIGN NATIONS` : `EDITORIAL VOLUME • ${countries.length} SOVEREIGN NATIONS`)
      : (isHardcover ? `EDICIÓN COLECCIONISTA TAPA DURA • ${countries.length} NACIONES` : `VOLUMEN EDITORIAL • ${countries.length} NACIONES SOBERANAS`);
    pdf.text(p1TitleText, p1.pageCenterX, 183, { align: 'center' });

    pdf.setTextColor(226, 232, 240);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.2);
    if (isEn) {
      pdf.text('• 5 Continental Sections: Europe, Americas, Asia, Africa, and Oceania', p1.pageCenterX, 192, { align: 'center' });
      pdf.text('• High-Definition SVG Vector Flags (300+ DPI) with Official Names & Proportions', p1.pageCenterX, 199, { align: 'center' });
      pdf.text('• Sovereign Profiles: Capitals, Coordinates, Population, Area, Currency & Languages', p1.pageCenterX, 206, { align: 'center' });
      pdf.text('• Heraldic Symbolism of State Colors & Historic Vexillological Trivia', p1.pageCenterX, 213, { align: 'center' });
      pdf.text(`• Amazon KDP Compliant Format (${isHardcover ? '8.25" x 11" Hardcover' : '8.5" x 11" Letter'}) with Safe Binding Margins`, p1.pageCenterX, 220, { align: 'center' });
    } else {
      pdf.text('• Organización por 5 Continentes: Europa, América, Asia, África y Oceanía', p1.pageCenterX, 192, { align: 'center' });
      pdf.text('• Banderas Vectoriales SVG en Alta Definición (300+ DPI) con Nombres y Proporciones', p1.pageCenterX, 199, { align: 'center' });
      pdf.text('• Fichas de Soberanía: Capitales, Coordenadas, Población, Superficie, Moneda e Idiomas', p1.pageCenterX, 206, { align: 'center' });
      pdf.text('• Simbolismo Heráldico de Colores y Efemérides Histórico-Vexilológicas', p1.pageCenterX, 213, { align: 'center' });
      pdf.text(`• Formato Amazon KDP (${isHardcover ? '8.25" x 11" Tapa Dura' : '8.5" x 11"'}) con Márgenes de Encuadernación Seguros`, p1.pageCenterX, 220, { align: 'center' });
    }

    // Pie de Portada dentro de los márgenes seguros KDP
    const p1FooterY = isBleed ? 248 : (height - 18);
    pdf.setTextColor(148, 163, 184);
    pdf.setFontSize(7.8);
    pdf.text(
      isEn
        ? 'WorldFlags Publishing • Amazon Kindle Direct Publishing • Print on Demand'
        : 'Editorial MundoBanderas • Amazon Kindle Direct Publishing • Print on Demand',
      p1.pageCenterX,
      p1FooterY,
      { align: 'center' }
    );

    // ==========================================
    // PÁGINA 2: DERECHOS DE AUTOR & ISBN (KDP)
    // ==========================================
    if (onProgress) onProgress(2, totalPages, isEn ? 'Generando Página Legal y de Créditos (English)...' : 'Generando Página Legal y de Créditos...', isEn ? 'Credits' : 'Créditos');
    pdf.addPage([width, height], 'portrait');

    const p2 = getPageMargins(2);

    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, width, height, 'F');

    // Marco legal sutil dentro de los márgenes seguros KDP
    const p2FrameX = p2.leftMargin + 1.5;
    const p2FrameY = topMargin + 1.5;
    const p2FrameW = contentWidth - 3.0;
    const p2FrameH = height - topMargin - bottomMargin - 3.0;
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.4);
    pdf.rect(p2FrameX, p2FrameY, p2FrameW, p2FrameH);

    const legalX = p2.leftMargin + 8;
    const legalW = contentWidth - 16;
    let legalY = 36;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(15, 23, 42);
    pdf.text(isEn ? 'WORLD FLAG ATLAS AND NATIONS' : 'ATLAS MUNDIAL DE BANDERAS Y NACIONES', legalX, legalY);

    legalY += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(71, 85, 105);
    pdf.text(
      isEn
        ? (isHardcover ? 'Official Vexillological Encyclopedia • Hardcover Collector\'s Edition' : 'Official Vexillological Encyclopedia Classified by Continents')
        : (isHardcover ? 'Enciclopedia Vexilológica Oficial • Edición Coleccionista en Tapa Dura' : 'Enciclopedia Vexilológica Oficial Clasificada por Continentes'),
      legalX,
      legalY
    );

    legalY += 12;
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.3);
    pdf.line(legalX, legalY, legalX + legalW, legalY);

    legalY += 12;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(15, 23, 42);
    pdf.text(isEn ? 'PUBLICATION INFORMATION & EDITORIAL CREDITS' : 'INFORMACIÓN DE PUBLICACIÓN & CRÉDITOS EDITORIALES', legalX, legalY);

    const legalLines = isEn ? [
      'Publisher: WorldFlags Publishing & Vexillological Press',
      `Edition: 1st International Commercial Edition in English (${isHardcover ? 'Hardcover ' : ''}2026)`,
      'ISBN-13 (KDP Registry): 979-8-89240-512-6',
      'Legal Deposit: Intellectual Property and International Copyright Registry',
      'Cartography & Vexillology: WorldFlags Cartographic and Heraldic Department',
      'Technical Review: Compliant with International Federation of Vexillological Associations (FIAV)',
      'All rights reserved. No part of this publication may be reproduced or transmitted',
      'without prior written permission from the publisher, except for brief scholarly citations.',
      'Published and distributed globally via Amazon Kindle Direct Publishing (KDP).'
    ] : [
      'Editorial: MundoBanderas Editorial & Vexillological Press',
      `Edición: 1.ª Edición Comercial Internacional en Español (${isHardcover ? 'Tapa Dura ' : ''}2026)`,
      'ISBN-13 (Registro KDP): 979-8-89240-512-6',
      'Depósito Legal: M-18492-2026 (Registro de la Propiedad Intelectual)',
      'Cartografía y Vexilología: Departamento Cartográfico MundoBanderas',
      'Revisión Técnica: Normativas de la Federación Internacional de Asociaciones Vexilológicas (FIAV)',
      'Reservados todos los derechos. Ninguna parte de esta obra puede ser reproducida',
      'sin autorización escrita previa de la editorial, excepto para citas académicas breves.',
      'Publicado y distribuido a escala mundial mediante Amazon Kindle Direct Publishing (KDP).'
    ];

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(51, 65, 85);
    legalLines.forEach((line) => {
      legalY += 6.5;
      pdf.text(line, legalX, legalY);
    });

    // Bloque de clasificación continental
    legalY += 12;
    const structureBoxH = 34;
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(legalX, legalY, legalW, structureBoxH, 2, 2, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(legalX, legalY, legalW, structureBoxH, 2, 2, 'D');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.8);
    pdf.setTextColor(217, 119, 6);
    pdf.text(isEn ? 'CONTINENTAL SECTION STRUCTURE:' : 'ESTRUCTURA DE SECCIONES CONTINENTALES:', legalX + 5, legalY + 6.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.2);
    pdf.setTextColor(71, 85, 105);
    if (isEn) {
      pdf.text('• Section I: Europe (Revolutionary tricolors and Nordic crosses)', legalX + 5, legalY + 12);
      pdf.text('• Section II: Americas (Liberation suns, federal stripes and stars)', legalX + 5, legalY + 17);
      pdf.text('• Section III: Asia (Crescents, dragons, solar and dynastic symbolism)', legalX + 5, legalY + 22);
      pdf.text('• Section IV: Africa (Pan-African colors, freedom stars and spears)', legalX + 5, legalY + 27);
      pdf.text('• Section V: Oceania (Southern Cross constellations and maritime fields)', legalX + 5, legalY + 32);
    } else {
      pdf.text('• Sección I: Europa (Tricolores revolucionarios y cruces nórdicas)', legalX + 5, legalY + 12);
      pdf.text('• Sección II: América (Soles libertadores, franjas y estrellas federales)', legalX + 5, legalY + 17);
      pdf.text('• Sección III: Asia (Media lunas, dragones y simbolismo solar y dinástico)', legalX + 5, legalY + 22);
      pdf.text('• Sección IV: África (Colores panafricanos, estrellas de libertad y lanzas)', legalX + 5, legalY + 27);
      pdf.text('• Sección V: Oceanía (Constelaciones de la Cruz del Sur y fondos marítimos)', legalX + 5, legalY + 32);
    }

    // Bloque inferior de especificaciones de imprenta
    legalY = height - 52;
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(legalX, legalY, legalW, 22, 2, 2, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(legalX, legalY, legalW, 22, 2, 2, 'D');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(2, 132, 199);
    pdf.text(isEn ? 'AMAZON KDP MANUFACTURING SPECIFICATIONS:' : 'ESPECIFICACIONES DE FABRICACIÓN AMAZON KDP:', legalX + 5, legalY + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(71, 85, 105);
    if (isEn) {
      pdf.text(`• Trim Size: ${isHardcover ? '8.25 x 11 in (20.95 x 27.94 cm) Hardcover Case Laminate' : '8.5 x 11 in (21.59 x 27.94 cm) - Letter'}`, legalX + 5, legalY + 11);
      pdf.text(`• Interior Type: Premium Color on White Bond Paper (55-60 lb / 90 gsm) • ${isBleed ? 'Bleed' : 'No Bleed'}`, legalX + 5, legalY + 16);
    } else {
      pdf.text(`• Formato de corte (Trim Size): ${isHardcover ? '8.25 x 11 pulgadas (20.95 x 27.94 cm) Tapa Dura' : '8.5 x 11 pulgadas (21.59 x 27.94 cm) - Carta / Letter'}`, legalX + 5, legalY + 11);
      pdf.text(`• Tipo de interior: Color Premium sobre Papel Bond Blanco (55-60 lb / 90 gsm) • ${isBleed ? 'Con Sangría' : 'Sin Sangría'}`, legalX + 5, legalY + 16);
    }

    // ==========================================
    // PÁGINAS 3..N: ÍNDICE GENERAL (TOC)
    // ==========================================
    let runningPagePointer = 2 + tocPagesCount + 1; // Primera página después del TOC
    const continentPageMap: Record<string, number> = {};
    const countryPageMap: Record<string, number> = {};

    grouped.forEach((g) => {
      continentPageMap[g.continentName] = runningPagePointer;
      runningPagePointer++; // Página divisoria del continente
      g.countries.forEach((c) => {
        countryPageMap[c.id] = runningPagePointer;
        runningPagePointer++;
      });
    });

    const appendixPageNumber = runningPagePointer;
    const backCoverPageNumber = runningPagePointer + 1;

    // Generar las páginas del TOC
    for (let tocPage = 0; tocPage < tocPagesCount; tocPage++) {
      const pageIndex = 3 + tocPage;
      if (onProgress) onProgress(pageIndex, totalPages, `Generando Índice General (Pág. ${tocPage + 1} de ${tocPagesCount})...`, 'Índice');

      const ptoc = getPageMargins(pageIndex);

      pdf.addPage([width, height], 'portrait');
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, width, height, 'F');

      // Encabezado del Índice
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text(isEn ? 'WORLD FLAG ATLAS • TABLE OF CONTENTS' : 'ATLAS MUNDIAL DE BANDERAS • TABLA DE CONTENIDOS', ptoc.leftMargin, 14);
      pdf.text(isEn ? `PART ${tocPage + 1} OF ${tocPagesCount}` : `PARTE ${tocPage + 1} DE ${tocPagesCount}`, width - ptoc.rightMargin, 14, { align: 'right' });

      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.line(ptoc.leftMargin, 16.5, width - ptoc.rightMargin, 16.5);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(15);
      pdf.setTextColor(15, 23, 42);
      pdf.text(isEn ? 'GENERAL INDEX BY CONTINENTS AND NATIONS' : 'ÍNDICE GENERAL POR CONTINENTES Y NACIONES', ptoc.pageCenterX, 26, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.2);
      pdf.setTextColor(100, 116, 139);
      pdf.text(isEn ? 'Quick locator for continental sections and sovereign flags' : 'Localización rápida de secciones continentales y pabellones soberanos', ptoc.pageCenterX, 31.5, { align: 'center' });

      // En la primera página del TOC mostramos el resumen de Secciones Continentales
      let startItemsY = 38;
      if (tocPage === 0) {
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(ptoc.leftMargin, 35, contentWidth, 26, 2, 2, 'F');
        pdf.setDrawColor(226, 232, 240);
        pdf.roundedRect(ptoc.leftMargin, 35, contentWidth, 26, 2, 2, 'D');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(2, 132, 199);
        pdf.text(isEn ? 'ATLAS CONTINENTAL SECTIONS:' : 'SECCIONES CONTINENTALES DEL ATLAS:', ptoc.leftMargin + 6, 41);

        const tocSectionColW = (contentWidth - 12) / 2;
        grouped.forEach((g, gIdx) => {
          const col = gIdx < 3 ? 0 : 1;
          const row = gIdx < 3 ? gIdx : gIdx - 3;
          const sX = ptoc.leftMargin + 6 + col * tocSectionColW;
          const sY = 47 + row * 5.2;

          const contName = isEn ? KdpTranslationService.getContinentEn(g.continentName) : g.continentName;
          const flagLabel = isEn ? 'flags' : 'banderas';
          const pageLabel = isEn ? 'p. ' : 'Pág. ';

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(7.2);
          pdf.setTextColor(15, 23, 42);
          pdf.text(`${isEn ? 'Section' : 'Sección'} ${g.meta.roman}: ${contName} (${g.countries.length} ${flagLabel})`, sX, sY);

          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(217, 119, 6);
          pdf.text(`${pageLabel}${continentPageMap[g.continentName]}`, sX + tocSectionColW - 6, sY, { align: 'right' });
        });

        startItemsY = 66;
      }

      // Países listados en 2 columnas
      const countriesInThisPage = countries.slice(tocPage * countriesPerTocPage, (tocPage + 1) * countriesPerTocPage);
      const colWidth = (contentWidth - 8) / 2;
      const rowsPerCol = Math.ceil(countriesPerTocPage / 2);

      countriesInThisPage.forEach((c, idx) => {
        const globalIdx = tocPage * countriesPerTocPage + idx;
        const col = idx < rowsPerCol ? 0 : 1;
        const row = idx % rowsPerCol;
        const colX = ptoc.leftMargin + col * (colWidth + 8);
        const rowY = startItemsY + row * 9.2;
        const targetPage = countryPageMap[c.id] || 0;

        // 1. Número de orden
        const numStr = `${globalIdx + 1}.`;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.2);
        pdf.setTextColor(2, 132, 199);
        pdf.text(numStr, colX, rowY);

        // 2. Cálculo milimétrico de coordenadas anti-superposición
        const nameStartX = colX + 7.2;
        const pageNumStr = isEn ? `p. ${targetPage}` : `Pág. ${targetPage}`;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.2);
        const pageNumW = pdf.getTextWidth(pageNumStr);
        const pageStartX = colX + colWidth - pageNumW;

        // Ancho máximo disponible para Nombre + (ISO)
        const maxRightForText = pageStartX - 3.0;
        const totalAvailableW = Math.max(30, maxRightForText - nameStartX);

        const isoStr = `(${c.code3 || c.id.toUpperCase()})`;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.5);
        const isoW = pdf.getTextWidth(isoStr);

        // Ancho máximo reservado para el nombre del país solo
        const maxNameWidth = Math.max(20, totalAvailableW - isoW - 2.2);

        // 3. Nombre del país (medido con la fuente exacta con la que se imprime)
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.2);
        pdf.setTextColor(15, 23, 42);

        let displayName = isEn ? (c.nameEn || c.nameEs) : c.nameEs;
        if (pdf.getTextWidth(displayName) > maxNameWidth) {
          while (displayName.length > 4 && pdf.getTextWidth(displayName + '…') > maxNameWidth) {
            displayName = displayName.slice(0, -1);
          }
          displayName = displayName + '…';
        }
        const nameW = pdf.getTextWidth(displayName);
        pdf.text(displayName, nameStartX, rowY);

        // 4. Código ISO colocado exactamente DESPUÉS del nombre sin posibilidad de superponerse
        const isoX = nameStartX + nameW + 2.0;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.5);
        pdf.setTextColor(100, 116, 139);
        pdf.text(isoStr, isoX, rowY);
        const textEndX = isoX + isoW;

        // 5. Línea guía de puntos vectorial milimétrica (nunca invade el texto ni el número de página)
        const leaderStartX = textEndX + 2.5;
        const leaderEndX = pageStartX - 2.0;
        if (leaderEndX > leaderStartX + 3.0) {
          pdf.setDrawColor(203, 213, 225);
          pdf.setLineWidth(0.2);
          pdf.setLineDashPattern([0.5, 1.2], 0);
          pdf.line(leaderStartX, rowY - 0.7, leaderEndX, rowY - 0.7);
          pdf.setLineDashPattern([], 0); // restablecer patrón
        }

        // 6. Número de página alineado a la derecha
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.2);
        pdf.setTextColor(15, 23, 42);
        pdf.text(pageNumStr, colX + colWidth, rowY, { align: 'right' });
      });

      // Pie del Índice dentro de márgenes reglamentarios KDP
      const tocFooterY = isBleed ? 250 : (height - 18);
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.line(ptoc.leftMargin, tocFooterY - 3.5, width - ptoc.rightMargin, tocFooterY - 3.5);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(isEn ? 'WorldFlags • Table of Contents' : 'MundoBanderas • Tabla de Contenidos', ptoc.leftMargin, tocFooterY);
      pdf.setFont('helvetica', 'bold');
      pdf.text(isEn ? `Page ${pageIndex}` : `Página ${pageIndex}`, width - ptoc.rightMargin, tocFooterY, { align: 'right' });
    }

    // ==========================================
    // PÁGINAS CONTINENTALES & PAÍSES
    // ==========================================
    for (const group of grouped) {
      const dividerPageNum = continentPageMap[group.continentName];
      if (onProgress) {
        onProgress(dividerPageNum, totalPages, `Creando Sección Continental: ${group.continentName}...`, group.continentName);
      }

      // ----------------------------------------------------
      // PORTADILLA DE SECCIÓN CONTINENTAL
      // ----------------------------------------------------
      pdf.addPage([width, height], 'portrait');

      const pdiv = getPageMargins(dividerPageNum);

      // Fondo editorial según KDP G201857950
      if (isBleed) {
        pdf.setFillColor(11, 19, 41); // #0b1329
        pdf.rect(0, 0, width, height, 'F');
      } else {
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, width, height, 'F');
        pdf.setFillColor(11, 19, 41);
        pdf.rect(pdiv.leftMargin, topMargin, contentWidth, height - topMargin - bottomMargin, 'F');
      }

      // Marco dorado de sección dentro de los márgenes reglamentarios KDP
      const divFrameX = pdiv.leftMargin + 1.5;
      const divFrameY = topMargin + 1.5;
      const divFrameW = contentWidth - 3.0;
      const divFrameH = height - topMargin - bottomMargin - 3.0;
      pdf.setDrawColor(217, 119, 6);
      pdf.setLineWidth(1.4);
      pdf.rect(divFrameX, divFrameY, divFrameW, divFrameH);
      pdf.setLineWidth(0.5);
      pdf.rect(divFrameX + 1.8, divFrameY + 1.8, divFrameW - 3.6, divFrameH - 3.6);

      const contName = isEn ? KdpTranslationService.getContinentEn(group.continentName) : group.continentName;
      const metaEn = CONTINENT_SECTION_METAS_EN[group.continentName] || CONTINENT_SECTION_METAS_EN['Europa'];

      // Distintivo de Sección
      pdf.setTextColor(245, 158, 11);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text(isEn ? `SECTION ${group.meta.roman}` : `SECCIÓN ${group.meta.roman}`, pdiv.pageCenterX, 29, { align: 'center' });

      // Título Continental en formato destacado
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(26);
      pdf.text(contName.toUpperCase(), pdiv.pageCenterX, 41, { align: 'center' });

      pdf.setTextColor(56, 189, 248);
      pdf.setFontSize(9.5);
      pdf.text(isEn ? 'REGIONAL VEXILLOLOGICAL & CARTOGRAPHIC ENCYCLOPEDIA' : 'ENCICLOPEDIA VEXILOLÓGICA Y CARTOGRÁFICA REGIONAL', pdiv.pageCenterX, 49, { align: 'center' });

      // Ficha Estadística del Continente (Tarjeta oscura)
      const divCardX = pdiv.leftMargin + 5;
      const divCardW = contentWidth - 10;
      pdf.setFillColor(15, 23, 42); // slate-900 / dark card
      pdf.roundedRect(divCardX, 55, divCardW, 43, 3, 3, 'F');
      pdf.setDrawColor(51, 65, 85);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(divCardX, 55, divCardW, 43, 3, 3, 'D');

      const colW = (divCardW - 16) / 2;
      pdf.setTextColor(245, 158, 11);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.text(isEn ? '★ CONTINENT PROFILE' : '★ DATOS DEL CONTINENTE', divCardX + 8, 63);

      pdf.setTextColor(226, 232, 240);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(isEn ? `• Cataloged flags: ${group.countries.length} states & territories` : `• Banderas catalogadas: ${group.countries.length} estados y territorios`, divCardX + 8, 71);
      pdf.text(isEn ? `• Estimated population: ${metaEn.approxPopEn}` : `• Población estimada: ${group.meta.approxPop}`, divCardX + 8, 78);
      pdf.text(isEn ? `• Land area: ${metaEn.approxAreaEn}` : `• Superficie territorial: ${group.meta.approxArea}`, divCardX + 8, 85);

      pdf.text(isEn ? `• Major languages:` : `• Idiomas principales:`, divCardX + 8 + colW, 71);
      pdf.setFont('helvetica', 'bold');
      pdf.text(isEn ? metaEn.languagesEn : group.meta.languages, divCardX + 8 + colW, 78);
      pdf.setFont('helvetica', 'normal');
      pdf.text(isEn ? `• KDP Edition: Premium Color Interior` : `• Edición KDP: Interior Color Premium`, divCardX + 8 + colW, 85);

      // Rasgos Vexilológicos y Heráldicos del Continente (Tarjeta oscura)
      pdf.setFillColor(15, 23, 42);
      pdf.roundedRect(divCardX, 103, divCardW, 44, 3, 3, 'F');
      pdf.setDrawColor(51, 65, 85);
      pdf.roundedRect(divCardX, 103, divCardW, 44, 3, 3, 'D');

      pdf.setTextColor(245, 158, 11);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.text(isEn ? 'REGIONAL HERALDIC & VEXILLOLOGICAL IDENTITY:' : 'IDENTIDAD HERÁLDICA & VEXILOLÓGICA REGIONAL:', divCardX + 8, 112);

      pdf.setTextColor(203, 213, 225);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.6);
      const splitHeraldic = pdf.splitTextToSize(isEn ? metaEn.heraldicCharacteristicsEn : group.meta.heraldicCharacteristics, divCardW - 16);
      pdf.text(splitHeraldic.slice(0, 3), divCardX + 8, 119);

      // Patrones clave envueltos para que no se desborden de los márgenes
      pdf.setTextColor(56, 189, 248);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.0);
      const keyPatternsText = isEn ? `Key elements: ${metaEn.keyElementsEn.join('   •   ')}` : `Patrones clave: ${group.meta.keyElements.join('   •   ')}`;
      const splitPatterns = pdf.splitTextToSize(keyPatternsText, divCardW - 16);
      pdf.text(splitPatterns.slice(0, 2), divCardX + 8, 139);

      // Mini-Índice Continental de Banderas en esta Sección (Tarjeta oscura)
      pdf.setFillColor(15, 23, 42);
      pdf.roundedRect(divCardX, 152, divCardW, 89, 3, 3, 'F');
      pdf.setDrawColor(51, 65, 85);
      pdf.roundedRect(divCardX, 152, divCardW, 89, 3, 3, 'D');

      pdf.setTextColor(245, 158, 11);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.2);
      pdf.text(isEn ? `SECTION FLAG DIRECTORY (${group.countries.length} NATIONS):` : `RELACIÓN DE BANDERAS DE ESTA SECCIÓN (${group.countries.length} NACIONES):`, divCardX + 8, 161);

      const miniCols = 3;
      const miniColW = (divCardW - 16) / miniCols;
      const maxRows = 11;

      group.countries.slice(0, miniCols * maxRows).forEach((c, cIdx) => {
        const cCol = Math.floor(cIdx / maxRows);
        const cRow = cIdx % maxRows;
        const mX = divCardX + 8 + cCol * miniColW;
        const mY = 169 + cRow * 6.3;
        const cPage = countryPageMap[c.id];

        const pageStr = `p.${cPage}`;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6.8);
        const pW = pdf.getTextWidth(pageStr);
        const maxNameW = Math.max(15, miniColW - pW - 6);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.8);
        pdf.setTextColor(226, 232, 240);
        let cNameClean = isEn ? (c.nameEn || c.nameEs) : c.nameEs;
        if (pdf.getTextWidth(cNameClean) > maxNameW) {
          while (cNameClean.length > 4 && pdf.getTextWidth(cNameClean + '…') > maxNameW) {
            cNameClean = cNameClean.slice(0, -1);
          }
          cNameClean = cNameClean + '…';
        }
        pdf.text(cNameClean, mX, mY);

        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(56, 189, 248);
        pdf.text(pageStr, mX + miniColW - 4, mY, { align: 'right' });
      });

      // Folio pie de portadilla dentro de los márgenes seguros KDP
      const divFooterY = isBleed ? 249 : (height - 18);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(isEn ? `WorldFlags • Section ${group.meta.roman}: ${contName}` : `MundoBanderas • Sección ${group.meta.roman}: ${group.continentName}`, pdiv.leftMargin + 4, divFooterY);
      pdf.setFont('helvetica', 'bold');
      pdf.text(isEn ? `Page ${dividerPageNum}` : `Página ${dividerPageNum}`, width - pdiv.rightMargin - 4, divFooterY, { align: 'right' });

      // ----------------------------------------------------
      // PÁGINAS DE PAÍSES DE ESTE CONTINENTE
      // ----------------------------------------------------
      for (const country of group.countries) {
        const pageNumber = countryPageMap[country.id];
        const { leftMargin, rightMargin, pageCenterX } = getPageMargins(pageNumber);

        if (onProgress) {
          onProgress(pageNumber, totalPages, isEn ? `Compiling Flag of ${country.nameEn}...` : `Compilando Bandera de ${country.nameEs}...`, isEn ? country.nameEn : country.nameEs);
        }

        pdf.addPage([width, height], 'portrait');

        // Fondo blanco nítido
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, width, height, 'F');

        // 1. Encabezado Superior (Running Header dentro de márgenes KDP)
        const headerY = isBleed ? 16.5 : 14.5;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.2);
        pdf.setTextColor(100, 116, 139);
        pdf.text(
          isEn
            ? `VEXILLOLOGICAL ENCYCLOPEDIA • SECTION ${group.meta.roman}: ${contName.toUpperCase()}`
            : `ENCICLOPEDIA VEXILOLÓGICA • SECCIÓN ${group.meta.roman}: ${group.continentName.toUpperCase()}`,
          leftMargin,
          headerY
        );
        pdf.text(isEn ? `ISO CODE: ${country.code3 || country.id.toUpperCase()}` : `CÓDIGO ISO: ${country.code3 || country.id.toUpperCase()}`, width - rightMargin, headerY, { align: 'right' });

        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.line(leftMargin, headerY + 2.0, width - rightMargin, headerY + 2.0);

        // 2. Título Superior con Nombre Oficial del País
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.2);
        pdf.setTextColor(2, 132, 199);
        pdf.text(isEn ? 'SOVEREIGN NATIONAL FLAG' : 'PABELLÓN NACIONAL SOBERANO', pageCenterX, 21.5, { align: 'center' });

        pdf.setTextColor(15, 23, 42); // slate-900
        pdf.setFont('helvetica', 'bold');
        const countryUpper = isEn ? (country.nameEn || country.nameEs).toUpperCase() : country.nameEs.toUpperCase();
        const headerFontSize = countryUpper.length > 25 ? 15 : countryUpper.length > 18 ? 17.5 : 21;
        pdf.setFontSize(headerFontSize);
        pdf.text(countryUpper, pageCenterX, 28, { align: 'center' });

        // Subtítulo: Nombre en Inglés / Español • Código ISO • Continente
        pdf.setTextColor(71, 85, 105);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.8);
        const subName = isEn ? country.nameEs : country.nameEn;
        const isoLabel = isEn ? 'ISO CODE' : 'CÓDIGO ISO';
        pdf.text(
          `${subName}   •   ${isoLabel}: ${country.code3 || country.id.toUpperCase()}   •   ${contName.toUpperCase()}`,
          pageCenterX,
          33.5,
          { align: 'center' }
        );

        // 3. Bandera Vectorial SVG incrustada a 300+ DPI
        const flagAreaW = contentWidth;
        const flagAreaH = 104;
        const flagAreaX = leftMargin;
        const flagAreaY = 36;

        await this.embedFlagImageOrVector(pdf, country, flagAreaX, flagAreaY, flagAreaW, flagAreaH);

        // Cartela Oficial con el Nombre del País y Proporción
        const cartoucheY = flagAreaY + flagAreaH + 3.2;
        const cartoucheW = Math.min(148, contentWidth);
        const cartoucheX = pageCenterX - cartoucheW / 2;
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(cartoucheX, cartoucheY, cartoucheW, 7.8, 2, 2, 'F');
        pdf.setDrawColor(203, 213, 225);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(cartoucheX, cartoucheY, cartoucheW, 7.8, 2, 2, 'D');

        const cartoucheText = isEn
          ? `OFFICIAL FLAG OF ${country.nameEn.toUpperCase()} • ${country.code3 || country.id.toUpperCase()}`
          : `BANDERA OFICIAL DE ${country.nameEs.toUpperCase()} • ${country.code3 || country.id.toUpperCase()}`;
        pdf.setFont('helvetica', 'bold');
        let cartoucheFontSize = 7.8;
        pdf.setFontSize(cartoucheFontSize);
        while (pdf.getTextWidth(cartoucheText) > cartoucheW - 8 && cartoucheFontSize > 5.5) {
          cartoucheFontSize -= 0.4;
          pdf.setFontSize(cartoucheFontSize);
        }
        pdf.setTextColor(15, 23, 42);
        pdf.text(cartoucheText, pageCenterX, cartoucheY + 5.2, { align: 'center' });

        // 4. Tarjetas de Datos Demográficos y de Soberanía (Grid 2x2)
        const infoStartY = cartoucheY + 11.5;
        const cardW = (contentWidth - 6) / 2;
        const cardH = 15;
        const cardRow1Y = infoStartY;
        const cardRow2Y = cardRow1Y + cardH + 3.2;

        // Tarjeta 1: Capital de Estado
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(leftMargin, cardRow1Y, cardW, cardH, 2, 2, 'F');
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(leftMargin, cardRow1Y, cardW, cardH, 2, 2, 'D');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(2, 132, 199);
        pdf.text(isEn ? '★ NATIONAL CAPITAL' : '★ CAPITAL NACIONAL', leftMargin + 5, cardRow1Y + 5);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.setTextColor(15, 23, 42);
        const rawCap = isEn ? (country.capitalEn || country.capitalEs || 'Official capital') : (country.capitalEs || country.capitalEn || 'Capital oficial');
        const cleanCap = pdf.getTextWidth(rawCap) > cardW - 10 ? pdf.splitTextToSize(rawCap, cardW - 10)[0] : rawCap;
        pdf.text(cleanCap, leftMargin + 5, cardRow1Y + 11);

        // Tarjeta 2: Continente y Coordenadas Geográficas
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(leftMargin + cardW + 6, cardRow1Y, cardW, cardH, 2, 2, 'F');
        pdf.setDrawColor(226, 232, 240);
        pdf.roundedRect(leftMargin + cardW + 6, cardRow1Y, cardW, cardH, 2, 2, 'D');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(16, 185, 129);
        pdf.text(isEn ? 'LOCATION & COORDINATES' : 'UBICACIÓN Y COORDENADAS', leftMargin + cardW + 11, cardRow1Y + 5);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.2);
        pdf.setTextColor(15, 23, 42);
        const coordStr = `${contName} • Lat: ${country.lat.toFixed(1)}°, Lng: ${country.lng.toFixed(1)}°`;
        const cleanCoord = pdf.getTextWidth(coordStr) > cardW - 14 ? pdf.splitTextToSize(coordStr, cardW - 14)[0] : coordStr;
        pdf.text(cleanCoord, leftMargin + cardW + 11, cardRow1Y + 11);

        // Tarjeta 3: Población y Superficie
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(leftMargin, cardRow2Y, cardW, cardH, 2, 2, 'F');
        pdf.setDrawColor(226, 232, 240);
        pdf.roundedRect(leftMargin, cardRow2Y, cardW, cardH, 2, 2, 'D');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(217, 119, 6);
        pdf.text(isEn ? 'POPULATION & LAND AREA' : 'POBLACIÓN Y SUPERFICIE', leftMargin + 5, cardRow2Y + 5);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.2);
        pdf.setTextColor(15, 23, 42);
        const popLabel = isEn ? 'inhab.' : 'hab.';
        const popStr = country.population
          ? (country.population >= 1000000 ? `${(country.population / 1000000).toFixed(1)}M ${popLabel}` : `${country.population.toLocaleString()} ${popLabel}`)
          : (isEn ? 'Sovereign territory' : 'Soberanía oficial');
        const areaStr = country.areaKm2 ? ` • ${country.areaKm2.toLocaleString()} km²` : '';
        const rawPopArea = `${popStr}${areaStr}`;
        const cleanPopArea = pdf.getTextWidth(rawPopArea) > cardW - 10 ? pdf.splitTextToSize(rawPopArea, cardW - 10)[0] : rawPopArea;
        pdf.text(cleanPopArea, leftMargin + 5, cardRow2Y + 11);

        // Tarjeta 4: Moneda e Idiomas
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(leftMargin + cardW + 6, cardRow2Y, cardW, cardH, 2, 2, 'F');
        pdf.setDrawColor(226, 232, 240);
        pdf.roundedRect(leftMargin + cardW + 6, cardRow2Y, cardW, cardH, 2, 2, 'D');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(139, 92, 246);
        pdf.text(isEn ? 'OFFICIAL CURRENCY & LANGUAGES' : 'MONEDA E IDIOMA OFICIAL', leftMargin + cardW + 11, cardRow2Y + 5);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.2);
        pdf.setTextColor(15, 23, 42);
        const translatedLang = isEn
          ? KdpTranslationService.translateLanguage(country.language, country.id)
          : (country.language || 'Idioma oficial');
        const translatedCurr = isEn
          ? KdpTranslationService.translateCurrency(country.currency, country.id)
          : (country.currency || 'Moneda oficial');
        const rawLangCurr = translatedCurr && translatedLang
          ? `${translatedCurr} • ${translatedLang}`
          : (translatedCurr || translatedLang);
        const cleanLangCurr = pdf.getTextWidth(rawLangCurr) > cardW - 14 ? pdf.splitTextToSize(rawLangCurr, cardW - 14)[0] : rawLangCurr;
        pdf.text(cleanLangCurr, leftMargin + cardW + 11, cardRow2Y + 11);

        // 5. Caja de Heráldica y Significado de los Colores
        const symbolY = cardRow2Y + cardH + 4;
        pdf.setFillColor(254, 252, 232); // Tono cálido heráldico
        pdf.roundedRect(leftMargin, symbolY, contentWidth, 18, 2, 2, 'F');
        pdf.setDrawColor(253, 230, 138);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(leftMargin, symbolY, contentWidth, 18, 2, 2, 'D');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.2);
        pdf.setTextColor(180, 83, 9);
        pdf.text(isEn ? 'HERALDIC SYMBOLISM & STATE COLORS' : 'SIGNIFICADO HERÁLDICO Y COLORES DE ESTADO', leftMargin + 6, symbolY + 5);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.6);
        pdf.setTextColor(71, 85, 105);
        const symbolText = isEn
          ? KdpTranslationService.translateSymbolism(country)
          : (country.flagSymbolismEs || `Pabellón nacional oficial con proporción geométrica reglamentaria. Colores de estado aprobados constitucionalmente y registrados de conformidad con las normativas internacionales de vexilología.`);
        const splitLines = pdf.splitTextToSize(symbolText, contentWidth - 12);
        pdf.text(splitLines.slice(0, 2), leftMargin + 6, symbolY + 10.2);

        // 6. Caja de Efeméride o Curiosidad Vexilológica
        const triviaY = symbolY + 21;
        pdf.setFillColor(240, 249, 255); // Sky light
        pdf.roundedRect(leftMargin, triviaY, contentWidth, 16, 2, 2, 'F');
        pdf.setDrawColor(186, 230, 253);
        pdf.roundedRect(leftMargin, triviaY, contentWidth, 16, 2, 2, 'D');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(2, 132, 199);
        pdf.text(isEn ? 'HISTORICAL FACT & VEXILLOLOGICAL TRIVIA' : 'DATO HISTÓRICO Y EFEMÉRIDE VEXILOLÓGICA', leftMargin + 6, triviaY + 4.8);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.3);
        pdf.setTextColor(51, 65, 85);
        const triviaText = isEn
          ? KdpTranslationService.translateFunFact(country)
          : (country.funFactEs || `Diseño vexilológico tradicional respetado internacionalmente, símbolo de soberanía y representatividad democrática en organismos mundiales como las Naciones Unidas.`);
        const splitTrivia = pdf.splitTextToSize(triviaText, contentWidth - 12);
        pdf.text(splitTrivia.slice(0, 2), leftMargin + 6, triviaY + 9.8);

        // 7. Pie de Página (Running Footer con Folio KDP alternado)
        const countryFooterY = isBleed ? 250 : (height - 18);
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.line(leftMargin, countryFooterY - 3.5, width - rightMargin, countryFooterY - 3.5);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.8);
        pdf.setTextColor(148, 163, 184);
        const footerCountryName = isEn ? country.nameEn : country.nameEs;
        const publisherName = isEn ? 'WorldFlags' : 'MundoBanderas';
        const flagOfText = isEn ? 'National Flag of' : 'Pabellón Nacional de';
        const pageWord = isEn ? 'Page' : 'Página';
        pdf.text(`${publisherName} • ${flagOfText} ${footerCountryName}`, leftMargin, countryFooterY);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(15, 23, 42);
        pdf.text(`${pageWord} ${pageNumber}`, width - rightMargin, countryFooterY, { align: 'right' });
      }
    }

    // ==========================================
    // APÉNDICE VEXILOLÓGICO & GLOSARIO
    // ==========================================
    if (onProgress) onProgress(appendixPageNumber, totalPages, isEn ? 'Generating Vexillological Appendix...' : 'Generando Apéndice Vexilológico...', isEn ? 'Appendix' : 'Apéndice');

    pdf.addPage([width, height], 'portrait');
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, width, height, 'F');

    const pap = getPageMargins(appendixPageNumber);

    // Encabezado
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(isEn ? 'VEXILLOLOGICAL ENCYCLOPEDIA • TECHNICAL APPENDIX' : 'ENCICLOPEDIA VEXILOLÓGICA • APÉNDICE TÉCNICO', pap.leftMargin, 14);
    pdf.text(isEn ? 'GLOSSARY' : 'GLOSARIO', width - pap.rightMargin, 14, { align: 'right' });
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.line(pap.leftMargin, 16.5, width - pap.rightMargin, 16.5);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(15, 23, 42);
    pdf.text(isEn ? 'GLOSSARY AND FUNDAMENTAL CONCEPTS OF VEXILLOLOGY' : 'GLOSARIO Y CONCEPTOS FUNDAMENTALES DE VEXILOLOGÍA', pap.pageCenterX, 27, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(isEn ? 'Quick guide to the accurate interpretation of sovereign flags and state standards' : 'Guía rápida para la correcta interpretación de los pabellones y estandartes de estado', pap.pageCenterX, 33, { align: 'center' });

    // Cuadros temáticos del Glosario
    let glossY = 42;
    const glossBoxW = (contentWidth - 8) / 2;

    // Cuadro 1: Anatomía
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(pap.leftMargin, glossY, glossBoxW, 58, 2, 2, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(pap.leftMargin, glossY, glossBoxW, 58, 2, 2, 'D');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(2, 132, 199);
    pdf.text(isEn ? '1. ANATOMY OF A FLAG' : '1. PARTES DE UNA BANDERA', pap.leftMargin + 6, glossY + 7);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(51, 65, 85);
    if (isEn) {
      pdf.text('• Hoist: Edge adjacent to the flagpole or halyard.', pap.leftMargin + 6, glossY + 16);
      pdf.text('• Canton: Upper hoist quarter reserved for sovereign emblems.', pap.leftMargin + 6, glossY + 24);
      pdf.text('• Fly: Outer free-floating half opposite the hoist.', pap.leftMargin + 6, glossY + 32);
      pdf.text('• Field: Primary textile body and color area of the standard.', pap.leftMargin + 6, glossY + 40);
      pdf.text('• Coat of arms: Official national emblem or heraldic charge.', pap.leftMargin + 6, glossY + 48);
    } else {
      pdf.text('• Vaina / Driza: Lado junto al mástil por donde se iza.', pap.leftMargin + 6, glossY + 16);
      pdf.text('• Cantón: Cuadrante superior izquierdo de honor.', pap.leftMargin + 6, glossY + 24);
      pdf.text('• Mosca: Extremo flotante opuesto a la driza.', pap.leftMargin + 6, glossY + 32);
      pdf.text('• Paño / Vexilo: Cuerpo textil general del estandarte.', pap.leftMargin + 6, glossY + 40);
      pdf.text('• Escudo heráldico: Emblema nacional de estado.', pap.leftMargin + 6, glossY + 48);
    }

    // Cuadro 2: Proporciones
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(pap.leftMargin + glossBoxW + 8, glossY, glossBoxW, 58, 2, 2, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(pap.leftMargin + glossBoxW + 8, glossY, glossBoxW, 58, 2, 2, 'D');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(16, 185, 129);
    pdf.text(isEn ? '2. OFFICIAL PROPORTIONS' : '2. PROPORCIONES REGLAMENTARIAS', pap.leftMargin + glossBoxW + 14, glossY + 7);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(51, 65, 85);
    if (isEn) {
      pdf.text('• 2:3 (Most common worldwide): Spain, France, Italy, Japan.', pap.leftMargin + glossBoxW + 14, glossY + 16);
      pdf.text('• 1:2 (British and maritime standard): United Kingdom, Australia, Canada.', pap.leftMargin + glossBoxW + 14, glossY + 24);
      pdf.text('• 3:5 (Central European): Germany, El Salvador, Nicaragua.', pap.leftMargin + glossBoxW + 14, glossY + 32);
      pdf.text('• 1:1 (Square format): Switzerland and Vatican City State.', pap.leftMargin + glossBoxW + 14, glossY + 40);
      pdf.text('• Unique non-quadrilateral: Double-pennon flag of Nepal.', pap.leftMargin + glossBoxW + 14, glossY + 48);
    } else {
      pdf.text('• 2:3 (La más común): España, Francia, Italia, Japón.', pap.leftMargin + glossBoxW + 14, glossY + 16);
      pdf.text('• 1:2 (Británica e insular): Reino Unido, Australia, Canadá.', pap.leftMargin + glossBoxW + 14, glossY + 24);
      pdf.text('• 3:5 (Centroeuropea): Alemania, El Salvador, Nicaragua.', pap.leftMargin + glossBoxW + 14, glossY + 32);
      pdf.text('• 1:1 (Cuadrada): Suiza y Estado de la Ciudad del Vaticano.', pap.leftMargin + glossBoxW + 14, glossY + 40);
      pdf.text('• Caso único no rectangular: Pabellón doble de Nepal.', pap.leftMargin + glossBoxW + 14, glossY + 48);
    }

    // Cuadro 3: Familias Vexilológicas
    glossY += 65;
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(pap.leftMargin, glossY, contentWidth, 70, 2, 2, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(pap.leftMargin, glossY, contentWidth, 70, 2, 2, 'D');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(217, 119, 6);
    pdf.text(isEn ? '3. MAJOR CHROMATIC FAMILIES AND VEXILLOLOGICAL TRADITIONS' : '3. PRINCIPALES FAMILIAS Y PATRONES CROMÁTICOS EN EL MUNDO', pap.leftMargin + 6, glossY + 8);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.6);
    pdf.setTextColor(51, 65, 85);
    if (isEn) {
      pdf.text('• Pan-African Colors (Green, Yellow, Red): Inspired by the Ethiopian flag, symbolizing fertility, wealth, and sacrifice.', pap.leftMargin + 6, glossY + 18);
      pdf.text('• Pan-Arab Colors (Black, White, Green, Red): Commemorating Abbasid, Umayyad, Fatimid, and Hashemite dynasties.', pap.leftMargin + 6, glossY + 28);
      pdf.text('• Pan-Slavic Colors (Red, White, Blue): Adopted at the 1848 Prague Slavic Congress for Eastern and Southern Europe.', pap.leftMargin + 6, glossY + 38);
      pdf.text('• Nordic Crosses: Shared Scandinavian Christian heritage (Denmark, Sweden, Norway, Finland, and Iceland).', pap.leftMargin + 6, glossY + 48);
      pdf.text('• Suns of May / Liberator Stripes: South American independence tradition (Argentina and Uruguay).', pap.leftMargin + 6, glossY + 58);
    } else {
      pdf.text('• Colores Panafricanos (Verde, Amarillo, Rojo): Inspirados en la bandera etíope, simbolizan tierra, riquezas y sangre.', pap.leftMargin + 6, glossY + 18);
      pdf.text('• Colores Panárabes (Negro, Blanco, Verde, Rojo): Dinastías abasí, omeya, fatimí y hachemí del mundo árabe.', pap.leftMargin + 6, glossY + 28);
      pdf.text('• Colores Paneslavos (Rojo, Blanco, Azul): Adoptados en el Congreso Eslavo de Praga de 1848 para Europa del Este.', pap.leftMargin + 6, glossY + 38);
      pdf.text('• Cruces Nórdicas: Tradición escandinava compartida (Dinamarca, Suecia, Noruega, Finlandia e Islandia).', pap.leftMargin + 6, glossY + 48);
      pdf.text('• Soles de Mayo / Banderas Libertadores: Tradición rioplatense y andina en Sudamérica (Argentina y Uruguay).', pap.leftMargin + 6, glossY + 58);
    }

    // Pie del Apéndice dentro de márgenes reglamentarios KDP
    const appendixFooterY = isBleed ? 250 : (height - 18);
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.line(pap.leftMargin, appendixFooterY - 3.5, width - pap.rightMargin, appendixFooterY - 3.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(isEn ? 'WorldFlags • Vexillological Appendix' : 'MundoBanderas • Apéndice Vexilológico', pap.leftMargin, appendixFooterY);
    pdf.setFont('helvetica', 'bold');
    pdf.text(isEn ? `Page ${appendixPageNumber}` : `Página ${appendixPageNumber}`, width - pap.rightMargin, appendixFooterY, { align: 'right' });

    // ==========================================
    // CONTRAPORTADA / CIERRE EDITORIAL (KDP)
    // ==========================================
    if (onProgress) onProgress(backCoverPageNumber, totalPages, isEn ? 'Generating Editorial Colophon and Summary...' : 'Generando Cierre Editorial y Colofón KDP...', isEn ? 'Colophon' : 'Colofón');

    pdf.addPage([width, height], 'portrait');

    const pback = getPageMargins(backCoverPageNumber);

    // Fondo editorial según KDP G201857950
    if (isBleed) {
      pdf.setFillColor(11, 19, 41); // #0b1329
      pdf.rect(0, 0, width, height, 'F');
    } else {
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, width, height, 'F');
      pdf.setFillColor(11, 19, 41);
      pdf.rect(pback.leftMargin, topMargin, contentWidth, height - topMargin - bottomMargin, 'F');
    }

    // Doble marco dorado dentro de márgenes seguros KDP
    const backFrameX = pback.leftMargin + 1.5;
    const backFrameY = topMargin + 1.5;
    const backFrameW = contentWidth - 3.0;
    const backFrameH = height - topMargin - bottomMargin - 3.0;
    pdf.setDrawColor(217, 119, 6);
    pdf.setLineWidth(1.4);
    pdf.rect(backFrameX, backFrameY, backFrameW, backFrameH);
    pdf.setLineWidth(0.5);
    pdf.rect(backFrameX + 1.8, backFrameY + 1.8, backFrameW - 3.6, backFrameH - 3.6);

    pdf.setTextColor(245, 158, 11);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text(isEn ? 'WORLD FLAG ATLAS & SOVEREIGN NATIONS' : 'ATLAS MUNDIAL DE BANDERAS Y NACIONES', pback.pageCenterX, 32, { align: 'center' });

    pdf.setTextColor(203, 213, 225);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.text(isEn ? 'The Definitive Vexillological and Geographic Guide for Collectors, Educators, and Students' : 'La Guía Vexilológica y Geográfica Definitiva para Coleccionistas, Docentes y Estudiantes', pback.pageCenterX, 40, { align: 'center' });

    // Sinopsis para Amazon KDP (Tarjeta oscura original)
    const backCardX = pback.leftMargin + 6;
    const backCardW = contentWidth - 12;
    pdf.setFillColor(15, 23, 42); // slate-900 / dark card
    pdf.roundedRect(backCardX, 48, backCardW, 76, 4, 4, 'F');
    pdf.setDrawColor(51, 65, 85);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(backCardX, 48, backCardW, 76, 4, 4, 'D');

    pdf.setTextColor(245, 158, 11);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.text(isEn ? 'WHAT MAKES THIS CONTINENTAL EDITION UNIQUE?' : '¿QUÉ HACE ÚNICA A ESTA EDICIÓN CLASIFICADA POR CONTINENTES?', pback.pageCenterX, 58, { align: 'center' });

    pdf.setTextColor(226, 232, 240);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.8);
    const blurb = isEn
      ? [
          '• Structured across 5 major continental sections: Europe, Americas, Asia, Africa, and Oceania.',
          '• Continental divider plates illustrated with demographics, land area, and heraldic identity.',
          '• Complete catalog featuring the official flag of every sovereign state in 300+ DPI vector SVG.',
          '• Official state names in English, native denomination, ISO 3166-1 alpha-3 code, and capital.',
          '• Heraldic profile explaining civic color meanings, constitutional symbolism, and proportions.',
          '• Formatted strictly in compliance with Amazon Kindle Direct Publishing print safety standards.'
        ]
      : [
          '• Estructura ordenada en 5 grandes secciones geográficas: Europa, América, Asia, África y Oceanía.',
          '• Portadillas continentales ilustradas con estadísticas de población, superficie e identidad heráldica.',
          '• Catálogo íntegro con la bandera oficial de cada estado soberano en gráfico vectorial SVG de 300+ DPI.',
          '• Incorpora el nombre oficial en español, denominación internacional en inglés, código ISO y capital.',
          '• Ficha heráldica con explicación del significado cívico de colores y proporción reglamentaria.',
          '• Formateado estrictamente bajo normativas de márgenes seguros de Amazon Kindle Direct Publishing.'
        ];
    blurb.forEach((line, lIdx) => {
      pdf.text(line, backCardX + 8, 68 + lIdx * 8.5);
    });

    // Rosa de los vientos en la contraportada (bajado para evitar colisión con el cuadro de texto)
    this.drawVectorCompass(pdf, pback.pageCenterX, 172, 25, true);

    // Bloque elegante de cierre editorial y colofón
    const colophonY = isBleed ? 210 : 215;
    pdf.setFillColor(15, 23, 42); // slate-900 / dark card
    const colophonW = contentWidth - 16;
    const colophonX = pback.leftMargin + 8;
    pdf.roundedRect(colophonX, colophonY, colophonW, 36, 3, 3, 'F');
    pdf.setDrawColor(51, 65, 85);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(colophonX, colophonY, colophonW, 36, 3, 3, 'D');

    pdf.setTextColor(245, 158, 11);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.2);
    pdf.text(isEn ? 'WORLDFLAGS PUBLISHING • EDITORIAL COLOPHON' : 'EDITORIAL MUNDOBANDERAS • COLOFÓN EDITORIAL', pback.pageCenterX, colophonY + 9, { align: 'center' });

    pdf.setTextColor(203, 213, 225);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.2);
    if (isEn) {
      pdf.text('Geographic and Vexillological Encyclopedic Edition in High-Definition Vector Format.', pback.pageCenterX, colophonY + 16, { align: 'center' });
      pdf.text('Produced under print-on-demand publishing standards for Amazon Kindle Direct Publishing (KDP).', pback.pageCenterX, colophonY + 22, { align: 'center' });
      pdf.text('Printed on premium white bond paper • Full-color interior • All rights reserved © 2026', pback.pageCenterX, colophonY + 29, { align: 'center' });
    } else {
      pdf.text('Edición Enciclopédica Geográfica y Vexilológica en Formato Vectorial de Alta Definición.', pback.pageCenterX, colophonY + 16, { align: 'center' });
      pdf.text('Producido bajo estándares editoriales de impresión bajo demanda para Amazon Kindle Direct Publishing (KDP).', pback.pageCenterX, colophonY + 22, { align: 'center' });
      pdf.text('Impreso en papel bond blanco premium • Interior a todo color • Todos los derechos reservados © 2026', pback.pageCenterX, colophonY + 29, { align: 'center' });
    }

    return pdf;
  }

  /**
   * Construye la CUBIERTA COMPLETA (Full Wrap Cover) con lomo exacto calculada para Amazon KDP
   * Dimensiones exactas = Sangría (0.125") + Contraportada (8.5") + Lomo + Portada (8.5") + Sangría (0.125")
   */
  public static async buildFullWrapCoverPdfDocument(
    countries: Country[],
    paperSize: 'letter' | 'a4' = 'letter',
    onProgress?: KdpProgressCallback,
    options: { lang?: 'es' | 'en'; bookFormat?: 'paperback' | 'hardcover' } = { lang: 'es', bookFormat: 'paperback' }
  ): Promise<jsPDF> {
    const isEn = options.lang === 'en';
    const isHardcover = options.bookFormat === 'hardcover';

    if (onProgress) {
      onProgress(1, 1, isEn ? 'Calculating spine and official KDP cover dimensions...' : 'Calculando lomo y dimensiones oficiales de cubierta KDP...', isEn ? 'Cover' : 'Cubierta');
    }

    const meta = isEn
      ? KdpTranslationService.generateEnglishListingMetadata(countries, options.bookFormat || 'paperback')
      : (isHardcover ? KdpTranslationService.generateSpanishHardcoverListingMetadata(countries) : AmazonKdpService.generateListingMetadata(countries));

    const isLetter = paperSize === 'letter';
    const trimW = isHardcover ? 209.55 : (isLetter ? 215.9 : 210.0); // 8.25" para tapa dura KDP estándar
    const trimH = isLetter ? 279.4 : 297.0;

    let totalCoverWidth: number;
    let totalCoverHeight: number;
    let backX: number;
    let backY: number;
    let spineX: number;
    let spineY: number;
    let frontX: number;
    let frontY: number;
    let spineWidthMm = meta.bookSpecifications.spineWidthMm;

    if (isHardcover) {
      // Normativa oficial Amazon KDP Case Laminate (Tapa Dura):
      // - Sangría de forrado (Turn-in): 15.0 mm (0.591") en los 4 bordes
      // - Hendidura de bisagra (Hinge): 10.0 mm (0.394") a cada lado del lomo
      // - Ceja de cartón rígido (Board overhang): 3.175 mm (0.125")
      const turnInMm = 15.0;
      const hingeMm = 10.0;
      const boardOverhangMm = 3.175;
      const boardW = trimW + boardOverhangMm;
      const boardH = trimH + boardOverhangMm * 2;

      totalCoverWidth = turnInMm + boardW + hingeMm + spineWidthMm + hingeMm + boardW + turnInMm;
      totalCoverHeight = turnInMm + boardH + turnInMm;

      backX = turnInMm;
      backY = turnInMm;
      spineX = turnInMm + boardW + hingeMm;
      spineY = turnInMm;
      frontX = spineX + spineWidthMm + hingeMm;
      frontY = turnInMm;
    } else {
      // Normativa oficial Amazon KDP Paperback (Tapa Blanda):
      const bleedMm = 3.175; // 0.125 in sangría reglamentaria KDP
      totalCoverWidth = bleedMm + trimW + spineWidthMm + trimW + bleedMm;
      totalCoverHeight = bleedMm + trimH + bleedMm;

      backX = bleedMm;
      backY = bleedMm;
      spineX = bleedMm + trimW;
      spineY = bleedMm;
      frontX = bleedMm + trimW + spineWidthMm;
      frontY = bleedMm;
    }

    const coverPdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [totalCoverHeight, totalCoverWidth],
      compress: true
    });

    // Incrustar fuentes TrueType físicas para cumplimiento riguroso de Amazon KDP
    embedKdpCompliantFonts(coverPdf);

    // Fondo global azul marino imperial
    coverPdf.setFillColor(10, 25, 47);
    coverPdf.rect(0, 0, totalCoverWidth, totalCoverHeight, 'F');

    // ----------------------------------------------------
    // 1. CONTRAPORTADA (PANEL IZQUIERDO)
    // ----------------------------------------------------
    // Marco dorado contraportada
    coverPdf.setDrawColor(217, 119, 6);
    coverPdf.setLineWidth(1.2);
    coverPdf.rect(backX + 12, backY + 12, trimW - 24, trimH - 24);
    coverPdf.setLineWidth(0.4);
    coverPdf.rect(backX + 14, backY + 14, trimW - 28, trimH - 28);

    coverPdf.setTextColor(245, 158, 11);
    coverPdf.setFont('helvetica', 'bold');
    coverPdf.setFontSize(12);
    coverPdf.text(
      isEn ? 'WORLD FLAG ATLAS & SOVEREIGN NATIONS' : 'ATLAS MUNDIAL DE BANDERAS Y NACIONES',
      backX + trimW / 2,
      backY + 30,
      { align: 'center' }
    );

    coverPdf.setTextColor(226, 232, 240);
    coverPdf.setFont('helvetica', 'normal');
    coverPdf.setFontSize(8.5);
    coverPdf.text(
      isEn
        ? 'The definitive reference work on sovereign standards and world state flags'
        : 'La obra visual de referencia sobre pabellones de estado y soberanía mundial',
      backX + trimW / 2,
      backY + 37,
      { align: 'center' }
    );

    // Sinopsis comercial
    coverPdf.setFillColor(15, 23, 42);
    coverPdf.roundedRect(backX + 20, backY + 46, trimW - 40, 72, 3, 3, 'F');
    coverPdf.setDrawColor(51, 65, 85);
    coverPdf.roundedRect(backX + 20, backY + 46, trimW - 40, 72, 3, 3, 'D');

    coverPdf.setTextColor(245, 158, 11);
    coverPdf.setFont('helvetica', 'bold');
    coverPdf.setFontSize(9);
    coverPdf.text(
      isEn
        ? (isHardcover ? 'DELUXE HARDCOVER CONTINENTAL EDITION:' : 'ENCYCLOPEDIC CONTINENTAL EDITION:')
        : (isHardcover ? 'EDICIÓN COLECCIONISTA EN TAPA DURA:' : 'EDICIÓN ENCICLOPÉDICA CLASIFICADA POR CONTINENTES:'),
      backX + 26,
      backY + 56
    );

    coverPdf.setTextColor(203, 213, 225);
    coverPdf.setFont('helvetica', 'normal');
    coverPdf.setFontSize(7.5);
    const backBullets = isEn
      ? [
          `• 5 Continental Sections: Europe, Americas, Asia, Africa, and Oceania with dividers.`,
          `• ${countries.length} sovereign state flags rendered in high-definition SVG vector format (300+ DPI).`,
          `• Official country names in English and native, capitals, coordinates, and proportions.`,
          `• Sovereign demographics: population, land area in km², legal currency, and languages.`,
          `• Detailed heraldic analysis explaining color meanings, crosses, stars, and emblems.`,
          `• Precision-formatted to strictly satisfy Amazon Kindle Direct Publishing print rules.`
        ]
      : [
          `• 5 Secciones Continentales: Europa, América, Asia, África y Oceanía con portadillas.`,
          `• ${countries.length} banderas de estados soberanos incrustadas en SVG vectorial (300+ DPI).`,
          `• Nombre oficial en español e inglés, capital, coordenadas y proporción reglamentaria.`,
          `• Ficha de datos demográficos: población, extensión en km², moneda e idiomas oficiales.`,
          `• Explicación del simbolismo de cada color, sol, estrella, cruz y escudo heráldico.`,
          `• Ajustado milimétricamente para cumplir las directrices de impresión de Amazon KDP.`
        ];
    backBullets.forEach((bullet, bIdx) => {
      coverPdf.text(bullet, backX + 26, backY + 65 + bIdx * 8);
    });

    // Rosa de los Vientos en contraportada (bajado para no verse encima del cuadro de texto)
    this.drawVectorCompass(coverPdf, backX + trimW / 2, backY + 168, 22, true);

    // Área limpia reservada para Código de Barras KDP (50.8 mm x 31.8 mm)
    const barcodeW = 50.8;
    const barcodeH = 31.8;
    const barcodeX = backX + trimW - 16 - barcodeW;
    const barcodeY = backY + trimH - 16 - barcodeH;

    coverPdf.setFillColor(255, 255, 255);
    coverPdf.rect(barcodeX, barcodeY, barcodeW, barcodeH, 'F');

    // Créditos pie de contraportada
    coverPdf.setTextColor(148, 163, 184);
    coverPdf.setFont('helvetica', 'normal');
    coverPdf.setFontSize(7.5);
    coverPdf.text(
      isEn ? 'WorldFlags Publishing • International Edition' : 'MundoBanderas Editorial • Edición Internacional',
      backX + 20,
      backY + trimH - 26
    );
    coverPdf.text(
      isEn
        ? `Print on demand on White Paper • Full-Color Interior • ${isHardcover ? 'Hardcover Case Laminate' : 'Paperback'}`
        : `Impreso bajo demanda en Papel Bond Blanco • Interior a Color • ${isHardcover ? 'Tapa Dura Case Laminate' : 'Tapa Blanda'}`,
      backX + 20,
      backY + trimH - 20
    );

    // ----------------------------------------------------
    // 2. LOMO CENTRAL (SPINE)
    // ----------------------------------------------------
    coverPdf.setFillColor(7, 17, 32);
    coverPdf.rect(spineX, 0, spineWidthMm, totalCoverHeight, 'F');

    // Líneas separadoras de lomo sutiles
    coverPdf.setDrawColor(217, 119, 6);
    coverPdf.setLineWidth(0.3);
    coverPdf.line(spineX, 0, spineX, totalCoverHeight);
    coverPdf.line(spineX + spineWidthMm, 0, spineX + spineWidthMm, totalCoverHeight);

    // Texto vertical en el lomo si tiene grosor suficiente (>= 7 mm)
    if (spineWidthMm >= 6.5) {
      coverPdf.saveGraphicsState();
      const textSpineX = spineX + spineWidthMm / 2 + 2;
      const textSpineY = spineY + trimH * 0.22;
      coverPdf.setFont('helvetica', 'bold');
      coverPdf.setFontSize(8.5);
      coverPdf.setTextColor(255, 255, 255);
      coverPdf.text(
        isEn
          ? `WORLD FLAG ATLAS & SOVEREIGN NATIONS   —   WORLDFLAGS PUBLISHING`
          : `ATLAS MUNDIAL DE BANDERAS Y NACIONES   —   MUNDOBANDERAS EDITORIAL`,
        textSpineX,
        textSpineY,
        { angle: -90 }
      );
      coverPdf.restoreGraphicsState();
    }

    // ----------------------------------------------------
    // 3. PORTADA FRONTAL (PANEL DERECHO)
    // ----------------------------------------------------
    // Doble marco dorado en portada frontal
    coverPdf.setDrawColor(217, 119, 6);
    coverPdf.setLineWidth(1.4);
    coverPdf.rect(frontX + 12, frontY + 12, trimW - 24, trimH - 24);
    coverPdf.setLineWidth(0.4);
    coverPdf.rect(frontX + 14, frontY + 14, trimW - 28, trimH - 28);

    // Encabezado institucional frontal
    coverPdf.setTextColor(245, 158, 11);
    coverPdf.setFont('helvetica', 'bold');
    coverPdf.setFontSize(10);
    coverPdf.text(
      isEn ? 'OFFICIAL GEOGRAPHICAL & VEXILLOLOGICAL ENCYCLOPEDIA' : 'ENCICLOPEDIA GEOGRÁFICA & VEXILOLÓGICA OFICIAL',
      frontX + trimW / 2,
      frontY + 30,
      { align: 'center' }
    );

    // Gran Título
    coverPdf.setTextColor(255, 255, 255);
    coverPdf.setFontSize(26);
    coverPdf.text(
      isEn ? 'WORLD FLAG ATLAS' : 'ATLAS MUNDIAL DE BANDERAS',
      frontX + trimW / 2,
      frontY + 46,
      { align: 'center' }
    );

    coverPdf.setTextColor(56, 189, 248);
    coverPdf.setFontSize(21);
    coverPdf.text(
      isEn ? 'CLASSIFIED BY CONTINENTS' : 'CLASIFICADO POR CONTINENTES',
      frontX + trimW / 2,
      frontY + 58,
      { align: 'center' }
    );

    coverPdf.setTextColor(203, 213, 225);
    coverPdf.setFont('helvetica', 'normal');
    coverPdf.setFontSize(9);
    coverPdf.text(
      isEn
        ? 'Visual Guide to Every Sovereign Nation in High-Definition SVG Vector Format'
        : 'Guía Visual de Todas las Naciones Soberanas en Formato Vectorial SVG',
      frontX + trimW / 2,
      frontY + 68,
      { align: 'center' }
    );

    // Gran Rosa de los Vientos en Portada Frontal
    this.drawVectorCompass(coverPdf, frontX + trimW / 2, frontY + 130, 42, true);

    // Bloque destacado de portada frontal
    coverPdf.setFillColor(15, 23, 42);
    coverPdf.roundedRect(frontX + 22, frontY + 192, trimW - 44, 52, 4, 4, 'F');
    coverPdf.setDrawColor(51, 65, 85);
    coverPdf.roundedRect(frontX + 22, frontY + 192, trimW - 44, 52, 4, 4, 'D');

    coverPdf.setTextColor(245, 158, 11);
    coverPdf.setFont('helvetica', 'bold');
    coverPdf.setFontSize(10.5);
    coverPdf.text(
      isEn
        ? (isHardcover ? `DELUXE HARDCOVER COLLECTOR'S EDITION • ${countries.length} NATIONS` : `AMAZON KDP COMMERCIAL EDITION • ${countries.length} NATIONS`)
        : (isHardcover ? `EDICIÓN DE COLECCIÓN EN TAPA DURA • ${countries.length} NACIONES` : `EDICIÓN COMERCIAL AMAZON KDP • ${countries.length} NACIONES`),
      frontX + trimW / 2,
      frontY + 203,
      { align: 'center' }
    );

    coverPdf.setTextColor(226, 232, 240);
    coverPdf.setFont('helvetica', 'normal');
    coverPdf.setFontSize(8.2);
    if (isEn) {
      coverPdf.text('• Continental Sections: Europe, Americas, Asia, Africa, and Oceania', frontX + trimW / 2, frontY + 212, { align: 'center' });
      coverPdf.text('• High-Definition Vector Graphics (300+ DPI) with Official Country Names', frontX + trimW / 2, frontY + 220, { align: 'center' });
      coverPdf.text('• Comprehensive Profiles: Capital, Heraldry, Currency, Population & Languages', frontX + trimW / 2, frontY + 228, { align: 'center' });
      coverPdf.text(`• Format: ${isHardcover ? '8.25 x 11 in Hardcover Case Laminate' : '8.5 x 11 in Letter'} • Full-Color Interior`, frontX + trimW / 2, frontY + 236, { align: 'center' });
    } else {
      coverPdf.text('• Secciones Continentales: Europa, América, Asia, África y Oceanía', frontX + trimW / 2, frontY + 212, { align: 'center' });
      coverPdf.text('• Gráficos Vectoriales de Alta Definición (300+ DPI) con Nombres Oficiales', frontX + trimW / 2, frontY + 220, { align: 'center' });
      coverPdf.text('• Fichas de Soberanía, Heráldica, Moneda, Población e Idiomas de Estado', frontX + trimW / 2, frontY + 228, { align: 'center' });
      coverPdf.text(`• Formato Estándar ${isHardcover ? '8.25 x 11 in Tapa Dura Case Laminate' : '8.5 x 11 pulgadas'} • Interior a Todo Color`, frontX + trimW / 2, frontY + 236, { align: 'center' });
    }

    // Sello inferior
    coverPdf.setTextColor(148, 163, 184);
    coverPdf.setFontSize(8);
    coverPdf.text(
      isEn
        ? 'WorldFlags Publishing • Amazon Kindle Direct Publishing'
        : 'MundoBanderas Editorial • Amazon Kindle Direct Publishing',
      frontX + trimW / 2,
      frontY + trimH - 18,
      { align: 'center' }
    );

    return coverPdf;
  }

  /**
   * Genera y descarga la CUBIERTA COMPLETA KDP (PDF de portada, lomo y contraportada)
   */
  public static async generateFullWrapCoverPdf(
    countries: Country[],
    paperSize: 'letter' | 'a4' = 'letter',
    onProgress?: KdpProgressCallback,
    options: { lang?: 'es' | 'en'; bookFormat?: 'paperback' | 'hardcover' } = { lang: 'es', bookFormat: 'paperback' }
  ): Promise<void> {
    const isEn = options.lang === 'en';
    const isHardcover = options.bookFormat === 'hardcover';
    const coverPdf = await this.buildFullWrapCoverPdfDocument(countries, paperSize, onProgress, options);

    let filename: string;
    if (isHardcover) {
      filename = isEn
        ? `World_Flag_Atlas_Hardcover_Case_Laminate_Cover_KDP_EN.pdf`
        : `Atlas_Mundial_Banderas_Cubierta_Tapa_Dura_Case_Laminate_KDP.pdf`;
    } else {
      filename = isEn
        ? `World_Flag_Atlas_Paperback_Cover_KDP_EN.pdf`
        : `Atlas_Mundial_Banderas_Cubierta_Completa_KDP_${paperSize}.pdf`;
    }

    coverPdf.save(filename);
  }

  /**
   * Genera y descarga la CUBIERTA DE TAPA DURA KDP (Case Laminate)
   */
  public static async generateHardcoverCoverPdf(
    countries: Country[],
    paperSize: 'letter' | 'a4' = 'letter',
    onProgress?: KdpProgressCallback,
    options: { lang?: 'es' | 'en' } = { lang: 'es' }
  ): Promise<void> {
    return this.generateFullWrapCoverPdf(countries, paperSize, onProgress, { ...options, bookFormat: 'hardcover' });
  }

  /**
   * PAQUETE AUTOMÁTICO 1-CLIC AMAZON KDP (ZIP):
   * Soporta Tapa Blanda y Tapa Dura, en Español o Inglés.
   */
  public static async generateKdpZipPackage(
    countries: Country[],
    paperSize: 'letter' | 'a4' = 'letter',
    onProgress?: KdpProgressCallback,
    options: { lang?: 'es' | 'en'; bookFormat?: 'paperback' | 'hardcover' } = { lang: 'es', bookFormat: 'paperback' }
  ): Promise<void> {
    const isEn = options.lang === 'en';
    const isHardcover = options.bookFormat === 'hardcover';

    if (onProgress) {
      onProgress(
        1,
        5,
        isEn
          ? `Compiling Interior PDF with Bleed (${isHardcover ? '8.25" x 11"' : '8.625" x 11.25"'})...`
          : `Compilando Manuscrito Interior con Sangría (${isHardcover ? '8.25" x 11"' : '8.625" x 11.25"'})...`,
        isEn ? 'Interior' : 'Interior'
      );
    }

    // 1. Compilar Interior PDF con Sangría
    const interiorPdfBleed = await this.buildInstantVectorPdfDocument(countries, paperSize, onProgress, {
      bleed: true,
      lang: options.lang || 'es',
      bookFormat: options.bookFormat || 'paperback'
    });
    const interiorBlobBleed = interiorPdfBleed.output('blob');

    if (onProgress) {
      onProgress(
        2,
        5,
        isEn
          ? `Compiling Interior PDF without Bleed (${isHardcover ? '8.25" x 11"' : '8.5" x 11.0"'})...`
          : `Compilando Manuscrito Interior sin Sangría (${isHardcover ? '8.25" x 11"' : '8.5" x 11.0"'})...`,
        isEn ? 'Interior' : 'Interior'
      );
    }

    // 2. Compilar Interior PDF sin Sangría
    const interiorPdfNoBleed = await this.buildInstantVectorPdfDocument(countries, paperSize, onProgress, {
      bleed: false,
      lang: options.lang || 'es',
      bookFormat: options.bookFormat || 'paperback'
    });
    const interiorBlobNoBleed = interiorPdfNoBleed.output('blob');

    if (onProgress) {
      onProgress(
        3,
        5,
        isEn
          ? `Compiling Full Wrap Cover (${isHardcover ? 'Case Laminate Hardcover' : 'Paperback'})...`
          : `Compilando Cubierta Completa (${isHardcover ? 'Tapa Dura Case Laminate' : 'Tapa Blanda'})...`,
        isEn ? 'Cover' : 'Cubierta'
      );
    }

    // 3. Compilar Cubierta Completa PDF
    const coverPdf = await this.buildFullWrapCoverPdfDocument(countries, paperSize, onProgress, options);
    const coverBlob = coverPdf.output('blob');

    if (onProgress) {
      onProgress(
        4,
        5,
        isEn ? 'Generating Metadata & KDP Upload Guide...' : 'Generando Metadatos y Guía de Subida Oficial Amazon KDP...',
        isEn ? 'Metadata' : 'Metadatos'
      );
    }

    // 4. Generar JSON y Guías de Texto adaptadas
    let metadata: any;
    let copyPasteGuide: string;
    let instructionsMarkdown: string;

    if (isHardcover) {
      if (isEn) {
        metadata = KdpTranslationService.generateEnglishListingMetadata(countries, 'hardcover');
        copyPasteGuide = KdpTranslationService.generateEnglishCopyPasteGuide(countries, 'hardcover');
        instructionsMarkdown = `# AMAZON KDP OFFICIAL PUBLISHING GUIDE - HARDCOVER EDITION
## World Flag Atlas & Nations: Official Hardcover Collector's Edition
### KDP Reference Guidelines: https://kdp.amazon.com/en_US/help/topic/G201857950

This package provides print-ready interior PDFs, a certified Case Laminate hardcover wrap cover, and complete listing metadata.

---

### 📦 PACKAGE CONTENTS:
1. **\`01_World_Flag_Atlas_Interior_KDP_BLEED_RECOMMENDED.pdf\`**
   - Format: Premium color on white bond paper with bleed.
   - Meets Amazon KDP requirements: 0.875" (22 mm) gutter margin for hardcover binding.
2. **\`01_World_Flag_Atlas_Interior_KDP_NO_BLEED.pdf\`**
   - Format: Premium color without bleed within safe zones.
3. **\`02_World_Flag_Atlas_Hardcover_Case_Laminate_Cover_KDP.pdf\`**
   - Official Case Laminate cover: 15 mm foldover wrap (turn-in) + 10 mm hinge grooves + spine of ${metadata.bookSpecifications.spineWidthMm} mm.
4. **\`03_kdp_hardcover_metadata.json\`**
   - Full JSON metadata file for automation or archiving.
5. **\`04_kdp_hardcover_copy_paste.txt\`**
   - Ready-to-paste text for the 3 steps of kdp.amazon.com.

### 🚀 FAST 3-MINUTE UPLOAD INSTRUCTIONS:
1. Go to **kdp.amazon.com** and click **Create -> Hardcover Book**.
2. **Step 1 (Hardcover Details):**
   - Language: English.
   - Copy title, subtitle, author, description HTML, and 7 keywords from \`04_kdp_hardcover_copy_paste.txt\`.
3. **Step 2 (Hardcover Content):**
   - Choose: Premium color interior with white paper.
   - Trim Size: 8.25 x 11 in (20.95 x 27.94 cm).
   - Bleed: Bleed (with bleed file) or No Bleed (with alternative file).
   - Cover finish: Glossy or Matte Case Laminate.
   - Upload manuscript and cover PDF.
   - Launch Book Previewer and click Approve.
4. **Step 3 (Pricing & Rights):**
   - Suggested Price: $32.99 USD.
   - Click Publish Your Hardcover Book!
`;
      } else {
        metadata = KdpTranslationService.generateSpanishHardcoverListingMetadata(countries);
        copyPasteGuide = KdpTranslationService.generateSpanishHardcoverCopyPasteGuide(countries);
        instructionsMarkdown = `# GUÍA DE PUBLICACIÓN OFICIAL EN AMAZON KDP - EDICIÓN EN TAPA DURA
## Atlas Mundial de Banderas y Naciones: Edición Oficial Coleccionista en Tapa Dura
### Referencia normativa de Amazon KDP: https://kdp.amazon.com/en_US/help/topic/G201857950

Este paquete contiene los archivos de interior y cubierta adaptados a la normativa técnica de Tapa Dura (Case Laminate) de Amazon KDP.

---

### 📦 CONTENIDO DEL PAQUETE DE TAPA DURA:
1. **\`01_Atlas_Interior_Tapa_Dura_KDP_CON_SANGRIA_RECOMENDADO.pdf\`**
   - Interior de lujo adaptado con 22 mm de medianil reforzado para encuadernación rígida cosida/encolada.
2. **\`01_Atlas_Interior_Tapa_Dura_KDP_SIN_SANGRIA.pdf\`**
   - Interior alternativo sin sangría con márgenes de seguridad ampliados.
3. **\`02_Atlas_Mundial_Banderas_Cubierta_Tapa_Dura_Case_Laminate_KDP.pdf\`**
   - Cubierta extendida oficial Case Laminate con 15 mm de forrado de cartón (turn-in) + 10 mm de hendidura de bisagra (hinge) y lomo de ${metadata.bookSpecifications.spineWidthMm} mm.
4. **\`03_kdp_metadatos_tapa_dura.json\`**
   - Ficha técnica completa en formato JSON para tapa dura.
5. **\`04_kdp_textos_copiar_pegar_tapa_dura.txt\`**
   - Textos exactos listos para copiar campo por campo en los 3 pasos de kdp.amazon.com.

### 🚀 PASOS PARA SUBIR A AMAZON KDP EN 3 MINUTOS:
1. Inicia sesión en **kdp.amazon.com** y haz clic en **"Crear" -> "Libro de tapa dura"**.
2. **Paso 1 (Detalles del libro de tapa dura):**
   - Idioma: Español.
   - Copia los datos del archivo \`04_kdp_textos_copiar_pegar_tapa_dura.txt\`.
3. **Paso 2 (Contenido del libro de tapa dura):**
   - Elige **"Interior a todo color de primera calidad con papel blanco"**.
   - Tamaño de corte: **8.25 x 11 in (20.95 x 27.94 cm)**.
   - Sangría: **"Con sangría" (Bleed)**.
   - Acabado: **Brillante (Glossy)** o **Mate (Matte)**.
   - Sube el manuscrito y la cubierta Case Laminate.
   - Abre el **Creador de vistas previas** de KDP y pulsa **Aprobar**.
4. **Paso 3 (Derechos y precios):**
   - Fija el precio sugerido: **$32.99 USD** (o 32,99 €). Tu regalía neta estimada superará los $12.00 USD por ejemplar.
   - Haz clic en **Publicar tu libro de tapa dura**.
`;
      }
    } else {
      // Tapa Blanda
      if (isEn) {
        metadata = KdpTranslationService.generateEnglishListingMetadata(countries, 'paperback');
        copyPasteGuide = KdpTranslationService.generateEnglishCopyPasteGuide(countries, 'paperback');
        instructionsMarkdown = `# AMAZON KDP OFFICIAL PUBLISHING GUIDE - PAPERBACK EDITION
## World Flag Atlas & Nations: Official Illustrated Continental Edition
### KDP Reference Guidelines: https://kdp.amazon.com/en_US/help/topic/G201857950

This package provides print-ready interior PDFs, a full wrap cover PDF, and complete listing metadata in English.

---

### 📦 PACKAGE CONTENTS:
1. **\`01_World_Flag_Atlas_Interior_KDP_BLEED_8.625x11.25.pdf\`**
2. **\`01_World_Flag_Atlas_Interior_KDP_NO_BLEED_8.5x11.pdf\`**
3. **\`02_World_Flag_Atlas_Paperback_Cover_KDP.pdf\`**
4. **\`03_kdp_paperback_metadata.json\`**
5. **\`04_kdp_paperback_copy_paste.txt\`**
6. **\`05_AMAZON_KDP_UPLOAD_INSTRUCTIONS.md\`**
`;
      } else {
        metadata = AmazonKdpService.generateListingMetadata(countries);
        copyPasteGuide = AmazonKdpService.generateCopyPasteGuide(countries);
        instructionsMarkdown = `# GUÍA DE PUBLICACIÓN OFICIAL EN AMAZON KDP (CONFORME A G201857950)
## Atlas Mundial de Banderas Clasificado por Continentes
### Referencia normativa de Amazon: https://kdp.amazon.com/en_US/help/topic/G201857950

Este paquete contiene los archivos de interior y cubierta adaptados a la normativa técnica de Amazon Kindle Direct Publishing (KDP).

---

### 📦 CONTENIDO DEL PAQUETE:
1. **\`01_Atlas_Interior_KDP_CON_SANGRIA_8.625x11.25_RECOMENDADO.pdf\`**
   - Tamaño del PDF: **8.625 x 11.25 pulgadas (21.91 x 28.58 cm)**.
   - En el Paso 2 de Amazon KDP, selecciona: **Sangría: "Con sangría" (Bleed)**.
2. **\`01_Atlas_Interior_KDP_SIN_SANGRIA_8.5x11.pdf\`**
   - Tamaño del PDF: **8.5 x 11.0 pulgadas (21.59 x 27.94 cm)**.
   - En el Paso 2 de Amazon KDP, selecciona: **Sangría: "Sin sangría" (No Bleed)**.
3. **\`02_Atlas_Mundial_Banderas_Cubierta_Completa_KDP.pdf\`**
   - Cubierta extendida oficial con sangría de 0.125" y caja de código de barras reservada.
4. **\`03_kdp_metadatos_publicacion_automatica.json\`**
5. **\`04_kdp_textos_copiar_pegar.txt\`**
6. **\`05_INSTRUCCIONES_SUBIDA_AMAZON_KDP_GUIA_G201857950.md\`**
`;
      }
    }

    const jsonContent = JSON.stringify(metadata, null, 2);

    if (onProgress) {
      onProgress(5, 5, isEn ? 'Packaging Final ZIP Bundle...' : 'Comprimiendo Paquete ZIP Final...', isEn ? 'Packaging' : 'Empaquetado');
    }

    // 5. Crear ZIP con JSZip
    const zip = new JSZip();

    if (isHardcover) {
      const bleedName = isEn ? '01_World_Flag_Atlas_Interior_KDP_BLEED_HARDCOVER.pdf' : '01_Atlas_Interior_Tapa_Dura_KDP_CON_SANGRIA_RECOMENDADO.pdf';
      const noBleedName = isEn ? '01_World_Flag_Atlas_Interior_KDP_NO_BLEED_HARDCOVER.pdf' : '01_Atlas_Interior_Tapa_Dura_KDP_SIN_SANGRIA.pdf';
      const coverName = isEn ? '02_World_Flag_Atlas_Hardcover_Case_Laminate_Cover_KDP.pdf' : '02_Atlas_Mundial_Banderas_Cubierta_Tapa_Dura_Case_Laminate_KDP.pdf';
      const metaName = isEn ? '03_kdp_hardcover_metadata.json' : '03_kdp_metadatos_tapa_dura.json';
      const txtName = isEn ? '04_kdp_hardcover_copy_paste.txt' : '04_kdp_textos_copiar_pegar_tapa_dura.txt';
      const guideName = isEn ? '05_KDP_HARDCOVER_INSTRUCTIONS.md' : '05_INSTRUCCIONES_SUBIDA_KDP_TAPA_DURA.md';

      zip.file(bleedName, interiorBlobBleed);
      zip.file(noBleedName, interiorBlobNoBleed);
      zip.file(coverName, coverBlob);
      zip.file(metaName, jsonContent);
      zip.file(txtName, copyPasteGuide);
      zip.file(guideName, instructionsMarkdown);
    } else {
      const bleedName = isEn ? '01_World_Flag_Atlas_Interior_KDP_BLEED_8.625x11.25.pdf' : '01_Atlas_Interior_KDP_CON_SANGRIA_8.625x11.25_RECOMENDADO.pdf';
      const noBleedName = isEn ? '01_World_Flag_Atlas_Interior_KDP_NO_BLEED_8.5x11.pdf' : '01_Atlas_Interior_KDP_SIN_SANGRIA_8.5x11.pdf';
      const coverName = isEn ? '02_World_Flag_Atlas_Paperback_Cover_KDP.pdf' : '02_Atlas_Mundial_Banderas_Cubierta_Completa_KDP.pdf';
      const metaName = isEn ? '03_kdp_paperback_metadata.json' : '03_kdp_metadatos_publicacion_automatica.json';
      const txtName = isEn ? '04_kdp_paperback_copy_paste.txt' : '04_kdp_textos_copiar_pegar.txt';
      const guideName = isEn ? '05_AMAZON_KDP_UPLOAD_INSTRUCTIONS.md' : '05_INSTRUCCIONES_SUBIDA_AMAZON_KDP_GUIA_G201857950.md';

      zip.file(bleedName, interiorBlobBleed);
      zip.file(noBleedName, interiorBlobNoBleed);
      zip.file(coverName, coverBlob);
      zip.file(metaName, jsonContent);
      zip.file(txtName, copyPasteGuide);
      zip.file(guideName, instructionsMarkdown);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const downloadUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;

    if (isHardcover) {
      link.download = isEn
        ? `Amazon_KDP_Hardcover_Package_English_${countries.length}_Countries.zip`
        : `Paquete_Amazon_KDP_Tapa_Dura_Espanol_${countries.length}_Paises.zip`;
    } else {
      link.download = isEn
        ? `Amazon_KDP_Paperback_Package_English_${countries.length}_Countries.zip`
        : `Paquete_Completo_Amazon_KDP_Atlas_Banderas_${countries.length}_Paises.zip`;
    }

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
  }

  /**
   * Genera el libro capturando los elementos visuales del DOM país por país progresivamente.
   */
  public static async generateVisualDomPdf(
    countries: Country[],
    paperSize: 'letter' | 'a4' = 'letter',
    setStagingCountry: (country: Country | null) => void,
    onProgress?: KdpProgressCallback,
    cancelRef?: { cancelled: boolean }
  ): Promise<void> {
    const isLetter = paperSize === 'letter';
    const pdfWidthMm = isLetter ? 215.9 : 210.0;
    const pdfHeightMm = isLetter ? 279.4 : 297.0;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: isLetter ? 'letter' : 'a4',
      compress: true
    });

    embedKdpCompliantFonts(pdf);

    const totalItems = countries.length;

    for (let i = 0; i < totalItems; i++) {
      if (cancelRef?.cancelled) {
        throw new Error('Compilación cancelada por el usuario.');
      }

      const country = countries[i];

      // 1. Montar país en el staging DOM
      setStagingCountry(country);
      await new Promise((r) => setTimeout(r, 60)); // Esperar que monte React

      // 2. Procesar Página 1 (Solo Bandera Oficial)
      if (onProgress) {
        onProgress(i + 1, totalItems, `Renderizando Bandera de ${country.nameEs}...`, country.nameEs);
      }

      const p1 = document.getElementById('kdp-active-staging-p1');
      if (p1) {
        if (i > 0) pdf.addPage(isLetter ? 'letter' : 'a4', 'portrait');

        const canvasP1 = await html2canvas(p1, {
          scale: 1.9,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false,
          imageTimeout: 10000
        });

        const imgDataP1 = canvasP1.toDataURL('image/jpeg', 0.92);
        pdf.addImage(imgDataP1, 'JPEG', 0, 0, pdfWidthMm, pdfHeightMm, undefined, 'FAST');
      }

      // Breve pausa para liberar memoria del hilo de renderizado
      await new Promise((r) => setTimeout(r, 20));
    }

    setStagingCountry(null);
    const filename = `Atlas_Mundial_Banderas_y_Mapas_${countries.length}_Paises_Amazon_KDP_${paperSize}.pdf`;
    pdf.save(filename);
  }

  /**
   * Dibuja una Rosa de los Vientos / Brújula Vectorial de alta precisión
   */
  private static drawVectorCompass(
    pdf: jsPDF,
    cx: number,
    cy: number,
    radius: number,
    isDarkCover: boolean = false
  ): void {
    const mainColor = isDarkCover ? [245, 158, 11] : [2, 132, 199];
    const secondaryColor = isDarkCover ? [203, 213, 225] : [100, 116, 139];
    const textColor = isDarkCover ? [255, 255, 255] : [15, 23, 42];

    // Círculos exteriores
    pdf.setDrawColor(mainColor[0], mainColor[1], mainColor[2]);
    pdf.setLineWidth(0.8);
    pdf.circle(cx, cy, radius, 'D');

    pdf.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.setLineWidth(0.3);
    pdf.circle(cx, cy, radius - 3, 'D');
    pdf.circle(cx, cy, radius * 0.45, 'D');

    // Rayos de los 4 Puntos Cardinales Principales (N, S, E, O)
    // NORTE (Rojo o Dorado)
    pdf.setFillColor(239, 68, 68); // Rojo Norte
    pdf.triangle(cx, cy - radius + 2, cx - (radius * 0.18), cy, cx, cy, 'F');
    pdf.setFillColor(185, 28, 28);
    pdf.triangle(cx, cy - radius + 2, cx + (radius * 0.18), cy, cx, cy, 'F');

    // SUR
    pdf.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.triangle(cx, cy + radius - 2, cx - (radius * 0.18), cy, cx, cy, 'F');
    pdf.setFillColor(51, 65, 85);
    pdf.triangle(cx, cy + radius - 2, cx + (radius * 0.18), cy, cx, cy, 'F');

    // ESTE
    pdf.setFillColor(mainColor[0], mainColor[1], mainColor[2]);
    pdf.triangle(cx + radius - 2, cy, cx, cy - (radius * 0.18), cx, cy, 'F');
    pdf.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.triangle(cx + radius - 2, cy, cx, cy + (radius * 0.18), cx, cy, 'F');

    // OESTE
    pdf.setFillColor(mainColor[0], mainColor[1], mainColor[2]);
    pdf.triangle(cx - radius + 2, cy, cx, cy - (radius * 0.18), cx, cy, 'F');
    pdf.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.triangle(cx - radius + 2, cy, cx, cy + (radius * 0.18), cx, cy, 'F');

    // Letras Cardinales
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(isDarkCover ? 12 : 11);

    // N
    pdf.setTextColor(239, 68, 68);
    pdf.text('N', cx, cy - radius - 2.5, { align: 'center' });

    // S
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.text('S', cx, cy + radius + 6, { align: 'center' });

    // E
    pdf.text('E', cx + radius + 4, cy + 3.5);

    // O / W
    pdf.text('O', cx - radius - 7, cy + 3.5);

    // Pequeño centro
    pdf.setFillColor(mainColor[0], mainColor[1], mainColor[2]);
    pdf.circle(cx, cy, 2, 'F');
  }

  // Caché en memoria para evitar descargas duplicadas de archivos vectoriales SVG
  private static svgTextCache = new Map<string, string>();

  /**
   * Incrusta el archivo SVG vectorial de la bandera directamente en el PDF usando curvas vectoriales (svg2pdf)
   * Si el motor del navegador o la red no pueden parsear el vector, cuenta con respaldo a 1400px ultra HD.
   */
  private static async embedFlagImageOrVector(
    pdf: jsPDF,
    country: Country,
    x: number,
    y: number,
    w: number,
    h: number
  ): Promise<void> {
    const svgUrl = `https://flagcdn.com/${country.id}.svg`;

    // 1. PRIORIDAD MÁXIMA: VECTORIAL PURO CON svg2pdf.js (Curvas bezier y formas nativas en el PDF para Illustrator)
    try {
      let svgText = this.svgTextCache.get(country.id);
      if (!svgText && typeof window !== 'undefined' && window.fetch) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const response = await fetch(svgUrl, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (response.ok) {
            svgText = await response.text();
            this.svgTextCache.set(country.id, svgText);
          }
        } catch {
          // Ignorar fallo de red y usar generador vectorial
        }
      }

      // Si no se obtuvo de FlagCDN, generar vector SVG limpio y estandarizado
      if (!svgText || !svgText.includes('<svg')) {
        svgText = await SvgExportHelper.generateFlagSvgString(country, { includeName: false });
        this.svgTextCache.set(country.id, svgText);
      }

      if (svgText && typeof document !== 'undefined') {
        // svg2pdf.js requiere que el elemento SVG esté en el DOM del navegador (document.body)
        // para que tenga window como defaultView y pueda resolver getComputedStyle, viewBox y estilos
        let stagingDiv = document.getElementById('kdp-svg-render-staging');
        if (!stagingDiv) {
          stagingDiv = document.createElement('div');
          stagingDiv.id = 'kdp-svg-render-staging';
          stagingDiv.style.position = 'fixed';
          stagingDiv.style.left = '-9999px';
          stagingDiv.style.top = '-9999px';
          stagingDiv.style.width = '1200px';
          stagingDiv.style.height = '1200px';
          stagingDiv.style.visibility = 'hidden';
          stagingDiv.style.opacity = '0';
          stagingDiv.style.pointerEvents = 'none';
          document.body.appendChild(stagingDiv);
        }

        // Cargar SVG en el DOM vivo
        stagingDiv.innerHTML = svgText;
        const svgElement = stagingDiv.querySelector('svg');

        if (svgElement) {
          // Extraer o calcular aspect ratio exacto
          let aspect = 1.5;
          const viewBox = svgElement.getAttribute('viewBox');
          if (viewBox) {
            const parts = viewBox.trim().split(/[\s,]+/).map(Number);
            if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
              aspect = parts[2] / parts[3];
            }
          } else {
            const wAttr = parseFloat(svgElement.getAttribute('width') || '0');
            const hAttr = parseFloat(svgElement.getAttribute('height') || '0');
            if (wAttr > 0 && hAttr > 0) {
              aspect = wAttr / hAttr;
              svgElement.setAttribute('viewBox', `0 0 ${wAttr} ${hAttr}`);
            }
          }

          let drawW = w;
          let drawH = w / aspect;
          if (drawH > h) {
            drawH = h;
            drawW = h * aspect;
          }
          const drawX = x + (w - drawW) / 2;
          const drawY = y + (h - drawH) / 2;

          // Renderizar el SVG vectorial directamente en la página del PDF usando svg2pdf
          // Esto inserta operadores de curvas bezier y trazados vectoriales puros en el PDF
          // que Adobe Illustrator abre como capas y trazados vectoriales editables y copiables.
          await svg2pdf(svgElement, pdf, {
            x: drawX,
            y: drawY,
            width: drawW,
            height: drawH
          });

          // Limpiar staging temporal
          stagingDiv.innerHTML = '';

          // Marco fino protector de imprenta (para banderas con campos blancos como Japón, Inglaterra, etc.)
          pdf.setDrawColor(203, 213, 225);
          pdf.setLineWidth(0.3);
          pdf.rect(drawX, drawY, drawW, drawH, 'D');
          return;
        }
      }
    } catch (svgErr) {
      console.warn(`Vector SVG embedding falló para ${country.nameEs}, usando respaldo:`, svgErr);
    }

    // 2. RESPALDO RASTER ALTA RESOLUCIÓN (Canvas a 1400px a partir del SVG)
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const loaded = await new Promise<boolean>((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = svgUrl;
        setTimeout(() => resolve(false), 3500); // 3.5s timeout
      });

      if (loaded && img.naturalWidth > 0 && img.naturalHeight > 0) {
        const aspect = img.naturalWidth / img.naturalHeight;
        let drawW = w;
        let drawH = w / aspect;
        if (drawH > h) {
          drawH = h;
          drawW = h * aspect;
        }
        const drawX = x + (w - drawW) / 2;
        const drawY = y + (h - drawH) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = 1400;
        canvas.height = Math.round(1400 / aspect);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
          pdf.addImage(dataUrl, 'JPEG', drawX, drawY, drawW, drawH, undefined, 'FAST');

          // Marco fino protector de imprenta (para banderas con campos blancos como Japón, Inglaterra, etc.)
          pdf.setDrawColor(203, 213, 225);
          pdf.setLineWidth(0.3);
          pdf.rect(drawX, drawY, drawW, drawH, 'D');
          return;
        }
      }
    } catch {
      // Continuar al respaldo de alta resolución
    }

    // 2. Respaldo de alta definición (PNG 1280px)
    try {
      const pngUrl = `https://flagcdn.com/w1280/${country.id}.png`;
      const imgPng = new Image();
      imgPng.crossOrigin = 'anonymous';

      const loadedPng = await new Promise<boolean>((resolve) => {
        imgPng.onload = () => resolve(true);
        imgPng.onerror = () => resolve(false);
        imgPng.src = pngUrl;
        setTimeout(() => resolve(false), 2500);
      });

      if (loadedPng && imgPng.naturalWidth > 0) {
        const aspect = (imgPng.naturalWidth || 640) / (imgPng.naturalHeight || 420);
        let drawW = w;
        let drawH = w / aspect;
        if (drawH > h) {
          drawH = h;
          drawW = h * aspect;
        }
        const drawX = x + (w - drawW) / 2;
        const drawY = y + (h - drawH) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = Math.round(1280 / aspect);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(imgPng, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          pdf.addImage(dataUrl, 'JPEG', drawX, drawY, drawW, drawH, undefined, 'FAST');

          pdf.setDrawColor(203, 213, 225);
          pdf.setLineWidth(0.3);
          pdf.rect(drawX, drawY, drawW, drawH, 'D');
          return;
        }
      }
    } catch {
      // Fallback a renderizado heráldico puro
    }

    // 3. Fallback vectorial geométrico garantizado
    pdf.setFillColor(248, 250, 252);
    pdf.rect(x, y, w, h, 'F');
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.5);
    pdf.rect(x, y, w, h, 'D');

    // Franjas de color heráldicas
    const cols = country.colors || ['blue', 'yellow', 'red'];
    const sliceW = w / cols.length;
    cols.forEach((c, idx) => {
      const hex = this.getColorHex(c);
      const rgb = this.hexToRgb(hex);
      pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
      pdf.rect(x + idx * sliceW, y, sliceW, h, 'F');
    });

    // Emblema central de soberanía
    pdf.setFillColor(255, 255, 255);
    pdf.circle(x + w / 2, y + h / 2, 14, 'F');
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.3);
    pdf.circle(x + w / 2, y + h / 2, 14, 'D');

    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text(country.code3 || country.id.toUpperCase(), x + w / 2, y + h / 2 + 3.5, { align: 'center' });
  }

  /**
   * Genera y embebe el mapa SVG verídico con divisiones territoriales y países limítrofes en el PDF
   */
  private static async embedCountrySvgMap(
    pdf: jsPDF,
    country: Country,
    x: number,
    y: number,
    w: number,
    h: number
  ): Promise<void> {
    try {
      const svgString = this.generateCountryMapSvgString(country, 710, 540);
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const loaded = await new Promise<boolean>((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
        setTimeout(() => resolve(false), 2000);
      });

      if (loaded) {
        const canvas = document.createElement('canvas');
        canvas.width = 1420; // 2x alta resolución
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          pdf.addImage(dataUrl, 'JPEG', x, y, w, h);
          URL.revokeObjectURL(url);
          return;
        }
      }
      URL.revokeObjectURL(url);
    } catch {
      // fallback
    }

    // Fallback de contingencia si el renderizado de imagen falla
    this.drawVectorCountryMapPlaceholder(pdf, country, x + (w / 2), y + (h / 2));
  }

  /**
   * Construye el SVG verídico del país con proyecciones D3, GeoJSON, divisiones y límites fronterizos
   */
  private static generateCountryMapSvgString(country: Country, width = 710, height = 540): string {
    const geojson = geoDataService.getCountriesGeoJSON();
    const countryFeature = geoDataService.getCountryFeature(country.id);
    const focalFeature = geoDataService.getFocalFeature(country.id) || countryFeature;
    const centroid = geoDataService.getCountryCentroid(country.id) || [country.lng, country.lat];
    const structure = getCountryPoliticalStructure(country);

    const proj = geoMercator().center(centroid).translate([width / 2, height / 2 + 4]);

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
            const scaleFactor = Math.min((width - padX * 2) / dx, (height - padY * 2) / dy);
            const currentScale = proj.scale();
            const newScale = Math.max(40, Math.min(currentScale * scaleFactor, 32000));
            proj.scale(newScale);

            const updatedBounds = geoPath().projection(proj).bounds(focalFeature as any);
            const midX = (updatedBounds[0][0] + updatedBounds[1][0]) / 2;
            const midY = (updatedBounds[0][1] + updatedBounds[1][1]) / 2;
            const shiftX = width / 2 - midX;
            const shiftY = (height / 2 + 4) - midY;
            proj.translate([width / 2 + shiftX, height / 2 + 4 + shiftY]);
          }
        }
      } catch {
        // fallback
      }
    }

    const pathGen = geoPath().projection(proj);
    const projectCoords = (coords: [number, number]): [number, number] | null => {
      try {
        const pt = proj(coords);
        if (pt && Number.isFinite(pt[0]) && Number.isFinite(pt[1])) return pt;
      } catch {}
      return null;
    };

    const targetBoundaries = subdivisionBoundaryService.generate2DBoundaries(
      country,
      projectCoords,
      [-100, -100, width + 100, height + 100]
    );

    let targetPathD = '';
    if (countryFeature) {
      targetPathD = pathGen(countryFeature) || '';
    }
    if (!targetPathD || targetPathD.length < 5) {
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
      targetPathD = 'M ' + points.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L ') + ' Z';
    }

    // Capital position
    const capPt = projectCoords([country.lng, country.lat]) || [width / 2, height / 2];

    // Build subdivisions colors
    const palette = ['#0284c7', '#0d9488', '#16a34a', '#d97706', '#ea580c', '#7c3aed', '#2563eb', '#db2777', '#0891b2', '#4f46e5', '#ca8a04', '#059669', '#e11d48', '#9333ea', '#0369a1'];

    // Surrounding neighbors
    let neighborsSvg = '';
    geojson.features.forEach((feat: any) => {
      if (feat.id !== country.id) {
        const d = pathGen(feat);
        if (d && d.length > 5) {
          neighborsSvg += `<path d="${d}" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.8" opacity="0.85" />`;
        }
      }
    });

    // Subdivisions SVG
    let subdivisionsSvg = '';
    if (targetBoundaries && targetBoundaries.cells && targetBoundaries.cells.length > 0) {
      targetBoundaries.cells.forEach((cell, bIdx) => {
        if (!cell.cellPath) return;
        const color = palette[bIdx % palette.length];
        subdivisionsSvg += `<path d="${cell.cellPath}" fill="${color}" stroke="#ffffff" stroke-width="0.8" opacity="0.92" />`;
      });

      if (targetBoundaries.dividingLinesPath) {
        subdivisionsSvg += `<path d="${targetBoundaries.dividingLinesPath}" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.95" />`;
      }

      targetBoundaries.cells.forEach((cell) => {
        const sub = cell.subdivision;
        const pt = cell.centerPt || projectCoords([sub.lng, sub.lat]);
        if (pt && Number.isFinite(pt[0]) && Number.isFinite(pt[1]) && pt[0] > 20 && pt[0] < width - 20 && pt[1] > 20 && pt[1] < height - 20) {
          const shortName = sub.name.length > 14 ? sub.name.substring(0, 12) + '…' : sub.name;
          const rectW = Math.max(48, shortName.length * 5.5 + 10);
          subdivisionsSvg += `
            <rect x="${pt[0] - rectW / 2}" y="${pt[1] - 7}" width="${rectW}" height="14" rx="3" fill="#ffffff" fill-opacity="0.92" stroke="#cbd5e1" stroke-width="0.5" />
            <text x="${pt[0]}" y="${pt[1] + 3}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="7.5" font-weight="bold" fill="#0f172a">${shortName}</text>
          `;
        }
      });
    }

    const clipId = `clip-kdp-${country.id.toLowerCase()}-${Math.floor(Math.random() * 100000)}`;

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
        <defs>
          <clipPath id="${clipId}">
            <path d="${targetPathD}" />
          </clipPath>
          <linearGradient id="ocean-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#f0f9ff" />
            <stop offset="100%" stop-color="#e0f2fe" />
          </linearGradient>
        </defs>

        <!-- Fondo Oceánico -->
        <rect width="${width}" height="${height}" fill="url(#ocean-grad)" />

        <!-- Líneas de cuadrícula geodésica -->
        <g stroke="#cbd5e1" stroke-width="0.4" stroke-dasharray="3,3" opacity="0.6">
          <line x1="100" y1="0" x2="100" y2="${height}" />
          <line x1="220" y1="0" x2="220" y2="${height}" />
          <line x1="340" y1="0" x2="340" y2="${height}" />
          <line x1="460" y1="0" x2="460" y2="${height}" />
          <line x1="580" y1="0" x2="580" y2="${height}" />
          <line x1="0" y1="90" x2="${width}" y2="90" />
          <line x1="0" y1="180" x2="${width}" y2="180" />
          <line x1="0" y1="270" x2="${width}" y2="270" />
          <line x1="0" y1="360" x2="${width}" y2="360" />
          <line x1="0" y1="450" x2="${width}" y2="450" />
        </g>

        <!-- Países limítrofes / vecinos -->
        <g id="neighbors">
          ${neighborsSvg}
        </g>

        <!-- Base del país objetivo -->
        <path d="${targetPathD}" fill="#0284c7" stroke="#0369a1" stroke-width="2.5" stroke-linejoin="round" />

        <!-- Sub-divisiones políticas clipeadas -->
        <g clip-path="url(#${clipId})">
          ${subdivisionsSvg}
        </g>

        <!-- Contorno perimetral del país -->
        <path d="${targetPathD}" fill="none" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round" />

        <!-- Pin y etiqueta de la capital nacional -->
        <g transform="translate(${capPt[0]}, ${capPt[1]})">
          <circle r="7" fill="#ef4444" fill-opacity="0.3" />
          <circle r="4.5" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />
          <polygon points="0,-3.5 1,-1 3.5,-1 1.5,0.5 2.2,3 0,1.5 -2.2,3 -1.5,0.5 -3.5,-1 -1,-1" fill="#ffffff" />
          <rect x="8" y="-10" width="${Math.max(65, (country.capitalEs || country.capitalEn || '').length * 6.8 + 18)}" height="18" rx="4" fill="#0f172a" fill-opacity="0.9" />
          <text x="14" y="2.5" font-family="Arial, Helvetica, sans-serif" font-size="8.5" font-weight="bold" fill="#ffffff">★ ${country.capitalEs || country.capitalEn}</text>
        </g>

        <!-- Barra informativa superior -->
        <rect x="16" y="14" width="${width - 32}" height="32" rx="8" fill="#ffffff" fill-opacity="0.95" stroke="#cbd5e1" stroke-width="1" />
        <text x="30" y="34" font-family="Arial, Helvetica, sans-serif" font-size="11.5" font-weight="bold" fill="#0284c7">MAPA CARTOGRÁFICO SVG • ${country.nameEs.toUpperCase()} (${structure.totalCount} ${structure.divisionTypeName.toUpperCase()})</text>
        <text x="${width - 30}" y="34" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="9.5" font-weight="bold" fill="#64748b">WGS84 EPSG:4326</text>

        <!-- Brújula / Rosa de los vientos en esquina -->
        <g transform="translate(${width - 55}, ${height - 55})">
          <circle r="22" fill="#ffffff" fill-opacity="0.92" stroke="#0284c7" stroke-width="1.5" />
          <polygon points="0,-16 4.5,0 0,-3.5" fill="#ef4444" />
          <polygon points="0,-16 -4.5,0 0,-3.5" fill="#b91c1c" />
          <polygon points="0,16 4.5,0 0,3.5" fill="#64748b" />
          <polygon points="0,16 -4.5,0 0,3.5" fill="#334155" />
          <polygon points="16,0 0,4.5 3.5,0" fill="#64748b" />
          <polygon points="-16,0 0,4.5 -3.5,0" fill="#64748b" />
          <text x="0" y="-9" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="7.5" font-weight="bold" fill="#ef4444">N</text>
          <circle r="2" fill="#0f172a" />
        </g>
      </svg>
    `.trim();
  }

  /**
   * Dibuja una representación cartográfica vectorial en la página de mapa con división política
   */
  private static drawVectorCountryMapPlaceholder(
    pdf: jsPDF,
    country: Country,
    cx: number,
    cy: number
  ): void {
    const structure = getCountryPoliticalStructure(country);

    // Contorno poligonal y fondo oceánico estilizado
    pdf.setFillColor(240, 249, 255);
    pdf.setDrawColor(2, 132, 199);
    pdf.setLineWidth(0.8);

    // Caja territorial principal
    const mapW = 160;
    const mapH = 68;
    const x0 = cx - (mapW / 2);
    const y0 = cy - (mapH / 2) + 2;

    pdf.roundedRect(x0, y0, mapW, mapH, 4, 4, 'F');
    pdf.roundedRect(x0, y0, mapW, mapH, 4, 4, 'D');

    // Malla de sub-bloques territoriales / departamentos representativos
    const subs = structure.subdivisions.slice(0, 6);
    const cellW = (mapW - 14) / Math.min(3, Math.max(2, Math.ceil(subs.length / 2)));
    const cellH = 22;

    // Colores para celdas de departamentos/estados
    const subColors: Array<[number, number, number]> = [
      [224, 242, 254], // Sky
      [209, 250, 229], // Emerald
      [254, 243, 199], // Amber
      [237, 233, 254], // Violet
      [254, 226, 226], // Rose
      [207, 250, 254]  // Cyan
    ];

    subs.forEach((sub, sIdx) => {
      const col = sIdx % 3;
      const row = Math.floor(sIdx / 3);
      const cellX = x0 + 7 + (col * (cellW + 2));
      const cellY = y0 + 10 + (row * (cellH + 2));

      const [r, g, b] = subColors[sIdx % subColors.length];
      pdf.setFillColor(r, g, b);
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.6);
      pdf.roundedRect(cellX, cellY, cellW, cellH, 2, 2, 'F');
      pdf.roundedRect(cellX, cellY, cellW, cellH, 2, 2, 'D');

      // Nombre del Departamento / Estado
      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.8);
      const cleanName = sub.name.length > 18 ? sub.name.substring(0, 16) + '…' : sub.name;
      pdf.text(cleanName, cellX + 3, cellY + 6);

      // Capital / Cabecera departamental
      pdf.setTextColor(100, 116, 139);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(5.8);
      pdf.text(`★ ${sub.capital}`, cellX + 3, cellY + 12);

      // Población del departamento
      if (sub.population) {
        pdf.text(`${(sub.population / 1000000).toFixed(1)}M hab.`, cellX + 3, cellY + 18);
      }
    });

    // Barra informativa superior: Estructura Política
    pdf.setFillColor(2, 132, 199);
    pdf.roundedRect(x0 + 4, y0 + 3, mapW - 8, 5.5, 1.5, 1.5, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6);
    pdf.text(
      `DIVISIÓN TERRITORIAL: ${structure.countryName.toUpperCase()} (${structure.totalCount} ${structure.divisionTypeName.toUpperCase()})`,
      cx,
      y0 + 7,
      { align: 'center' }
    );

    // Pie de mapa territorial: Países limítrofes georreferenciados
    pdf.setTextColor(71, 85, 105);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.2);
    pdf.text(
      `Fronteras Limítrofes y Países Vecinos Cartografiados con División Departamental / Estatal WGS84`,
      cx,
      y0 + mapH - 3,
      { align: 'center' }
    );
  }

  /**
   * Genera y descarga una ficha técnica en PDF 100% Vectorial para un país individual con su bandera en formato SVG nativo
   */
  public static async generateSingleCountryVectorPdf(
    country: Country,
    paperSize: 'letter' | 'a4' = 'letter',
    theme: 'light' | 'dark' = 'light',
    lang: 'es' | 'en' = 'es'
  ): Promise<void> {
    const isEn = lang === 'en';
    const isLetter = paperSize === 'letter';
    const width = isLetter ? 215.9 : 210.0;
    const height = isLetter ? 279.4 : 297.0;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: isLetter ? 'letter' : 'a4',
      compress: true
    });

    embedKdpCompliantFonts(pdf);

    const isLight = theme === 'light';
    const margin = 16;
    const contentWidth = width - margin * 2;
    const centerX = width / 2;

    // Fondo
    if (isLight) {
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, width, height, 'F');
    } else {
      pdf.setFillColor(15, 23, 42); // slate-900
      pdf.rect(0, 0, width, height, 'F');
    }

    // Marco exterior decorativo
    pdf.setDrawColor(isLight ? 226 : 51, isLight ? 232 : 65, isLight ? 240 : 85);
    pdf.setLineWidth(0.4);
    pdf.rect(10, 10, width - 20, height - 20);

    // 1. ENCABEZADO SUPERIOR
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(isLight ? 100 : 148, isLight ? 116 : 163, isLight ? 139 : 184);
    pdf.text(
      isEn ? 'VEXILLOLOGICAL ENCYCLOPEDIA • OFFICIAL SVG VECTOR SHEET' : 'ENCICLOPEDIA VEXILOLÓGICA • FICHA VECTORIAL SVG OFICIAL',
      margin,
      18
    );
    pdf.setTextColor(2, 132, 199);
    const continentUpper = isEn ? KdpTranslationService.getContinentEn(country.continent).toUpperCase() : country.continent.toUpperCase();
    pdf.text(continentUpper, width - margin, 18, { align: 'right' });

    pdf.setDrawColor(isLight ? 226 : 51, isLight ? 232 : 65, isLight ? 240 : 85);
    pdf.setLineWidth(0.3);
    pdf.line(margin, 20.5, width - margin, 20.5);

    // 2. TÍTULO SUPERIOR: NOMBRE DEL PAÍS
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(2, 132, 199);
    pdf.text(isEn ? 'SOVEREIGN NATIONAL FLAG' : 'PABELLÓN NACIONAL SOBERANO', centerX, 27, { align: 'center' });

    pdf.setTextColor(isLight ? 15 : 255, isLight ? 23 : 255, isLight ? 42 : 255);
    pdf.setFontSize(22);
    const countryMainName = isEn ? (country.nameEn || country.nameEs).toUpperCase() : country.nameEs.toUpperCase();
    const countrySecName = isEn ? country.nameEs.toUpperCase() : country.nameEn.toUpperCase();
    pdf.text(countryMainName, centerX, 36, { align: 'center' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(isLight ? 100 : 148, isLight ? 116 : 163, isLight ? 139 : 184);
    pdf.text(
      `${countrySecName}   •   ${isEn ? 'ISO CODE' : 'CÓDIGO ISO'}: ${country.code3 || country.id.toUpperCase()}   •   ${continentUpper}`,
      centerX,
      41,
      { align: 'center' }
    );

    // 3. BANDERA VECTORIAL SVG INCRUSTADA
    const flagAreaW = contentWidth;
    const flagAreaH = 100;
    const flagAreaX = margin;
    const flagAreaY = 44;

    await this.embedFlagImageOrVector(pdf, country, flagAreaX, flagAreaY, flagAreaW, flagAreaH);

    // Cartela Oficial con el Nombre del País en la Bandera
    const cartoucheY = flagAreaY + flagAreaH + 4;
    const cartoucheW = Math.min(145, contentWidth);
    const cartoucheX = centerX - cartoucheW / 2;
    pdf.setFillColor(isLight ? 248 : 30, isLight ? 250 : 41, isLight ? 252 : 59);
    pdf.roundedRect(cartoucheX, cartoucheY, cartoucheW, 8.5, 2, 2, 'F');
    pdf.setDrawColor(isLight ? 203 : 51, isLight ? 213 : 65, isLight ? 225 : 85);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(cartoucheX, cartoucheY, cartoucheW, 8.5, 2, 2, 'D');

    const cartoucheText = isEn
      ? `OFFICIAL FLAG OF ${(country.nameEn || country.nameEs).toUpperCase()} • ${country.code3 || country.id.toUpperCase()}`
      : `BANDERA OFICIAL DE ${country.nameEs.toUpperCase()} • ${country.code3 || country.id.toUpperCase()}`;
    pdf.setTextColor(isLight ? 15 : 241, isLight ? 23 : 245, isLight ? 42 : 249);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.text(cartoucheText, centerX, cartoucheY + 5.5, { align: 'center' });

    // 4. GRILLA DE 4 ESTADÍSTICAS
    const statsY = cartoucheY + 12;
    const statBoxW = (contentWidth - 9) / 4;
    const statBoxH = 16;
    const stats = isEn
      ? [
          { label: 'CAPITAL', val: country.capitalEn || country.capitalEs || 'Official Capital' },
          { label: 'POPULATION', val: `${country.population.toLocaleString('en-US')} inhab.` },
          { label: 'CURRENCY', val: KdpTranslationService.translateCurrency(country.currency, country.id) },
          { label: 'LANGUAGE', val: KdpTranslationService.translateLanguage(country.language, country.id) }
        ]
      : [
          { label: 'CAPITAL', val: country.capitalEs },
          { label: 'POBLACIÓN', val: `${country.population.toLocaleString('es-ES')} hab.` },
          { label: 'MONEDA', val: country.currency },
          { label: 'IDIOMA', val: country.language }
        ];

    stats.forEach((st, idx) => {
      const boxX = margin + idx * (statBoxW + 3);
      pdf.setFillColor(isLight ? 248 : 30, isLight ? 250 : 41, isLight ? 252 : 59);
      pdf.roundedRect(boxX, statsY, statBoxW, statBoxH, 2, 2, 'F');
      pdf.setDrawColor(isLight ? 226 : 51, isLight ? 232 : 65, isLight ? 240 : 85);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(boxX, statsY, statBoxW, statBoxH, 2, 2, 'D');

      pdf.setTextColor(2, 132, 199);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      pdf.text(st.label, boxX + 3.5, statsY + 5.5);

      pdf.setTextColor(isLight ? 15 : 241, isLight ? 23 : 245, isLight ? 42 : 249);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      const trimmedVal = pdf.splitTextToSize(st.val, statBoxW - 7);
      pdf.text(trimmedVal[0] || '', boxX + 3.5, statsY + 11.5);
    });

    // 5. CAJA DE SIMBOLISMO DE LA BANDERA
    const symbolY = statsY + statBoxH + 4;
    const symbolH = 38;
    pdf.setFillColor(isLight ? 250 : 20, isLight ? 250 : 30, isLight ? 252 : 45);
    pdf.roundedRect(margin, symbolY, contentWidth, symbolH, 2.5, 2.5, 'F');
    pdf.setDrawColor(isLight ? 226 : 51, isLight ? 232 : 65, isLight ? 240 : 85);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin, symbolY, contentWidth, symbolH, 2.5, 2.5, 'D');

    pdf.setTextColor(2, 132, 199);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.text(
      isEn ? 'NATIONAL FLAG SYMBOLISM (OFFICIAL VEXILLOLOGY)' : 'SIMBOLISMO DE LA BANDERA NACIONAL (VEXILOLOGÍA OFICIAL)',
      margin + 4,
      symbolY + 6.5
    );

    pdf.setTextColor(isLight ? 51 : 226, isLight ? 65 : 232, isLight ? 85 : 240);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    const symbolText = isEn ? KdpTranslationService.translateSymbolism(country) : country.flagSymbolismEs;
    const symbolLines = pdf.splitTextToSize(symbolText, contentWidth - 8);
    pdf.text(symbolLines.slice(0, 5), margin + 4, symbolY + 13, { lineHeightFactor: 1.35 });

    // 6. CAJA DE CURIOSIDAD GEOGRÁFICA Y CULTURAL
    const triviaY = symbolY + symbolH + 3.5;
    const triviaH = 32;
    pdf.setFillColor(isLight ? 255 : 24, isLight ? 251 : 34, isLight ? 235 : 46);
    pdf.roundedRect(margin, triviaY, contentWidth, triviaH, 2.5, 2.5, 'F');
    pdf.setDrawColor(isLight ? 254 : 120, isLight ? 215 : 53, isLight ? 170 : 15);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin, triviaY, contentWidth, triviaH, 2.5, 2.5, 'D');

    pdf.setTextColor(217, 119, 6);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.text(
      isEn ? 'GEOGRAPHIC & CULTURAL TRIVIA' : 'CURIOSIDAD GEOGRÁFICA Y CULTURAL',
      margin + 4,
      triviaY + 6.5
    );

    // Embed direct download QR code on the right side of trivia box
    const qrSize = 22;
    const qrX = margin + contentWidth - qrSize - 4;
    const qrY = triviaY + 4;
    try {
      const directQrUrl = typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}?action=download-pdf&country=${country.id}&paper=${paperSize}&theme=${theme}&lang=${lang}`
        : `https://mundobanderas.app?action=download-pdf&country=${country.id}&lang=${lang}`;
      const qrDataUrl = await QRCode.toDataURL(directQrUrl, {
        width: 160,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#0f172a', light: '#ffffff' }
      });
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2, 1, 1, 'F');
      pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      pdf.setFontSize(5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(isLight ? 100 : 180, isLight ? 116 : 190, isLight ? 139 : 200);
      pdf.text(isEn ? 'DIGITAL DOWNLOAD QR' : 'QR DESCARGA DIGITAL', qrX + qrSize / 2, qrY + qrSize + 2.5, { align: 'center' });
    } catch (qrErr) {
      console.warn('No se pudo generar QR para PDF:', qrErr);
    }

    pdf.setTextColor(isLight ? 68 : 226, isLight ? 64 : 232, isLight ? 60 : 240);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    const triviaText = isEn ? KdpTranslationService.translateFunFact(country) : country.funFactEs;
    const availableTriviaW = contentWidth - qrSize - 16;
    const triviaLines = pdf.splitTextToSize(triviaText, availableTriviaW);
    pdf.text(triviaLines.slice(0, 4), margin + 4, triviaY + 13, { lineHeightFactor: 1.35 });

    // 7. PIE DE PÁGINA (PÁGINA 1)
    pdf.setDrawColor(isLight ? 226 : 51, isLight ? 232 : 65, isLight ? 240 : 85);
    pdf.setLineWidth(0.3);
    pdf.line(margin, height - 14, width - margin, height - 14);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(isLight ? 148 : 100, isLight ? 163 : 116, isLight ? 184 : 139);
    pdf.text(
      isEn ? 'WorldFlags • Sovereign National Flags in SVG Vector Format' : 'MundoBanderas • Pabellones Nacionales en Formato Vectorial SVG',
      margin,
      height - 9.5
    );
    pdf.setFont('helvetica', 'bold');
    pdf.text(
      isEn ? 'PAGE 1 • ULTRA HD SVG' : 'PÁGINA 1 • ULTRA HD SVG',
      width - margin,
      height - 9.5,
      { align: 'right' }
    );

    // ========================================================
    // PÁGINA 2: MAPA CARTOGRÁFICO CON DIVISIÓN TERRITORIAL SVG
    // ========================================================
    pdf.addPage([width, height], 'portrait');
    if (isLight) {
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, width, height, 'F');
    } else {
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, width, height, 'F');
    }

    // Marco exterior
    pdf.setDrawColor(isLight ? 226 : 51, isLight ? 232 : 65, isLight ? 240 : 85);
    pdf.setLineWidth(0.4);
    pdf.rect(10, 10, width - 20, height - 20);

    // Encabezado Pág 2
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(isLight ? 100 : 148, isLight ? 116 : 163, isLight ? 139 : 184);
    pdf.text(
      isEn ? 'CARTOGRAPHIC ATLAS • TERRITORIAL POLITICAL DIVISION' : 'ATLAS CARTOGRÁFICO • DIVISIÓN POLÍTICO-TERRITORIAL',
      margin,
      18
    );
    pdf.setTextColor(2, 132, 199);
    pdf.text(isEn ? 'PAGE 2 • SVG MAP' : 'PÁGINA 2 • MAPA SVG', width - margin, 18, { align: 'right' });
    pdf.line(margin, 20.5, width - margin, 20.5);

    // Título Pág 2
    pdf.setTextColor(2, 132, 199);
    pdf.setFontSize(8);
    pdf.text(isEn ? 'OFFICIAL TERRITORIAL DIVISION' : 'DIVISIÓN TERRITORIAL OFICIAL', centerX, 27, { align: 'center' });
    pdf.setFontSize(20);
    pdf.setTextColor(isLight ? 15 : 255, isLight ? 23 : 255, isLight ? 42 : 255);
    pdf.text(countryMainName, centerX, 36, { align: 'center' });

    const structure = getCountryPoliticalStructure(country);
    pdf.setFontSize(8);
    pdf.setTextColor(isLight ? 100 : 148, isLight ? 116 : 163, isLight ? 139 : 184);
    pdf.text(
      isEn
        ? `${structure.totalCount} ${structure.divisionTypeName.toUpperCase()} • BORDERING NATIONS & WGS84`
        : `${structure.totalCount} ${structure.divisionTypeName.toUpperCase()} • PAÍSES LIMÍTROFES & WGS84`,
      centerX,
      41,
      { align: 'center' }
    );

    // Dibuja el mapa territorial
    this.drawVectorCountryMapPlaceholder(pdf, country, centerX, 88);

    // Tabla de Subdivisiones
    const subTableY = 132;
    const subColW = (contentWidth - 6) / 2;
    pdf.setFillColor(isLight ? 248 : 30, isLight ? 250 : 41, isLight ? 252 : 59);
    pdf.roundedRect(margin, subTableY, contentWidth, 120, 3, 3, 'F');
    pdf.setDrawColor(isLight ? 226 : 51, isLight ? 232 : 65, isLight ? 240 : 85);
    pdf.roundedRect(margin, subTableY, contentWidth, 120, 3, 3, 'D');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(2, 132, 199);
    pdf.text(
      isEn ? `SUBDIVISIONS REGISTER: ${structure.countryName.toUpperCase()}` : `REGISTRO DE SUBDIVISIONES: ${structure.countryName.toUpperCase()}`,
      margin + 6,
      subTableY + 8
    );

    const displaySubs = structure.subdivisions.slice(0, 16);
    displaySubs.forEach((sub, sIdx) => {
      const col = sIdx % 2;
      const row = Math.floor(sIdx / 2);
      const subX = margin + 6 + col * (subColW + 2);
      const subY = subTableY + 16 + row * 12;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.2);
      pdf.setTextColor(isLight ? 15 : 240, isLight ? 23 : 245, isLight ? 42 : 255);
      const subNameClean = pdf.splitTextToSize(`• ${sub.name}`, subColW - 10)[0];
      pdf.text(subNameClean, subX, subY);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(isLight ? 100 : 160, isLight ? 116 : 170, isLight ? 139 : 180);
      const capPop = sub.population
        ? `★ ${sub.capital} (${(sub.population / 1000000).toFixed(1)}M hab.)`
        : `★ ${sub.capital}`;
      pdf.text(capPop, subX + 4, subY + 5);
    });

    // Pie de Pág 2
    pdf.line(margin, height - 14, width - margin, height - 14);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(isLight ? 148 : 100, isLight ? 163 : 116, isLight ? 184 : 139);
    pdf.text(
      isEn ? 'WorldFlags • Territorial Map & Political Organization' : 'MundoBanderas • Mapa Territorial & Organización Política',
      margin,
      height - 9.5
    );
    pdf.setFont('helvetica', 'bold');
    pdf.text(isEn ? 'PAGE 2' : 'PÁGINA 2', width - margin, height - 9.5, { align: 'right' });

    // ========================================================
    // PÁGINA 3: HISTORIA DE MEDIA PÁGINA & 10 DATOS CURIOSOS
    // ========================================================
    pdf.addPage([width, height], 'portrait');
    if (isLight) {
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, width, height, 'F');
    } else {
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, width, height, 'F');
    }

    // Marco exterior
    pdf.setDrawColor(isLight ? 226 : 51, isLight ? 232 : 65, isLight ? 240 : 85);
    pdf.setLineWidth(0.4);
    pdf.rect(10, 10, width - 20, height - 20);

    // Encabezado Pág 3
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(isLight ? 100 : 148, isLight ? 116 : 163, isLight ? 139 : 184);
    pdf.text(
      isEn ? 'HISTORICAL COMPENDIUM • 10 CURIOUS FACTS & GEODESY' : 'COMPENDIO HISTÓRICO • 10 DATOS CURIOSOS & GEODESIA',
      margin,
      18
    );
    pdf.setTextColor(2, 132, 199);
    pdf.text(isEn ? 'PAGE 3 • NATION PROFILE' : 'PÁGINA 3 • PERFIL NACIONAL', width - margin, 18, { align: 'right' });
    pdf.line(margin, 20.5, width - margin, 20.5);

    // Top Header: Rosa de los Vientos y Geodesia WGS84
    const p3CompassX = margin + 22;
    const p3CompassY = 36;
    this.drawVectorCompass(pdf, p3CompassX, p3CompassY, 14, isLight);

    // Geodesic Data card next to compass
    const geoCardX = margin + 44;
    const geoCardW = contentWidth - 44;
    pdf.setFillColor(isLight ? 248 : 30, isLight ? 250 : 41, isLight ? 252 : 59);
    pdf.roundedRect(geoCardX, 24, geoCardW, 25, 2, 2, 'F');
    pdf.setDrawColor(isLight ? 226 : 51, isLight ? 232 : 65, isLight ? 240 : 85);
    pdf.roundedRect(geoCardX, 24, geoCardW, 25, 2, 2, 'D');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(2, 132, 199);
    pdf.text(
      isEn ? `GEODETIC POSITIONING • ${countryMainName}` : `POSICIONAMIENTO GEODÉSICO • ${countryMainName}`,
      geoCardX + 5,
      29.5
    );

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.2);
    pdf.setTextColor(isLight ? 51 : 226, isLight ? 65 : 232, isLight ? 85 : 240);
    const latAbs = Math.abs(country.lat).toFixed(2);
    const lonAbs = Math.abs(country.lng).toFixed(2);
    const latDir = country.lat >= 0 ? (isEn ? 'N (North)' : 'N (Norte)') : (isEn ? 'S (South)' : 'S (Sur)');
    const lonDir = country.lng >= 0 ? (isEn ? 'E (East)' : 'E (Este)') : (isEn ? 'W (West)' : 'O (Oeste)');
    pdf.text(`WGS84 Coordinates: ${latAbs}° ${latDir} • ${lonAbs}° ${lonDir}`, geoCardX + 5, 35.5);
    pdf.text(`Capital: ★ ${country.capitalEs || country.capitalEn} • ${structure.governmentSystem}`, geoCardX + 5, 41.5);
    pdf.text(`Territorial Surface: ${country.areaKm2 ? country.areaKm2.toLocaleString() : 'N/A'} km² • Pop: ${(country.population / 1000000).toFixed(1)}M hab.`, geoCardX + 5, 46.5);

    // SECCIÓN HISTORIA DE MEDIA PÁGINA
    const histY = 53;
    const histH = 75;
    pdf.setFillColor(isLight ? 254 : 32, isLight ? 252 : 24, isLight ? 242 : 18);
    pdf.roundedRect(margin, histY, contentWidth, histH, 3, 3, 'F');
    pdf.setDrawColor(isLight ? 253 : 180, isLight ? 230 : 120, isLight ? 138 : 30);
    pdf.roundedRect(margin, histY, contentWidth, histH, 3, 3, 'D');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(180, 83, 9);
    pdf.text(
      isEn
        ? `HISTORICAL CHRONICLE & SOVEREIGN ORIGINS OF ${countryMainName}`
        : `HISTORIA DE LA NACIÓN Y ORIGEN SOBERANO DE ${countryMainName}`,
      margin + 6,
      histY + 7
    );

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.6);
    pdf.setTextColor(isLight ? 71 : 226, isLight ? 85 : 232, isLight ? 105 : 240);
    const historyText = CountryNarrativeService.getCountryHistory(country, lang);
    const histLines = pdf.splitTextToSize(historyText, contentWidth - 12);
    pdf.text(histLines.slice(0, 16), margin + 6, histY + 14, { lineHeightFactor: 1.4 });

    // SECCIÓN 10 DATOS CURIOSOS
    const factsY = histY + histH + 4;
    const factsH = height - factsY - 18;
    pdf.setFillColor(isLight ? 240 : 15, isLight ? 253 : 35, isLight ? 244 : 25);
    pdf.roundedRect(margin, factsY, contentWidth, factsH, 3, 3, 'F');
    pdf.setDrawColor(isLight ? 187 : 20, isLight ? 247 : 83, isLight ? 208 : 45);
    pdf.roundedRect(margin, factsY, contentWidth, factsH, 3, 3, 'D');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(5, 150, 105);
    pdf.text(
      isEn
        ? `10 FASCINATING FACTS, HISTORICAL MILESTONES & RECORDS`
        : `10 DATOS CURIOSOS, HITOS HISTÓRICOS Y RÉCORDS OFICIALES`,
      margin + 6,
      factsY + 7
    );

    const curiosities = CountryNarrativeService.getCountryCuriosities(country, lang);
    const factColW = (contentWidth - 12) / 2;
    curiosities.slice(0, 10).forEach((fact, fIdx) => {
      const col = fIdx % 2;
      const row = Math.floor(fIdx / 2);
      const fX = margin + 6 + col * (factColW + 4);
      const fY = factsY + 13 + row * 21;

      pdf.setFillColor(16, 185, 129);
      pdf.circle(fX + 3, fY + 1, 3.2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(5.8);
      pdf.text(String(fIdx + 1), fX + 3, fY + 2.2, { align: 'center' });

      pdf.setTextColor(isLight ? 15 : 240, isLight ? 23 : 245, isLight ? 42 : 255);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.8);
      const factLines = pdf.splitTextToSize(fact, factColW - 9);
      pdf.text(factLines.slice(0, 3), fX + 8, fY + 1.5, { lineHeightFactor: 1.25 });
    });

    // Pie de Pág 3
    pdf.line(margin, height - 14, width - margin, height - 14);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(isLight ? 148 : 100, isLight ? 163 : 116, isLight ? 184 : 139);
    pdf.text(
      isEn ? 'WorldFlags • Sovereign History & 10 Curious Facts Compendium' : 'MundoBanderas • Compendio de Historia Soberana & 10 Datos Curiosos',
      margin,
      height - 9.5
    );
    pdf.setFont('helvetica', 'bold');
    pdf.text(isEn ? 'PAGE 3' : 'PÁGINA 3', width - margin, height - 9.5, { align: 'right' });

    const cleanName = (isEn ? (country.nameEn || country.nameEs) : country.nameEs)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    const filename = isEn
      ? `Vector_Flag_Atlas_SVG_3Pages_${country.code3 || country.id.toUpperCase()}_${cleanName}_${paperSize}.pdf`
      : `Atlas_Vectorial_SVG_3Paginas_${country.id.toUpperCase()}_${cleanName}_${paperSize}.pdf`;
    pdf.save(filename);
  }

  private static getColorHex(colorName: string): string {
    const map: Record<string, string> = {
      red: '#EF4444',
      blue: '#2563EB',
      yellow: '#EAB308',
      green: '#10B981',
      white: '#F8FAFC',
      black: '#0F172A',
      orange: '#F97316',
      purple: '#8B5CF6'
    };
    return map[colorName.toLowerCase()] || '#64748B';
  }

  private static hexToRgb(hex: string): [number, number, number] {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }
}
