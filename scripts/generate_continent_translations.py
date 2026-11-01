import json
import os
import re

with open('/tmp/all_countries.json', 'r', encoding='utf-8') as f:
    countries = json.load(f)

# Helper translation mappings
from test_trans import LANG_MAP, CURR_MAP, translate_lang, translate_curr

def escape_ts(s):
    if not s:
        return ""
    return s.replace('\\', '\\\\').replace("'", "\\'")

# High quality domain translations for symbolism patterns and fun facts
SYM_PHRASES = [
    (r'Tricolor revolucionario', 'Revolutionary tricolor'),
    (r'Tricolor horizontal', 'Horizontal tricolor'),
    (r'Tricolor vertical', 'Vertical tricolor'),
    (r'Tricolor paneslavo', 'Pan-Slavic tricolor'),
    (r'Colores panafricanos', 'Pan-African colors'),
    (r'Colores panárabes', 'Pan-Arab colors'),
    (r'Cruz Nórdica', 'Nordic cross'),
    (r'Cruz nórdica', 'Nordic cross'),
    (r'franjas horizontales', 'horizontal stripes'),
    (r'franjas verticales', 'vertical stripes'),
    (r'franja amarilla', 'yellow stripe'),
    (r'franja azul', 'blue stripe'),
    (r'franja roja', 'red stripe'),
    (r'franja verde', 'green stripe'),
    (r'franja blanca', 'white stripe'),
    (r'franja negra', 'black stripe'),
    (r'estrella de cinco puntas', 'five-pointed star'),
    (r'estrellas blancas', 'white stars'),
    (r'estrella solitaria', 'lone star'),
    (r'Sol de Mayo', 'Sun of May'),
    (r'creciente lunar y estrella', 'crescent moon and star'),
    (r'creciente y estrella', 'crescent and star'),
    (r'escudo nacional', 'national coat of arms'),
    (r'escudo de armas', 'coat of arms'),
    (r'pabellón nacional', 'national flag'),
    (r'símbolo de soberanía', 'symbol of sovereignty'),
    (r'esperanza', 'hope'),
    (r'pureza', 'purity'),
    (r'sangre de los libertadores', 'blood of the liberators'),
    (r'sangre de los héroes', 'blood of the heroes'),
    (r'paz y libertad', 'peace and freedom'),
    (r'riqueza mineral', 'mineral wealth'),
    (r'océano', 'ocean'),
    (r'cielo', 'sky'),
    (r'verde de la agricultura', 'green of agriculture'),
    (r'amarillo del oro', 'gold of natural wealth'),
    (r'sobre fondo', 'on a field of'),
    (r'sobre campo', 'upon a field of'),
    (r'en el centro', 'in the center'),
    (r'en el cantón', 'in the canton'),
    (r'con rostro humano', 'with a human face'),
    (r'incaico', 'Incan'),
    (r'azteca', 'Aztec'),
    (r'masónico', 'Masonic'),
    (r'cóndor andino', 'Andean condor'),
    (r'biodiversidad', 'biodiversity'),
    (r'flora y fauna', 'flora and fauna')
]

# We will read each continent and output dedicated ts file
def write_continent_file(continent_name, output_path, var_name):
    cont_countries = [c for c in countries if c['continent'] == continent_name]
    lines = [
        "import { CountryTranslationEn } from './types';",
        "",
        f"export const {var_name}: Record<string, CountryTranslationEn> = {{"
    ]
    
    for c in cont_countries:
        cid = c['id']
        lang_en = translate_lang(c.get('language', ''))
        curr_en = translate_curr(c.get('currency', ''))
        
        sym_es = c.get('flagSymbolismEs', '')
        fun_es = c.get('funFactEs', '')
        
        lines.append(f"  {cid}: {{")
        lines.append(f"    languageEn: '{escape_ts(lang_en)}',")
        lines.append(f"    currencyEn: '{escape_ts(curr_en)}',")
        lines.append(f"    flagSymbolismEsRaw: '{escape_ts(sym_es)}',")
        lines.append(f"    funFactEsRaw: '{escape_ts(fun_es)}'")
        lines.append(f"  }},")
        
    lines.append("};")
    lines.append("")
    with open(output_path, 'w', encoding='utf-8') as out:
        out.write("\n".join(lines))
    print(f"Wrote {len(cont_countries)} to {output_path}")

print("Helper ready.")
