import json
from test_trans import translate_lang, translate_curr

with open('/tmp/all_countries.json', 'r', encoding='utf-8') as f:
    countries = json.load(f)

def esc(s):
    if not s:
        return ""
    return s.replace('\\', '\\\\').replace("'", "\\'")

ASIA_TRANSLATIONS = {
    'jp': {
        'sym': 'The "Hinomaru" featuring the crimson sun disc on a pure white field, embodying the Land of the Rising Sun.',
        'fun': 'Features the world\'s oldest continuous hereditary monarchy and over 6,800 islands along the Pacific Rim.'
    },
    'cn': {
        'sym': 'Red revolutionary field with five golden stars: the large party star flanked by the four social classes in national unity.',
        'fun': 'The Great Wall of China is the longest man-made defensive structure in history, stretching over 21,000 kilometers.'
    },
    'in': {
        'sym': 'Tiranga tricolor: saffron for courage, white for peace, and green for fertility, centered by the navy blue 24-spoke Ashoka Chakra.',
        'fun': 'The world\'s most populous democracy and birthplace of four major world religions: Hinduism, Buddhism, Jainism, and Sikhism.'
    },
    'kr': {
        'sym': 'The "Taegeukgi" bearing the red and blue yin-yang circle of cosmic equilibrium surrounded by four black trigrams.',
        'fun': 'A global technology and cultural powerhouse with the highest high-speed broadband penetration in the world.'
    },
    'th': {
        'sym': 'The "Trairanga": five horizontal stripes of red for nation, white for Buddhist religion, and central blue for the sovereign monarchy.',
        'fun': 'The only country in Southeast Asia that successfully avoided colonization by European imperial powers.'
    },
    'sg': {
        'sym': 'Red for universal brotherhood and equality, white for purity, with a crescent moon and five stars of democracy, peace, progress, justice, and equality.',
        'fun': 'A global financial hub and island city-state featuring the world\'s tallest indoor waterfall at Jewel Changi Airport.'
    },
    'vn': {
        'sym': 'A central five-pointed golden star on a red revolutionary field, uniting workers, peasants, soldiers, intellectuals, and youth.',
        'fun': 'Ha Long Bay features thousands of towering limestone karsts and isles rising majestically out of emerald waters.'
    },
    'id': {
        'sym': 'The "Sang Saka Merah Putih": historic red and white horizontal bicolor dating back to the 13th-century Majapahit Empire.',
        'fun': 'The largest archipelagic state in the world, comprising over 17,500 islands and the habitat of the Komodo dragon.'
    },
    'sa': {
        'sym': 'Green field of Islam bearing the white Arabic Shahada inscription and a horizontal sword of justice and strength.',
        'fun': 'Home to the holy cities of Mecca and Medina, and holds the world\'s second-largest proven petroleum reserves.'
    },
    'il': {
        'sym': 'White field framed by two blue stripes evoking the Jewish tallit prayer shawl, centered by the Star of David (Magen David).',
        'fun': 'The Dead Sea is the lowest elevation on land on Earth at 430 meters below sea level, with hyper-saline buoyant waters.'
    },
    'ae': {
        'sym': 'Pan-Arab colors: green for fertility, white for neutrality, black for petroleum wealth, and a red hoist bar for national unity.',
        'fun': 'Home to the Burj Khalifa in Dubai, the world\'s tallest architectural structure soaring to 828 meters.'
    },
    'ph': {
        'sym': 'Royal blue and scarlet red horizontal bands with a white hoist triangle bearing an eight-rayed golden sun and three stars.',
        'fun': 'Composed of over 7,640 tropical islands and recognized as the world\'s leading biodiversity hotspot for marine life.'
    },
    'my': {
        'sym': 'The "Jalur Gemilang" (Stripes of Glory) with 14 alternating red and white stripes, a blue canton, a crescent, and a 14-pointed star.',
        'fun': 'Home to the Petronas Twin Towers in Kuala Lumpur, the tallest twin skyscrapers in the world.'
    },
    'ir': {
        'sym': 'Green, white, and red horizontal tricolor bearing the stylized national emblem and 22 Takbir inscriptions in Kufic script.',
        'fun': 'Heir to the ancient Persian Empire, home to 27 UNESCO World Heritage sites including Persepolis.'
    },
    'pk': {
        'sym': 'Dark green field representing the Muslim majority with a white vertical hoist bar for religious minorities and crescent star.',
        'fun': 'Contains K2 (Mount Godwin-Austen), the second highest mountain peak on Earth at 8,611 meters.'
    },
    'iq': {
        'sym': 'Red, white, and black pan-Arab tricolor charged with the green Kufic script inscription "Allahu Akbar" (God is the Greatest).',
        'fun': 'Mesopotamia between the Tigris and Euphrates rivers is celebrated as the "Cradle of Civilization" where writing was invented.'
    },
    'qa': {
        'sym': 'Maroon field separated from a white hoist by a nine-pointed serrated line representing the nine Emirates of the Persian Gulf.',
        'fun': 'Has the world\'s highest GDP per capita by purchasing power and hosted the 2022 FIFA World Cup.'
    },
    'lb': {
        'sym': 'Red stripes for blood shed for liberation framing a white snow stripe centered by the green Lebanon Cedar tree of eternity.',
        'fun': 'Byblos is one of the oldest continuously inhabited cities in the world, where the Phoenician alphabet was popularized.'
    },
    'mv': {
        'sym': 'Green rectangle of prosperity and peace on a red border of sacrifice, centered by a white crescent moon of Islam.',
        'fun': 'The lowest-lying nation on planet Earth, with an average natural ground level of just 1.5 meters above sea level.'
    },
    'lk': {
        'sym': 'The "Lion Flag": a golden lion holding a sword representing the Sinhalese majority, flanked by green and orange stripes.',
        'fun': 'Famous worldwide as the producer of Ceylon tea and home to the ancient rock fortress citadel of Sigiriya.'
    },
    'bh': {
        'sym': 'Red field separated from a white hoist by five serrated triangles representing the Five Pillars of Islam.',
        'fun': 'Known in ancient times as Dilmun and celebrated for its natural pearls harvested in the Persian Gulf.'
    },
    'kp': {
        'sym': 'Central red panel framed by white fimbriations and blue stripes, bearing a red five-pointed star in a white circle.',
        'fun': 'Features the Rungrado 1st of May Stadium in Pyongyang, the largest stadium by seating capacity in the world.'
    },
    'tw': {
        'sym': 'Red field with a navy blue canton charged with the White Sun with twelve rays representing the twelve months and traditional hours.',
        'fun': 'Produces more than 60% of the world\'s advanced semiconductor computer microchips, primarily through TSMC.'
    },
    'af': {
        'sym': 'Traditional tricolor of black, red, and green charged with the national emblem showing a mosque, pulpit, and wheat wreath.',
        'fun': 'Lapis lazuli gemstones have been continuously mined in the Badakhshan province of Afghanistan for over 6,000 years.'
    },
    'am': {
        'sym': 'Horizontal tricolor of red for blood shed for survival, blue for peace under Armenian skies, and orange for creative talent.',
        'fun': 'The first nation in the world to officially adopt Christianity as its state religion in 301 AD.'
    },
    'az': {
        'sym': 'Horizontal tricolor of blue for Turkic heritage, red for modern democracy, and green for Islamic culture with crescent and star.',
        'fun': 'Known as the "Land of Fire" due to Yanar Dag, a natural subterranean natural gas fire blazing continuously on a hillside.'
    },
    'bd': {
        'sym': 'Deep green field representing lush vegetation, offset with a red circle symbolizing the rising sun of independence.',
        'fun': 'The Sundarbans mangrove forest in the Bay of Bengal delta is the largest mangrove ecosystem on Earth and home to Bengal tigers.'
    },
    'mm': {
        'sym': 'Horizontal tricolor of yellow for solidarity, green for peace and lush nature, and red for courage, centered by a large white star.',
        'fun': 'The Shwedagon Pagoda in Yangon is coated with over 60 tons of pure gold leaf and encrusted with thousands of diamonds.'
    },
    'bn': {
        'sym': 'Yellow field for the Sultan, crossed by diagonal black and white stripes, centered by the red Royal Crest of Brunei.',
        'fun': 'The Sultan of Brunei resides in Istana Nurul Iman, the largest residential royal palace in the world with 1,788 rooms.'
    },
    'bt': {
        'sym': 'Diagonally divided yellow (monarchy) and orange (Buddhist tradition), centered by Druk the Thunder Dragon grasping jewels.',
        'fun': 'The only country in the world that measures national success by Gross National Happiness (GNH) and is carbon-negative.'
    },
    'kh': {
        'sym': 'Blue and red horizontal triband centered by the white three-towered silhouette of the ancient Angkor Wat temple.',
        'fun': 'Angkor Wat is the largest religious temple complex in the world by land area, spanning over 162 hectares.'
    },
    'ge': {
        'sym': 'The "Five Cross Flag": a red St. George cross on white accompanied by four smaller red Bolnisi-type crosslets.',
        'fun': 'Recognized by archaeologists as the cradle of wine, with continuous winemaking traditions dating back over 8,000 years.'
    },
    'jo': {
        'sym': 'Pan-Arab black, white, and green horizontal tricolor with a red chevron bearing a seven-pointed white star for the first surah.',
        'fun': 'Petra, the ancient Nabataean rock-cut caravan city carved directly into red sandstone cliffs, is a Wonder of the World.'
    },
    'kz': {
        'sym': 'Sky-blue field of endless skies, featuring a golden steppe eagle soaring beneath a 32-rayed sun with national ornamental border.',
        'fun': 'The world\'s largest landlocked country by geographic area, larger than all of Western Europe combined.'
    },
    'kg': {
        'sym': 'Red field bearing a 40-rayed golden sun centered by the tunduk (central circular roof opening of a traditional nomad yurt).',
        'fun': 'Home to the celestial peaks of the Tian Shan mountain range and the epic of Manas, one of the longest epic poems in world literature.'
    },
    'kw': {
        'sym': 'Pan-Arab horizontal tricolor of green, white, and red with a black trapezoid along the hoist.',
        'fun': 'The Kuwaiti Dinar (KWD) is the highest-valued sovereign currency unit in the world by nominal exchange rate.'
    },
    'la': {
        'sym': 'Red stripes for liberation struggles, central royal blue band, and a full white moon disc symbolizing unity over the Mekong.',
        'fun': 'Known as the "Land of a Million Elephants", it is the only completely landlocked nation in Southeast Asia.'
    },
    'mn': {
        'sym': 'Red-blue-red vertical triband bearing the golden Soyombo national ideogram embodying fire, sun, moon, earth, and water.',
        'fun': 'The least densely populated sovereign nation on Earth, with more horses than human inhabitants.'
    },
    'np': {
        'sym': 'Unique non-quadrilateral flag with two stacked triangular pennons, crimson red with blue borders, depicting sun and crescent moon.',
        'fun': 'Mount Everest (Sagarmatha), the highest mountain peak on Earth at 8,848.86 meters, stands on Nepal\'s northern border.'
    },
    'om': {
        'sym': 'White for peace, red for historical struggles, and green for fertility, bearing the national emblem of crossed khanjar daggers.',
        'fun': 'The oldest continuously independent sovereign Arab state in the world, famed for its ancient frankincense trading ports.'
    },
    'ps': {
        'sym': 'Pan-Arab black, white, and green horizontal tricolor with a red triangle based on the hoist.',
        'fun': 'Home to ancient cities of global historical and religious heritage, including Jericho, one of the oldest inhabited cities on Earth.'
    },
    'sy': {
        'sym': 'Red, white, and black tricolor bearing two green stars symbolizing the historic union of Syria and Egypt.',
        'fun': 'Damascus is widely considered one of the oldest continuously inhabited capital cities on the globe.'
    },
    'tj': {
        'sym': 'Red, white, and green horizontal stripes centered by a golden crown surrounded by seven stars of happiness.',
        'fun': 'More than 90% of Tajikistan\'s national territory is occupied by towering peaks of the Pamir and Alay mountain ranges.'
    },
    'tl': {
        'sym': 'Red field with yellow and black overlapping hoist triangles, charged with a white star of guidance and peace.',
        'fun': 'One of only two predominantly Catholic nations in Asia, alongside the Philippines.'
    },
    'tm': {
        'sym': 'Green field with a vertical carpet stripe displaying five traditional guls, accompanied by a white crescent moon and five stars.',
        'fun': 'The Darvaza Gas Crater, popularly known as the "Door to Hell", has been burning continuously in the Karakum Desert since 1971.'
    },
    'uz': {
        'sym': 'Blue for Turkic heritage, white for peace, and green for fertility, separated by red stripes, with a crescent moon and 12 stars.',
        'fun': 'The historic Silk Road oasis cities of Samarkand, Bukhara, and Khiva feature spectacular turquoise-tiled Islamic architecture.'
    },
    'ye': {
        'sym': 'Red, white, and black pan-Arab horizontal tricolor symbolizing the revolution, pure intent, and dark past.',
        'fun': 'The historic walled city of Shibam is celebrated as the "Manhattan of the Desert" for its ancient high-rise mudbrick towers.'
    },
    'hk': {
        'sym': 'Red field charged with a stylized white five-petaled Hong Kong orchid flower (Bauhinia blakeana).',
        'fun': 'Possesses more skyscrapers (buildings over 150 meters) than any other metropolitan city in the world.'
    },
    'mo': {
        'sym': 'Emerald green field featuring a white lotus flower blooming above the Governor Nobre de Carvalho Bridge and sea waters.',
        'fun': 'The historic center of Macau preserves a fascinating blend of Portuguese and Chinese architectural landmarks.'
    },
    'io': {
        'sym': 'Blue and white wavy lines symbolizing the Indian Ocean, with the British Union Jack in the canton and a tropical palm tree.',
        'fun': 'Comprises the Chagos Archipelago, an isolated group of coral atolls in the central Indian Ocean.'
    },
    'cc': {
        'sym': 'Green field with a palm tree on a gold disc in the canton, a golden crescent, and the Southern Cross constellation.',
        'fun': 'An Australian external territory composed of 27 coral islands encircling two tranquil tropical lagoons.'
    },
    'cx': {
        'sym': 'Diagonally divided green (land) and blue (sea), featuring the Southern Cross and a golden bosun bird (white-tailed tropicbird).',
        'fun': 'Famous worldwide for the annual red crab migration, where millions of land crabs march across the island to breed in the sea.'
    }
}

