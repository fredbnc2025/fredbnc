import { SubscriptionPlan, SubscriptionPlanId, UserSubscription } from '../types';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Plan Pro Mensual',
    price: 4.99,
    periodLabel: '/ mes',
    billingDescription: 'Facturación mensual flexible. Cancela en cualquier momento sin compromiso.',
    savingsBadge: undefined,
    isPopular: false,
    features: [
      'Descargas masivas ilimitadas en ZIP (catálogo completo)',
      'Exportación en Ultra HD 4K y SVG para imprenta textil',
      'Desbloqueo de todos los emblemas heráldicos en el Taller',
      'Modo Contrarreloj y Trivia sin límites diarios',
      'Certificados de Vexilología oficiales en PDF',
      'Experiencia 100% libre de anuncios'
    ],
    ctaLabel: 'Suscribirme por $4.99/mes'
  },
  {
    id: 'annual',
    name: 'Plan Pro Anual',
    badge: 'Más Popular • Ahorra 52%',
    price: 29.0,
    periodLabel: '/ año',
    billingDescription: 'Equivale a solo $2.41 al mes. Pago único anual de $29.',
    savingsBadge: 'Ahorras $30.88 al año',
    isPopular: true,
    features: [
      'Todo lo incluido en el Plan Mensual',
      'Ahorro del 52% respecto al pago mensual',
      'Descargas prioritarias en ZIP de 250+ países',
      'Exportación ilimitada en 8K Vectorial Ultra HD',
      'Acceso anticipado a nuevas banderas y datos vexilológicos',
      'Licencia de uso comercial para proyectos y publicaciones',
      'Soporte prioritario por correo'
    ],
    ctaLabel: 'Elegir Plan Anual ($29/año)'
  },
  {
    id: 'lifetime',
    name: 'Acceso de Por Vida',
    badge: 'Pago Único • Sin Cuotas',
    price: 49.0,
    periodLabel: ' pago único',
    billingDescription: 'Acceso Pro ilimitado para siempre. Sin pagos mensuales ni anuales.',
    savingsBadge: 'Para Siempre',
    isPopular: false,
    features: [
      'Todo lo incluido en el Plan Pro Anual',
      'Un solo pago para siempre: nunca volverás a pagar',
      'Todas las futuras actualizaciones incluidas de por vida',
      'Descargas de bases de datos completas en JSON y CSV',
      'Insignia de Miembro Fundador VIP en tu perfil',
      'Licencia comercial perpetua para diseño y educación'
    ],
    ctaLabel: 'Obtener de Por Vida por $49'
  }
];

const STORAGE_KEY = 'mundobanderas_subscription_v1';

export class SubscriptionService {
  private static instance: SubscriptionService;
  private currentSub: UserSubscription;
  private listeners: Array<(sub: UserSubscription) => void> = [];

  private constructor() {
    this.currentSub = this.loadFromStorage();
  }

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  private loadFromStorage(): UserSubscription {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check expiration if applicable
        if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
          return { planId: 'free', isPro: false };
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Error loading subscription from localStorage:', e);
    }
    return { planId: 'free', isPro: false };
  }

  private saveToStorage(sub: UserSubscription) {
    this.currentSub = sub;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sub));
    } catch (e) {
      console.warn('Error saving subscription to localStorage:', e);
    }
    this.notifyListeners();
  }

  public getSubscription(): UserSubscription {
    return this.currentSub;
  }

  public isPro(): boolean {
    return this.currentSub.isPro;
  }

  public subscribe(listener: (sub: UserSubscription) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentSub);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.currentSub));
  }

  public activatePlan(planId: SubscriptionPlanId, customerEmail?: string) {
    if (planId === 'free') {
      this.saveToStorage({ planId: 'free', isPro: false });
      return;
    }

    const now = Date.now();
    let expiresAt: number | null = null;

    if (planId === 'monthly') {
      expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days
    } else if (planId === 'annual') {
      expiresAt = now + 365 * 24 * 60 * 60 * 1000; // 1 year
    } else if (planId === 'lifetime') {
      expiresAt = null; // Lifetime
    }

    const newSub: UserSubscription = {
      planId,
      isPro: true,
      activatedAt: now,
      expiresAt,
      customerEmail: customerEmail || 'usuario_pro@ejemplo.com'
    };

    this.saveToStorage(newSub);
  }

  public cancelPlan() {
    this.saveToStorage({
      planId: 'free',
      isPro: false
    });
  }
}

export const subscriptionService = SubscriptionService.getInstance();
