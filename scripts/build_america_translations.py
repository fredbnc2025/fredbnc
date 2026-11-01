import json
import re

with open('/tmp/all_countries.json', 'r', encoding='utf-8') as f:
    countries = json.load(f)

# Helper dictionaries from test_trans
from test_trans import translate_lang, translate_curr

def esc(s):
    if not s:
        return ""
    return s.replace('\\', '\\\\').replace("'", "\\'")

# AMERICA TRANSLATIONS
AMERICA_TRANSLATIONS = {
    'ar': {
        'sym': 'Light blue and white stripes of the Argentine skies centered by the golden Incan Sun of May with a human face honoring independence.',
        'fun': 'Encompasses Aconcagua, the highest mountain peak outside Asia at 6,961 meters, and the sweeping Patagonian glaciers.'
    },
    'bo': {
        'sym': 'Red for heroic sacrifice, yellow for mineral wealth, and green for rich natural biodiversity.',
        'fun': 'The Salar de Uyuni is the world\'s largest salt flat, spanning over 10,000 square kilometers and acting as a giant natural mirror.'
    },
    'br': {
        'sym': 'Green field for the Amazonian rainforest, yellow rhombus for mineral wealth, and the Southern celestial sphere with "Ordem e Progresso".',
        'fun': 'Houses the Amazon River basin, the largest river by discharge volume and the most biodiverse tropical rainforest globally.'
    },
    'ca': {
        'sym': 'The iconic eleven-pointed stylized red maple leaf framed by red borders honoring Canadian natural heritage.',
        'fun': 'Boasts the longest national coastline of any country in the world, spanning over 202,080 kilometers.'
    },
    'cl': {
        'sym': 'Blue canton with the solitary white star of guidance, white snow of the Andes, and red for battle sacrifice.',
        'fun': 'The Atacama Desert is celebrated as the driest non-polar desert on Earth, renowned as an astronomical stargazing paradise.'
    },
    'co': {
        'sym': 'Miranda\'s tricolor: primary yellow for natural wealth, blue for oceans, and red for the blood shed by independence heroes.',
        'fun': 'The second most biodiverse country on the planet and the world\'s leading producer of premium emeralds.'
    },
    'cr': {
        'sym': 'Inspired by the French tricolor: blue of the sky, white of peace, and red of warmth and civic generosity.',
        'fun': 'A global pioneer in environmental conservation with no standing army since 1948, protecting over 25% of its land as national parks.'
    },
    'cu': {
        'sym': 'Five stripes representing the historical colonial departments, a Masonic red equality triangle, and the lone star of freedom.',
        'fun': 'Home to the bee hummingbird (Zunzuncito), the smallest living bird species on Earth measuring just 5 centimeters.'
    },
    'ec': {
        'sym': 'Tricolor charged with the national coat of arms presided by the Andean Condor soaring above Mount Chimborazo.',
        'fun': 'The Galápagos Islands are a UNESCO World Heritage site whose unique endemic fauna inspired Darwin\'s theory of evolution.'
    },
    'sv': {
        'sym': 'Blue stripes for the Caribbean and Pacific oceans, and central white stripe for peace charged with the national coat of arms.',
        'fun': 'Known as the "Land of Volcanoes", it is the smallest and most densely populated nation in Central America.'
    },
    'us': {
        'sym': 'Fifty white stars on a blue canton for the sovereign states and thirteen stripes for the original founding colonies.',
        'fun': 'The Grand Canyon reveals nearly two billion years of Earth\'s geological history in its layered red rock formations.'
    },
    'gt': {
        'sym': 'Two sky-blue stripes framing a white peace field charged with the resplendent Quetzal bird, sovereign symbol of liberty.',
        'fun': 'Tikal was one of the greatest urban and ceremonial centers of the ancient pre-Columbian Maya civilization.'
    },
    'hn': {
        'sym': 'Five blue stars representing the five member nations of the historic Federal Republic of Central America.',
        'fun': 'The Copán Maya ruins are world-renowned for their exquisitely carved stone stelae and hieroglyphic stairway.'
    },
    'mx': {
        'sym': 'Green for hope, white for unity, and red for heroes\' blood, crowned by the Aztec eagle devouring a serpent on a nopal cactus.',
        'fun': 'Introduced chocolate, corn, and vanilla to the world and features the Great Pyramid of Cholula, the largest by volume on Earth.'
    },
    'ni': {
        'sym': 'Sky-blue bands and central triangle with five volcanoes and the Phrygian cap of liberty surrounded by peace rainbow.',
        'fun': 'Lake Nicaragua is the only freshwater lake in the world inhabited by oceanic bull sharks.'
    },
    'pa': {
        'sym': 'White, blue, and red quarters with stars symbolizing civic purity, authority, and law uniting political factions.',
        'fun': 'The Panama Canal is an engineering marvel that connects the Atlantic and Pacific oceans, handling thousands of ships annually.'
    },
    'py': {
        'sym': 'Unique national flag with different obverse and reverse designs: the national Coat of Arms on the front and Treasury Seal on the back.',
        'fun': 'The Itaipu Dam on the Paraná River is one of the world\'s largest producers of clean hydroelectric energy.'
    },
    'pe': {
        'sym': 'Vertical triband in national red and white, symbolizing Peruvian courage, peace, and patriotic dignity with national coat of arms.',
        'fun': 'Machu Picchu stands as one of the New Seven Wonders of the World, alongside the ancient Lake Titicaca.'
    },
    'uy': {
        'sym': 'Nine alternating blue and white stripes for the founding departments, with the golden Sun of May in the upper canton.',
        'fun': 'Hosted and won the first ever FIFA World Cup in 1930 at the historic Estadio Centenario in Montevideo.'
    },
    've': {
        'sym': 'Yellow for sun and soil, blue for the Caribbean Sea, red for independence, and an arc of eight white stars.',
        'fun': 'Angel Falls (Salto Ángel) is the world\'s highest uninterrupted waterfall with a plunging drop of 979 meters.'
    },
    'bs': {
        'sym': 'Black hoist triangle representing the strength of the Bahamian people, framing aquamarine ocean stripes and a golden sand band.',
        'fun': 'Comprises an archipelago of over 700 islands and cays surrounded by some of the clearest turquoise waters on Earth.'
    },
    'do': {
        'sym': 'White cross of faith dividing blue and red quarters, centered by the national coat of arms bearing the Bible opened to John 8:32.',
        'fun': 'Santo Domingo is the oldest permanent European settlement in the Americas, home to the New World\'s first cathedral.'
    },
    'jm': {
        'sym': 'Golden Saltire cross framing black triangles for hardships overcome and green triangles for agricultural abundance and hope.',
        'fun': 'Birthplace of reggae music icon Bob Marley and the world\'s fastest sprinters, including eight-time Olympic gold medalist Usain Bolt.'
    },
    'ht': {
        'sym': 'Blue and red horizontal bicolor featuring the national coat of arms with the Phrygian cap of liberty atop a palm tree.',
        'fun': 'Became the world\'s first independent Black-led republic in 1804 after a successful slave revolution.'
    },
    'bz': {
        'sym': 'Royal blue field with red fimbriations and the national coat of arms depicting two woodcutters beneath a mahogany tree.',
        'fun': 'Home to the Great Blue Hole, a giant underwater marine sinkhole celebrated by Jacques Cousteau.'
    },
    'tt': {
        'sym': 'Red field symbolizing the warmth of the sun and energy, bisected by a black diagonal stripe with white fimbriations for earth and water.',
        'fun': 'Birthplace of the steelpan drum (the only acoustic musical instrument invented in the 20th century) and the limbo dance.'
    },
    'ag': {
        'sym': 'Red "V" for victory framing black for African ancestry, blue for the Caribbean Sea, and a rising golden sun of dawn.',
        'fun': 'Renowned for boasting 365 distinct white sand beaches—one for every single day of the year.'
    },
    'bb': {
        'sym': 'Ultramarine blue for the sea and sky, yellow for golden sand beaches, centered by Neptune\'s black broken trident of independence.',
        'fun': 'The birthplace of rum, with Mount Gay Distilleries holding the oldest continuous commercial rum rum license (1703).'
    },
    'dm': {
        'sym': 'Forest green field with a tricolor cross and purple Sisserou parrot encircled by ten lime-green stars for the parishes.',
        'fun': 'Known as the "Nature Island of the Caribbean" with lush mountainous rainforests, 365 rivers, and the world\'s second-largest boiling lake.'
    },
    'gd': {
        'sym': 'Red border with six gold stars, four green and gold triangles, and a stylized golden nutmeg clove on the hoist.',
        'fun': 'Known as the "Spice Isle" because it is one of the world\'s largest exporters of nutmeg and mace.'
    },
    'kn': {
        'sym': 'Green for fertility, red for liberation, and a black diagonal stripe with two white stars of hope and freedom.',
        'fun': 'The smallest sovereign federation in the Americas, both in geographic land area and population.'
    },
    'lc': {
        'sym': 'Cerulean blue field with yellow, black, and white isosceles triangles symbolizing the volcanic twin Pitons rising from the sea.',
        'fun': 'The only sovereign country in the world named after a historic woman (Saint Lucy of Syracuse).'
    },
    'vc': {
        'sym': 'Blue for sky, gold for warmth, and green for vegetation, centered by three green diamonds forming a "V" for Saint Vincent.',
        'fun': 'Features the active stratovolcano La Soufrière and served as a major filming location for Pirates of the Caribbean.'
    },
    'pr': {
        'sym': 'Five alternating red and white stripes with a blue hoist triangle bearing a solitary white star of Puerto Rican sovereignty.',
        'fun': 'El Yunque National Forest is the only tropical rainforest in the United States National Forest System.'
    },
    'gl': {
        'sym': 'White and red horizontal bicolor charged with a reversed counterchanged circle symbolizing the polar sun setting over icy waters.',
        'fun': 'The world\'s largest island that is not a continent, covered by a permanent ice sheet over two kilometers thick.'
    },
    'gy': {
        'sym': 'The "Golden Arrowhead": a golden arrow of mineral wealth bordered in white upon a green agricultural field.',
        'fun': 'Kaieteur Falls is the world\'s widest single-drop waterfall, four times higher than Niagara Falls.'
    },
    'sr': {
        'sym': 'Green for agriculture, white for justice and freedom, and red for progress, centered by a golden five-pointed star of unity.',
        'fun': 'The most heavily forested country on Earth, with over 93% of its national territory covered by pristine Amazon rainforest.'
    },
    'vi': {
        'sym': 'White field bearing a golden American bald eagle holding an olive branch and arrows, flanked by the letters V and I.',
        'fun': 'The only location in the United States where traffic drives on the left-hand side of the road.'
    },
    'pm': {
        'sym': 'Blue field depicting Jacques Cartier\'s ship the Grande Hermine, with Basque, Breton, and Norman regional flags on the hoist.',
        'fun': 'The last remaining territorial remnant of France\'s once-vast colonial empire of New France in North America.'
    },
    'bl': {
        'sym': 'White field charged with the local coat of arms featuring Maltese crosses, fleurs-de-lis, and Swedish crowns.',
        'fun': 'Formerly a Swedish colony for over a century, its capital Gustavia is named after King Gustav III of Sweden.'
    },
    'mf': {
        'sym': 'Flies the French national tricolor with local emblem honoring the peaceful partition of the island with the Dutch.',
        'fun': 'The island of Saint Martin is the smallest inhabited landmass in the world divided between two sovereign nations.'
    },
    'bm': {
        'sym': 'British Red Ensign with the Bermudian coat of arms depicting the wreckage of the ship Sea Venture in 1609.',
        'fun': 'Famous for its distinctive pink sand beaches created by pulverized red foraminifera shells and coral reefs.'
    },
    'ky': {
        'sym': 'British Blue Ensign bearing the Caymanian coat of arms with three green stars, a golden lion, and a green sea turtle.',
        'fun': 'A premier global offshore financial center renowned for world-class scuba diving along the Cayman Wall.'
    },
    'vg': {
        'sym': 'British Blue Ensign charged with Saint Ursula and eleven oil lamps representing the eleven thousand virgin martyrs.',
        'fun': 'The Baths on Virgin Gorda feature monumental granite boulders forming scenic sea caves and tidal saltwater pools.'
    },
    'ai': {
        'sym': 'British Blue Ensign charged with the Anguillan coat of arms showing three orange dolphins leaping in an unbroken circle.',
        'fun': 'Renowned for exceptionally tranquil white sand beaches, turquoise bays, and luxury boutique hospitality.'
    },
    'tc': {
        'sym': 'British Blue Ensign bearing a shield with a queen conch shell, a spiny lobster, and a native Turks head cactus.',
        'fun': 'Grace Bay Beach in Providenciales is consistently voted among the most breathtaking beaches in the world.'
    },
    'ms': {
        'sym': 'British Blue Ensign bearing Erin, the female personification of Ireland, holding a golden harp beside a Christian cross.',
        'fun': 'Known as the "Emerald Isle of the Caribbean" due to its Irish heritage and lush volcanic landscapes.'
    },
    'fk': {
        'sym': 'British Blue Ensign charged with the Falkland Islands coat of arms featuring a ram on a tussock grass mound above the ship Desire.',
        'fun': 'Home to five different species of penguins, where penguins outnumber human residents by more than a hundred to one.'
    },
    'aw': {
        'sym': 'Lapis-blue field representing the Caribbean Sea, two yellow horizontal stripes for mineral wealth, and a red four-pointed star.',
        'fun': 'Positioned comfortably south of the Caribbean hurricane belt, enjoying sunny weather year-round.'
    },
    'cw': {
        'sym': 'Deep blue field with a yellow stripe representing the sun, and two white stars symbolizing Curaçao and Klein Curaçao.',
        'fun': 'Willemstad\'s historic harbor front features iconic Dutch colonial architecture painted in vibrant pastel shades.'
    },
    'sx': {
        'sym': 'Red and blue horizontal bicolor with a white hoist triangle bearing the national coat of arms and brown pelican.',
        'fun': 'Maho Beach is famous worldwide for airplanes passing directly over sunbathers just meters before touching down.'
    },
    'gf': {
        'sym': 'French tricolor accompanied locally by a green and yellow diagonal bicolor charged with a red star of socialism.',
        'fun': 'Hosts the Guiana Space Centre near Kourou, the primary European spaceport for Ariane and Vega rocket launches.'
    },
    'gp': {
        'sym': 'Official French tricolor accompanied by local cultural flags featuring royal fleurs-de-lis, suns, and sugar cane stalks.',
        'fun': 'The butterfly-shaped island is home to La Grande Soufrière, the highest volcanic mountain peak in the Lesser Antilles.'
    },
    'mq': {
        'sym': 'Traditional blue and white cross flag with four fer-de-lance vipers, alongside the newly adopted cultural red, green, and black flag.',
        'fun': 'Birthplace of Empress Joséphine, the first wife of Napoleon Bonaparte and Empress of the French.'
    },
    'bq': {
        'sym': 'Special Caribbean municipalities of the Netherlands (Bonaire, Sint Eustatius, Saba) flying official municipal standards.',
        'fun': 'Mount Scenery on Saba is an active volcano and the highest geographic point in the entire Kingdom of the Netherlands.'
    },
    'gs': {
        'sym': 'British Blue Ensign bearing the South Georgia coat of arms with a lion holding a torch and a reindeer crest.',
        'fun': 'Famous as the burial site of legendary polar explorer Sir Ernest Shackleton at Grytviken whaling station.'
    }
}

