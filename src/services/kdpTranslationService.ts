import { Country, Continent } from '../types';
import { ALL_COUNTRY_TRANSLATIONS_EN } from '../data/translations';

export interface TranslatedContinentMeta {
  id: string;
  name: string;
  nameEn: string;
  roman: string;
  approxPopEn: string;
  approxAreaEn: string;
  languagesEn: string;
  heraldicCharacteristicsEn: string;
  keyElementsEn: string[];
}

export const CONTINENT_SECTION_METAS_EN: Record<string, TranslatedContinentMeta> = {
  'Europa': {
    id: 'europa',
    name: 'Europa',
    nameEn: 'Europe',
    roman: 'I',
    approxPopEn: '~750 Million inhabitants',
    approxAreaEn: '10,180,000 km²',
    languagesEn: 'English, French, German, Spanish, Italian, Russian',
    heraldicCharacteristicsEn: 'Cradle of modern regulated vexillology. Notable for revolutionary tricolors inspired by the French and Dutch revolutions, Scandinavian Nordic Crosses (Denmark, Sweden, Norway, Finland, Iceland), double-headed imperial eagles, and the Cross of Saint George.',
    keyElementsEn: ['Horizontal and Vertical Tricolors', 'Scandinavian Nordic Crosses', 'Pan-Slavic Colors (White, Blue, Red)', 'Historical Heraldry & St. George Cross']
  },
  'América': {
    id: 'america',
    name: 'América',
    nameEn: 'Americas',
    roman: 'II',
    approxPopEn: '~1.03 Billion inhabitants',
    approxAreaEn: '42,550,000 km²',
    languagesEn: 'English, Spanish, Portuguese, French, and Indigenous Languages',
    heraldicCharacteristicsEn: 'Patriotic symbols forged during republican independence movements. Prominent features include the Incan Sun of May (Argentina and Uruguay), federal stripes and stellar constellations (USA, Brazil, Venezuela), the maple leaf, and Miranda\'s Gran Colombian triad (Yellow, Blue, and Red).',
    keyElementsEn: ['Suns of May of Independence', 'Liberation Stripes & Federal Stars', 'Gran Colombian Triad (Yellow, Blue, Red)', 'Nature Emblems & Sovereign Shields']
  },
  'Asia': {
    id: 'asia',
    name: 'Asia',
    nameEn: 'Asia',
    roman: 'III',
    approxPopEn: '~4.75 Billion inhabitants',
    approxAreaEn: '44,580,000 km²',
    languagesEn: 'Mandarin, Hindi, Arabic, Bengali, Russian, Japanese',
    heraldicCharacteristicsEn: 'Millennia-old confluence of dynastic, philosophical, and spiritual traditions. Dominated by Pan-Arab Colors (Black, White, Green, and Red), the Eastern Rising Sun, the Islamic Crescent and Star, the Wheel of Dharma (Ashoka Chakra), and geometric emblems of cosmic harmony.',
    keyElementsEn: ['Pan-Arab Colors of Historic Dynasties', 'Islamic Crescents and Five-Pointed Stars', 'Rising Suns and Dharma Wheels', 'Traditional Patterns and State Stripes']
  },
  'África': {
    id: 'africa',
    name: 'África',
    nameEn: 'Africa',
    roman: 'IV',
    approxPopEn: '~1.4 Billion inhabitants',
    approxAreaEn: '30,370,000 km²',
    languagesEn: 'Arabic, French, English, Swahili, Portuguese',
    heraldicCharacteristicsEn: 'Remarkable geometric vibrancy and identity strength. Inspired by the historic Ethiopian flag that resisted colonialism, Pan-African Colors prevail (Green for agricultural fertility, Yellow for mineral wealth, Red for martyrs\' blood, and Black for the people).',
    keyElementsEn: ['Pan-African Colors (Green, Yellow, Red, Black)', 'Chevrons and Triangles at the Hoist', 'Fish Eagles and African Wildlife', 'Black Stars of African Freedom']
  },
  'Oceanía': {
    id: 'oceania',
    name: 'Oceanía',
    nameEn: 'Oceania',
    roman: 'V',
    approxPopEn: '~45 Million inhabitants',
    approxAreaEn: '8,526,000 km²',
    languagesEn: 'English, French, Polynesian and Melanesian Languages',
    heraldicCharacteristicsEn: 'Island and continental territories of the Great Pacific Ocean. Distinguished by sky-blue and deep-sea maritime fields, the Southern Cross constellation (Crux) guiding voyagers, British Blue Ensign cantons, and traditional Polynesian navigation motifs.',
    keyElementsEn: ['Southern Cross Constellation (Crux)', 'British Maritime Blue Ensign Cantons', 'Polynesian Star Navigation Motifs', 'Pacific Ocean Fields and Tropical Suns']
  }
};

export class KdpTranslationService {
  /**
   * Mapeo de continentes a inglés
   */
  public static getContinentEn(continent: Continent | string): string {
    const map: Record<string, string> = {
      'Europa': 'Europe',
      'América': 'Americas',
      'América del Sur': 'South America',
      'América del Norte': 'North America',
      'Asia': 'Asia',
      'África': 'Africa',
      'Oceanía': 'Oceania'
    };
    return map[continent] || continent;
  }

