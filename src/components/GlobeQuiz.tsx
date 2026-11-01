import React, { useState, useEffect, useCallback } from 'react';
import { Country, QuizState } from '../types';
import { countryService } from '../services/countryService';
import confetti from 'canvas-confetti';
import { Trophy, Flame, Timer, CheckCircle, XCircle, RotateCcw, Award, ArrowRight, Compass, MapPin, Sparkles } from 'lucide-react';

interface GlobeQuizProps {
  countries: Country[];
  onFocusCountryOnGlobe: (country: Country) => void;
}

export const GlobeQuiz: React.FC<GlobeQuizProps> = ({
  countries,
  onFocusCountryOnGlobe
}) => {
  const [gameMode, setGameMode] = useState<'flag-to-country' | 'location-to-flag'>('flag-to-country');
  const [currentCountry, setCurrentCountry] = useState<Country | null>(null);
  const [options, setOptions] = useState<Country[]>([]);
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestionIndex: 0,
    score: 0,
    streak: 0,
    totalQuestions: 10,
    isCompleted: false,
    selectedAnswer: null,
    isCorrect: null,
    timeLeft: 15
  });

  // Generate a new random question with 4 unique options
  const nextQuestion = useCallback(() => {
    if (countries.length < 4) return;

    const randomIndex = Math.floor(Math.random() * countries.length);
    const target = countries[randomIndex];
    setCurrentCountry(target);

    // Pick 3 distinct wrong choices
    const wrongChoices: Country[] = [];
    while (wrongChoices.length < 3) {
      const wrong = countries[Math.floor(Math.random() * countries.length)];
      if (wrong.id !== target.id && !wrongChoices.some((c) => c.id === wrong.id)) {
        wrongChoices.push(wrong);
      }
    }

    // Shuffle 4 options
    const allOptions = [...wrongChoices, target].sort(() => Math.random() - 0.5);
    setOptions(allOptions);

    setQuizState((prev) => ({
      ...prev,
      selectedAnswer: null,
      isCorrect: null,
      timeLeft: 15
    }));
  }, [countries]);

  // Timer countdown hook
  useEffect(() => {
    if (quizState.isCompleted || quizState.selectedAnswer !== null) return;

    const timer = setInterval(() => {
      setQuizState((prev) => {
        if (prev.timeLeft <= 1) {
          // Time out
          return {
            ...prev,
            selectedAnswer: 'TIMEOUT',
            isCorrect: false,
            streak: 0
          };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizState.isCompleted, quizState.selectedAnswer]);

  // Start new quiz session
  const startNewQuiz = () => {
    setQuizState({
      currentQuestionIndex: 0,
      score: 0,
      streak: 0,
      totalQuestions: 10,
      isCompleted: false,
      selectedAnswer: null,
      isCorrect: null,
      timeLeft: 15
    });
    nextQuestion();
  };

  useEffect(() => {
    startNewQuiz();
  }, []);

  const handleSelectOption = (selected: Country) => {
    if (quizState.selectedAnswer !== null || !currentCountry) return;

    const isRight = selected.id === currentCountry.id;

    if (isRight) {
      const newStreak = quizState.streak + 1;
      if (newStreak % 3 === 0) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      }

      setQuizState((prev) => ({
        ...prev,
        score: prev.score + Math.max(10, prev.timeLeft * 2),
        streak: newStreak,
        selectedAnswer: selected.id,
        isCorrect: true
      }));
    } else {
      setQuizState((prev) => ({
        ...prev,
        streak: 0,
        selectedAnswer: selected.id,
        isCorrect: false
      }));
    }
  };

  const handleAdvance = () => {
    if (quizState.currentQuestionIndex + 1 >= quizState.totalQuestions) {
      setQuizState((prev) => ({ ...prev, isCompleted: true }));
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
    } else {
      setQuizState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      }));
      nextQuestion();
    }
  };

  if (!currentCountry) return null;

  return (
    <div className="w-full space-y-6">
      {/* Quiz Top Scoreboard */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Puntaje</p>
              <p className="text-xl font-bold text-white">{quizState.score}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Racha</p>
              <p className="text-xl font-bold text-orange-400">{quizState.streak} 🔥</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-sky-400" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Tiempo</p>
              <p className={`text-xl font-bold ${quizState.timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-sky-400'}`}>
                {quizState.timeLeft}s
              </p>
            </div>
          </div>
        </div>

        {/* Game Mode Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => {
              setGameMode('flag-to-country');
              startNewQuiz();
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              gameMode === 'flag-to-country' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Bandera ➔ País
          </button>
          <button
            onClick={() => {
              setGameMode('location-to-flag');
              startNewQuiz();
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              gameMode === 'location-to-flag' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Mapa 3D ➔ Bandera
          </button>
        </div>
      </div>

      {/* Quiz Question Card */}
      {!quizState.isCompleted ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          {/* Question Display Side */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center space-y-6">
            <span className="text-xs font-semibold text-sky-400 bg-sky-950/80 px-3 py-1 rounded-full border border-sky-500/20">
              Pregunta {quizState.currentQuestionIndex + 1} de {quizState.totalQuestions}
            </span>

            {gameMode === 'flag-to-country' ? (
              <div className="space-y-4 w-full flex flex-col items-center">
                <h3 className="text-lg font-bold text-white">¿A qué país pertenece esta bandera SVG?</h3>
                <div className="relative w-64 h-40 bg-slate-950 rounded-2xl border border-slate-800 p-2 shadow-2xl overflow-hidden flex items-center justify-center">
                  <img
                    src={`https://flagcdn.com/${currentCountry.id}.svg`}
                    alt="Bandera SVG incógnita"
                    className="max-h-full max-w-full object-contain rounded shadow-lg"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">
                  Mira la posición resaltada en el Mapa 3D:
                </h3>
                <p className="text-sm text-sky-400 font-medium">
                  {currentCountry.continent} • Capital: {currentCountry.capitalEs}
                </p>
                <p className="text-xs text-slate-400">¿Cuál es la bandera SVG oficial de este país?</p>
              </div>
            )}

            {/* Answer Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {options.map((option) => {
                const isSelected = quizState.selectedAnswer === option.id;
                const isCorrectOption = option.id === currentCountry.id;

                let btnStyle = 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-200';
                if (quizState.selectedAnswer !== null) {
                  if (isCorrectOption) {
                    btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-emerald-500/20 shadow-lg';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-rose-500/20 shadow-lg';
                  }
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelectOption(option)}
                    disabled={quizState.selectedAnswer !== null}
                    className={`p-4 rounded-2xl border font-semibold text-sm transition-all flex items-center justify-between gap-3 text-left ${btnStyle}`}
                  >
                    {gameMode === 'flag-to-country' ? (
                      <span>{option.nameEs}</span>
                    ) : (
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://flagcdn.com/${option.id}.svg`}
                          alt={option.nameEs}
                          className="w-10 h-7 object-cover rounded border border-white/20"
                        />
                        <span>{option.nameEs}</span>
                      </div>
                    )}

                    {quizState.selectedAnswer !== null && isCorrectOption && (
                      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    )}
                    {quizState.selectedAnswer !== null && isSelected && !isCorrectOption && (
                      <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Next Question Control */}
            {quizState.selectedAnswer !== null && (
              <button
                onClick={handleAdvance}
                className="mt-4 w-full py-3.5 bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm rounded-2xl shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 animate-in fade-in"
              >
                <span>Siguiente Pregunta</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Geographic Preview & Clue Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Pistas Geográficas
                </span>
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-lg">
                  {currentCountry?.continent}
                </span>
              </div>

              {currentCountry && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-sky-400" />
                        Coordenadas
                      </span>
                      <span className="font-mono text-slate-200">
                        {countryService.formatCoordinatesDMS(currentCountry.lat, currentCountry.lng)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Capital</span>
                      <span className="font-semibold text-slate-200">{currentCountry.capitalEs}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Población</span>
                      <span className="font-semibold text-slate-200">
                        {(currentCountry.population / 1000000).toFixed(1)} M hab.
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Moneda</span>
                      <span className="font-semibold text-slate-200">{currentCountry.currency}</span>
                    </div>
                  </div>

                  {quizState.selectedAnswer !== null && (
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-sky-500/20 text-xs text-slate-300 leading-relaxed animate-in fade-in">
                      <p className="font-semibold text-sky-300 mb-1">Simbolismo de la Bandera:</p>
                      <p className="line-clamp-4">{currentCountry.flagSymbolismEs}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {currentCountry && (
              <button
                onClick={() => onFocusCountryOnGlobe(currentCountry)}
                className="mt-4 w-full py-3 bg-slate-800 hover:bg-sky-600 text-slate-200 hover:text-white font-semibold text-xs rounded-xl border border-slate-700 hover:border-sky-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                title="Ver este país en el mapa mundi SVG interactivo"
              >
                <MapPin className="w-4 h-4 text-sky-400" />
                <span>Explorar en el Mapa Mundi SVG</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Quiz Completed Screen */
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl text-center space-y-6 max-w-lg mx-auto">
          <div className="w-20 h-20 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/40">
            <Award className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">¡Trivia Completada!</h2>
            <p className="text-slate-400 text-sm mt-1">Excelente exploración de banderas y mapa 3D</p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400">Puntuación Final</p>
              <p className="text-3xl font-extrabold text-sky-400 mt-1">{quizState.score}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Aciertos</p>
              <p className="text-3xl font-extrabold text-emerald-400 mt-1">
                {Math.round((quizState.score / (quizState.totalQuestions * 30)) * 100)}%
              </p>
            </div>
          </div>

          <button
            onClick={startNewQuiz}
            className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-2xl shadow-xl shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Jugar de Nuevo</span>
          </button>
        </div>
      )}
    </div>
  );
};
