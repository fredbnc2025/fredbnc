import { Country } from '../types';

export interface AmazonListingMetadata {
  title: string;
  subtitle: string;
  author: string;
  descriptionHtml: string;
  descriptionText: string;
  keywords: string[];
  categories: string[];
  kdpPricing: {
    suggestedListPriceUsd: number;
    currency: string;
    minimumPriceUsd: number;
    estimatedRoyalty70Percent: number;
    printOnDemandCostEstimate: number;
  };
  bookSpecifications: {
    trimSize: string; // e.g. "8.5 x 11 in" (Letter)
    interiorType: string; // Premium Color interior with white paper
    paperType: string; // White Paper (Papel Bond 80-90g)
    coverFinish: string; // Matte / Glossy
    pageCount: number;
    spineWidthIn: number;
    spineWidthMm: number;
    bleed: string;
  };
  bulletPoints: string[];
}

export class AmazonKdpService {
  /**
   * Calcula el lomo reglamentario para Amazon KDP en pulgadas y milímetros
   * Papel Bond Blanco Interior Color Premium KDP: 0.002252 pulgadas por página (0.0572 mm/pág)
   */
  public static calculateSpineWidth(pageCount: number): { spineWidthIn: number; spineWidthMm: number } {
    const spineWidthIn = Math.max(0.0625, Number((pageCount * 0.002252).toFixed(4)));
    const spineWidthMm = Number((spineWidthIn * 25.4).toFixed(2));
    return { spineWidthIn, spineWidthMm };
  }