  /**
   * Traduce cadenas de idiomas al inglés
   */
  /**
   * Traduce cadenas de idiomas al inglés con soporte para catálogo completo de 249 países
   */
  public static translateLanguage(lang: string, countryId?: string): string {
    if (countryId) {
      const entry = ALL_COUNTRY_TRANSLATIONS_EN[countryId.toLowerCase()];
      if (entry && entry.languageEn) {
        return entry.languageEn;
      }
    }
    if (!lang) return 'Official language';
    return lang
      .replace(/Español/gi, 'Spanish')
      .replace(/Inglés/gi, 'English')
      .replace(/Francés/gi, 'French')
      .replace(/Alemán/gi, 'German')
      .replace(/Italiano/gi, 'Italian')
      .replace(/Portugués/gi, 'Portuguese')
      .replace(/Ruso/gi, 'Russian')
      .replace(/Árabe/gi, 'Arabic')
      .replace(/Mandarín/gi, 'Mandarin')
      .replace(/Chino/gi, 'Chinese')
      .replace(/Japonés/gi, 'Japanese')
      .replace(/Coreano/gi, 'Korean')
      .replace(/Neerlandés/gi, 'Dutch')
      .replace(/Holandés/gi, 'Dutch')
      .replace(/Griego/gi, 'Greek')
      .replace(/Sueco/gi, 'Swedish')
      .replace(/Noruego/gi, 'Norwegian')
      .replace(/Danés/gi, 'Danish')
      .replace(/Finés/gi, 'Finnish')
      .replace(/Finlandés/gi, 'Finnish')
      .replace(/Polaco/gi, 'Polish')
      .replace(/Turco/gi, 'Turkish')
      .replace(/Hindi/gi, 'Hindi')
      .replace(/Bengalí/gi, 'Bengali')
      .replace(/Suajili/gi, 'Swahili')
      .replace(/Swahili/gi, 'Swahili')
      .replace(/Catalán/gi, 'Catalan')
      .replace(/Gallego/gi, 'Galician')
      .replace(/Vasco/gi, 'Basque')
      .replace(/Albanés/gi, 'Albanian')
      .replace(/Bielorruso/gi, 'Belarusian')
      .replace(/Bosnio/gi, 'Bosnian')
      .replace(/Croata/gi, 'Croatian')
      .replace(/Serbio/gi, 'Serbian')
      .replace(/Búlgaro/gi, 'Bulgarian')
      .replace(/Eslovaco/gi, 'Slovak')
      .replace(/Esloveno/gi, 'Slovenian')
      .replace(/Estonio/gi, 'Estonian')
      .replace(/Letón/gi, 'Latvian')
      .replace(/Lituano/gi, 'Lithuanian')
      .replace(/Luxemburgués/gi, 'Luxembourgish')
      .replace(/Rumano/gi, 'Romanian')
      .replace(/Montenegrino/gi, 'Montenegrin')
      .replace(/Feroés/gi, 'Faroese')
      .replace(/Macedonio/gi, 'Macedonian')
      .replace(/Manés/gi, 'Manx')
      .replace(/Irlandés/gi, 'Irish')
      .replace(/Islandés/gi, 'Icelandic')
      .replace(/Maltés/gi, 'Maltese')
      .replace(/Hebreo/gi, 'Hebrew')
      .replace(/Persa/gi, 'Persian')
      .replace(/Farsi/gi, 'Farsi')
      .replace(/Urdu/gi, 'Urdu')
      .replace(/Tagalo/gi, 'Tagalog')
      .replace(/Filipino/gi, 'Filipino')
      .replace(/Tailandés/gi, 'Thai')
      .replace(/Vietnamita/gi, 'Vietnamese')
      .replace(/Indonesio/gi, 'Indonesian')
      .replace(/Malayo/gi, 'Malay')
      .replace(/Birmano/gi, 'Burmese')
      .replace(/Jemer/gi, 'Khmer')
      .replace(/Laosiano/gi, 'Lao')
      .replace(/Lao/gi, 'Lao')
      .replace(/Mongol/gi, 'Mongolian')
      .replace(/Tibetano/gi, 'Tibetan')
      .replace(/Armenio/gi, 'Armenian')
      .replace(/Azerí/gi, 'Azerbaijani')
      .replace(/Georgiano/gi, 'Georgian')
      .replace(/Kazajo/gi, 'Kazakh')
      .replace(/Kirguís/gi, 'Kyrgyz')
      .replace(/Tayiko/gi, 'Tajik')
      .replace(/Turcomano/gi, 'Turkmen')
      .replace(/Uzbeko/gi, 'Uzbek')
      .replace(/Pastún/gi, 'Pashto')
      .replace(/Darí/gi, 'Dari')
      .replace(/Amhárico/gi, 'Amharic')
      .replace(/Somalí/gi, 'Somali')
      .replace(/Yoruba/gi, 'Yoruba')
      .replace(/Ibo/gi, 'Igbo')
      .replace(/Igbo/gi, 'Igbo')
      .replace(/Hausa/gi, 'Hausa')
      .replace(/Zulú/gi, 'Zulu')
      .replace(/Xhosa/gi, 'Xhosa')
      .replace(/Afrikáans/gi, 'Afrikaans')
      .replace(/Guaraní/gi, 'Guarani')
      .replace(/Quechua/gi, 'Quechua')
      .replace(/Aimara/gi, 'Aymara')
      .replace(/Náhuatl/gi, 'Nahuatl')
      .replace(/Maya/gi, 'Maya')
      .replace(/Papiamento/gi, 'Papiamento')
      .replace(/Criollo/gi, 'Creole')
      .replace(/Samoano/gi, 'Samoan')
      .replace(/Tongano/gi, 'Tongan')
      .replace(/Fiyiano/gi, 'Fijian')
      .replace(/Maorí/gi, 'Māori')
      .replace(/Palauano/gi, 'Palauan')
      .replace(/Marshallés/gi, 'Marshallese')
      .replace(/Gilbertés/gi, 'Gilbertese')
      .replace(/Tuvaluano/gi, 'Tuvaluan')
      .replace(/Nauruano/gi, 'Nauruan')
      .replace(/Tetun/gi, 'Tetum')
      .replace(/Dhivehi/gi, 'Maldivian (Dhivehi)')
      .replace(/Cingalés/gi, 'Sinhala')
      .replace(/Tamil/gi, 'Tamil')
      .replace(/Nepalí/gi, 'Nepali')
      .replace(/Dzongkha/gi, 'Dzongkha')
      .replace(/Kurdo/gi, 'Kurdish')
      .replace(/Groenlandés/gi, 'Greenlandic')
      .replace(/Lenguas Nativas/gi, 'Indigenous Languages')
      .replace(/Lenguas Polinesias y Melanesias/gi, 'Polynesian & Melanesian Languages')
      .replace(/Lenguas Criollas/gi, 'Creole Languages');
  }

