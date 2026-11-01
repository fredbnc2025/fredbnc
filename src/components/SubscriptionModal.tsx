import React, { useState, useEffect } from 'react';
import { subscriptionService, SUBSCRIPTION_PLANS } from '../services/subscriptionService';
import { SubscriptionPlanId, UserSubscription } from '../types';
import {
  Crown,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Zap,
  CreditCard,
  Lock,
  ArrowRight,
  Gift,
  HelpCircle,
  CheckCircle2,
  FileCode,
  Download,
  Award
} from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: SubscriptionPlanId;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  initialPlan = 'annual'
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId>(initialPlan);
  const [userSub, setUserSub] = useState<UserSubscription>(subscriptionService.getSubscription());
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState<string>('');

  useEffect(() => {
    const unsub = subscriptionService.subscribe(setUserSub);
    return unsub;
  }, []);

  useEffect(() => {
    if (initialPlan && initialPlan !== 'free') {
      setSelectedPlanId(initialPlan);
    }
  }, [initialPlan]);

  if (!isOpen) return null;

  const handleSelectAndPay = (planId: SubscriptionPlanId) => {
    setIsProcessing(true);

    // Simulate safe instant checkout transaction (or ready for Stripe Checkout redirect)
    setTimeout(() => {
      subscriptionService.activatePlan(planId, emailInput || 'comprador@ejemplo.com');
      setIsProcessing(false);
      const planName = SUBSCRIPTION_PLANS.find((p) => p.id === planId)?.name || 'Plan Pro';
      setSuccessMessage(`¡Felicidades! Tu cuenta ha sido activada con el ${planName}. Disfruta de todos los beneficios Pro.`);
      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    }, 1000);
  };

  const handleCancelSub = () => {
    subscriptionService.cancelPlan();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Glow Accent Header */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-sky-500 to-indigo-500" />

        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Content */}
        <div className="p-6 md:p-8 text-center bg-gradient-to-b from-slate-850 to-slate-900 border-b border-slate-800">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Crown className="w-3.5 h-3.5" />
            <span>MundoBanderas Pro</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Desbloquea el Poder Ilimitado de la Vexilología
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto mt-2">
            Descargas de paquetes vectoriales masivos, exportación en Ultra HD 4K, insignias y certificados oficiales, y herramientas avanzadas de diseño.
          </p>

          {/* Current Status Badge if already Pro */}
          {userSub.isPro && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                Actualmente tienes activo el{' '}
                <strong>
                  {SUBSCRIPTION_PLANS.find((p) => p.id === userSub.planId)?.name || 'Plan Pro'}
                </strong>
                {userSub.expiresAt ? ` (Vence el ${new Date(userSub.expiresAt).toLocaleDateString()})` : ' (Acceso de Por Vida)'}
              </span>
            </div>
          )}

          {successMessage && (
            <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 animate-bounce">
              <Sparkles className="w-4 h-4" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Pricing Cards Grid (3 Options: Monthly, Annual, Lifetime) */}
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const isCurrentActive = userSub.isPro && userSub.planId === plan.id;

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`relative flex flex-col justify-between rounded-3xl p-6 transition-all duration-300 cursor-pointer ${
                    plan.isPopular
                      ? 'bg-slate-850 border-2 border-sky-500 shadow-xl shadow-sky-500/10'
                      : 'bg-slate-950/70 border border-slate-800 hover:border-slate-700'
                  } ${isSelected ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-900' : ''}`}
                >
                  {/* Top Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    {/* Plan Name & Price */}
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-base text-white">{plan.name}</h3>
                      {isSelected && <Zap className="w-4 h-4 text-sky-400" />}
                    </div>

                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white">${plan.price}</span>
                      <span className="text-xs text-slate-400 font-medium">{plan.periodLabel}</span>
                    </div>

                    <p className="text-xs text-slate-400 mt-2 min-h-[32px] leading-relaxed">
                      {plan.billingDescription}
                    </p>

                    {plan.savingsBadge && (
                      <span className="inline-block mt-2 text-[11px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                        {plan.savingsBadge}
                      </span>
                    )}

                    {/* Features List */}
                    <div className="mt-5 space-y-2.5 pt-4 border-t border-slate-800">
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-sky-400 flex-shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Action Button */}
                  <div className="mt-6 pt-2">
                    {isCurrentActive ? (
                      <button
                        disabled
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600/30 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 cursor-default"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Plan Activo</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAndPay(plan.id);
                        }}
                        disabled={isProcessing}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                          plan.isPopular
                            ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/20'
                            : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                        }`}
                      >
                        {isProcessing && selectedPlanId === plan.id ? (
                          <span>Procesando pago...</span>
                        ) : (
                          <>
                            <span>{plan.ctaLabel}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Instant Activation Box for Testing / Direct Simulation */}
          <div className="mt-8 bg-slate-950 border border-slate-800/90 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-white">Garantía de Satisfacción de 14 Días</p>
                <p className="text-slate-400">
                  Pagos cifrados con protocolo SSL de 256 bits mediante Stripe Checkout, Apple Pay y Google Pay.
                </p>
              </div>
            </div>

            {userSub.isPro ? (
              <button
                onClick={handleCancelSub}
                className="text-xs text-rose-400 hover:text-rose-300 underline font-medium cursor-pointer whitespace-nowrap"
              >
                Volver al Plan Gratuito (Cancelar)
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">¿Tienes un código o quieres probar Pro?</span>
                <button
                  onClick={() => handleSelectAndPay('annual')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                >
                  Activar Demo Pro
                </button>
              </div>
            )}
          </div>

          {/* Value Comparison Table: Free vs Pro */}
          <div className="mt-8 border-t border-slate-800 pt-6">
            <h4 className="text-sm font-bold text-white mb-4 text-center">
              Comparativa de Características: Free vs. Pro
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3 font-semibold">Característica</th>
                    <th className="py-2.5 px-3 font-semibold text-center w-28">Plan Gratuito</th>
                    <th className="py-2.5 px-3 font-bold text-center text-sky-400 w-36 bg-sky-950/20 rounded-t-lg">
                      Plan Pro ★
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td className="py-2.5 px-3">Catálogo y Fichas de 250+ Banderas</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400">✓ Incluido</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold bg-sky-950/10">✓ Incluido</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3">Descargas Masivas de Banderas en ZIP</td>
                    <td className="py-2.5 px-3 text-center text-slate-500">Hasta 5 por lote</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold bg-sky-950/10">
                      ✓ Ilimitadas (250+)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3">Taller Creador: Resolución de Exportación</td>
                    <td className="py-2.5 px-3 text-center text-slate-500">1080p estándar</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold bg-sky-950/10">
                      ✓ 4K / 8K Ultra HD
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3">Emblemas Heráldicos Exclusivos (Dragón, León, etc.)</td>
                    <td className="py-2.5 px-3 text-center text-slate-500">Básicos</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold bg-sky-950/10">
                      ✓ Colección Completa
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3">Certificados de Trivia Vexilológica en PDF</td>
                    <td className="py-2.5 px-3 text-center text-slate-500">✕ No</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold bg-sky-950/10">
                      ✓ Con Firma y Puntuación
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3">Licencia para Uso Comercial en Diseño / Edición</td>
                    <td className="py-2.5 px-3 text-center text-slate-500">Personal / Académico</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold bg-sky-950/10">
                      ✓ Licencia Comercial
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-500">
          ¿Preguntas sobre facturación corporativa o planes para instituciones educativas? Contáctanos en{' '}
          <span className="text-slate-300">soporte@mundobanderas.com</span>
        </div>
      </div>
    </div>
  );
};