  /**
   * Generates the complete Amazon KDP & Kindle Direct Publishing product listing payload
   */
  public static generateListingMetadata(countries: Country[]): AmazonListingMetadata {
    const countriesPerTocPage = 40;
    const tocPagesCount = Math.max(1, Math.ceil(countries.length / countriesPerTocPage));
    // Portada (1) + Copyright (1) + Índice (tocPagesCount) + Divisores de Continente (5) + Países (N) + Apéndice (1) + Contraportada (1)
    const continentCount = 5;
    const totalPages = 1 + 1 + tocPagesCount + continentCount + countries.length + 1 + 1;
    const countriesCount = countries.length;
    const { spineWidthIn, spineWidthMm } = this.calculateSpineWidth(totalPages);

    const title = `Atlas Mundial de Banderas y Naciones: Edición Oficial Clasificada por Continentes`;
    const subtitle = `Enciclopedia Vexilológica y Geográfica Ilustrada en Alta Resolución con Banderas Vectoriales SVG, Heráldica y Datos de Soberanía`;
    const author = `MundoBanderas Editorial`;

    const bulletPoints = [
      `BANDERAS VECTORIALES SVG EN ALTA DEFINICIÓN (300+ DPI): Cada uno de los ${countriesCount} estados soberanos cuenta con su pabellón oficial incrustado en máxima nitidez y proporción geométrica exacta.`,
      `NOMBRE OFICIAL EN ESPAÑOL E IDENTIFICACIÓN SOBERANA: Nombre destacado en tipografía de imprenta, denominación internacional en inglés, código de tres letras ISO 3166-1 y continente.`,
      `FICHA COMPLETA DE SOBERANÍA Y GEOGRAFÍA: Capital de estado, población estimada, superficie territorial en km², moneda de curso legal e idiomas oficiales por cada país.`,
      `SIGNIFICADO HERÁLDICO Y PROPORCIÓN REGLAMENTARIA: Explicación del simbolismo de los colores de estado y proporción cívica oficial (2:3, 1:2, 3:5, 1:1).`,
      `ESTRUCTURA EDITORIAL COMPLETA PARA AMAZON KDP (${totalPages} PÁGINAS): Portada interior, página de créditos legales con ISBN, índice general numerado, apéndice vexilológico y contraportada con área de código de barras.`,
      `CUMPLIMIENTO ESTRICTO DE MÁRGENES DE IMPRENTA: Formato estándar 8.5" x 11" (Carta) con márgenes de seguridad de 0.5" certificados para pasar la revisión automática de Kindle Direct Publishing.`
    ];

    const descriptionHtml = `
<h2>🌍 Atlas Mundial de Banderas: La Enciclopedia Vexilológica Definitiva</h2>
<p><strong>Descubre la obra visual de referencia más completa, rigurosa y nítida sobre los pabellones oficiales y símbolos de soberanía de todos los países del planeta.</strong></p>

<h3>¿Qué encontrarás en este volumen de ${totalPages} páginas?</h3>
<ul>
  <li><strong>${countriesCount} Páginas Exclusivas de Países:</strong> Una página completa por nación con su bandera vectorial SVG de alta definición y su nombre oficial claramente identificado.</li>
  <li><strong>Ficha de Datos de Soberanía:</strong> Capital nacional, región geográfica, población, extensión territorial en km², moneda e idiomas oficiales.</li>
  <li><strong>Simbolismo y Heráldica:</strong> El significado histórico y constitucional de los colores de cada bandera, junto con su proporción geométrica reglamentaria.</li>
  <li><strong>Página Legal y Derechos de Autor:</strong> Ficha técnica con ISBN-13, depósito editorial y registro de derechos de autor para venta internacional en Amazon KDP.</li>
  <li><strong>Índice General de Banderas:</strong> Tabla de contenidos paginada para una rápida localización de cualquier nación.</li>
  <li><strong>Apéndice Vexilológico:</strong> Glosario técnico ilustrado con las partes de una bandera (asta, vexilo, cantón, mosca), familias cromáticas mundiales y proporciones heráldicas.</li>
  <li><strong>Formato Carta / Letter (8.5 x 11 pulgadas):</strong> Interior a todo color sobre papel bond de calidad editorial.</li>
</ul>

<h3>🎯 Ideal para:</h3>
<p>Estudiantes, docentes, bibliotecas escolares y universitarias, diplomáticos, amantes de la historia y la geografía, y apasionados de la vexilología.</p>
`.trim();

    const descriptionText = `
ATLAS MUNDIAL DE BANDERAS: ENCICLOPEDIA VEXILOLÓGICA OFICIAL DE TODAS LAS NACIONES DEL MUNDO

Descubre la obra visual de referencia más completa, rigurosa y nítida sobre los pabellones oficiales y símbolos de soberanía de todos los países del planeta.

QUÉ ENCONTRARÁS EN ESTE VOLUMEN DE ${totalPages} PÁGINAS:
- ${countriesCount} Páginas Exclusivas de Países: Una página completa por nación con su bandera vectorial SVG de alta definición y su nombre oficial claramente identificado.
- Ficha de Datos de Soberanía: Capital nacional, región geográfica, población, extensión territorial en km², moneda e idiomas oficiales.
- Simbolismo y Heráldica: El significado histórico y constitucional de los colores de cada bandera, junto con su proporción geométrica reglamentaria.
- Página Legal y Derechos de Autor: Ficha técnica con ISBN-13, depósito editorial y registro de derechos de autor para venta internacional en Amazon KDP.
- Índice General de Banderas: Tabla de contenidos paginada para una rápida localización de cualquier nación.
- Apéndice Vexilológico: Glosario técnico ilustrado con las partes de una bandera, familias cromáticas mundiales y proporciones heráldicas.
- Formato Carta / Letter (8.5 x 11 pulgadas): Impresión a todo color sobre papel bond blanco.

IDEAL PARA:
Estudiantes, docentes, diplomáticos, bibliotecas y entusiastas de la vexilología y geografía mundial.
`.trim();

    const keywords = [
      'atlas de banderas del mundo',
      'banderas de todos los paises con nombres',
      'enciclopedia vexilologica mundial',
      'banderas en alta definicion svg',
      'capitales y paises del mundo libro',
      'guia visual de banderas y naciones',
      'simbolos patrios y heraldica mundial'
    ];

    const categories = [
      'Nonfiction > Reference > Atlases & Maps',
      'Nonfiction > History > Historical Geography',
      'Nonfiction > Education > Teaching Materials > Social Studies',
      'Juvenile Nonfiction > Reference > Atlases'
    ];

    return {
      title,
      subtitle,
      author,
      descriptionHtml,
      descriptionText,
      keywords,
      categories,
      kdpPricing: {
        suggestedListPriceUsd: 19.99,
        currency: 'USD',
        minimumPriceUsd: 12.99,
        estimatedRoyalty70Percent: 9.85,
        printOnDemandCostEstimate: 6.50
      },
      bookSpecifications: {
        trimSize: '8.5 x 11 in (21.59 x 27.94 cm) - Carta / Letter Papel Bond',
        interiorType: 'Premium Color Interior with White Paper',
        paperType: 'White Paper 50-61lb (Papel Bond Blanco de Alta Resistencia)',
        coverFinish: 'Matte / Brillante según preferencia',
        pageCount: totalPages,
        spineWidthIn,
        spineWidthMm,
        bleed: 'No Bleed (Márgenes de seguridad KDP 0.5 in incluidos)'
      },
      bulletPoints
    };
  }