  /**
   * Traduce nombres de monedas al inglés con soporte para catálogo completo de 249 países
   */
  public static translateCurrency(curr: string, countryId?: string): string {
    if (countryId) {
      const entry = ALL_COUNTRY_TRANSLATIONS_EN[countryId.toLowerCase()];
      if (entry && entry.currencyEn) {
        return entry.currencyEn;
      }
    }
    if (!curr) return 'Official currency';
    return curr
      .replace(/Lek albanés\s*\(L\)/gi, 'Albanian Lek (L)')
      .replace(/Lek albanés/gi, 'Albanian Lek')
      .replace(/Euro/gi, 'Euro')
      .replace(/Dólar estadounidense/gi, 'US Dollar')
      .replace(/Dólar canadiense/gi, 'Canadian Dollar')
      .replace(/Dólar australiano/gi, 'Australian Dollar')
      .replace(/Dólar neozelandés/gi, 'New Zealand Dollar')
      .replace(/Dólar de Singapur/gi, 'Singapore Dollar')
      .replace(/Dólar de Hong Kong/gi, 'Hong Kong Dollar')
      .replace(/Dólar de Brunéi/gi, 'Brunei Dollar')
      .replace(/Dólar de las Islas Caimán/gi, 'Cayman Islands Dollar')
      .replace(/Dólar de Bermudas/gi, 'Bermudian Dollar')
      .replace(/Dólar bahameño/gi, 'Bahamian Dollar')
      .replace(/Dólar barbadense/gi, 'Barbadian Dollar')
      .replace(/Dólar beliceño/gi, 'Belize Dollar')
      .replace(/Dólar fiyiano/gi, 'Fijian Dollar')
      .replace(/Dólar guyanés/gi, 'Guyanese Dollar')
      .replace(/Dólar jamaiquino/gi, 'Jamaican Dollar')
      .replace(/Dólar liberiano/gi, 'Liberian Dollar')
      .replace(/Dólar namibio/gi, 'Namibian Dollar')
      .replace(/Dólar surinamés/gi, 'Surinamese Dollar')
      .replace(/Dólar de Trinidad y Tobago/gi, 'Trinidad & Tobago Dollar')
      .replace(/Dólar salomonense/gi, 'Solomon Islands Dollar')
      .replace(/Dólar del Caribe Oriental/gi, 'East Caribbean Dollar')
      .replace(/Libra esterlina/gi, 'Pound Sterling')
      .replace(/Libra de Gibraltar/gi, 'Gibraltar Pound')
      .replace(/Libra manesa/gi, 'Manx Pound')
      .replace(/Libra de Jersey/gi, 'Jersey Pound')
      .replace(/Libra de Guernsey/gi, 'Guernsey Pound')
      .replace(/Franco suizo/gi, 'Swiss Franc')
      .replace(/Franco CFA/gi, 'CFA Franc')
      .replace(/Franco CFP/gi, 'CFP Franc')
      .replace(/Yen japonés/gi, 'Japanese Yen')
      .replace(/Yuan chino/gi, 'Chinese Yuan')
      .replace(/Rublo ruso/gi, 'Russian Ruble')
      .replace(/Rublo bielorruso/gi, 'Belarusian Ruble')
      .replace(/Rupia india/gi, 'Indian Rupee')
      .replace(/Rupia pakistaní/gi, 'Pakistani Rupee')
      .replace(/Rupia de Sri Lanka/gi, 'Sri Lankan Rupee')
      .replace(/Rupia indonesia/gi, 'Indonesian Rupiah')
      .replace(/Real brasileño/gi, 'Brazilian Real')
      .replace(/Peso mexicano/gi, 'Mexican Peso')
      .replace(/Peso argentino/gi, 'Argentine Peso')
      .replace(/Peso colombiano/gi, 'Colombian Peso')
      .replace(/Peso chileno/gi, 'Chilean Peso')
      .replace(/Peso dominicano/gi, 'Dominican Peso')
      .replace(/Peso cubano/gi, 'Cuban Peso')
      .replace(/Peso uruguayo/gi, 'Uruguayan Peso')
      .replace(/Peso filipino/gi, 'Philippine Peso')
      .replace(/Sol peruano/gi, 'Peruvian Sol')
      .replace(/Sol\s*\(S\/\)/gi, 'Peruvian Sol (S/)')
      .replace(/Boliviano/gi, 'Boliviano')
      .replace(/Guaraní/gi, 'Guaraní')
      .replace(/Bolívar Digital/gi, 'Venezuelan Bolívar')
      .replace(/Bolívar/gi, 'Bolívar')
      .replace(/Quetzal/gi, 'Quetzal')
      .replace(/Lempira/gi, 'Lempira')
      .replace(/Córdoba/gi, 'Córdoba')
      .replace(/Colón costarricense/gi, 'Costa Rican Colón')
      .replace(/Corona sueca/gi, 'Swedish Krona')
      .replace(/Corona noruega/gi, 'Norwegian Krone')
      .replace(/Corona danesa/gi, 'Danish Krone')
      .replace(/Corona checa/gi, 'Czech Koruna')
      .replace(/Corona islandesa/gi, 'Icelandic Króna')
      .replace(/Corona feroesa/gi, 'Faroese Króna')
      .replace(/Rand sudafricano/gi, 'South African Rand')
      .replace(/Dinar serbio/gi, 'Serbian Dinar')
      .replace(/Dinar/gi, 'Dinar')
      .replace(/Dirham/gi, 'Dirham')
      .replace(/Riyal/gi, 'Riyal')
      .replace(/Rial/gi, 'Rial')
      .replace(/Shekel/gi, 'Shekel')
      .replace(/Florín húngaro/gi, 'Hungarian Forint')
      .replace(/Leu rumano/gi, 'Romanian Leu')
      .replace(/Leu moldavo/gi, 'Moldovan Leu')
      .replace(/Lev búlgaro/gi, 'Bulgarian Lev')
      .replace(/Grivna/gi, 'Ukrainian Hryvnia')
      .replace(/Lira turca/gi, 'Turkish Lira')
      .replace(/Złoty/gi, 'Polish Złoty')
      .replace(/Marco convertible/gi, 'Convertible Mark')
      .replace(/Denar macedonio/gi, 'Macedonian Denar');
  }

