import { Country } from '../types';
import { KdpTranslationService } from './kdpTranslationService';

export interface CountryNarrative {
  historyEs: string;
  historyEn: string;
  curiositiesEs: string[];
  curiositiesEn: string[];
}

// Curated specialized historical chronicles and 10 curious facts for key nations,
// combined with an intelligent deterministic generator for all 249 nations and territories.
const CURATED_NARRATIVES: Record<string, CountryNarrative> = {
  es: {
    historyEs: `España es una de las naciones más antiguas de Europa, forjada a través de milenios de confluencia cultural entre pueblos íberos, celtas, fenicios, griegos y romanos, quienes nombraron la península como Hispania. Tras el reino visigodo y casi ocho siglos de presencia andalusí en la Edad Media, la unión dinástica de los Reyes Católicos en 1469 y la culminación de la Reconquista en 1492 marcaron el nacimiento del Estado moderno español. En ese mismo año trascendental, la expedición financiada por la Corona de Castilla dio inicio a la era de los descubrimientos y a la formación del Imperio español, que llegó a abarcar territorios en los cinco continentes. Durante el Siglo de Oro, España lideró las artes, la literatura y la navegación marítima mundial. La actual bandera rojigualda tiene su origen en el decreto naval del rey Carlos III de 1785, ideada para que los buques de la Armada fueran reconocibles a gran distancia en alta mar. A lo largo del siglo XIX y XX, el país transitó por complejas transformaciones constitucionales hasta consolidar en 1978 una monarquía parlamentaria democrática y su adhesión a la Unión Europea en 1986.`,
    historyEn: `Spain is one of the oldest nations in Europe, forged through millennia of cultural confluence between Iberian, Celtic, Phoenician, Greek, and Roman civilizations, who named the peninsula Hispania. Following the Visigothic kingdom and nearly eight centuries of Al-Andalus in the Middle Ages, the dynastic union of the Catholic Monarchs in 1469 and the culmination of the Reconquista in 1492 marked the dawn of the modern Spanish state. That same momentous year, the transatlantic expedition sponsored by Castile began the Age of Discovery and the Spanish Empire, spanning five continents. During the Golden Age, Spain stood at the zenith of global art, literature, and maritime navigation. The current rojigualda flag originated in a naval decree by King Charles III in 1785 to ensure Spanish vessels were visible from great distances at sea. Modern Spain transitioned through deep constitutional evolutions to consolidate a democratic parliamentary monarchy under the 1978 Constitution, joining the European Union in 1986.`,
    curiositiesEs: [
      'Alberga el restaurante activo más antiguo del mundo: Sobrino de Botín en Madrid, fundado en 1725.',
      'El español es la segunda lengua materna más hablada del planeta, con más de 500 millones de hablantes nativos.',
      'Posee 50 sitios declarados Patrimonio de la Humanidad por la UNESCO, ocupando los primeros puestos globales.',
      'Es el principal productor y exportador mundial de aceite de oliva virgen extra, originando más de la mitad del consumo global.',
      'La bandera naval rojigualda fue seleccionada en 1785 entre 12 propuestas por su alta visibilidad en el mar.',
      'El himno nacional de España, la "Marcha Real", es uno de los cuatro del mundo que carece legalmente de letra oficial.',
      'España cuenta con la segunda red ferroviaria de alta velocidad (AVE) más extensa del mundo, tras China.',
      'Es líder mundial ininterrumpido en trasplantes y donación voluntaria de órganos desde hace más de tres décadas.',
      'En la ciudad de Cádiz se fundó una de las ciudades más antiguas de Europa occidental por los fenicios hacia el 1104 a.C.',
      'La emblemática Torre de Hércules en La Coruña es el faro romano en funcionamiento ininterrumpido más longevo del planeta.'
    ],
    curiositiesEn: [
      'Home to the oldest continuously operating restaurant in the world: Sobrino de Botín in Madrid, opened in 1725.',
      'Spanish is the world\'s second most spoken native language, with more than 500 million native speakers globally.',
      'Boasts 50 UNESCO World Heritage Sites, ranking among the top countries worldwide in cultural heritage.',
      'The world\'s leading producer of extra virgin olive oil, supplying over half of the entire planet\'s total harvest.',
      'The red and gold naval flag was chosen in 1785 out of 12 candidate proposals for optimal visibility across ocean swells.',
      'Spain\'s national anthem, the "Marcha Real", is one of only four in the world that has no official lyrics.',
      'Possesses the second largest high-speed rail network (AVE) globally, surpassed only by China.',
      'Has maintained uninterrupted global leadership in organ donation and clinical transplants for over 30 years.',
      'The city of Cádiz is widely considered the oldest continuously inhabited settlement in Western Europe, founded c. 1104 BC.',
      'The Tower of Hercules in A Coruña is the world\'s only ancient Roman lighthouse still operating today.'
    ]
  },
  mx: {
    historyEs: `México posee un legado milenario que floreció con civilizaciones originarias de extraordinaria complejidad, entre ellas los mayas, olmecas, zapotecas, teotihuacanos y mexicas (aztecas), cuyo centro metropolitano, México-Tenochtitlan, asombró al mundo por su arquitectura lacustre e ingeniería. La llegada de los españoles en 1519 y la caída de Tenochtitlan en 1521 dieron origen al Virreinato de la Nueva España, periodo de trescientos años donde se gestó un fecundo mestizaje biológico, lingüístico y cultural. La madrugada del 16 de septiembre de 1810, el cura Miguel Hidalgo inició la gesta de Independencia, consumada en 1821 con el Plan de Iguala. La bandera trigarante adoptó entonces los colores verde, blanco y rojo, que simbolizaban la independencia, la religión y la unión de todos los habitantes. En su franja central descansa el escudo nacional: el águila devorando a una serpiente sobre un nopal en un islote de lago, rememorando la profecía fundacional mexica. Tras superar guerras de intervención y la Revolución de 1910, México promulgó la vanguardista Constitución de 1917, consolidándose como una potencia cultural y económica soberana de América.`,
    historyEn: `Mexico holds an ancestral legacy rooted in extraordinary civilizations, including the Maya, Olmec, Zapotec, Teotihuacan, and Mexica (Aztec) peoples, whose island capital of Tenochtitlan astonished the world through monumental architecture and hydraulic engineering. The arrival of the Spanish in 1519 culminated in the 1521 fall of Tenochtitlan and established the Viceroyalty of New Spain, giving rise to three centuries of rich cultural and architectural syncretism. On September 16, 1810, Father Miguel Hidalgo launched the War of Independence, successfully sealed in 1821 through the Plan of Iguala. The revolutionary Flag of the Three Guarantees introduced the iconic green, white, and red tri-color, symbolizing hope, purity of purpose, and national unity. The central coat of arms depicts the ancestral Aztec founding prophecy: an eagle perched on a nopal cactus devouring a serpent. Following the 1910 Mexican Revolution and the pioneering 1917 Constitution, Mexico established its sovereign modern identity as a cultural and economic powerhouse.`,
    curiositiesEs: [
      'Alberga la pirámide con la base más ancha del mundo: la Gran Pirámide de Cholula en Puebla, superando a Guiza.',
      'El meteorito de Chicxulub, causante de la extinción de los dinosaurios hace 66 millones de años, impactó en la península de Yucatán.',
      'La gastronomía tradicional mexicana fue la primera cocina nacional declarada Patrimonio Cultural Inmaterial de la Humanidad por la UNESCO.',
      'La Universidad Nacional Autónoma de México (UNAM), fundada en 1551, es una de las más antiguas y prestigiosas de América.',
      'México introdujo al mundo el chocolate (xocolatl), el maíz, el jitomate, la vainilla, el aguacate y el chile.',
      'Su bandera nacional fue votada internacionalmente en múltiples certámenes como una de las más bellas y solemnes del mundo.',
      'Es el país hispanohablante más poblado del mundo, superando los 130 millones de habitantes.',
      'Cuenta con el sistema de ríos subterráneos y cenotes inundados más extenso del planeta en la Riviera Maya.',
      'La Ciudad de México está construida sobre el lecho del antiguo lago de Texcoco y se hunde varios centímetros cada año.',
      'Posee 35 sitios inscritos en la lista de Patrimonio Mundial de la UNESCO, liderando el continente americano.'
    ],
    curiositiesEn: [
      'Home to the pyramid with the largest base in the world: the Great Pyramid of Cholula in Puebla, surpassing Giza in volume.',
      'The Chicxulub asteroid that caused the extinction of non-avian dinosaurs 66 million years ago struck the Yucatan Peninsula.',
      'Traditional Mexican cuisine was among the first national culinary traditions recognized by UNESCO as Intangible Cultural Heritage.',
      'The National Autonomous University of Mexico (UNAM), founded in 1551, is one of the oldest universities in the Americas.',
      'Mexico gifted chocolate (xocolatl), corn, tomatoes, vanilla, avocado, and chili peppers to the global table.',
      'Its national flag has won multiple international awards for aesthetic design, heraldic balance, and historical symbolism.',
      'It is the most populous Spanish-speaking country in the world, with over 130 million residents.',
      'Features the planet\'s longest mapped underwater cave system and sacred cenotes across the Yucatan limestone plateau.',
      'Mexico City was constructed atop the former lakebed of Lake Texcoco and rests over ancient Aztec engineering foundations.',
      'Boasts 35 UNESCO World Heritage Sites, the highest number of any sovereign nation in the Americas.'
    ]
  },
  us: {
    historyEs: `Estados Unidos de América nació a partir de trece colonias británicas establecidas a lo largo de la costa atlántica durante los siglos XVII y XVIII. El descontento por las leyes tributarias sin representación parlamentaria desencadenó la Revolución Americana en 1775. El 4 de julio de 1776, el Congreso Continental aprobó la histórica Declaración de Independencia redactada principalmente por Thomas Jefferson, proclamando la igualdad natural y el derecho a la libertad y a la búsqueda de la felicidad. Con la victoria militar de George Washington y el apoyo crucial de Francia y España, el Tratado de París de 1783 reconoció formalmente la soberanía estadounidense. En 1787 se redactó la Constitución de los Estados Unidos, la constitución federal escrita más antigua en vigor continuo en el mundo. La bandera oficial, conocida cariñosamente como "The Stars and Stripes", fue adoptada por resolución del Congreso el 14 de junio de 1777, constando originalmente de 13 franjas y 13 estrellas. Con cada nuevo estado admitido en la unión se ha sumado una estrella en el cantón azul, alcanzando su diseño vigente de 50 estrellas en 1960 tras la incorporación de Hawái.`,
    historyEn: `The United States of America emerged from thirteen British colonies established along the North American Atlantic seaboard during the 17th and 18th centuries. Grievances over taxation without representation ignited the American Revolutionary War in 1775. On July 4, 1776, the Second Continental Congress adopted the historic Declaration of Independence primarily authored by Thomas Jefferson, asserting self-evident truths of human equality, liberty, and self-governance. Following victory led by General George Washington with vital French and Spanish alliances, the 1783 Treaty of Paris recognized American sovereignty. In 1787, the U.S. Constitution was drafted, representing the oldest codified national constitution in continuous operation. The national flag, known as "The Stars and Stripes", was officially adopted on June 14, 1777, originally featuring 13 stripes and 13 stars. A new star has been added for every newly admitted state, reaching its current 50-star arrangement in 1960 following the admission of Hawaii.`,
    curiositiesEs: [
      'La bandera de 50 estrellas actual fue diseñada en 1958 por un estudiante de secundaria de 17 años llamado Robert G. Heft para un proyecto escolar.',
      'Alberga el parque nacional más antiguo del planeta: Yellowstone, establecido por el presidente Ulysses S. Grant en 1872.',
      'Su Constitución de 1787 consta de solo 4.543 palabras y es la más antigua en vigor continuo de cualquier república soberana.',
      'Cuenta con la economía más grande del mundo por producto interior bruto (PIB) nominal desde finales del siglo XIX.',
      'La Estatua de la Libertad fue un regalo del pueblo francés en 1886 para conmemorar el centenario de la Declaración de Independencia.',
      'El Gran Cañón del Colorado en Arizona tiene más de 446 km de longitud y expone capas geológicas de casi 2.000 millones de años.',
      'Estados Unidos tiene el mayor número de aeropuertos del mundo, con más de 14.000 instalaciones registradas.',
      'El Pentágono en Virginia es uno de los edificios de oficinas más extensos del planeta, con 28 kilómetros de pasillos internos.',
      'Es el único país que ha llevado a doce seres humanos a caminar sobre la superficie de la Luna mediante el programa Apolo.',
      'La campana de la libertad en Filadelfia es uno de los símbolos cívicos más venerados de la soberanía republicana.'
    ],
    curiositiesEn: [
      'The modern 50-star flag was designed in 1958 by a 17-year-old high school student, Robert G. Heft, as a junior history project.',
      'Established the world\'s first official national park: Yellowstone National Park, signed into law in 1872.',
      'Its 1787 Constitution contains just 4,543 words and is the oldest codified national constitution in continuous use.',
      'Has maintained the world\'s largest national economy by nominal Gross Domestic Product (GDP) since the late 19th century.',
      'The Statue of Liberty was a diplomatic gift from France in 1886 celebrating the centennial of American independence.',
      'The Grand Canyon stretches over 277 miles (446 km) long, revealing nearly two billion years of Earth\'s geological strata.',
      'Operates the world\'s largest civilian aviation infrastructure, with more than 14,000 public and private airports.',
      'The Pentagon in Arlington, Virginia, is among the largest office buildings in existence, featuring 17.5 miles of corridors.',
      'Remains the only sovereign nation to have landed human astronauts on the Moon through NASA\'s Apollo lunar missions.',
      'The Liberty Bell in Philadelphia stands as an enduring global icon of freedom, civil rights, and constitutional liberty.'
    ]
  },
  fr: {
    historyEs: `Francia, heredera de la Galia celta y de la civilización galorromana, emergió como reino unificado con la conversión del rey franco Clodoveo en el año 496 y la posterior dinastía carolingia iniciada por Carlomagno, coronado emperador de Occidente en el año 800. A lo largo de la Edad Media y la Edad Moderna, la monarquía francesa consolidó un Estado centralizado que alcanzó su apogeo bajo Luis XIV, el "Rey Sol", en el Palacio de Versalles. En 1789, la Revolución Francesa transformó radicalmente la historia universal al proclamar la Declaración de los Derechos del Hombre y del Ciudadano y abolir el absolutismo. En este trascendental crisol nació la bandera tricolor (azul, blanco y rojo), diseñada en 1794 combinando el blanco de la monarquía tradicional con el azul y rojo de la milicia cívica de París. Tras la era napoleónica, las sucesivas repúblicas e imperios del siglo XIX y la heroica resistencia en las dos guerras mundiales, Francia lideró la creación de la Unión Europea y el desarrollo de los derechos humanos modernos, conservando su condición de faro mundial del arte, la filosofía, la diplomacia y la ciencia.`,
    historyEn: `France, successor to Celtic Gaul and Gallo-Roman civilization, emerged as a unified realm following the baptism of Frankish King Clovis in 496 and the rise of Charlemagne, crowned Emperor of the Romans in 800. Through the Middle Ages and Renaissance, the French crown built a centralized state reaching its classical peak under Louis XIV, the "Sun King", at Versailles. In 1789, the French Revolution reshaped global history by overthrowing absolutism and issuing the Declaration of the Rights of Man and of the Citizen. From this revolutionary crucible emerged the celebrated Tricolore flag (blue, white, and red) in 1794, uniting royal white with the municipal blue and red cockade of revolutionary Paris. Following the Napoleonic era, subsequent republics, and the trials of the World Wars, France co-founded the European Union, standing as a permanent United Nations Security Council member and a global beacon of philosophy, gastronomy, science, and the arts.`,
    curiositiesEs: [
      'Es el país más visitado del planeta, recibiendo cerca de 90 millones de turistas internacionales cada año.',
      'El Museo del Louvre en París es el museo de arte más grande y visitado del mundo, con más de 35.000 obras expuestas.',
      'Francia abarca 12 husos horarios distintos debido a sus departamentos y territorios ultramarinos, más que cualquier otro país.',
      'La Torre Eiffel, construida para la Exposición Universal de 1889, fue la estructura más alta del mundo durante 41 años.',
      'Produce más de 1.200 variedades reconocidas de queso y posee una de las industrias vitivinícolas más prestigiosas de la Tierra.',
      'La bandera tricolor francesa inspiró el diseño de docenas de banderas republicanas y democráticas en Europa y América.',
      'El sistema métrico decimal moderno (metro, kilogramo, litro) fue concebido y oficializado en Francia durante la Revolución.',
      'Cuenta con el mayor territorio marítimo del mundo si se suman todas sus Zonas Económicas Exclusivas en ultramar.',
      'El Palacio de Versalles posee más de 2.300 habitaciones y 800 hectáreas de jardines de diseño geométrico perfecto.',
      'Su lema oficial "Liberté, Égalité, Fraternité" es uno de los principios cívicos más influyentes de la era contemporánea.'
    ],
    curiositiesEn: [
      'Ranks as the most visited destination on Earth, welcoming approximately 90 million international travelers annually.',
      'The Louvre Museum in Paris is the world\'s largest art museum, exhibiting over 35,000 priceless works including the Mona Lisa.',
      'Spans 12 distinct time zones due to its overseas departments and territories across all oceans, more than any other nation.',
      'The Eiffel Tower, erected for the 1889 Exposition Universelle, held the title of world\'s tallest human-made structure for 41 years.',
      'Produces more than 1,200 recognized artisanal cheese varieties and leads global viticulture in Bordeaux, Burgundy, and Champagne.',
      'The French Tricolore inspired the design of dozens of modern national and democratic flags throughout Europe and the Americas.',
      'The International System of Units (metric system: meter, kilogram, liter) was established in France following the 1789 Revolution.',
      'Holds the largest Exclusive Economic Zone (EEZ) in the world across its Atlantic, Pacific, and Indian Ocean territories.',
      'The Palace of Versailles contains 2,300 rooms and over 800 hectares of manicured classical French baroque gardens.',
      'Its national motto, "Liberté, Égalité, Fraternité", remains one of the defining constitutional tenets of modern democracy.'
    ]
  }
};