# Write America
lines_am = [
    "import { CountryTranslationEn } from './types';",
    "",
    "export const AMERICA_TRANSLATIONS_EN: Record<string, CountryTranslationEn> = {"
]

am_countries = [c for c in countries if c['continent'] == 'América']
for c in am_countries:
    cid = c['id']
    t = AMERICA_TRANSLATIONS.get(cid, {})
    lang_en = translate_lang(c.get('language', ''))
    curr_en = translate_curr(c.get('currency', ''))
    sym_en = t.get('sym', f"Official sovereign flag of {c['nameEn']} with regulation proportions and official state colors.")
    fun_en = t.get('fun', f"Key sovereign nation in the Americas, noted for rich cultural traditions and historic landmarks.")
    
    lines_am.append(f"  {cid}: {{")
    lines_am.append(f"    languageEn: '{esc(lang_en)}',")
    lines_am.append(f"    currencyEn: '{esc(curr_en)}',")
    lines_am.append(f"    flagSymbolismEn: '{esc(sym_en)}',")
    lines_am.append(f"    funFactEn: '{esc(fun_en)}'")
    lines_am.append(f"  }},")

lines_am.append("};")
lines_am.append("")

with open('/app/applet/src/data/translations/americaTranslationsEn.ts', 'w', encoding='utf-8') as f_am:
    f_am.write("\n".join(lines_am))
print("Wrote America translations.")