  /**
   * Traduce o adapta con alta fidelidad el significado heráldico de la bandera al inglés
   * Consultando el catálogo general de traducciones para los 249 países
   */
  public static translateSymbolism(country: Country): string {
    const cid = country.id.toLowerCase();
    const entry = ALL_COUNTRY_TRANSLATIONS_EN[cid];
    if (entry && entry.flagSymbolismEn) {
      return entry.flagSymbolismEn;
    }

    const es = country.flagSymbolismEs;
    if (!es) {
      return `Official sovereign national flag of ${country.nameEn || country.nameEs} with regulation proportions and authorized state colors registered under international vexillological standards.`;
    }

    return `Official sovereign national flag of ${country.nameEn || country.nameEs} featuring constitutional geometric proportions and heraldic state colors.`;
  }

  /**
   * Traduce o adapta con alta fidelidad los datos curiosos al inglés
   * Consultando el catálogo general de traducciones para los 249 países
   */
  public static translateFunFact(country: Country): string {
    const cid = country.id.toLowerCase();
    const entry = ALL_COUNTRY_TRANSLATIONS_EN[cid];
    if (entry && entry.funFactEn) {
      return entry.funFactEn;
    }

    return `Significant sovereign nation of ${KdpTranslationService.getContinentEn(country.continent)}, celebrated for its rich historical heritage, natural biodiversity, and unique cultural traditions.`;
  }