lines_as = [
    "import { CountryTranslationEn } from './types';",
    "",
    "export const ASIA_TRANSLATIONS_EN: Record<string, CountryTranslationEn> = {"
]

as_countries = [c for c in countries if c['continent'] == 'Asia']
for c in as_countries:
    cid = c['id']
    t = ASIA_TRANSLATIONS.get(cid, {})
    lang_en = translate_lang(c.get('language', ''))
    curr_en = translate_curr(c.get('currency', ''))
    sym_en = t.get('sym', f"Official sovereign flag of {c['nameEn']} with regulation proportions and official state colors.")
    fun_en = t.get('fun', f"Key sovereign nation in Asia, noted for rich cultural traditions and historic landmarks.")
    
    lines_as.append(f"  {cid}: {{")
    lines_as.append(f"    languageEn: '{esc(lang_en)}',")
    lines_as.append(f"    currencyEn: '{esc(curr_en)}',")
    lines_as.append(f"    flagSymbolismEn: '{esc(sym_en)}',")
    lines_as.append(f"    funFactEn: '{esc(fun_en)}'")
    lines_as.append(f"  }},")

lines_as.append("};")
lines_as.append("")

with open('/app/applet/src/data/translations/asiaTranslationsEn.ts', 'w', encoding='utf-8') as f_as:
    f_as.write("\n".join(lines_as))
print(f"Wrote {len(as_countries)} Asia translations.")
