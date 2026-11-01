import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Country, QuizState, SubscriptionPlanId } from '../types';
import { subscriptionService } from '../services/subscriptionService';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Flame,
  Timer,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  ArrowRight,
  Sparkles,
  Zap,
  BookOpen,
  HelpCircle,
  Layers,
  Globe2,
  Scale,
  Crown,
  Download,
  FileCheck
} from 'lucide-react';

interface FlagQuizProps {
  countries: Country[];
  onOpenDetails: (country: Country) => void;
  onUpgradePro?: (plan?: SubscriptionPlanId) => void;
}

type QuizMode = 'flag-to-country' | 'country-to-flag' | 'capital-to-flag' | 'speedrun-60s';
type DifficultyLevel = 'all' | 'easy' | 'hard';

export const FlagQuiz: React.FC<FlagQuizProps> = ({ countries, onOpenDetails, onUpgradePro }) => {
  const [gameMode, setGameMode] = useState<QuizMode>('flag-to-country');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('all');
  const [currentCountry, setCurrentCountry] = useState<Country | null>(null);
  const [options, setOptions] = useState<Country[]>([]);
  const [isProUser, setIsProUser] = useState<boolean>(subscriptionService.isPro());
  const [certificateGenerated, setCertificateGenerated] = useState<boolean>(false);
  const [answeredHistory, setAnsweredHistory] = useState<
    { country: Country; selectedOption: Country; isCorrect: boolean }[]
  >([]);

  useEffect(() => {
    const unsub = subscriptionService.subscribe((sub) => {
      setIsProUser(sub.isPro);
    });
    return unsub;
  }, []);

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

  const [speedrunTimer, setSpeedrunTimer] = useState<number>(60);
  const speedrunTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Filter countries pool based on difficulty
  const getPool = useCallback(() => {
    if (difficulty === 'easy') {
      return countries.filter((c) => c.population > 10000000);
    }
    if (difficulty === 'hard') {
      return countries.filter((c) => c.isIsland || c.population < 5000000);
    }
    return countries;
  }, [countries, difficulty]);

  // Pick Next Question
  const nextQuestion = useCallback(() => {
    const pool = getPool();
    if (pool.length < 4) return;

    const randomIndex = Math.floor(Math.random() * pool.length);
    const target = pool[randomIndex];
    setCurrentCountry(target);

    // Pick 3 distinct wrong options
    const wrongChoices: Country[] = [];
    while (wrongChoices.length < 3) {
      const wrong = pool[Math.floor(Math.random() * pool.length)];
      if (wrong.id !== target.id && !wrongChoices.some((c) => c.id === wrong.id)) {
        wrongChoices.push(wrong);
      }
    }

    const all = [...wrongChoices, target].sort(() => Math.random() - 0.5);
    setOptions(all);

    setQuizState((prev) => ({
      ...prev,
      selectedAnswer: null,
      isCorrect: null,
      timeLeft: gameMode === 'speedrun-60s' ? 999 : 15
    }));
  }, [getPool, gameMode]);

  // Timer countdown for standard questions
  useEffect(() => {
    if (gameMode === 'speedrun-60s') return;
    if (quizState.isCompleted || quizState.selectedAnswer !== null) return;

    const timer = setInterval(() => {
      setQuizState((prev) => {
        if (prev.timeLeft <= 1) {
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
  }, [quizState.isCompleted, quizState.selectedAnswer, gameMode]);

  // Speedrun global timer
  useEffect(() => {
    if (gameMode !== 'speedrun-60s' || quizState.isCompleted) return;

    speedrunTimerRef.current = setInterval(() => {
      setSpeedrunTimer((prev) => {
        if (prev <= 1) {
          setQuizState((q) => ({ ...q, isCompleted: true }));
          confetti({ particleCount: 120, spread: 80 });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (speedrunTimerRef.current) clearInterval(speedrunTimerRef.current);
    };
  }, [gameMode, quizState.isCompleted]);

  // Start new quiz session
  const startNewQuiz = () => {
    setAnsweredHistory([]);
    setSpeedrunTimer(60);
    setQuizState({
      currentQuestionIndex: 0,
      score: 0,
      streak: 0,
      totalQuestions: gameMode === 'speedrun-60s' ? 50 : 10,
      isCompleted: false,
      selectedAnswer: null,
      isCorrect: null,
      timeLeft: 15
    });
    nextQuestion();
  };

  useEffect(() => {
    startNewQuiz();
  }, [gameMode, difficulty]);

  const handleSelectOption = (selected: Country) => {
    if (quizState.selectedAnswer !== null || !currentCountry) return;

    const isRight = selected.id === currentCountry.id;
    setAnsweredHistory((prev) => [...prev, { country: currentCountry, selectedOption: selected, isCorrect: isRight }]);

    if (isRight) {
      const newStreak = quizState.streak + 1;
      const streakBonus = Math.min(newStreak * 5, 25);
      const timeBonus = gameMode === 'speedrun-60s' ? 10 : quizState.timeLeft * 2;
      const earned = 20 + timeBonus + streakBonus;

      if (newStreak >= 3 && newStreak % 3 === 0) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      }

      setQuizState((prev) => ({
        ...prev,
        score: prev.score + earned,
        streak: newStreak,
        selectedAnswer: selected.id,
        isCorrect: true
      }));

      // In speedrun mode, auto advance instantly on answer!
      if (gameMode === 'speedrun-60s') {
        setTimeout(() => {
          setQuizState((prev) => ({
            ...prev,
            currentQuestionIndex: prev.currentQuestionIndex + 1
          }));
          nextQuestion();
        }, 350);
      }
    } else {
      setQuizState((prev) => ({
        ...prev,
        streak: 0,
        selectedAnswer: selected.id,
        isCorrect: false
      }));

      if (gameMode === 'speedrun-60s') {
        setTimeout(() => {
          setQuizState((prev) => ({
            ...prev,
            currentQuestionIndex: prev.currentQuestionIndex + 1
          }));
          nextQuestion();
        }, 500);
      }
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
      {/* Quiz Top Dashboard */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        {/* Live Score & Multiplier */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Puntos</p>
              <p className="text-2xl font-black text-white">{quizState.score}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Racha</p>
              <p className="text-2xl font-black text-orange-400">{quizState.streak} 🔥</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
              <Timer className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">
                {gameMode === 'speedrun-60s' ? 'Reloj Global' : 'Tiempo Pregunta'}
              </p>
              <p
                className={`text-2xl font-black ${
                  (gameMode === 'speedrun-60s' ? speedrunTimer : quizState.timeLeft) <= 5
                    ? 'text-rose-500 animate-pulse'
                    : 'text-sky-400'
                }`}
              >
                {gameMode === 'speedrun-60s' ? `${speedrunTimer}s` : `${quizState.timeLeft}s`}
              </p>
            </div>
          </div>
        </div>

        {/* Game Mode Tabs & Difficulty Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-semibold">
            {[
              { id: 'flag-to-country', label: 'Bandera ➔ País' },
              { id: 'country-to-flag', label: 'País ➔ Bandera' },
              { id: 'capital-to-flag', label: 'Capital ➔ Bandera' },
              { id: 'speedrun-60s', label: '⚡ Contrarreloj 60s' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setGameMode(m.id as QuizMode)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  gameMode === m.id
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Difficulty Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-medium">
            {(['all', 'easy', 'hard'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setDifficulty(lvl)}
                className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  difficulty === lvl
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl === 'all' ? 'Todos' : lvl === 'easy' ? 'Fácil' : 'Difícil'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Question Card */}
      {!quizState.isCompleted ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Question Interactive Core */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center space-y-6">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-sky-400 bg-sky-950/80 px-3 py-1 rounded-full border border-sky-500/20">
                Pregunta {quizState.currentQuestionIndex + 1} de {quizState.totalQuestions}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Continente: {currentCountry.continent}
              </span>
            </div>

            {/* Mode 1: Flag to Country */}
            {gameMode === 'flag-to-country' && (
              <div className="space-y-4 w-full flex flex-col items-center">
                <h3 className="text-xl font-bold text-white">¿A qué país pertenece esta bandera SVG?</h3>
                <div className="relative w-64 aspect-[3/2] bg-slate-950 rounded-2xl border border-slate-800 p-2 shadow-2xl overflow-hidden flex items-center justify-center">
                  <img
                    src={`https://flagcdn.com/${currentCountry.id}.svg`}
                    alt="Bandera misteriosa"
                    className="w-full h-full object-cover rounded-lg shadow-md"
                  />
                </div>
              </div>
            )}

            {/* Mode 2: Country to Flag */}
            {gameMode === 'country-to-flag' && (
              <div className="space-y-3 w-full flex flex-col items-center">
                <h3 className="text-sm font-semibold text-sky-400 uppercase tracking-wider">Identifica la bandera oficial de:</h3>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 max-w-sm w-full">
                  <p className="text-2xl font-black text-white">{currentCountry.nameEs}</p>
                  <p className="text-xs text-slate-400 mt-1">Capital: {currentCountry.capitalEs}</p>
                </div>
              </div>
            )}

            {/* Mode 3: Capital to Flag */}
            {gameMode === 'capital-to-flag' && (
              <div className="space-y-3 w-full flex flex-col items-center">
                <h3 className="text-sm font-semibold text-sky-400 uppercase tracking-wider">
                  ¿Qué bandera corresponde a la capital?
                </h3>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 max-w-sm w-full">
                  <span className="text-xs text-slate-400">Capital Nacional:</span>
                  <p className="text-2xl font-black text-white mt-0.5">{currentCountry.capitalEs}</p>
                  <span className="text-xs font-mono text-sky-400">Continente: {currentCountry.continent}</span>
                </div>
              </div>
            )}

            {/* Mode 4: Speedrun 60s */}
            {gameMode === 'speedrun-60s' && (
              <div className="space-y-4 w-full flex flex-col items-center">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Zap className="w-4 h-4" />
                  <span>Modo Ráfaga Rápida</span>
                </div>
                <div className="relative w-56 aspect-[3/2] bg-slate-950 rounded-2xl border border-slate-800 p-1.5 shadow-2xl overflow-hidden flex items-center justify-center">
                  <img
                    src={`https://flagcdn.com/${currentCountry.id}.svg`}
                    alt="Bandera Speedrun"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Answer Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full pt-2">
              {options.map((option) => {
                const isSelected = quizState.selectedAnswer === option.id;
                const isCorrectOption = option.id === currentCountry.id;

                let btnStyle = 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-200';
                if (quizState.selectedAnswer !== null) {
                  if (isCorrectOption) {
                    btnStyle = 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-emerald-500/20 shadow-lg';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-950/90 border-rose-500 text-rose-300 shadow-rose-500/20 shadow-lg';
                  }
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelectOption(option)}
                    disabled={quizState.selectedAnswer !== null}
                    className={`p-4 rounded-2xl border font-semibold text-sm transition-all flex items-center justify-between gap-3 text-left cursor-pointer ${btnStyle}`}
                  >
                    {gameMode === 'flag-to-country' || gameMode === 'speedrun-60s' ? (
                      <span className="truncate">{option.nameEs}</span>
                    ) : (
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://flagcdn.com/${option.id}.svg`}
                          alt={option.nameEs}
                          className="w-11 h-7 object-cover rounded border border-white/20 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{option.nameEs}</p>
                          <p className="text-[11px] text-slate-400 truncate">{option.capitalEs}</p>
                        </div>
                      </div>
                    )}

                    {quizState.selectedAnswer !== null && isCorrectOption && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    )}
                    {quizState.selectedAnswer !== null && isSelected && !isCorrectOption && (
                      <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Advance Button (Standard modes) */}
            {quizState.selectedAnswer !== null && gameMode !== 'speedrun-60s' && (
              <button
                onClick={handleAdvance}
                className="mt-4 w-full py-4 bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm rounded-2xl shadow-xl shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer animate-in fade-in"
              >
                <span>
                  {quizState.currentQuestionIndex + 1 >= quizState.totalQuestions
                    ? 'Ver Resultados Finales'
                    : 'Siguiente Pregunta'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right: Flag Vexillology Clues & Educational Side Panel */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Pistas Vexilológicas
                </span>
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                  ISO: {currentCountry.code3}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
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
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Idioma</span>
                  <span className="font-semibold text-slate-200">{currentCountry.language}</span>
                </div>
              </div>

              {quizState.selectedAnswer !== null && (
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-sky-500/20 text-xs text-slate-300 space-y-1.5 animate-in fade-in">
                  <p className="font-bold text-sky-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Simbolismo de la Bandera:
                  </p>
                  <p className="leading-relaxed">{currentCountry.flagSymbolismEs}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => onOpenDetails(currentCountry)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span>Abrir Ficha Vexilológica Completa</span>
            </button>
          </div>
        </div>
      ) : (
        /* Quiz Finished Screen with History & Learning Review */
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6 max-w-2xl mx-auto">
          <div className="text-center space-y-2">
            <div className="w-20 h-20 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/40 shadow-xl shadow-amber-500/20">
              <Award className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white mt-3">¡Sesión de Trivia Finalizada!</h2>
            <p className="text-slate-400 text-xs">
              Has puesto a prueba tu conocimiento de vexilología internacional.
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-400">Puntaje Final</p>
              <p className="text-3xl font-black text-sky-400 mt-1">{quizState.score}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Aciertos</p>
              <p className="text-3xl font-black text-emerald-400 mt-1">
                {answeredHistory.filter((h) => h.isCorrect).length} / {answeredHistory.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Efectividad</p>
              <p className="text-3xl font-black text-indigo-400 mt-1">
                {answeredHistory.length > 0
                  ? Math.round(
                      (answeredHistory.filter((h) => h.isCorrect).length / answeredHistory.length) * 100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>

          {/* History breakdown */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Repaso de Banderas:</h4>
            <div className="space-y-2">
              {answeredHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://flagcdn.com/${item.country.id}.svg`}
                      alt={item.country.nameEs}
                      className="w-8 h-5 object-cover rounded border border-white/10"
                    />
                    <span className="font-semibold text-white">{item.country.nameEs}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.isCorrect ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correcto
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1 font-semibold">
                        <XCircle className="w-3.5 h-3.5" /> Marcaste: {item.selectedOption.nameEs}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Certificate Generator */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Crown className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Certificado Oficial de Vexilología</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-bold">
                    PRO
                  </span>
                </p>
                <p className="text-[11px] text-slate-400">
                  Diploma acreditativo con tu puntuación, nivel y firma digital.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (!isProUser) {
                  if (onUpgradePro) onUpgradePro('annual');
                  return;
                }
                setCertificateGenerated(true);
                setTimeout(() => setCertificateGenerated(false), 4000);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer whitespace-nowrap ${
                isProUser
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950'
                  : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40'
              }`}
            >
              {certificateGenerated ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>¡Certificado Emitido!</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>{isProUser ? 'Descargar Diploma' : 'Desbloquear con Pro'}</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={startNewQuiz}
            className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-2xl shadow-xl shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Jugar Nueva Partida</span>
          </button>
        </div>
      )}
    </div>
  );
};
