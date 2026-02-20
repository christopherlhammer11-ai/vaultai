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

export type SubscriptionTier = "free" | "core" | "pro" | "teams" | "enterprise";

export type SubscriptionStatus = {
  tier: SubscriptionTier;
  active: boolean;
  trialEnd: string | null;
  customerId: string | null;
  sessionId: string | null;
  activatedAt: string | null;
};

const FREE_MESSAGE_LIMIT = 999999; // uncapped — re-enable when products go live

const STORAGE_KEY = "vault_subscription";

const defaultSubscription = (): SubscriptionStatus => ({
  tier: "free",
  active: false,
  trialEnd: null,
  customerId: null,
  sessionId: null,
  activatedAt: null,
});

/** Desktop Electron app detection */
function isElectron(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as unknown as Record<string, unknown>).electron ||
    typeof navigator !== "undefined" && navigator.userAgent.includes("Electron");
}

/** Check if subscription is genuinely active (not expired) */
function isSubscriptionActive(sub: SubscriptionStatus): boolean {
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
  licenseTier: SubscriptionTier;
  licenseLoading: boolean;
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
  web_search: "pro",
  cloud_llm: "pro",
  voice_input: "pro",
  voice_output: "pro",
  pdf_export: "pro",
  pdf_upload: "free",
  personas: "core",
  file_vault: "core",
  reports: "pro",
  share: "core",
};

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  core: 1,
  pro: 2,
  teams: 3,
  enterprise: 4,
};

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionStatus>(defaultSubscription());
  const [messageCount, setMessageCount] = useState(0);
  const [licenseTier, setLicenseTier] = useState<SubscriptionTier>("free");
  const [licenseLoading, setLicenseLoading] = useState(false);

  // Fetch license tier from server on mount (Electron desktop only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isElectron()) return;

    setLicenseLoading(true);
    fetch("/api/license/check")
      .then((res) => res.json())
      .then((data) => {
        if (data.tier) {
          const tier = data.tier as SubscriptionTier;
          setLicenseTier(tier);
          // Also sync to subscription state so the rest of the app sees it
          if (TIER_RANK[tier] > 0) {
            setSubscription((prev) => ({
              ...prev,
              tier,
              active: true,
            }));
          }
        }
      })
      .catch(() => {
        // Fail-open: leave as free tier
        console.warn("[subscription-store] Failed to check license, defaulting to free");
      })
      .finally(() => {
        setLicenseLoading(false);
      });
  }, []);

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
    // Desktop app: check license tier from server
    if (isElectron()) {
      // Core or higher → unlimited messages
      if (TIER_RANK[licenseTier] >= TIER_RANK["core"]) return true;
      // Free tier on desktop → same message limit
      return messageCount < FREE_MESSAGE_LIMIT;
    }
    // Web: check subscription status
    if (isSubscriptionActive(subscription)) return true;
    return messageCount < FREE_MESSAGE_LIMIT;
  }, [subscription, messageCount, licenseTier]);

  const isFeatureAvailable = useCallback(
    (feature: PremiumFeature) => {
      // Desktop app: use server-verified license tier
      if (isElectron()) {
        const requiredTier = FEATURE_TIERS[feature];
        return TIER_RANK[licenseTier] >= TIER_RANK[requiredTier];
      }
      // Web: use subscription status
      if (!isSubscriptionActive(subscription)) return false;
      const requiredTier = FEATURE_TIERS[feature];
      return TIER_RANK[subscription.tier] >= TIER_RANK[requiredTier];
    },
    [subscription, licenseTier]
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
      licenseTier,
      licenseLoading,
    }),
    [subscription, messageCount, canSendMessage, isFeatureAvailable, activateSubscription, incrementMessageCount, resetMessageCount, clearSubscription, licenseTier, licenseLoading]
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
