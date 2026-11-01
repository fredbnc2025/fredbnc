import { Country } from '../types';

export const AMERICA_COUNTRIES: Country[] = [
  {
    id: 'ar', code3: 'ARG', nameEs: 'Argentina', nameEn: 'Argentina', capitalEs: 'Buenos Aires', capitalEn: 'Buenos Aires',
    continent: 'América', lat: -38.4161, lng: -63.6167, population: 46000000, areaKm2: 2780400,
    currency: 'Peso argentino ($)', language: 'Español', colors: ['blue', 'white', 'yellow'],
    flagSymbolismEs: 'Franjas celestes y blanca con el Sol de Mayo incaico con rostro humano en el centro.',
    funFactEs: 'Alberga el cerro Aconcagua (6.961 m), la cumbre más alta de toda América.'
  },
  {
    id: 'bo', code3: 'BOL', nameEs: 'Bolivia', nameEn: 'Bolivia', capitalEs: 'Sucre', capitalEn: 'Sucre',
    continent: 'América', lat: -16.2902, lng: -63.5887, population: 12000000, areaKm2: 1098581,
    currency: 'Boliviano (Bs)', language: 'Español, Quechua, Aimara', colors: ['red', 'yellow', 'green'],
    flagSymbolismEs: 'Rojo por la sangre heroica, amarillo por la riqueza mineral y verde por la biodiversidad.',
    funFactEs: 'Posee el Salar de Uyuni, el mayor desierto continuo de sal y reserva de litio del planeta.'
  },
  {
    id: 'br', code3: 'BRA', nameEs: 'Brasil', nameEn: 'Brazil', capitalEs: 'Brasilia', capitalEn: 'Brasilia',
    continent: 'América', lat: -14.235, lng: -51.9253, population: 215000000, areaKm2: 8515767,
    currency: 'Real brasileño (R$)', language: 'Portugués', colors: ['green', 'yellow', 'blue', 'white'],
    flagSymbolismEs: 'Fondo verde amazónico, rombo amarillo mineral y globo celeste con la Cruz del Sur.',
    funFactEs: 'Es el país con mayor biodiversidad y alberga la mayor parte de la selva del Amazonas.'
  },
  {
    id: 'ca', code3: 'CAN', nameEs: 'Canadá', nameEn: 'Canada', capitalEs: 'Ottawa', capitalEn: 'Ottawa',
    continent: 'América', lat: 56.1304, lng: -106.3468, population: 38000000, areaKm2: 9984670,
    currency: 'Dólar canadiense (C$)', language: 'Inglés, Francés', colors: ['red', 'white'],
    flagSymbolismEs: 'La emblemática hoja de arce roja de once puntas sobre campo blanco flanqueada por barras rojas.',
    funFactEs: 'Posee la costa litoral más extensa del mundo (202.080 km) y más del 60% de los lagos del planeta.'
  },
  {
    id: 'cl', code3: 'CHL', nameEs: 'Chile', nameEn: 'Chile', capitalEs: 'Santiago de Chile', capitalEn: 'Santiago',
    continent: 'América', lat: -35.6751, lng: -71.543, population: 19500000, areaKm2: 756102,
    currency: 'Peso chileno ($)', language: 'Español', colors: ['blue', 'white', 'red'],
    flagSymbolismEs: 'Azul por el cielo del Pacífico, blanco por las nieves andinas, rojo por el heroísmo y estrella solitaria.',
    funFactEs: 'El Desierto de Atacama en Chile es el lugar no polar más árido de la Tierra.'
  },
  {
    id: 'co', code3: 'COL', nameEs: 'Colombia', nameEn: 'Colombia', capitalEs: 'Bogotá', capitalEn: 'Bogota',
    continent: 'América', lat: 4.5709, lng: -74.2973, population: 51000000, areaKm2: 1141748,
    currency: 'Peso colombiano ($)', language: 'Español', colors: ['yellow', 'blue', 'red'],
    flagSymbolismEs: 'Amarillo por la riqueza del sol y suelo, azul por los dos océanos y rojo por la sangre libertadora.',
    funFactEs: 'Es el país con mayor variedad de especies de aves y orquídeas del mundo.'
  },
  {
    id: 'cr', code3: 'CRI', nameEs: 'Costa Rica', nameEn: 'Costa Rica', capitalEs: 'San José', capitalEn: 'San Jose',
    continent: 'América', lat: 9.7489, lng: -83.7534, population: 5100000, areaKm2: 51100,
    currency: 'Colón costarricense (₡)', language: 'Español', colors: ['blue', 'white', 'red'],
    flagSymbolismEs: 'Inspirada en el tricolor: azul del cielo, blanco de la paz y rojo de la calidez humana.',
    funFactEs: 'Carece de ejército militar desde 1948 y alberga el 5% de la biodiversidad mundial.'
  },
  {
    id: 'cu', code3: 'CUB', nameEs: 'Cuba', nameEn: 'Cuba', capitalEs: 'La Habana', capitalEn: 'Havana',
    continent: 'América', lat: 21.5218, lng: -77.7812, population: 11000000, areaKm2: 109884,
    currency: 'Peso cubano ($)', language: 'Español', colors: ['blue', 'white', 'red'], isIsland: true,
    flagSymbolismEs: 'Cinco franjas por los departamentos coloniales, triángulo rojo masónico y estrella solitaria.',
    funFactEs: 'Es la isla más grande de las Antillas Mayores en el mar Caribe.'
  },
  {
    id: 'ec', code3: 'ECU', nameEs: 'Ecuador', nameEn: 'Ecuador', capitalEs: 'Quito', capitalEn: 'Quito',
    continent: 'América', lat: -1.8312, lng: -78.1834, population: 18000000, areaKm2: 283561,
    currency: 'Dólar estadounidense ($)', language: 'Español, Kichwa', colors: ['yellow', 'blue', 'red'],
    flagSymbolismEs: 'Tricolor con el escudo nacional presidido por el Cóndor Andino sobre el volcán Chimborazo.',
    funFactEs: 'La cumbre del volcán Chimborazo es el punto de la superficie más cercano al Sol por el abultamiento ecuatorial.'
  },
  {
    id: 'sv', code3: 'SLV', nameEs: 'El Salvador', nameEn: 'El Salvador', capitalEs: 'San Salvador', capitalEn: 'San Salvador',
    continent: 'América', lat: 13.7942, lng: -88.8965, population: 6300000, areaKm2: 21041,
    currency: 'Dólar estadounidense ($)', language: 'Español', colors: ['blue', 'white'],
    flagSymbolismEs: 'Franjas azules por los dos océanos y blanca central por la paz con el escudo nacional.',
    funFactEs: 'Conocido como la "Tierra de Volcanes", posee más de 20 conos volcánicos.'
  },
  {
    id: 'us', code3: 'USA', nameEs: 'Estados Unidos', nameEn: 'United States', capitalEs: 'Washington D.C.', capitalEn: 'Washington D.C.',
    continent: 'América', lat: 37.0902, lng: -95.7129, population: 333000000, areaKm2: 9833517,
    currency: 'Dólar estadounidense ($)', language: 'Inglés, Español', colors: ['red', 'white', 'blue'],
    flagSymbolismEs: '50 estrellas blancas por los estados federados y 13 barras por las colonias fundadoras originales.',
    funFactEs: 'El Gran Cañón del Colorado tiene más de 446 km de longitud y dos mil millones de años de historia geológica.'
  },
  {
    id: 'gt', code3: 'GTM', nameEs: 'Guatemala', nameEn: 'Guatemala', capitalEs: 'Ciudad de Guatemala', capitalEn: 'Guatemala City',
    continent: 'América', lat: 15.7835, lng: -90.2308, population: 18000000, areaKm2: 108889,
    currency: 'Quetzal (Q)', language: 'Español', colors: ['blue', 'white'],
    flagSymbolismEs: 'Dos franjas celestes entre el mar Caribe y Pacífico y el ave Quetzal símbolo de libertad.',
    funFactEs: 'Cuna del milenario imperio Maya con las majestuosas pirámides de Tikal en la selva del Petén.'
  },
  {
    id: 'hn', code3: 'HND', nameEs: 'Honduras', nameEn: 'Honduras', capitalEs: 'Tegucigalpa', capitalEn: 'Tegucigalpa',
    continent: 'América', lat: 15.2, lng: -86.2419, population: 10200000, areaKm2: 112492,
    currency: 'Lempira (L)', language: 'Español', colors: ['blue', 'white'],
    flagSymbolismEs: 'Cinco estrellas azules que representan la unión de las repúblicas centroamericanas.',
    funFactEs: 'Alberga las ruinas mayas de Copán, famosas por sus estelas talladas con inscripciones jeroglíficas.'
  },
  {
    id: 'mx', code3: 'MEX', nameEs: 'México', nameEn: 'Mexico', capitalEs: 'Ciudad de México', capitalEn: 'Mexico City',
    continent: 'América', lat: 23.6345, lng: -102.5528, population: 128000000, areaKm2: 1964375,
    currency: 'Peso mexicano ($)', language: 'Español', colors: ['green', 'white', 'red'],
    flagSymbolismEs: 'El águila real mexicana devorando a la serpiente sobre un nopal en un islote lacustre azteca.',
    funFactEs: 'La Gran Pirámide de Cholula es el basamento piramidal más voluminoso construido por el hombre.'
  },
  {
    id: 'ni', code3: 'NIC', nameEs: 'Nicaragua', nameEn: 'Nicaragua', capitalEs: 'Managua', capitalEn: 'Managua',
    continent: 'América', lat: 12.8654, lng: -85.2072, population: 6800000, areaKm2: 130373,
    currency: 'Córdoba (C$)', language: 'Español', colors: ['blue', 'white'],
    flagSymbolismEs: 'Franjas celestes y triángulo central con cinco volcanes y el gorro frigio de la libertad.',
    funFactEs: 'El Lago Cocibolca (Gran Lago de Nicaragua) es el único lago de agua dulce con tiburones toro adaptados.'
  },
  {
    id: 'pa', code3: 'PAN', nameEs: 'Panamá', nameEn: 'Panama', capitalEs: 'Ciudad de Panamá', capitalEn: 'Panama City',
    continent: 'América', lat: 8.538, lng: -80.7821, population: 4400000, areaKm2: 75417,
    currency: 'Balboa (B/.) / Dólar ($)', language: 'Español', colors: ['blue', 'red', 'white'],
    flagSymbolismEs: 'Cuadrantes blanco, azul y rojo con estrellas que simbolizan autoridad, ley y pureza cívica.',
    funFactEs: 'El Canal de Panamá conecta los océanos Atlántico y Pacífico moviendo más de 14.000 buques anuales.'
  },
  {
    id: 'py', code3: 'PRY', nameEs: 'Paraguay', nameEn: 'Paraguay', capitalEs: 'Asunción', capitalEn: 'Asuncion',
    continent: 'América', lat: -23.4425, lng: -58.4438, population: 6700000, areaKm2: 406752,
    currency: 'Guaraní (₲)', language: 'Español, Guaraní', colors: ['red', 'white', 'blue'],
    flagSymbolismEs: 'Única bandera en el mundo con anverso y reverso diferentes: Escudo de la República y Sello de Hacienda.',
    funFactEs: 'El guaraní es hablado por más del 90% de la población como lengua materna oficial.'
  },
  {
    id: 'pe', code3: 'PER', nameEs: 'Perú', nameEn: 'Peru', capitalEs: 'Lima', capitalEn: 'Lima',
    continent: 'América', lat: -9.19, lng: -75.0152, population: 34000000, areaKm2: 1285216,
    currency: 'Sol (S/)', language: 'Español, Quechua, Aimara', colors: ['red', 'white'],
    flagSymbolismEs: 'Rojo por la sangre heroica, blanco por la paz y escudo con vicuña, quina y cornucopia.',
    funFactEs: 'Machu Picchu se erige a 2.430 m sobre el cañón del río Urubamba como maravilla del mundo incaico.'
  },
  {
    id: 'uy', code3: 'URY', nameEs: 'Uruguay', nameEn: 'Uruguay', capitalEs: 'Montevideo', capitalEn: 'Montevideo',
    continent: 'América', lat: -32.5228, lng: -55.7658, population: 3400000, areaKm2: 176215,
    currency: 'Peso uruguayo ($)', language: 'Español', colors: ['blue', 'white', 'yellow'],
    flagSymbolismEs: 'Nueve franjas por los departamentos originales y el Sol de Mayo en el cantón superior.',
    funFactEs: 'Produce más del 95% de su energía eléctrica a partir de fuentes renovables limpias.'
  },
  {
    id: 've', code3: 'VEN', nameEs: 'Venezuela', nameEn: 'Venezuela', capitalEs: 'Caracas', capitalEn: 'Caracas',
    continent: 'América', lat: 6.4238, lng: -66.5897, population: 28000000, areaKm2: 916445,
    currency: 'Bolívar Digital (Bs.D)', language: 'Español', colors: ['yellow', 'blue', 'red', 'white'],
    flagSymbolismEs: 'Amarillo del sol, azul del mar Caribe, rojo libertador y arco de ocho estrellas blancas.',
    funFactEs: 'Posee el Salto Ángel (Kerepakupai Vená) con 979 metros, la caída de agua ininterrumpida más alta del planeta.'
  },
  {
    id: 'bs', code3: 'BHS', nameEs: 'Bahamas', nameEn: 'Bahamas', capitalEs: 'Nassau', capitalEn: 'Nassau',
    continent: 'América', lat: 25.0343, lng: -77.3963, population: 400000, areaKm2: 13943,
    currency: 'Dólar bahameño ($)', language: 'Inglés', colors: ['blue', 'yellow', 'black'], isIsland: true,
    flagSymbolismEs: 'Triángulo negro por la fuerza del pueblo y franjas aguamarina y dorada por el mar caribeño y arenas.',
    funFactEs: 'Archipiélago de más de 700 islas y cayos de coral con aguas de transparencia extraordinaria.'
  },
  {
    id: 'do', code3: 'DOM', nameEs: 'República Dominicana', nameEn: 'Dominican Republic', capitalEs: 'Santo Domingo', capitalEn: 'Santo Domingo',
    continent: 'América', lat: 18.7357, lng: -70.1627, population: 11200000, areaKm2: 48671,
    currency: 'Peso dominicano ($)', language: 'Español', colors: ['blue', 'red', 'white'], isIsland: true,
    flagSymbolismEs: 'Cruz blanca central símbolo de redención y fe, con el lema "Dios, Patria, Libertad" en el escudo.',
    funFactEs: 'Santo Domingo es el asentamiento europeo continuo más antiguo de América, fundado en 1496.'
  },
  {
    id: 'jm', code3: 'JAM', nameEs: 'Jamaica', nameEn: 'Jamaica', capitalEs: 'Kingston', capitalEn: 'Kingston',
    continent: 'América', lat: 18.1096, lng: -77.2975, population: 2800000, areaKm2: 10991,
    currency: 'Dólar jamaiquino ($)', language: 'Inglés, Patois jamaiquino', colors: ['green', 'yellow', 'black'], isIsland: true,
    flagSymbolismEs: 'Cruz de San Andrés dorada con triángulos verdes por la agricultura y negros por la resiliencia.',
    funFactEs: 'Cuna del reggae, de Bob Marley y de los atletas velocistas más rápidos de la historia.'
  },
  {
    id: 'ht', code3: 'HTI', nameEs: 'Haití', nameEn: 'Haiti', capitalEs: 'Puerto Príncipe', capitalEn: 'Port-au-Prince',
    continent: 'América', lat: 18.9712, lng: -72.2852, population: 11500000, areaKm2: 27750,
    currency: 'Gourde (G)', language: 'Criollo haitiano, Francés', colors: ['blue', 'red', 'white'], isIsland: true,
    flagSymbolismEs: 'Bicolor azul y rojo con el escudo nacional y el lema "L\'Union Fait La Force" sobre una palmera.',
    funFactEs: 'Primera república negra independiente del mundo y primera nación latinoamericana en independizarse (1804).'
  },
  {
    id: 'bz', code3: 'BLZ', nameEs: 'Belice', nameEn: 'Belize', capitalEs: 'Belmopán', capitalEn: 'Belmopan',
    continent: 'América', lat: 17.1899, lng: -88.4976, population: 400000, areaKm2: 22966,
    currency: 'Dólar beliceño (BZ$)', language: 'Inglés, Español, Criollo beliceño', colors: ['blue', 'red', 'white'],
    flagSymbolismEs: 'Azul con ribetes rojos y escudo con dos leñadores bajo el árbol de caoba.',
    funFactEs: 'Alberga el "Gran Agujero Azul" (Great Blue Hole), una sima submarina circular de 300 m de ancho.'
  },
  {
    id: 'tt', code3: 'TTO', nameEs: 'Trinidad y Tobago', nameEn: 'Trinidad and Tobago', capitalEs: 'Puerto España', capitalEn: 'Port of Spain',
    continent: 'América', lat: 10.6918, lng: -61.2225, population: 1400000, areaKm2: 5130,
    currency: 'Dólar de Trinidad y Tobago (TT$)', language: 'Inglés', colors: ['red', 'black', 'white'], isIsland: true,
    flagSymbolismEs: 'Banda diagonal negra con ribetes blancos sobre fondo rojo fuego que simboliza la calidez humana.',
    funFactEs: 'Cuna del instrumento musical Steelpan (tambor de acero) y de los ritmos calipso y soca.'
  },
  {
    id: 'ag', code3: 'ATG', nameEs: 'Antigua y Barbuda', nameEn: 'Antigua and Barbuda', capitalEs: "Saint John's", capitalEn: "Saint John's",
    continent: 'América', lat: 17.0608, lng: -61.7964, population: 94000, areaKm2: 442,
    currency: 'Dólar del Caribe Oriental (EC$)', language: 'Inglés, Criollo de Antigua', colors: ['red', 'black', 'blue', 'white', 'yellow'], isIsland: true,
    flagSymbolismEs: 'V estilizada de la victoria con sol naciente dorado sobre mar azul caribeño y arenas blancas.',
    funFactEs: 'Famosa por sus 365 playas de arena blanca y rosada, una para cada día del año.'
  },
  {
    id: 'bb', code3: 'BRB', nameEs: 'Barbados', nameEn: 'Barbados', capitalEs: 'Bridgetown', capitalEn: 'Bridgetown',
    continent: 'América', lat: 13.1939, lng: -59.5432, population: 281000, areaKm2: 430,
    currency: 'Dólar de Barbados (Bds$)', language: 'Inglés, Bajan', colors: ['blue', 'yellow', 'black'], isIsland: true,
    flagSymbolismEs: 'Tridente de Neptuno negro sobre franja dorada entre dos franjas azules de cielo y océano.',
    funFactEs: 'La destilería Mount Gay Rum (fundada en 1703) es la productora de ron comercial más antigua del mundo.'
  },
  {
    id: 'dm', code3: 'DMA', nameEs: 'Dominica', nameEn: 'Dominica', capitalEs: 'Roseau', capitalEn: 'Roseau',
    continent: 'América', lat: 15.415, lng: -61.371, population: 72000, areaKm2: 751,
    currency: 'Dólar del Caribe Oriental (EC$)', language: 'Inglés, Criollo francés patois', colors: ['green', 'yellow', 'black', 'white', 'red'], isIsland: true,
    flagSymbolismEs: 'Loro Imperial Sisserou (ave nacional) rodeado de diez estrellas verdes en disco rojo.',
    funFactEs: 'Conocida como la "Isla de la Naturaleza" por sus 365 ríos, fuentes termales y el Boiling Lake volcánico.'
  },
  {
    id: 'gd', code3: 'GRD', nameEs: 'Granada', nameEn: 'Grenada', capitalEs: "Saint George's", capitalEn: "Saint George's",
    continent: 'América', lat: 12.1165, lng: -61.679, population: 125000, areaKm2: 344,
    currency: 'Dólar del Caribe Oriental (EC$)', language: 'Inglés, Criollo granadino', colors: ['red', 'yellow', 'green'], isIsland: true,
    flagSymbolismEs: 'Borde rojo con estrellas, triángulos verde y amarillo y una nuez moscada emblema nacional.',
    funFactEs: 'Conocida como la "Isla de las Especias" por ser el segundo mayor productor mundial de nuez moscada.'
  },
  {
    id: 'kn', code3: 'KNA', nameEs: 'San Cristóbal y Nieves', nameEn: 'Saint Kitts and Nevis', capitalEs: 'Basseterre', capitalEn: 'Basseterre',
    continent: 'América', lat: 17.3578, lng: -62.783, population: 48000, areaKm2: 261,
    currency: 'Dólar del Caribe Oriental (EC$)', language: 'Inglés', colors: ['green', 'red', 'black', 'yellow', 'white'], isIsland: true,
    flagSymbolismEs: 'Banda negra diagonal con dos estrellas blancas sobre campos verde de la tierra y rojo libertario.',
    funFactEs: 'El país soberano más pequeño en superficie y población de todo el continente americano.'
  },
  {
    id: 'lc', code3: 'LCA', nameEs: 'Santa Lucía', nameEn: 'Saint Lucia', capitalEs: 'Castries', capitalEn: 'Castries',
    continent: 'América', lat: 13.9094, lng: -60.9789, population: 180000, areaKm2: 616,
    currency: 'Dólar del Caribe Oriental (EC$)', language: 'Inglés, Criollo de Santa Lucía', colors: ['blue', 'yellow', 'black', 'white'], isIsland: true,
    flagSymbolismEs: 'Los picos volcánicos Pitons representados en triángulos negro, blanco y amarillo sobre fondo azul.',
    funFactEs: 'Único país del mundo nombrado en honor a una figura histórica femenina (Santa Lucía de Siracusa).'
  },
  {
    id: 'vc', code3: 'VCT', nameEs: 'San Vicente y las Granadinas', nameEn: 'Saint Vincent and the Grenadines', capitalEs: 'Kingstown', capitalEn: 'Kingstown',
    continent: 'América', lat: 13.2528, lng: -61.1971, population: 104000, areaKm2: 389,
    currency: 'Dólar del Caribe Oriental (EC$)', language: 'Inglés, Criollo vicentino', colors: ['blue', 'yellow', 'green'], isIsland: true,
    flagSymbolismEs: 'Tres diamantes verdes en forma de V sobre franja amarilla central que simbolizan las joyas insulares.',
    funFactEs: 'Las Granadinas comprenden 32 islas paradisíacas de arena blanca como Bequia y Mustique.'
  },
  {
    id: 'pr', code3: 'PRI', nameEs: 'Puerto Rico', nameEn: 'Puerto Rico', capitalEs: 'San Juan', capitalEn: 'San Juan',
    continent: 'América', lat: 18.2208, lng: -66.5901, population: 3200000, areaKm2: 8870,
    currency: 'Dólar estadounidense ($)', language: 'Español, Inglés', colors: ['red', 'white', 'blue'], isIsland: true, isTerritory: true,
    flagSymbolismEs: 'Cinco franjas rojas y blancas con triángulo azul celeste y la estrella solitaria blanca borincana.',
    funFactEs: 'Alberga El Yunque, el único bosque pluvial tropical del Sistema Forestal Nacional de EE.UU.'
  },
  {
    id: 'gl', code3: 'GRL', nameEs: 'Groenlandia', nameEn: 'Greenland', capitalEs: 'Nuuk', capitalEn: 'Nuuk',
    continent: 'América', lat: 71.7069, lng: -42.6043, population: 56000, areaKm2: 2166086,
    currency: 'Corona danesa (DKK)', language: 'Groenlandés, Danés', colors: ['red', 'white'], isIsland: true, isTerritory: true,
    flagSymbolismEs: 'Disco solar rojo y blanco sobre campo bipartido blanco y rojo sin la tradicional cruz nórdica.',
    funFactEs: 'Es la isla no continental más grande del planeta, con un 80% de su superficie cubierta por hielo.'
  },
  {
    id: 'gy', code3: 'GUY', nameEs: 'Guyana', nameEn: 'Guyana', capitalEs: 'Georgetown', capitalEn: 'Georgetown',
    continent: 'América', lat: 4.8604, lng: -58.9302, population: 813000, areaKm2: 214969,
    currency: 'Dólar guyanés (G$)', language: 'Inglés', colors: ['green', 'yellow', 'red', 'black', 'white'],
    flagSymbolismEs: 'La Punta de Flecha Dorada ("The Golden Arrowhead") apuntando hacia el futuro y desarrollo.',
    funFactEs: 'Las Cataratas Kaieteur tienen una caída libre simple de 226 metros en medio de la selva virgen.'
  },
  {
    id: 'sr', code3: 'SUR', nameEs: 'Surinam', nameEn: 'Suriname', capitalEs: 'Paramaribo', capitalEn: 'Paramaribo',
    continent: 'América', lat: 3.9193, lng: -56.0278, population: 623000, areaKm2: 163820,
    currency: 'Dólar surinamés ($)', language: 'Neerlandés', colors: ['green', 'white', 'red', 'yellow'],
    flagSymbolismEs: 'Estrella dorada de la unidad sobre franjas verde selva y roja de progreso y fraternidad.',
    funFactEs: 'Único país de Sudamérica con el neerlandés como idioma oficial, con más del 90% cubierto por selva.'
  },
  {
    id: 'vi', code3: 'VIR', nameEs: 'Islas Vírgenes de los Estados Unidos', nameEn: 'United States Virgin Islands', capitalEs: 'Carlota Amalia', capitalEn: 'Charlotte Amalie',
    continent: 'América', lat: 18.3358, lng: -64.8963, population: 105000, areaKm2: 346,
    currency: 'Dólar estadounidense ($)', language: 'Inglés, Español', colors: ['white', 'yellow', 'blue', 'green'], isIsland: true, isTerritory: true,
    flagSymbolismEs: 'Águila calva dorada con flechas y rama de olivo flanqueada por las letras V e I sobre fondo blanco.',
    funFactEs: 'Comprende las islas de Saint Thomas, Saint John y Saint Croix en el Caribe oriental.'
  },
  {
    id: 'pm', code3: 'SPM', nameEs: 'San Pedro y Miquelón', nameEn: 'Saint Pierre and Miquelon', capitalEs: 'San Pedro', capitalEn: 'Saint-Pierre',
    continent: 'América', lat: 46.8852, lng: -56.3159, population: 6000, areaKm2: 242,
    currency: 'Euro (€)', language: 'Francés', colors: ['blue', 'red', 'yellow', 'white'], isIsland: true, isTerritory: true,
    flagSymbolismEs: 'El navío Grande Hermine de Jacques Cartier con banderas de País Vasco, Bretaña y Normandía.',
    funFactEs: 'Único vestigio del antiguo territorio colonial francés en América del Norte situado junto a Terranova.'
  },
  {
    id: 'bl', code3: 'BLM', nameEs: 'San Bartolomé', nameEn: 'Saint Barthelemy', capitalEs: 'Gustavia', capitalEn: 'Gustavia',
    continent: 'América', lat: 17.9, lng: -62.8333, population: 10000, areaKm2: 25,
    currency: 'Euro (€)', language: 'Francés', colors: ['white', 'blue', 'red', 'yellow'], isIsland: true, isTerritory: true,
    flagSymbolismEs: 'Escudo sobre campo blanco con cruces de Malta, flor de lis y tres coronas doradas de herencia sueca.',
    funFactEs: 'Antigua colonia de Suecia en el Caribe, su capital Gustavia honra al rey Gustavo III de Suecia.'
  },
  {
    id: 'mf', code3: 'MAF', nameEs: 'San Martín', nameEn: 'Saint Martin', capitalEs: 'Marigot', capitalEn: 'Marigot',
    continent: 'América', lat: 18.0708, lng: -63.0501, population: 32000, areaKm2: 53,
    currency: 'Euro (€)', language: 'Francés', colors: ['blue', 'white', 'red'], isIsland: true, isTerritory: true,
    flagSymbolismEs: 'Tricolor con el escudo oficial que muestra un pelícano y la flora tropical de la mitad francesa.',
    funFactEs: 'La isla más pequeña del mundo dividida pacíficamente entre dos naciones soberanas (Francia y Países Bajos).'
  },
  {
    id: 'bm', code3: 'BMU', nameEs: 'Bermudas', nameEn: 'Bermuda', capitalEs: 'Hamilton', capitalEn: 'Hamilton',
    continent: 'América', lat: 32.3078, lng: -64.7505, population: 64000, areaKm2: 54,
    currency: 'Dólar de Bermudas ($)', language: 'Inglés', colors: ['red', 'blue', 'white'], isIsland: true, isTerritory: true,
    flagSymbolismEs: 'Pabellón rojo británico con escudo que representa el naufragio del navío Sea Venture en 1609.',
    funFactEs: 'Famosa por sus playas de arena rosa coralina y el legendario Triángulo de las Bermudas.'
  },
  {
    id: 'ky', code3: 'CYM', nameEs: 'Islas Caimán', nameEn: 'Cayman Islands', capitalEs: 'George Town', capitalEn: 'George Town',
    continent: 'América', lat: 19.3133, lng: -81.2546, population: 68000, areaKm2: 264,
    currency: 'Dólar de las Islas Caimán ($)', language: 'Inglés', colors: ['blue', 'red', 'white', 'yellow'], isIsland: true, isTerritory: true,
    flagSymbolismEs: 'Pabellón azul con tres estrellas doradas sobre ondas marinas, un león rampante y una tortuga.',
    funFactEs: 'Centro financiero mundial y paraíso de buceo en la famosa Stingray City con rayas marinas dóciles.'
  },
  {
    id: 'vg', code3: 'VGB', nameEs: 'Islas Vírgenes Británicas', nameEn: 'British Virgin Islands', capitalEs: 'Road Town', capitalEn: 'Road Town',
    continent: 'América', lat: 18.4207, lng: -64.6399, population: 31000, areaKm2: 151,
    currency: 'Dólar estadounidense ($)', language: 'Inglés', colors: ['blue', 'white', 'green', 'yellow'], isIsland: true, isTerritory: true,
    flagSymbolismEs: 'Pabellón azul con Santa Úrsula y las once lámparas de aceite doradas de las vírgenes.',
    funFactEs: 'La formación geológica "The Baths" en Virgen Gorda exhibe piscinas naturales entre rocas de granito.'
  },
  {
    id: 'ai', code3: 'AIA', nameEs: 'Anguila', nameEn: 'Anguilla', capitalEs: 'El Valle', capitalEn: 'The Valley',
    continent: 'América', lat: 18.2206, lng: -63.0686, population: 15000, areaKm2: 91,
    currency: 'Dólar del Caribe Oriental ($)', language: 'Inglés', colors: ['blue', 'white', 'orange'], isIsland: true, isTerritory: true,
    flagSymbolismEs: 'Pabellón azul con escudo de tres delfines anaranjados entrelazados en círculo sobre turquesa.',
    funFactEs: 'Su nombre proviene de la palabra "anguila" por su forma delgada y alargada vista desde el mar.'
  },
  {
    id: 'tc', code3: 'TCA', nameEs: 'Islas Turcas y Caicos', nameEn: 'Turks and Caicos Islands', capitalEs: 'Cockburn Town', capitalEn: 'Cockburn Town',
    continent: 'América', lat: 21.694, lng: -71.7979, population: 45000, areaKm2: 948,
    currency: 'Dólar estadounidense ($)', language: 'Inglés', colors: ['blue', 'red', 'yellow'], isIsland: true, isTerritory: true,
    flagSymbolismEs: 'Pabellón azul con escudo que incluye un caracol rosado de reina, una langosta y un cactus turco.',
    funFactEs: 'Grace Bay Beach ha sido votada repetidamente como una de las mejores playas del mundo.'
  },
  {
    id: 'ms', code3: 'MSR', nameEs: 'Montserrat', nameEn: 'Montserrat', capitalEs: 'Plymouth / Brades', capitalEn: 'Brades',
    continent: 'América', lat: 16.7425, lng: -62.1874, population: 5000, areaKm2: 102,
    currency: 'Dólar del Caribe Oriental ($)', language: 'Inglés', colors: ['blue', 'white', 'green'], isIsland: true, isTerritory: true,
    flagSymbolismEs: 'Pabellón azul con la figura de Erin vestida de verde sosteniendo un arpa dorada y una cruz.',
    funFactEs: 'La erupción del volcán Soufrière Hills en 1995 sepultó la capital histórica de Plymouth bajo cenizas.'
  },
  {
    id: 'fk', code3: 'FLK', nameEs: 'Islas Malvinas', nameEn: 'Falkland Islands', capitalEs: 'Puerto Argentino', capitalEn: 'Stanley',
    continent: 'América', lat: -51.7963, lng: -59.5236, population: 3000, areaKm2: 12173,
    currency: 'Libra de las Malvinas (£)', language: 'Inglés', colors: ['blue', 'white', 'red'], isIsland: true, isTerritory: true,
    flagSymbolismEs: 'Pabellón azul con escudo que exhibe un carnero sobre hierba tussac y el navío Desire.',
    funFactEs: 'Hogar de más de medio millón de pingüinos de cinco especies diferentes en el Atlántico Sur.'
  },
  {
    id: 'aw', code3: 'ABW', nameEs: 'Aruba', nameEn: 'Aruba', capitalEs: 'Oranjestad', capitalEn: 'Oranjestad',
    continent: 'América', lat: 12.5211, lng: -69.9683, population: 106000, areaKm2: 180,
    currency: 'Florín arubeño (ƒ)', language: 'Papiamento, Holandés, Inglés, Español', colors: ['blue', 'yellow', 'red', 'white'], isIsland: true, isTerritory: true,
    flagSymbolismEs: 'Fondo azul cielo con dos franjas amarillas y una estrella roja de cuatro puntas con borde blanco.',
    funFactEs: 'Conocida como "One Happy Island", se encuentra fuera del cinturón de huracanes del Caribe.'
  },
  {
    id: 'cw', code3: 'CUW', nameEs: 'Curazao', nameEn: 'Curaçao', capitalEs: 'Willemstad', capitalEn: 'Willemstad',
    continent: 'América', lat: 12.1696, lng: -68.99, population: 191000, areaKm2: 444,
    currency: 'Florín antillano neerlandés (ƒ)', language: 'Papiamento, Holandés, Inglés, Español', colors: ['blue', 'yellow', 'white'], isIsland: true, isTerritory: true,
    flagSymbolismEs: 'Fondo azul marino con franja amarilla y dos estrellas blancas de Curazao y Klein Curazao.',
    funFactEs: 'El puente flotante Reina Emma en Willemstad es un icono arquitectónico caribeño móvil.'
  },
  {
    id: 'sx', code3: 'SXM', nameEs: 'Sint Maarten', nameEn: 'Sint Maarten', capitalEs: 'Philipsburg', capitalEn: 'Philipsburg',
    continent: 'América', lat: 18.0425, lng: -63.0548, population: 44000, areaKm2: 34,
    currency: 'Florín antillano neerlandés (ƒ)', language: 'Inglés, Holandés', colors: ['red', 'blue', 'white'], isIsland: true, isTerritory: true,
    flagSymbolismEs: 'Triángulo blanco en el asta con el escudo nacional y dos franjas horizontales roja y azul.',
    funFactEs: 'Maho Beach es famosa mundialmente por los aviones de pasajeros que aterrizan sobre la playa.'
  },
  {
    id: 'gf', code3: 'GUF', nameEs: 'Guayana Francesa', nameEn: 'French Guiana', capitalEs: 'Cayena', capitalEn: 'Cayenne',
    continent: 'América', lat: 3.9339, lng: -53.1258, population: 300000, areaKm2: 83534,
    currency: 'Euro (€)', language: 'Francés', colors: ['green', 'yellow', 'red', 'blue', 'white'], isTerritory: true,
    flagSymbolismEs: 'Bicolor diagonal verde y amarillo con una estrella roja de cinco puntas en el centro y el tricolor francés oficial.',
    funFactEs: 'Alberga el Centro Espacial Guayanés en Kourou, el principal puerto espacial de la Agencia Espacial Europea (ESA).'
  },
  {
    id: 'gp', code3: 'GLP', nameEs: 'Guadalupe', nameEn: 'Guadeloupe', capitalEs: 'Basse-Terre', capitalEn: 'Basse-Terre',
    continent: 'América', lat: 16.265, lng: -61.551, population: 384000, areaKm2: 1628,
    currency: 'Euro (€)', language: 'Francés, Criollo antillano', colors: ['blue', 'yellow', 'green', 'red'], isIsland: true, isTerritory: true,
    flagSymbolismEs: 'Estandarte histórico azul con tres flores de lis doradas y cañas de azúcar verdes bajo un sol radiante.',
    funFactEs: 'Su geografía tiene forma de mariposa formada por las islas Grande-Terre y Basse-Terre.'
  },
  {
    id: 'mq', code3: 'MTQ', nameEs: 'Martinica', nameEn: 'Martinique', capitalEs: 'Fort-de-France', capitalEn: 'Fort-de-France',
    continent: 'América', lat: 14.6415, lng: -61.0242, population: 360000, areaKm2: 1128,
    currency: 'Euro (€)', language: 'Francés, Criollo martiniqués', colors: ['red', 'green', 'black'], isIsland: true, isTerritory: true,
    flagSymbolismEs: 'Bandera oficial adoptada en 2023 con franjas verde y negra, triángulo rojo y la silueta del colibrí martiniqués.',
    funFactEs: 'El volcán Monte Pelée en Martinica protagonizó una de las erupciones volcánicas más famosas del siglo XX en 1902.'
  },
  {
    id: 'bq', code3: 'BES', nameEs: 'Caribe Neerlandés (Bonaire, Saba, San Eustaquio)', nameEn: 'Caribbean Netherlands', capitalEs: 'Kralendijk', capitalEn: 'Kralendijk',
    continent: 'América', lat: 12.1784, lng: -68.2385, population: 27000, areaKm2: 328,
    currency: 'Dólar estadounidense ($)', language: 'Papiamento, Neerlandés, Inglés', colors: ['blue', 'yellow', 'white', 'red'], isIsland: true, isTerritory: true,
    flagSymbolismEs: 'Bandera de Bonaire con estrella roja de seis puntas en brújula náutica blanca y campos azul y amarillo.',
    funFactEs: 'El volcán inactivo Monte Scenery en Saba (887 m) es el punto más alto del Reino de los Países Bajos.'
  },
  {
    id: 'gs', code3: 'SGS', nameEs: 'Islas Georgias del Sur y Sandwich del Sur', nameEn: 'South Georgia and South Sandwich Islands', capitalEs: 'Punto Coronel / Grytviken', capitalEn: 'Grytviken',
    continent: 'América', lat: -54.4296, lng: -36.5879, population: 35, areaKm2: 3903,
    currency: 'Libra esterlina (£)', language: 'Inglés', colors: ['blue', 'white', 'red', 'green', 'yellow'], isIsland: true, isTerritory: true,
    flagSymbolismEs: 'Pabellón azul británico con escudo coronado que incluye león dorado, pingüino emperador y reno ártico.',
    funFactEs: 'En Grytviken reposan los restos del célebre explorador polar Sir Ernest Shackleton.'
  }
];