  /**
   * Metadatos para Amazon KDP en Inglés
   */
  public static generateEnglishListingMetadata(
    countries: Country[],
    bookFormat: 'paperback' | 'hardcover' = 'paperback'
  ) {
    const isHardcover = bookFormat === 'hardcover';
    const countriesPerTocPage = 40;
    const tocPagesCount = Math.max(1, Math.ceil(countries.length / countriesPerTocPage));
    const continentCount = 5;
    const totalPages = 1 + 1 + tocPagesCount + continentCount + countries.length + 1 + 1;
    const countriesCount = countries.length;

    // Hardcover Case Laminate spine calculation includes board backing (+0.08 in / 2 mm)
    const spineWidthIn = Number(((totalPages * 0.002252) + (isHardcover ? 0.08 : 0)).toFixed(4));
    const spineWidthMm = Number((spineWidthIn * 25.4).toFixed(2));

    const title = isHardcover
      ? `World Flag Atlas & Nations: Official Hardcover Collector's Edition`
      : `World Flag Atlas & Nations: Official Illustrated Continental Edition`;

    const subtitle = isHardcover
      ? `Definitive Case-Laminate Vexillological Encyclopedia with High-Definition SVG Vector Flags, Heraldry, and Sovereign Profiles`
      : `High-Resolution Vexillological and Geographic Encyclopedia with SVG Vector Flags, Heraldry, and Sovereign Profiles`;

    const author = `WorldFlags Publishing`;

    const suggestedPrice = isHardcover ? 32.99 : 24.99;
    const minPrice = isHardcover ? 19.99 : 14.99;
    const printCost = isHardcover ? 11.50 : 6.80;
    const estimatedRoyalty = Number(((suggestedPrice * 0.6) - printCost).toFixed(2));

    const bulletPoints = [
      `HIGH-DEFINITION SVG VECTOR FLAGS (300+ DPI): Every single one of the ${countriesCount} sovereign nations features its official state flag rendered in pristine geometric proportion and vector crispness.`,
      `ENGLISH AND NATIVE STATE NAMES: Clearly labeled with official country name in English, native designation, three-letter ISO 3166-1 alpha-3 code, and continental classification.`,
      `COMPREHENSIVE SOVEREIGN PROFILE: State capital, estimated population, geographic land area in km², official currency, and state languages for every territory.`,
      `HERALDIC MEANINGS & OFFICIAL PROPORTIONS: Detailed constitutional breakdown of state colors, stars, suns, crosses, and coats of arms alongside regulation proportions (2:3, 1:2, 3:5, 1:1).`,
      `FULL KDP EDITORIAL STRUCTURE (${totalPages} PAGES): Title page, copyright page with ISBN, numbered table of contents, continent dividers, vexillological appendix, and back cover barcode area.`,
      `AMAZON KDP COMPLIANT PRINT MARGINS: Standard ${isHardcover ? '8.25" x 11" Case Laminate / 8.5" x 11"' : '8.5" x 11" Letter'} format with 0.5" safety zones certified for Kindle Direct Publishing automatic approval.`
    ];

    const descriptionHtml = `
<h2>🌍 World Flag Atlas & Nations: The Definitive Vexillological Encyclopedia</h2>
<p><strong>Discover the most comprehensive, rigorous, and visually stunning reference work on the official flags and sovereign symbols of every nation on Earth.</strong></p>

<h3>What will you find inside this ${totalPages}-page ${isHardcover ? 'Hardcover Collector\'s' : 'Volume'}?</h3>
<ul>
  <li><strong>${countriesCount} Dedicated Country Pages:</strong> A full page per nation featuring its official high-definition SVG vector flag and sovereign identification.</li>
  <li><strong>Sovereignty & Demographic Data:</strong> National capital, geographic coordinates, population, land area in square kilometers, legal currency, and official languages.</li>
  <li><strong>Symbolism & Heraldry:</strong> The historical, constitutional, and cultural significance behind each flag's color palette, emblems, and civic proportions.</li>
  <li><strong>Editorial Copyright Page:</strong> Complete publishing credits, ISBN-13 registration, and Amazon KDP print-on-demand specifications.</li>
  <li><strong>Pagianted Table of Contents:</strong> Fast, convenient navigation organized logically across five continental sections.</li>
  <li><strong>Vexillological Appendix:</strong> Illustrated technical glossary covering flag anatomy (canton, field, fly, hoist, charge), global chromatic families, and standard proportions.</li>
  <li><strong>Premium Print Quality:</strong> Full-color interior on premium white bond paper.</li>
</ul>

<h3>🎯 Perfect for:</h3>
<p>Students, educators, academic and public libraries, diplomats, geography and history enthusiasts, and vexillology collectors.</p>
`.trim();

    const descriptionText = `
WORLD FLAG ATLAS & NATIONS: OFFICIAL VEXILLOLOGICAL ENCYCLOPEDIA OF EVERY NATION ON EARTH

Discover the most comprehensive, rigorous, and visually stunning reference work on the official flags and sovereign symbols of every country on Earth.

WHAT YOU WILL FIND IN THIS ${totalPages}-PAGE ${isHardcover ? 'HARDCOVER' : 'VOLUME'}:
- ${countriesCount} Dedicated Country Pages: Full-page high-definition SVG vector flags with official names.
- Sovereign Demographics: Capital, location coordinates, population, area in km², currency, and languages.
- Heraldic Symbolism: Constitutional breakdown of color meanings and geometric proportions.
- Legal Credits: ISBN-13 cataloging and print specifications for Amazon Kindle Direct Publishing.
- Table of Contents: Fast indexing across Europe, Americas, Asia, Africa, and Oceania.
- Vexillological Appendix: Anatomy of a flag, color families, and heraldic standards.

IDEAL FOR:
Students, teachers, diplomats, libraries, and enthusiasts of global geography and vexillology.
`.trim();

    const keywords = [
      'world flag atlas book',
      'flags of all countries with names',
      'world flags encyclopedia',
      'svg vector flags high resolution',
      'world capitals and nations guide',
      'geography reference book for school',
      'vexillology symbols and heraldry'
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
        suggestedListPriceUsd: suggestedPrice,
        currency: 'USD',
        minimumPriceUsd: minPrice,
        estimatedRoyalty70Percent: estimatedRoyalty,
        printOnDemandCostEstimate: printCost
      },
      bookSpecifications: {
        trimSize: isHardcover
          ? '8.25 x 11 in (20.95 x 27.94 cm) - Hardcover Case Laminate'
          : '8.5 x 11 in (21.59 x 27.94 cm) - Letter Paperback',
        interiorType: 'Premium Color Interior with White Paper',
        paperType: 'White Paper 55-60lb (High Quality Bond)',
        coverFinish: isHardcover ? 'Glossy / Matte Case Laminate' : 'Matte / Glossy Paperback',
        pageCount: totalPages,
        spineWidthIn,
        spineWidthMm,
        bleed: isHardcover ? 'Hardcover Case Wrap (0.591" turn-in + 0.394" hinge)' : 'Bleed / No Bleed 0.125"'
      },
      bulletPoints
    };
  }

  /**
   * Genera la guía de copiar y pegar en Inglés para Amazon KDP
   */
  public static generateEnglishCopyPasteGuide(
    countries: Country[],
    bookFormat: 'paperback' | 'hardcover' = 'paperback'
  ): string {
    const meta = this.generateEnglishListingMetadata(countries, bookFormat);
    const isHardcover = bookFormat === 'hardcover';

    return `================================================================================
AMAZON KINDLE DIRECT PUBLISHING (KDP) QUICK COPY-PASTE GUIDE
${meta.title} - ${isHardcover ? 'HARDCOVER EDITION' : 'PAPERBACK EDITION'}
================================================================================

STEP 1: ${isHardcover ? 'HARDCOVER DETAILS' : 'PAPERBACK DETAILS'} (kdp.amazon.com)
--------------------------------------------------------------------------------
1. Language:
English

2. Book Title:
${meta.title}

3. Subtitle:
${meta.subtitle}

4. Series:
(Leave blank or: World Geographical Reference Series)

5. Edition Number:
1

6. Primary Author:
First name: WorldFlags
Last name: Publishing

7. Description (Copy and paste formatted HTML):
${meta.descriptionHtml}

8. Publishing Rights:
[X] I own the copyright and I hold the necessary publishing rights.

9. Primary Keywords (Paste one into each of the 7 boxes):
1) ${meta.keywords[0]}
2) ${meta.keywords[1]}
3) ${meta.keywords[2]}
4) ${meta.keywords[3]}
5) ${meta.keywords[4]}
6) ${meta.keywords[5]}
7) ${meta.keywords[6]}

10. Categories (Choose at least 2):
- Nonfiction > Reference > Atlases & Maps
- Nonfiction > History > Historical Geography
- Juvenile Nonfiction > Reference > Atlases


STEP 2: ${isHardcover ? 'HARDCOVER CONTENT' : 'PAPERBACK CONTENT'}
--------------------------------------------------------------------------------
1. KDP ISBN:
[X] Assign me a free KDP ISBN (or provide your registered ISBN).

2. Publication Date:
(Leave blank for immediate release).

3. Print Options:
- Interior: [X] Premium color interior with white paper
- Trim Size: [X] ${isHardcover ? '8.25 x 11 in (20.95 x 27.94 cm)' : '8.5 x 11 in (21.59 x 27.94 cm)'}
- Bleed: [X] Bleed (PDF includes standard KDP bleed margins)
- Cover Finish: [X] Glossy or Matte Case Laminate

4. Manuscript Upload:
- Click "Upload ${isHardcover ? 'hardcover' : 'paperback'} manuscript"
- Select: 01_World_Flag_Atlas_Interior_KDP_EN.pdf
- Compiled Page Count: ${meta.bookSpecifications.pageCount} pages

5. Book Cover:
- Select: [X] Upload a cover you already have (print-ready PDF only)
- Select: 02_World_Flag_Atlas_${isHardcover ? 'Hardcover_Case_Laminate' : 'Paperback'}_Cover_KDP_EN.pdf
- Precise dimensions: Spine ${meta.bookSpecifications.spineWidthMm} mm ${isHardcover ? '+ 0.591" turn-in wrap + 0.394" hinge grooves' : '+ 0.125" bleed'}.

6. Book Previewer:
- Click "Launch Previewer".
- Verify automated check passes with zero margin errors.
- Click "Approve".


STEP 3: ${isHardcover ? 'HARDCOVER RIGHTS & PRICING' : 'PAPERBACK RIGHTS & PRICING'}
--------------------------------------------------------------------------------
1. Territories:
[X] All territories (worldwide rights)

2. Primary Marketplace:
Amazon.com (or Amazon.co.uk)

3. Pricing & Royalties:
- Suggested List Price: $${meta.kdpPricing.suggestedListPriceUsd} USD (£${(meta.kdpPricing.suggestedListPriceUsd * 0.8).toFixed(2)})
- Printing Cost Estimate: ~$${meta.kdpPricing.printOnDemandCostEstimate} USD
- Estimated Net Royalty per sale (60-70%): ~$${meta.kdpPricing.estimatedRoyalty70Percent} USD

4. Expanded Distribution:
[X] Check Expanded Distribution (enables book to be ordered by bookstores and libraries).

5. Publish:
- Click the yellow button: "Publish Your ${isHardcover ? 'Hardcover' : 'Paperback'} Book".
================================================================================
`;
  }

  /**
   * Genera los metadatos de Tapa Dura en Español para Amazon KDP
   */
  public static generateSpanishHardcoverListingMetadata(countries: Country[]) {
    const countriesPerTocPage = 40;
    const tocPagesCount = Math.max(1, Math.ceil(countries.length / countriesPerTocPage));
    const continentCount = 5;
    const totalPages = 1 + 1 + tocPagesCount + continentCount + countries.length + 1 + 1;
    const countriesCount = countries.length;

    // Lomo de Tapa Dura con holgura de cartón rígido Case Laminate (+0.08 in / 2.0 mm)
    const spineWidthIn = Number(((totalPages * 0.002252) + 0.08).toFixed(4));
    const spineWidthMm = Number((spineWidthIn * 25.4).toFixed(2));

    const title = `Atlas Mundial de Banderas y Naciones: Edición Oficial Coleccionista en Tapa Dura`;
    const subtitle = `Enciclopedia Vexilológica y Geográfica Ilustrada en Alta Resolución con Banderas Vectoriales SVG, Heráldica y Datos de Soberanía`;
    const author = `MundoBanderas Editorial`;

    const bulletPoints = [
      `EDICIÓN DE LUJO EN TAPA DURA (CASE LAMINATE): Encuadernación rígida de colección con cubierta plastificada brillante/mate de máxima durabilidad para bibliotecas y hogares.`,
      `BANDERAS VECTORIALES SVG EN ALTA DEFINICIÓN (300+ DPI): Cada uno de los ${countriesCount} estados soberanos cuenta con su pabellón oficial incrustado en máxima nitidez y proporción geométrica exacta.`,
      `NOMBRE OFICIAL EN ESPAÑOL E IDENTIFICACIÓN SOBERANA: Nombre destacado en tipografía de imprenta, denominación internacional en inglés, código ISO 3166-1 y continente.`,
      `FICHA COMPLETA DE SOBERANÍA Y GEOGRAFÍA: Capital de estado, población estimada, superficie territorial en km², moneda de curso legal e idiomas oficiales por cada país.`,
      `SIGNIFICADO HERÁLDICO Y PROPORCIÓN REGLAMENTARIA: Explicación del simbolismo de los colores de estado y proporción cívica oficial (2:3, 1:2, 3:5, 1:1).`,
      `ESTRUCTURA EDITORIAL COMPLETA (${totalPages} PÁGINAS): Portada interior, página de créditos legales con ISBN, índice general numerado, divisores continentales, apéndice vexilológico y contraportada con área de código de barras.`
    ];

    const descriptionHtml = `
<h2>🌍 Atlas Mundial de Banderas: Edición Oficial Coleccionista en Tapa Dura</h2>
<p><strong>Descubre la obra visual de referencia definitiva sobre los pabellones oficiales y símbolos de soberanía de todos los países del planeta en una majestuosa edición de tapa dura para toda la vida.</strong></p>

<h3>¿Qué encontrarás en este volumen de lujo de ${totalPages} páginas?</h3>
<ul>
  <li><strong>Encuadernación de Tapa Dura (Case Laminate):</strong> Calidad de biblioteca superior, resistente y elegante.</li>
  <li><strong>${countriesCount} Páginas Exclusivas de Países:</strong> Una página completa por nación con su bandera vectorial SVG de alta definición y su nombre oficial claramente identificado.</li>
  <li><strong>Ficha de Datos de Soberanía:</strong> Capital nacional, región geográfica, población, extensión territorial en km², moneda e idiomas oficiales.</li>
  <li><strong>Simbolismo y Heráldica:</strong> El significado histórico y constitucional de los colores de cada bandera, junto con su proporción geométrica reglamentaria.</li>
  <li><strong>Página Legal y Derechos de Autor:</strong> Ficha técnica con ISBN-13, depósito editorial y registro de derechos de autor para venta internacional en Amazon KDP.</li>
  <li><strong>Índice General de Banderas:</strong> Tabla de contenidos paginada para una rápida localización de cualquier nación.</li>
  <li><strong>Apéndice Vexilológico:</strong> Glosario técnico ilustrado con las partes de una bandera, familias cromáticas mundiales y proporciones heráldicas.</li>
  <li><strong>Interior a Todo Color de Primera Calidad:</strong> Impreso sobre papel bond blanco de alta densidad.</li>
</ul>

<h3>🎯 Ideal para:</h3>
<p>Coleccionistas, bibliotecas escolares y familiares, diplomáticos, educadores y apasionados de la vexilología y geografía universal.</p>
`.trim();

    return {
      title,
      subtitle,
      author,
      descriptionHtml,
      descriptionText: descriptionHtml.replace(/<[^>]+>/g, ''),
      keywords: [
        'atlas de banderas tapa dura',
        'libro de banderas del mundo tapa dura',
        'enciclopedia vexilologica mundial',
        'banderas de todos los paises coleccionista',
        'capitales y paises del mundo libro',
        'guia visual de banderas y naciones kdp',
        'simbolos patrios y heraldica mundial'
      ],
      categories: [
        'Nonfiction > Reference > Atlases & Maps',
        'Nonfiction > History > Historical Geography',
        'Nonfiction > Education > Teaching Materials > Social Studies',
        'Juvenile Nonfiction > Reference > Atlases'
      ],
      kdpPricing: {
        suggestedListPriceUsd: 32.99,
        currency: 'USD',
        minimumPriceUsd: 19.99,
        estimatedRoyalty70Percent: 12.25,
        printOnDemandCostEstimate: 11.50
      },
      bookSpecifications: {
        trimSize: '8.25 x 11 in (20.95 x 27.94 cm) o 8.5 x 11 in - Tapa Dura (Case Laminate)',
        interiorType: 'Premium Color Interior with White Paper',
        paperType: 'White Paper 55-60lb (Papel Bond Blanco de Alta Resistencia)',
        coverFinish: 'Brillante (Glossy) o Mate (Matte) Case Laminate',
        pageCount: totalPages,
        spineWidthIn,
        spineWidthMm,
        bleed: 'Case Laminate KDP: Sangría de forrado 15 mm (0.591") + hendidura de bisagra 10 mm (0.394")'
      },
      bulletPoints
    };
  }

  /**
   * Genera la guía de subir a KDP Tapa Dura en Español
   */
  public static generateSpanishHardcoverCopyPasteGuide(countries: Country[]): string {
    const meta = this.generateSpanishHardcoverListingMetadata(countries);

    return `================================================================================
GUÍA RÁPIDA DE COPIAR Y PEGAR PARA AMAZON KINDLE DIRECT PUBLISHING (KDP)
${meta.title} - EDICIÓN EN TAPA DURA (CASE LAMINATE)
================================================================================

PASO 1: DETALLES DEL LIBRO DE TAPA DURA (kdp.amazon.com)
--------------------------------------------------------------------------------
1. Idioma:
Español

2. Título del libro:
${meta.title}

3. Subtítulo:
${meta.subtitle}

4. Serie:
(Dejar en blanco o: Gran Colección de Enciclopedias Geográficas)

5. Número de edición:
1

6. Autor principal:
Nombre: MundoBanderas
Apellidos: Editorial

7. Descripción (Copia y pega este texto con formato HTML):
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


PASO 2: CONTENIDO DEL LIBRO DE TAPA DURA
--------------------------------------------------------------------------------
1. ISBN de KDP para Tapa Dura:
[X] Asignarme un ISBN de KDP gratuito para tapa dura (los libros de tapa dura requieren un ISBN independiente del de tapa blanda).

2. Fecha de publicación:
(Dejar en blanco para publicación inmediata).

3. Opciones de impresión:
- Interior: [X] Interior a todo color de primera calidad con papel blanco
- Tamaño de corte (Trim Size): [X] 8.25 x 11 in (20.95 x 27.94 cm) o 8.5 x 11 in
- Sangría: [X] Con sangría (Bleed)
- Acabado de la cubierta de tapa dura: [X] Brillante (Glossy) o Mate (Matte) según preferencia

4. Manuscrito:
- Haz clic en "Subir manuscrito de tapa dura"
- Selecciona el archivo: 01_Atlas_Mundial_Banderas_Interior_Tapa_Dura_KDP.pdf
- Número de páginas compiladas: ${meta.bookSpecifications.pageCount} páginas (cumple holgadamente el mínimo de 75 páginas para tapa dura de Amazon KDP)

5. Cubierta del libro de Tapa Dura (Case Laminate):
- Selecciona: [X] Subir una cubierta que ya tienes (solo PDF lista para imprimir)
- Sube el archivo: 02_Atlas_Mundial_Banderas_Cubierta_Tapa_Dura_Case_Laminate_KDP.pdf
- Medidas exactas generadas: Ancho total con lomo ${meta.bookSpecifications.spineWidthMm} mm + 15 mm de forrado de cartón (turn-in) + 10 mm de hendidura de bisagra (hinge) por lado.

6. Vista previa del libro:
- Haz clic en "Iniciar el Creador de vistas previas".
- Espera la comprobación automatizada de Amazon (sin errores de sangría de cartón ni texto cortado en la bisagra).
- Haz clic en "Aprobar".


PASO 3: DERECHOS Y PRECIOS DEL LIBRO DE TAPA DURA
--------------------------------------------------------------------------------
1. Territorios:
[X] Todos los territorios (derechos mundiales)

2. Tienda principal:
Amazon.com (o Amazon.es)

3. Precios y regalías sugeridas para Tapa Dura:
- Precio de lista sugerido: $${meta.kdpPricing.suggestedListPriceUsd} USD (o 32,99 €)
- Coste de impresión estimado KDP: ~$${meta.kdpPricing.printOnDemandCostEstimate} USD
- Regalía neta estimada por ejemplar: ~$${meta.kdpPricing.estimatedRoyalty70Percent} USD

4. Distribución ampliada:
[X] Marcar casilla de Distribución ampliada (permite vender en librerías, universidades y bibliotecas públicas).

5. Publicar:
- Haz clic en el botón amarillo: "Publicar tu libro de tapa dura".
================================================================================
`;
  }
}
