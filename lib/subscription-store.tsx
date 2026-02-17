"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

export type SubscriptionTier = "free" | "lite" | "premium";

export type SubscriptionStatus = {
  tier: SubscriptionTier;
  active: boolean;
  trialEnd: string | null;
  customerId: string | null;
  sessionId: string | null;
  activatedAt: string | null;
};

const FREE_MESSAGE_LIMIT = 5;

const STORAGE_KEY = "vault_subscription";

const defaultSubscription = (): SubscriptionStatus => ({
  tier: "free",
  active: false,
  trialEnd: null,
  customerId: null,
  sessionId: null,
  activatedAt: null,
});

/** Desktop Electron app = always premium (user already purchased) */
function isElectron(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as unknown as Record<string, unknown>).electron ||
    typeof navigator !== "undefined" && navigator.userAgent.includes("Electron");
}

/** Check if subscription is genuinely active (not expired) */
function isSubscriptionActive(sub: SubscriptionStatus): boolean {
  // Desktop app: always active — user paid on the website before downloading
  if (isElectron()) return true;
  if (!sub.active) return false;
  if (sub.trialEnd) {
    return new Date(sub.trialEnd).getTime() > Date.now();
  }
  return true;
}

type SubscriptionContextValue = {
  subscription: SubscriptionStatus;
  messageCount: number;
  canSendMessage: boolean;
  isFeatureAvailable: (feature: PremiumFeature) => boolean;
  activateSubscription: (tier: SubscriptionTier, sessionId: string) => void;
  incrementMessageCount: () => void;
  resetMessageCount: () => void;
  clearSubscription: () => void;
};

export type PremiumFeature =
  | "web_search"
  | "cloud_llm"
  | "voice_input"
  | "voice_output"
  | "pdf_export"
  | "pdf_upload"
  | "personas"
  | "file_vault"
  | "reports"
  | "share";

const FEATURE_TIERS: Record<PremiumFeature, SubscriptionTier> = {
  web_search: "premium",
  cloud_llm: "premium",
  voice_input: "premium",
  voice_output: "premium",
  pdf_export: "premium",
  pdf_upload: "premium",
  personas: "premium",
  file_vault: "lite",
  reports: "premium",
  share: "lite",
};

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  lite: 1,
  premium: 2,
};

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionStatus>(defaultSubscription());
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: SubscriptionStatus = JSON.parse(stored);
        // Auto-expire trial subscriptions
        if (parsed.active && parsed.trialEnd && new Date(parsed.trialEnd).getTime() <= Date.now()) {
          parsed.active = false;
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
        setSubscription(parsed);
      }
      const count = window.localStorage.getItem("hammerlock_message_count");
      if (count) setMessageCount(parseInt(count, 10) || 0);
    } catch {
      // ignore
    }
  }, []);

  const persist = useCallback((sub: SubscriptionStatus) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sub));
  }, []);

  const activateSubscription = useCallback(
    (tier: SubscriptionTier, sessionId: string) => {
      const next: SubscriptionStatus = {
        tier,
        active: true,
        trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        customerId: null,
        sessionId,
        activatedAt: new Date().toISOString(),
      };
      setSubscription(next);
      persist(next);
    },
    [persist]
  );

  const incrementMessageCount = useCallback(() => {
    setMessageCount((prev) => {
      const next = prev + 1;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("hammerlock_message_count", String(next));
      }
      return next;
    });
  }, []);

  const resetMessageCount = useCallback(() => {
    setMessageCount(0);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("hammerlock_message_count", "0");
    }
  }, []);

  const canSendMessage = useMemo(() => {
    // Desktop app: unlimited messages
    if (isElectron()) return true;
    if (isSubscriptionActive(subscription)) return true;
    return messageCount < FREE_MESSAGE_LIMIT;
  }, [subscription, messageCount]);

  const isFeatureAvailable = useCallback(
    (feature: PremiumFeature) => {
      // Desktop app: all features unlocked
      if (isElectron()) return true;
      if (!isSubscriptionActive(subscription)) return false;
      const requiredTier = FEATURE_TIERS[feature];
      return TIER_RANK[subscription.tier] >= TIER_RANK[requiredTier];
    },
    [subscription]
  );

  const clearSubscription = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem("hammerlock_message_count");
    setSubscription(defaultSubscription());
    setMessageCount(0);
  }, []);

  const value = useMemo(
    () => ({
      subscription,
      messageCount,
      canSendMessage,
      isFeatureAvailable,
      activateSubscription,
      incrementMessageCount,
      resetMessageCount,
      clearSubscription,
    }),
    [subscription, messageCount, canSendMessage, isFeatureAvailable, activateSubscription, incrementMessageCount, resetMessageCount, clearSubscription]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return context;
}

export { FREE_MESSAGE_LIMIT };
