import json
from test_trans import translate_lang, translate_curr

with open('/tmp/all_countries.json', 'r', encoding='utf-8') as f:
    countries = json.load(f)

def esc(s):
    if not s:
        return ""
    return s.replace('\\', '\\\\').replace("'", "\\'")

AFRICA_TRANSLATIONS = {
    'za': {
        'sym': 'The vibrant "Rainbow Flag" with a converging horizontal Y-shape symbolizing the coming together of diverse South African cultures.',
        'fun': 'The only nation in the world with three official constitutional capital cities: Pretoria, Cape Town, and Bloemfontein.'
    },
    'eg': {
        'sym': 'Pan-Arab tricolor of red, white, and black bearing the golden Eagle of Saladin centered on the white band.',
        'fun': 'Home to the Great Pyramid of Giza, the oldest and sole surviving monument of the Seven Wonders of the Ancient World.'
    },
    'ma': {
        'sym': 'Crimson red field representing the royal Alaouite dynasty, centered by an open green pentagram (Seal of Solomon).',
        'fun': 'The University of al-Qarawiyyin in Fez, founded in 859 AD, is recognized by UNESCO as the oldest continuously operating university.'
    },
    'ke': {
        'sym': 'Traditional Maasai shield with two crossed spears superimposed on black, red, and green stripes with white fimbriations.',
        'fun': 'The annual Great Migration in the Maasai Mara ecosystem involves over two million wildebeest, zebras, and gazelles.'
    },
    'ng': {
        'sym': 'Vertical green-white-green triband: lush agricultural lands and natural forests framing central peace and unity.',
        'fun': 'Africa\'s most populous nation, famed for its thriving Nollywood film industry and dynamic cultural music scene.'
    },
    'dz': {
        'sym': 'Vertical green and white bicolor charged with a red crescent moon and five-pointed star of Islam.',
        'fun': 'The largest sovereign country in Africa by territorial land area, with over 80% covered by the Sahara Desert.'
    },
    'so': {
        'sym': 'Sky-blue field inspired by the United Nations, centered by a white five-pointed Star of Unity representing Somali regions.',
        'fun': 'Has the longest coastline on mainland Africa, stretching over 3,300 kilometers along the Indian Ocean and Gulf of Aden.'
    },
    'mg': {
        'sym': 'White vertical hoist bar with red and green horizontal bands, reflecting the colors of the historic Merina Kingdom.',
        'fun': 'Over 90% of Madagascar\'s wildlife species, including all species of wild lemurs, are found nowhere else on planet Earth.'
    },
    'et': {
        'sym': 'Green, yellow, and red horizontal tricolor (the prototype for pan-African colors) centered by a blue disc with a golden radiant star.',
        'fun': 'The only African nation that successfully defeated European colonial conquest, preserving its independence at the Battle of Adwa (1896).'
    },
    'tz': {
        'sym': 'Black diagonal stripe with yellow fimbriations dividing green (agriculture) and blue (the Indian Ocean and Great Lakes).',
        'fun': 'Mount Kilimanjaro is the highest free-standing mountain in the world and the highest peak in Africa at 5,895 meters.'
    },
    'sn': {
        'sym': 'Pan-African tricolor of green, yellow, and red charged with a green five-pointed star of hope and independence in the center.',
        'fun': 'Lake Retba (Lac Rose) owes its striking bubblegum-pink water color to Dunaliella salina microalgae and high salt content.'
    },
    'gh': {
        'sym': 'Pan-African red, gold, and green tricolor centered by a black star symbolizing the lodestar of African freedom and sovereignty.',
        'fun': 'The first sub-Saharan African country to achieve independence from European colonial rule in 1957.'
    },
    'tn': {
        'sym': 'Red field centered by a white disc bearing a red crescent moon and star, symbolizing traditional Ottoman and Islamic heritage.',
        'fun': 'The ancient ruins of Carthage, founded by the Phoenicians in the 9th century BC, lie on the outskirts of modern Tunis.'
    },
    'cv': {
        'sym': 'Blue field representing the ocean and sky, with a white and red stripe and ten gold stars representing the ten volcanic islands.',
        'fun': 'Known as the homeland of Morna musical blues, popularized worldwide by legendary barefoot diva Cesária Évora.'
    },
    'sc': {
        'sym': 'Five oblique colored bands radiating from the bottom hoist corner, symbolizing a dynamic new nation moving forward into the future.',
        'fun': 'An archipelago of 115 granite and coral islands, home to the unique Coco de Mer palm bearing the world\'s heaviest seed.'
    },
    'mu': {
        'sym': 'Four horizontal stripes of red (independence struggle), blue (Indian Ocean), yellow (light of freedom), and green (vegetation).',
        'fun': 'The sole known historical habitat of the extinct flightless dodo bird, which disappeared in the late 17th century.'
    },
    'km': {
        'sym': 'Four horizontal stripes of yellow, white, red, and blue with a green hoist triangle bearing a crescent and four stars.',
        'fun': 'Known as the "Perfume Islands" because it is the world\'s leading producer of ylang-ylang essential oil for high perfumery.'
    },
    'st': {
        'sym': 'Green, yellow, and green horizontal triband with a red hoist triangle and two black stars representing the two main islands.',
        'fun': 'Africa\'s second-smallest country by population, renowned for fine single-origin artisanal cocoa plantations.'
    },
    'ao': {
        'sym': 'Horizontal red and black bicolor charged with a yellow half-gear wheel, a machete, and a five-pointed star of industry and agriculture.',
        'fun': 'Home to the giant sable antelope (Palanca Negra Gigante), a majestic animal endemic to Angola with horns up to 1.6 meters.'
    },
    'bj': {
        'sym': 'Green vertical hoist stripe with yellow and red horizontal bands representing pan-African solidarity and Dahomey heritage.',
        'fun': 'The historical cradle of the Vodun religion and home to the Royal Palaces of Abomey, a UNESCO World Heritage site.'
    },
    'bw': {
        'sym': 'Light blue field representing rain (pula), separated by a black central band with white borders for racial harmony.',
        'fun': 'The Okavango Delta is one of the world\'s premier inland deltas, where annual floodwaters create an astonishing wildlife oasis.'
    },
    'bf': {
        'sym': 'Red for revolutionary struggle and green for agricultural abundance, centered by a golden five-pointed star of guidance.',
        'fun': 'Its name translates to "Land of Incorruptible People", renowned for hosting FESPACO, Africa\'s largest film festival.'
    },
    'bi': {
        'sym': 'White saltire dividing green (hope) and red (suffering), centered by a white disc with three stars for unity, work, and progress.',
        'fun': 'The source of the White Nile River begins in the southernmost highlands of Burundi near Rutovu.'
    },
    'cm': {
        'sym': 'Green, red, and yellow vertical tricolor centered by a golden star of national unity between anglophone and francophone regions.',
        'fun': 'Known as "Africa in Miniature" because it exhibits all major climates and vegetation types of the continent.'
    },
    'td': {
        'sym': 'Vertical tricolor of blue for sky and hope, gold for the sun and desert, and red for patriotic sacrifice and unity.',
        'fun': 'Lake Chad, once one of the largest lakes in Africa, supports millions of people across four neighboring countries.'
    },
    'ci': {
        'sym': 'Vertical tricolor of orange for northern savannahs, white for peace, and green for coastal forests and hope.',
        'fun': 'The world\'s largest producer and exporter of cocoa beans, supplying over 40% of the globe\'s cocoa harvest.'
    },
    'er': {
        'sym': 'Red isosceles triangle of blood shed for liberty framing green for agriculture and blue for the Red Sea, with an olive wreath.',
        'fun': 'Asmara is famous for its remarkably preserved Italian modernist and Art Deco architecture from the 1930s.'
    },
    'ga': {
        'sym': 'Horizontal tricolor of green for equatorial forests, gold for the Equator line, and blue for the Atlantic Ocean.',
        'fun': 'Over 85% of Gabon is covered by pristine tropical rainforest, protected by a network of 13 national parks.'
    },
    'gm': {
        'sym': 'Red for sun, blue for the Gambia River, and green for agriculture, separated by white fimbriations representing peace.',
        'fun': 'The smallest country on mainland Africa, forming a narrow riverine enclave completely surrounded by Senegal except for its coastline.'
    },
    'gn': {
        'sym': 'Vertical tricolor of red for sacrifice and labor, yellow for sun and mineral wealth, and green for lush vegetation.',
        'fun': 'Holds the world\'s largest reserves of bauxite ore, the essential mineral source for aluminum production.'
    },
    'gq': {
        'sym': 'Green, white, and red horizontal tricolor with a blue hoist triangle, charged with the silk-cotton mangrove tree arms.',
        'fun': 'The only independent sovereign country in Africa with Spanish as an official national language.'
    },
    'gw': {
        'sym': 'Red vertical stripe with black star of African unity, with yellow and green horizontal bands for labor and forests.',
        'fun': 'The Bijagós Archipelago comprises 88 islands recognized as a UNESCO Biosphere Reserve with saltwater-swimming hippos.'
    },
    'ls': {
        'sym': 'Blue for rain, white for peace, and green for land, charged with a black traditional Basotho conical straw hat (mokorotlo).',
        'fun': 'Known as the "Kingdom in the Sky", it is the only sovereign state in the world situated entirely above 1,000 meters elevation.'
    },
    'lr': {
        'sym': 'Eleven alternating red and white stripes with a blue canton bearing a solitary white star of African liberty and sovereignty.',
        'fun': 'Founded in 1822 by freed African Americans, it is Africa\'s oldest modern democratic republic.'
    },
    'ly': {
        'sym': 'Pan-Arab horizontal tricolor of red, black, and green centered by a white crescent moon and five-pointed star.',
        'fun': 'Home to Leptis Magna, one of the most prominent, well-preserved, and extensive Roman city ruins in the Mediterranean.'
    },
    'mw': {
        'sym': 'Horizontal tricolor of black (African people), red (blood of martyrs), and green (nature) with a rising red sun of freedom.',
        'fun': 'Lake Malawi contains more species of freshwater fish than any other lake on planet Earth, especially colorful cichlids.'
    },
    'ml': {
        'sym': 'Pan-African vertical tricolor of green for fertility, gold for mineral wealth, and red for courage and sacrifice.',
        'fun': 'The Great Mosque of Djenné is the largest mudbrick architectural building in the world, re-plastered annually by the community.'
    },
    'mr': {
        'sym': 'Green field with golden crescent and star, framed by two red horizontal stripes representing patriotic defense.',
        'fun': 'The Richat Structure ("Eye of the Sahara") is a prominent circular geological dome visible clearly from outer space.'
    },
    'mz': {
        'sym': 'Green, black, and yellow stripes with a red hoist triangle bearing a golden star, an open book, a hoe, and an AK-47 rifle.',
        'fun': 'The only national flag in the world featuring a modern assault rifle, symbolizing national defense and sovereignty.'
    },
    'na': {
        'sym': 'Blue and green triangles separated by a red diagonal stripe with white fimbriations, charged with a 12-rayed golden sun.',
        'fun': 'The Namib Desert is celebrated as the oldest desert in the world, renowned for gigantic red sand dunes at Sossusvlei.'
    },
    'ne': {
        'sym': 'Horizontal tricolor of orange for the Sahara Desert, white for purity and innocence, and green for fertile southern plains.',
        'fun': 'The Aïr and Ténéré Natural Reserve is the second largest nature reserve in Africa, home to prehistoric Saharan rock art.'
    },
    'cf': {
        'sym': 'Four horizontal stripes of blue, white, green, and yellow, bisected by a vertical red stripe with a golden star of guidance.',
        'fun': 'Dzanga-Sangha Special Reserve features Dzanga Bai ("Village of Elephants"), where hundreds of forest elephants gather daily.'
    },
    'cg': {
        'sym': 'Green, yellow, and red diagonal tricolor symbolizing agriculture, warmth of the people, and revolutionary struggle.',
        'fun': 'The Congo Basin rainforest is the second largest tropical rainforest on Earth, playing a crucial role in global climate.'
    },
    'cd': {
        'sym': 'Sky-blue field crossed by a red diagonal stripe with yellow borders, charged with a golden five-pointed star in the canton.',
        'fun': 'Home to Virunga National Park, Africa\'s oldest national park, and the critically endangered mountain gorillas.'
    },
    'rw': {
        'sym': 'Horizontal triband of sky-blue with a 24-rayed golden sun, yellow for economic growth, and green for prosperity.',
        'fun': 'Known as the "Land of a Thousand Hills", it leads the world in female parliamentary representation with over 60% women MPs.'
    },
    'sl': {
        'sym': 'Horizontal tricolor of light green for agricultural resources, white for unity and justice, and light blue for the natural harbor.',
        'fun': 'Freetown boasts the third-largest natural harbor in the world and was founded as a haven for freed enslaved people.'
    },
    'sz': {
        'sym': 'Blue for peace, yellow for mineral wealth, and crimson for past battles, centered by a traditional Nguni ox-hide shield and spears.',
        'fun': 'Renamed Eswatini in 2018, it is one of the world\'s last remaining absolute monarchies.'
    },
    'sd': {
        'sym': 'Pan-Arab horizontal tricolor of red, white, and black with a green chevron along the hoist.',
        'fun': 'Contains over 250 pyramids in Meroë and other royal cemeteries, more than double the number found in all of Egypt.'
    },
    'ss': {
        'sym': 'Black, red, and green horizontal stripes with white fimbriations and a blue hoist triangle bearing a golden star of unity.',
        'fun': 'The Sudd swamp in South Sudan is one of the largest tropical wetlands in the world, formed by the White Nile River.'
    },
    'tg': {
        'sym': 'Five alternating green and yellow stripes with a red canton bearing a white five-pointed star of independence.',
        'fun': 'Koutammakou, the land of the Batammariba people, is famous for its traditional mud tower-houses called Takienta.'
    },
    'ug': {
        'sym': 'Six alternating horizontal stripes of black (people), yellow (sunshine), and red (brotherhood), centered by a Grey Crowned Crane.',
        'fun': 'Winston Churchill famously dubbed Uganda the "Pearl of Africa" for its magnificent biodiversity, lakes, and snowcapped Rwenzoris.'
    },
    'dj': {
        'sym': 'Light blue for the sea and sky, light green for the earth, and a white hoist triangle with a red star of unity.',
        'fun': 'Lake Assal is the lowest point in Africa at 155 meters below sea level and the saltiest body of water outside Antarctica.'
    },
    'zm': {
        'sym': 'Green field with a tricolor of red, black, and orange stripes in the fly surmounted by a soaring African fish eagle.',
        'fun': 'Victoria Falls (Mosi-oa-Tunya, "The Smoke That Thunders") forms the world\'s largest curtain of falling water.'
    },
    'zw': {
        'sym': 'Seven horizontal stripes of green, yellow, red, and black, with a white hoist triangle bearing a red star and Zimbabwe Bird.',
        'fun': 'The Great Zimbabwe stone ruins are monumental granite walls built without mortar between the 11th and 15th centuries.'
    },
    'sh': {
        'sym': 'British Blue Ensign bearing the coat of arms showing a rocky coastline and a three-masted sailing ship.',
        'fun': 'The remote South Atlantic island where French Emperor Napoleon Bonaparte was exiled in 1815 and died in 1821.'
    },
    'eh': {
        'sym': 'Pan-Arab black, white, and green horizontal tricolor with a red hoist triangle and red crescent moon and star.',
        'fun': 'A disputed desert territory in North Africa bordering the Atlantic Ocean with rich phosphate and fishing grounds.'
    },
    'yt': {
        'sym': 'Official French tricolor accompanied by local coat of arms showing crescent moon and ylang-ylang flowers with seahorses.',
        'fun': 'Surrounded by one of the largest enclosed coral lagoons in the world, protected by a double barrier reef.'
    },
    're': {
        'sym': 'Official French tricolor accompanied by the cultural volcano flag with red rays radiating from a stylized Piton de la Fournaise.',
        'fun': 'Piton de la Fournaise on Réunion is one of the most active and accessible shield volcanoes in the world.'
    },
    'tf': {
        'sym': 'Navy blue field with the French tricolor in the canton, charged with the monogram TAF and five white stars.',
        'fun': 'An isolated cluster of volcanic islands in the southern Indian Ocean serving as a premier scientific sanctuary for sub-Antarctic wildlife.'
    }
}