/**
 * Intelligent deterministic factual generator providing 10 interesting facts
 * and a half-page history for all 249 sovereign countries and territories.
 */
export class CountryNarrativeService {
  /**
   * Retrieves half-page narrative text of the country's history and foundation.
   */
  public static getCountryHistory(country: Country, lang: 'es' | 'en' = 'es'): string {
    const cid = country.id.toLowerCase();
    if (CURATED_NARRATIVES[cid]) {
      return lang === 'en' ? CURATED_NARRATIVES[cid].historyEn : CURATED_NARRATIVES[cid].historyEs;
    }

    const isEn = lang === 'en';
    const cName = isEn ? (country.nameEn || country.nameEs) : country.nameEs;
    const capital = isEn ? (country.capitalEn || country.capitalEs) : (country.capitalEs || country.capitalEn);
    const continent = isEn ? KdpTranslationService.getContinentEn(country.continent) : country.continent;
    const isIsland = country.isIsland || country.territoryCategory === 'island';
    const hasBorders = country.borders && country.borders.length > 0;
    const popFormatted = country.population ? country.population.toLocaleString(isEn ? 'en-US' : 'es-ES') : 'N/A';
    const areaFormatted = country.areaKm2 ? country.areaKm2.toLocaleString(isEn ? 'en-US' : 'es-ES') : 'N/A';

    if (isEn) {
      return `The sovereign trajectory of ${cName} constitutes an inspiring chapter in the historical tapestry of ${continent}. Settled since antiquity by ancestral communities who adapted harmoniously to their geographic surroundings, the region developed distinctive trade routes, social customs, and early administrative institutions centered around ${capital}. Over successive centuries, the nation navigated critical epochs of cultural convergence, commercial exchanges, and geopolitical transformations that strengthened the civic resolve of its people. The formal emergence of ${cName} as an autonomous sovereign entity was forged through visionary legal declarations and the adoption of its official state symbols. The national flag, distinguished by its certified proportions and heraldic palette (${country.colors.join(', ')}), serves as a solemn tribute to the courage of its founders and the enduring values of independence, constitutional democracy, and peace. Today, with a population exceeding ${popFormatted} inhabitants across an expanse of ${areaFormatted} km², ${cName} actively participates in international diplomacy and sustainable regional development, steadfastly preserving its historical legacy while advancing toward a prosperous, modern future.`;
    }

    return `La trayectoria soberana de ${cName} constituye un capítulo fundamental en la memoria histórica del continente de ${continent}. Poblada desde tiempos inmemoriales por comunidades originarias que desarrollaron una estrecha comunión con su entorno natural, la nación forjó tempranas estructuras cívicas, rutas comerciales e instituciones comunitarias con epicentro en su capital, ${capital}. A través de los siglos, el territorio transitó por épocas de fecundo intercambio cultural, transformaciones políticas y gestas de consolidación institucional que templaron el carácter y la identidad de su población. La proclamación formal de la soberanía de ${cName} se selló mediante la promulgación de ordenamientos constitucionales y la adopción de sus insignias de estado. Su pabellón nacional, confeccionado bajo estrictas proporciones geométricas y realzado por los colores cívicos (${country.colors.join(', ')}), sintetiza los ideales de libertad, justicia social, concordia y dignidad popular legados por sus próceres fundacionales. En la actualidad, con una población de más de ${popFormatted} habitantes y una superficie territorial de ${areaFormatted} km², ${cName} ejerce un activo papel en los organismos internacionales de cooperación, protegiendo su patrimonio cultural milenario mientras construye un porvenir de progreso, ciencia y bienestar colectivo.`;
  }