  /**
   * Genera el archivo de texto estructurado para copiar y pegar directamente en los 3 pasos de KDP sin trabas
   */
  public static generateCopyPasteGuide(countries: Country[]): string {
    const meta = this.generateListingMetadata(countries);
    return `================================================================================
GUÍA RÁPIDA DE COPIAR Y PEGAR PARA AMAZON KINDLE DIRECT PUBLISHING (KDP)
Atlas Mundial de Banderas y Naciones - Edición Clasificada por Continentes
================================================================================

PASO 1: DETALLES DEL LIBRO DE TAPA BLANDA (kdp.amazon.com)
--------------------------------------------------------------------------------
1. Idioma:
Español

2. Título del libro:
${meta.title}

3. Subtítulo:
${meta.subtitle}

4. Serie:
(Dejar en blanco o: Colección Enciclopedias Geográficas Mundiales)

5. Número de edición:
1

6. Autor principal:
Nombre: MundoBanderas
Apellidos: Editorial

7. Descripción (Copia y pega este texto con formato para que se vea perfecto en Amazon):
${meta.descriptionHtml}

8. Derechos de publicación:
[X] Poseo los derechos de autor y los derechos de publicación necesarios.

9. Palabras clave principales (Pega una en cada una de las 7 casillas):
1) ${meta.keywords[0]}
2) ${meta.keywords[1]}
3) ${meta.keywords[2]}
4) ${meta.keywords[3]}
5) ${meta.keywords[4]}
6) ${meta.keywords[5]}
7) ${meta.keywords[6]}

10. Categorías (Selecciona al menos 2):
- No ficción infantil > Consulta > Atlas
- No ficción > Historia > Geografía histórica
- Educación y enseñanza > Ciencias sociales


PASO 2: CONTENIDO DEL LIBRO DE TAPA BLANDA
--------------------------------------------------------------------------------
1. ISBN de KDP:
[X] Asignarme un ISBN de KDP gratuito (o introduce tu propio ISBN adquirido).

2. Fecha de publicación:
(Dejar en blanco para publicación inmediata).

3. Opciones de impresión:
- Interior: [X] Interior a todo color de primera calidad con papel blanco
- Tamaño de corte (Trim Size): [X] 8.5 x 11 in (21.59 x 27.94 cm)
- Sangría: [X] Sin sangría (No Bleed)
- Acabado de la cubierta: [X] Brillante (Glossy) o Mate (Matte)

4. Manuscrito:
- Haz clic en "Subir manuscrito de tapa blanda"
- Selecciona el archivo: 01_Atlas_Mundial_Banderas_Interior_KDP.pdf
- Número de páginas compiladas: ${meta.bookSpecifications.pageCount} páginas

5. Cubierta del libro:
- Selecciona: [X] Subir una cubierta que ya tienes (solo PDF lista para imprimir)
- Sube el archivo: 02_Atlas_Mundial_Banderas_Cubierta_Completa_KDP.pdf
- Medidas exactas generadas: Ancho total con lomo ${meta.bookSpecifications.spineWidthMm} mm + 0.125" sangría.

6. Vista previa del libro:
- Haz clic en "Iniciar el Creador de vistas previas".
- Espera la comprobación automatizada de Amazon (sin errores de sangría ni texto cortado).
- Haz clic en "Aprobar".


PASO 3: DERECHOS Y PRECIOS DEL LIBRO DE TAPA BLANDA
--------------------------------------------------------------------------------
1. Territorios:
[X] Todos los territorios (derechos mundiales)

2. Tienda principal:
Amazon.com (o Amazon.es)

3. Precios y regalías sugeridas:
- Precio de lista sugerido: $${meta.kdpPricing.suggestedListPriceUsd} USD (o 22,99 €)
- Coste de impresión estimado: ~$${meta.kdpPricing.printOnDemandCostEstimate} USD
- Regalía neta estimada por ejemplar (70%): ~$${meta.kdpPricing.estimatedRoyalty70Percent} USD

4. Distribución ampliada:
[X] Marcar casilla de Distribución ampliada (permite vender en librerías y bibliotecas).

5. Publicar:
- Haz clic en el botón amarillo: "Publicar tu libro de tapa blanda".
================================================================================
`;
  }

  /**
   * Generates a downloadable JSON manifest for automated Amazon KDP / API uploads
   */
  public static downloadKdpManifest(countries: Country[]): void {
    const metadata = this.generateListingMetadata(countries);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(metadata, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `amazon_kdp_atlas_mundial_metadata_${countries.length}_paises.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}
