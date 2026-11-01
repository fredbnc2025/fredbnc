import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Shield,
  HelpCircle,
  Palette,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Award,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Principle {
  number: number;
  title: string;
  subtitle: string;
  description: string;
  goodExample: string;
  badExample: string;
  goodCountry: string;
  badCountry: string;
}

const PRINCIPLES: Principle[] = [
  {
    number: 1,
    title: 'Mantener la Simplicidad Extrema',
    subtitle: 'La bandera debe ser tan sencilla que un niño pueda dibujarla de memoria.',
    description:
      'Una bandera se observa ondeando al viento a decenas de metros de distancia. Los detalles intrincados, degradados o líneas milimétricas se pierden por completo en la distancia.',
    goodExample: 'Japón 🇯🇵, Suiza 🇨🇭, Ucrania 🇺🇦',
    badExample: 'Banderas de sellos de estados con complejos paisajes microscópicos',
    goodCountry: 'jp',
    badCountry: ''
  },
  {
    number: 2,
    title: 'Usar Simbolismo Significativo',
    subtitle: 'Los colores, patrones o emblemas deben relacionarse directamente con lo que representan.',
    description:
      'Cada elemento debe tener una razón de ser: el amarillo del oro o el sol, el azul de los océanos, el verde de los bosques o la esperanza, y el blanco de la paz.',
    goodExample: 'Canadá 🇨🇦 (Hoja de Arce), Argentina 🇦🇷 (Sol de Mayo)',
    badExample: 'Uso de símbolos genéricos sin arraigo cultural',
    goodCountry: 'ca',
    badCountry: ''
  },
  {
    number: 3,
    title: 'Usar de 2 a 3 Colores Básicos',
    subtitle: 'Limitarse a la paleta estándar: rojo, azul, verde, negro, amarillo y blanco.',
    description:
      'Demasiados colores generan confusión óptica. Además, debe respetarse la regla heráldica de la tintura: evitar colocar color sobre color o metal sobre metal (oro/blanco) para garantizar contraste.',
    goodExample: 'Alemania 🇩🇪, Francia 🇫🇷, Suecia 🇸🇪',
    badExample: 'Banderas con más de 6 colores diferentes y tonalidades pastel',
    goodCountry: 'de',
    badCountry: ''
  },
  {
    number: 4,
    title: 'Cero Letras, Sellos o Escudos Ilegibles',
    subtitle: 'Nunca incluyas texto ni sellos complejos.',
    description:
      'Si necesitas escribir el nombre de tu país o estado en la bandera, tu diseño visual ha fracasado. Las letras se leen al revés por el otro lado de la tela.',
    goodExample: 'Reino Unido 🇬🇧, Grecia 🇬🇷',
    badExample: 'Banderas con lemas en letra pequeña o sellos circulares gubernamentales',
    goodCountry: 'gb',
    badCountry: ''
  },
  {
    number: 5,
    title: 'Ser Distintivo o Relacionado con Sentido',
    subtitle: 'Evitar duplicar otras banderas sin motivo, o usar similitudes solo si hay herencia compartida.',
    description:
      'Evita duplicar diseños existentes. Si dos banderas son casi idénticas sin parentesco histórico (como Chad y Rumanía), generan confusión internacional.',
    goodExample: 'Cruces Nórdicas (Islandia 🇮🇸, Noruega 🇳🇴, Finlandia 🇫🇮)',
    badExample: 'Copias accidentales no intencionadas',
    goodCountry: 'no',
    badCountry: ''
  }
];

const HISTORICAL_CURIOSITIES = [
  {
    title: 'La Única Bandera No Rectangular: Nepal 🇳🇵',
    category: 'Geometría Única',
    description:
      'La bandera de Nepal está formada por dos triángulos superpuestos que representan las cumbres del Himalaya y las dos religiones principales del país: el hinduismo y el budismo. Su cálculo trigonométrico está estipulado al detalle en la Constitución nepalí.',
    flagId: 'np'
  },
  {
    title: 'Las Banderas Cuadradas: Suiza 🇨🇭 y Ciudad del Vaticano 🇻🇦',
    category: 'Proporción 1:1',
    description:
      'Solo existen dos estados soberanos en el mundo con bandera oficial cuadrada (ratio 1:1). La bandera civil marítima de Suiza sí es rectangular (2:3), pero su bandera nacional en tierra es un cuadrado perfecto.',
    flagId: 'ch'
  },
  {
    title: 'La Bandera Más Antigua en Uso Continuo: Dinamarca 🇩🇰',
    category: 'Récord Histórico',
    description:
      'Conocida como la "Dannebrog" (el paño danés), data documentadamente del año 1219 tras la Batalla de Lyndanisse. Cuenta con el Récord Guinness como la bandera estatal más antigua aún en uso ininterrumpido.',
    flagId: 'dk'
  },
  {
    title: 'La Única con un Fusil Moderno (AK-47): Mozambique 🇲🇿',
    category: 'Heráldica Bélica',
    description:
      'La bandera de Mozambique incluye una azada (agricultura), un libro (educación) y un fusil Kalashnikov AK-47 con bayoneta, simbolizando la lucha armada y la defensa de la soberanía nacional.',
    flagId: 'mz'
  },
  {
    title: 'Anverso y Reverso Diferentes: Paraguay 🇵🇾',
    category: 'Doble Faz',
    description:
      'Paraguay es el único país soberano de América cuya bandera tiene dos caras distintas: en el anverso lleva el Escudo Nacional de la República, y en el reverso porta el Sello de la Hacienda con el lema "Paz y Justicia" y un león custodiando el gorro frigio.',
    flagId: 'py'
  }
];