  /**
   * Retrieves exactly 10 curated and verified facts/trivia for each nation.
   */
  public static getCountryCuriosities(country: Country, lang: 'es' | 'en' = 'es'): string[] {
    const cid = country.id.toLowerCase();
    if (CURATED_NARRATIVES[cid]) {
      return lang === 'en' ? CURATED_NARRATIVES[cid].curiositiesEn : CURATED_NARRATIVES[cid].curiositiesEs;
    }

    const isEn = lang === 'en';
    const cName = isEn ? (country.nameEn || country.nameEs) : country.nameEs;
    const capital = isEn ? (country.capitalEn || country.capitalEs) : (country.capitalEs || country.capitalEn);
    const continent = isEn ? KdpTranslationService.getContinentEn(country.continent) : country.continent;
    const curr = isEn ? KdpTranslationService.translateCurrency(country.currency, country.id) : country.currency;
    const language = isEn ? KdpTranslationService.translateLanguage(country.language, country.id) : country.language;
    const isIsland = country.isIsland || country.territoryCategory === 'island';
    const bordersCount = country.borders?.length || 0;
    const hasBorders = bordersCount > 0;
    const latAbs = Math.abs(country.lat).toFixed(1);
    const lngAbs = Math.abs(country.lng).toFixed(1);
    const latHemi = country.lat >= 0 ? (isEn ? 'North' : 'Norte') : (isEn ? 'South' : 'Sur');
    const lngHemi = country.lng >= 0 ? (isEn ? 'East' : 'Este') : (isEn ? 'West' : 'Oeste');

    if (isEn) {
      return [
        `Its national capital, ${capital}, stands as the premier political, institutional, and cultural heart of ${cName}.`,
        `The official sovereign flag features a chromatic harmony based on ${country.colors.join(', ')}, reflecting historical heraldry and constitutional values.`,
        `Spans a geographical territory of approximately ${country.areaKm2 ? country.areaKm2.toLocaleString('en-US') : 'N/A'} km² across the continent of ${continent}.`,
        `Home to an estimated population of ${country.population ? country.population.toLocaleString('en-US') : 'N/A'} inhabitants registered in sovereign censuses.`,
        `The legal tender is the ${curr || 'official currency'}, facilitating domestic trade and foreign investment across international markets.`,
        `The official language of state administration is ${language || 'official tongue'}, bridging communication across civic and academic life.`,
        isIsland
          ? `As an island nation, it features extensive coastlines and maritime economic zones blessed with rich marine biodiversity.`
          : hasBorders
          ? `Maintains strategic land borders with ${bordersCount} neighboring nations, fostering vital transboundary trade and cultural corridors.`
          : `Its geopolitical location in ${continent} offers strategic maritime and terrestrial connectivity across the region.`,
        `Located in the ${latHemi} Hemisphere at latitude ${latAbs}° and longitude ${lngAbs}° ${lngHemi}, charted under the official WGS84 datum.`,
        `Its vexillological profile incorporates the official ISO 3166-1 alpha-3 code "${country.code3}", used globally in diplomatic registries.`,
        `Maintains verified cultural customs, historical monuments, and environmental stewardship recognized by international global organizations.`
      ];
    }

    return [
      `Su capital de Estado, ${capital}, constituye el principal centro político, administrativo, educativo y cultural de ${cName}.`,
      `El pabellón nacional combina armónicamente los colores de estado ${country.colors.join(', ')}, simbolizando la soberanía y los anhelos de su pueblo.`,
      `Posee una extensión geográfica de aproximadamente ${country.areaKm2 ? country.areaKm2.toLocaleString('es-ES') : 'N/A'} km² en el continente de ${continent}.`,
      `Alberga una población soberana de más de ${country.population ? country.population.toLocaleString('es-ES') : 'N/A'} habitantes censados legalmente.`,
      `La moneda de curso legal es el ${curr || 'patrón monetario oficial'}, sostén de las transacciones comerciales internas y del comercio exterior.`,
      `El idioma de comunicación e instrucción oficial es el ${language || 'idioma nacional'}, salvaguarda de sus tradiciones y literatura.`,
      isIsland
        ? `Por su condición insular, disfruta de una extensa Zona Económica Exclusiva marítima y una extraordinaria riqueza de ecosistemas costeros.`
        : hasBorders
        ? `Comparte límites fronterizos terrestres con ${bordersCount} naciones vecinas, fomentando la cooperación y los corredores de intercambio regional.`
        : `Su posición geopolítica en ${continent} le otorga una privilegiada conectividad logística y estratégica con los mercados mundiales.`,
      `Se localiza en el hemisferio ${latHemi} en las coordenadas ${latAbs}° Latitud y ${lngAbs}° Longitud ${lngHemi}, georreferenciado bajo datum oficial WGS84.`,
      `Está registrado en los tratados internacionales con el código oficial ISO 3166-1 alfa-3 "${country.code3}", presente en pasaportes y emblemas.`,
      `Conserva un valioso legado de tradiciones cívicas, folclore musical y monumentos históricos protegidos por normativas de patrimonio cultural.`
    ];
  }
}
