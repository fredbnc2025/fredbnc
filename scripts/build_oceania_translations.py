import json
from test_trans import translate_lang, translate_curr

with open('/tmp/all_countries.json', 'r', encoding='utf-8') as f:
    countries = json.load(f)

def esc(s):
    if not s:
        return ""
    return s.replace('\\', '\\\\').replace("'", "\\'")

OCEANIA_TRANSLATIONS = {
    'au': {
        'sym': 'Blue Ensign with the British Union Jack in the canton, the large seven-pointed Commonwealth Star, and the Southern Cross.',
        'fun': 'The Great Barrier Reef is the largest living coral reef ecosystem on Earth, spanning over 2,300 kilometers.'
    },
    'nz': {
        'sym': 'Royal Blue Ensign bearing four red stars with white borders representing the Southern Cross constellation in the South Pacific.',
        'fun': 'First self-governing nation to grant women the right to vote in 1893, and home to breathtaking fjords and geothermal geysers.'
    },
    'fj': {
        'sym': 'Sky-blue field representing the Pacific Ocean, with the Union Jack and the Fijian coat of arms bearing a British lion and dove of peace.',
        'fun': 'Consists of an archipelago of more than 330 islands, of which approximately 110 are permanently inhabited.'
    },
    'pg': {
        'sym': 'Diagonally divided black and red triangles, charged with the Southern Cross constellation and a soaring Raggiana Bird of Paradise.',
        'fun': 'The most linguistically diverse nation in the world, with over 840 distinct living indigenous languages spoken.'
    },
    'sb': {
        'sym': 'Divided diagonally by a yellow stripe representing sunshine, with blue for ocean, green for land, and five stars for island provinces.',
        'fun': 'Guadalcanal was the site of the pivotal, six-month Guadalcanal campaign during World War II in the Pacific Theater.'
    },
    'vu': {
        'sym': 'Red and green horizontal bands with a black hoist triangle, charged with a boar\'s tusk of prosperity and two crossed namele fern fronds.',
        'fun': 'The ancestral tradition of land diving (Naghol) on Pentecost Island is the ancient ritual precursor to modern bungee jumping.'
    },
    'ws': {
        'sym': 'Red field symbolizing courage, with a blue canton bearing the five stars of the Southern Cross constellation.',
        'fun': 'Fa\'a Samoa ("The Samoan Way") is the 3,000-year-old traditional cultural system that governs daily social and communal life.'
    },
    'to': {
        'sym': 'Red field with a white canton bearing a red Greek cross, symbolizing deep Christian faith and royal sovereign protection.',
        'fun': 'The only Pacific island nation that never lost its indigenous sovereignty or fell under formal European colonization.'
    },
    'fm': {
        'sym': 'Pacific blue field bearing four white five-pointed stars arranged in a diamond for the island states: Chuuk, Pohnpei, Kosrae, and Yap.',
        'fun': 'Nan Madol on Pohnpei is an ancient megalithic city constructed entirely on artificial islets linked by tidal canals.'
    },
    'ki': {
        'sym': 'Red upper half with a golden frigatebird soaring over a rising sun, above six alternating white and blue wavy Pacific ocean stripes.',
        'fun': 'The only country in the world situated in all four hemispheres (Northern, Southern, Eastern, and Western).'
    },
    'mh': {
        'sym': 'Blue field with diagonal orange and white rays expanding toward the fly, accompanied by a 24-pointed star of peace and navigation.',
        'fun': 'The Marshallese were master open-ocean navigators who crafted sophisticated stick charts to read swells and wave refractions.'
    },
    'pw': {
        'sym': 'Light blue field representing the Pacific Ocean, centered by a golden-yellow full moon disc symbolizing peace and natural harvest.',
        'fun': 'Jellyfish Lake in the Rock Islands is inhabited by millions of stingless golden jellyfish that follow the sun across the lake.'
    },
    'nr': {
        'sym': 'Blue field representing the Pacific, bisected by a golden horizontal line for the Equator and a 12-pointed star for the twelve tribes.',
        'fun': 'The world\'s smallest independent island nation and republic, covering a land area of just 21 square kilometers.'
    },
    'tv': {
        'sym': 'Light blue field with the British Union Jack in the canton and nine golden stars arranged geographically to represent Tuvalu\'s islands.',
        'fun': 'Generates substantial international sovereign revenue from licensing its iconic national top-level internet domain (.tv).'
    },
    'nc': {
        'sym': 'Flies both the French national tricolor and the Kanak cultural flag with blue, red, and green stripes and a Flèche Faîtière spire.',
        'fun': 'The New Caledonia Barrier Reef is the second largest double barrier reef in the world after the Great Barrier Reef.'
    },
    'pf': {
        'sym': 'Red-white-red horizontal triband bearing the Polynesian coat of arms showing a traditional outrigger sailing canoe and sun.',
        'fun': 'Bora Bora and Tahiti feature iconic overwater bungalows and turquoise lagoons framed by dramatic extinct volcanic spires.'
    },
    'gu': {
        'sym': 'Dark blue field bordered in red, centered by an almond-shaped sling stone emblem depicting Agana Bay and a flying proa outrigger.',
        'fun': 'The southernmost and largest island in the Mariana Islands, where the ancient Chamorro culture created giant stone Latte pillars.'
    },
    'as': {
        'sym': 'Navy blue field with a red-fimbriated white triangle bearing an American bald eagle clutching traditional Samoan symbols of authority.',
        'fun': 'The National Park of American Samoa is the only United States national park located south of the Equator.'
    },
    'mp': {
        'sym': 'Blue field centered by a white star on a grey Latte stone pillar, surrounded by a Carolinian floral mwarmwar decorative wreath.',
        'fun': 'The nearby Mariana Trench contains the Challenger Deep, the deepest known point in the Earth\'s oceans at nearly 11,000 meters.'
    },
    'ck': {
        'sym': 'British Blue Ensign bearing a ring of fifteen white five-pointed stars representing the Cook Islands in the South Pacific.',
        'fun': 'A self-governing island nation in free association with New Zealand, renowned for black pearl aquaculture.'
    },
    'nu': {
        'sym': 'Golden-yellow field representing sunshine, with the British Union Jack charged with five golden stars in the canton.',
        'fun': 'Known as the "Rock of Polynesia", it is the world\'s first entire nation to be designated as an International Dark Sky Sanctuary.'
    },
    'wf': {
        'sym': 'French national tricolor accompanied locally by a red flag with a white Maltese cross in the fly.',
        'fun': 'A French overseas collectivity that preserves three traditional Polynesian hereditary kingdoms (Uvea, Sigave, and Alo).'
    },
    'pn': {
        'sym': 'British Blue Ensign charged with the coat of arms featuring the Bible and anchor from the legendary ship HMS Bounty.',
        'fun': 'Inhabited primarily by descendants of the famous 1789 HMS Bounty mutineers and their Tahitian companions.'
    },
    'tk': {
        'sym': 'Navy blue field depicting a Polynesian canoe (vaka) sailing toward the Southern Cross constellation in gold.',
        'fun': 'The world\'s first territory to generate 100% of its electricity exclusively from renewable solar photovoltaic power.'
    },
    'nf': {
        'sym': 'Green-white-green vertical triband charged with the dark green silhouette of a majestic native Norfolk Island pine.',
        'fun': 'Home to the historic Kingston and Arthur\'s Vale Historic Area, a UNESCO-listed convict settlement site.'
    },
    'aq': {
        'sym': 'True South flag or Graham Bartram design: a solid navy blue field centered by a crisp white outline map of the Antarctic continent.',
        'fun': 'The coldest, driest, and windiest continent on Earth, containing approximately 70% of the world\'s fresh water frozen in its ice sheet.'
    },
    'bv': {
        'sym': 'Flies the official flag of Norway with its blue and white Scandinavian cross on a red field.',
        'fun': 'Recognized as the single most isolated and remote uninhabited island on Earth, surrounded by stormy sub-Antarctic seas.'
    },
    'hm': {
        'sym': 'Flies the Australian national flag with the Union Jack, Commonwealth Star, and the Southern Cross.',
        'fun': 'Home to Mawson Peak on Big Ben volcano, the highest Australian mountain peak outside the Australian Antarctic Territory (2,745 m).'
    }
}