lines_af = [
    "import { CountryTranslationEn } from './types';",
    "",
    "export const AFRICA_TRANSLATIONS_EN: Record<string, CountryTranslationEn> = {"
]

af_countries = [c for c in countries if c['continent'] == 'África']
for c in af_countries:
    cid = c['id']
    t = AFRICA_TRANSLATIONS.get(cid, {})
    lang_en = translate_lang(c.get('language', ''))
    curr_en = translate_curr(c.get('currency', ''))
    sym_en = t.get('sym', f"Official sovereign flag of {c['nameEn']} with regulation proportions and official state colors.")
    fun_en = t.get('fun', f"Key sovereign nation in Africa, noted for rich cultural traditions and historic landmarks.")
    
    lines_af.append(f"  {cid}: {{")
    lines_af.append(f"    languageEn: '{esc(lang_en)}',")
    lines_af.append(f"    currencyEn: '{esc(curr_en)}',")
    lines_af.append(f"    flagSymbolismEn: '{esc(sym_en)}',")
    lines_af.append(f"    funFactEn: '{esc(fun_en)}'")
    lines_af.append(f"  }},")

lines_af.append("};")
lines_af.append("")

with open('/app/applet/src/data/translations/africaTranslationsEn.ts', 'w', encoding='utf-8') as f_af:
    f_af.write("\n".join(lines_af))
print(f"Wrote {len(af_countries)} Africa translations.")