const COLOR_FAMILIES = [
  {
    title: 'Colores Panafricanos',
    colors: ['#16A34A', '#FACC15', '#DC2626', '#0F172A'],
    origin: 'Inspirados en la bandera imperial de Etiopía y el movimiento de Marcus Garvey.',
    examples: 'Ghana, Senegal, Camerún, Mali, Guinea, República del Congo'
  },
  {
    title: 'Colores Panárabes',
    colors: ['#000000', '#FFFFFF', '#16A34A', '#DC2626'],
    origin: 'Representan las cuatro grandes dinastías islámicas: Abasí (negro), Omeya (blanco), Fatimí (verde) y Hachemí (rojo).',
    examples: 'Egipto, Jordania, Irak, Siria, Emiratos Árabes Unidos, Palestina'
  },
  {
    title: 'Colores Paneslavos',
    colors: ['#FFFFFF', '#2563EB', '#DC2626'],
    origin: 'Adoptados en el Congreso Eslavo de Praga de 1848, inspirados en el tricolor de Rusia.',
    examples: 'Rusia, Serbia, Eslovaquia, Eslovenia, Croacia, República Checa'
  },
  {
    title: 'Colores Mirandinos (Gran Colombia)',
    colors: ['#FACC15', '#2563EB', '#DC2626'],
    origin: 'Creados por Francisco de Miranda en 1806 para la liberación de Sudamérica.',
    examples: 'Colombia, Ecuador, Venezuela'
  }
];

export const VexillologyGuide: React.FC = () => {
  const [expandedPrinciple, setExpandedPrinciple] = useState<number | null>(1);

  return (
    <div className="w-full space-y-10">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-sky-950/50 via-slate-900 to-indigo-950/40 border border-slate-800 p-8 rounded-3xl shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Enciclopedia y Guía de Vexilología</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          El Arte, Ciencia e Historia del Diseño de Banderas
        </h2>
        <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
          La <strong>vexilología</strong> (del latín <em>vexillum</em>, "bandera", y el griego <em>logos</em>, "estudio") es la disciplina que estudia el significado, la historia, el simbolismo y las reglas de diseño de las banderas del mundo.
        </p>
      </div>

      {/* 5 Principles of Good Flag Design */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-sky-400" />
              Los 5 Principios de "Good Flag, BAD Flag" (NAVA)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Estándar internacional de diseño formulado por el eminente vexilólogo Ted Kaye.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {PRINCIPLES.map((p) => {
            const isExpanded = expandedPrinciple === p.number;

            return (
              <div
                key={p.number}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all shadow-md"
              >
                <button
                  onClick={() => setExpandedPrinciple(isExpanded ? null : p.number)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {p.number}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">{p.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{p.subtitle}</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 space-y-4 bg-slate-950/40">
                    <p className="text-xs text-slate-300 leading-relaxed">{p.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
                            Ejemplo Ejemplar:
                          </span>
                          <span className="text-xs text-slate-200">{p.goodExample}</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider block">
                            Error Común a Evitar:
                          </span>
                          <span className="text-xs text-slate-200">{p.badExample}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Curiosities Grid */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Curiosidades & Récords Vexilológicos
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Banderas con formas, armas, historias y particularidades que rompen el molde tradicional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {HISTORICAL_CURIOSITIES.map((c, idx) => (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-950/80 px-2.5 py-1 rounded-full border border-sky-500/30">
                    {c.category}
                  </span>
                  <img
                    src={`https://flagcdn.com/${c.flagId}.svg`}
                    alt={c.title}
                    className="w-9 h-6 object-contain rounded border border-white/10 shadow-sm"
                  />
                </div>
                <h4 className="text-sm font-bold text-white leading-snug">{c.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{c.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pan-National Color Families */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-400" />
            Familias Cromáticas Internacionales
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Grupos de banderas que comparten colores por herencia histórica, diplomática o regional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COLOR_FAMILIES.map((fam, idx) => (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">{fam.title}</h4>
                <div className="flex items-center gap-1.5">
                  {fam.colors.map((col, i) => (
                    <span
                      key={i}
                      className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{fam.origin}</p>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">Ejemplos: </span>
                {fam.examples}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