lines_oc = [
    "import { CountryTranslationEn } from './types';",
    "",
    "export const OCEANIA_TRANSLATIONS_EN: Record<string, CountryTranslationEn> = {"
]

oc_countries = [c for c in countries if c['continent'] == 'Oceanía']
for c in oc_countries:
    cid = c['id']
    t = OCEANIA_TRANSLATIONS.get(cid, {})
    lang_en = translate_lang(c.get('language', ''))
    curr_en = translate_curr(c.get('currency', ''))
    sym_en = t.get('sym', f"Official sovereign flag of {c['nameEn']} with regulation proportions and official state colors.")
    fun_en = t.get('fun', f"Key sovereign nation in Oceania, noted for rich cultural traditions and historic landmarks.")
    
    lines_oc.append(f"  {cid}: {{")
    lines_oc.append(f"    languageEn: '{esc(lang_en)}',")
    lines_oc.append(f"    currencyEn: '{esc(curr_en)}',")
    lines_oc.append(f"    flagSymbolismEn: '{esc(sym_en)}',")
    lines_oc.append(f"    funFactEn: '{esc(fun_en)}'")
    lines_oc.append(f"  }},")

lines_oc.append("};")
lines_oc.append("")

with open('/app/applet/src/data/translations/oceaniaTranslationsEn.ts', 'w', encoding='utf-8') as f_oc:
    f_oc.write("\n".join(lines_oc))
print(f"Wrote {len(oc_countries)} Oceania translations.")
