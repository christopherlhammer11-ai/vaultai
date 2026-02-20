// 🔨🔐 HammerLock AI — Stripe Checkout
// Mixed billing: one-time (Core), subscription (Pro), per-seat (Teams)
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;

type PlanConfig = {
  priceEnv: string;
  mode: "payment" | "subscription";
  trial?: number;          // trial days (subscriptions only)
  perSeat?: boolean;       // per-user pricing (Teams)
};

const PLAN_CONFIG: Record<string, PlanConfig> = {
  // Core — $15 one-time
  "core-onetime":     { priceEnv: "STRIPE_PRICE_CORE_ONETIME",     mode: "payment" },
  // Pro — $29/mo
  "pro-monthly":      { priceEnv: "STRIPE_PRICE_PRO_MONTHLY",      mode: "subscription" },
  // Teams — $49/user/mo
  "teams-monthly":    { priceEnv: "STRIPE_PRICE_TEAMS_MONTHLY",    mode: "subscription", perSeat: true },
  // Booster — +$10/mo (adds 1,500 monthly cloud AI credits)
  "booster-monthly":  { priceEnv: "STRIPE_PRICE_BOOSTER_MONTHLY",  mode: "subscription" },
  // Power — +$25/mo (adds 5,000 monthly cloud AI credits)
  "power-monthly":    { priceEnv: "STRIPE_PRICE_POWER_MONTHLY",    mode: "subscription" },
};

const VALID_PLANS = new Set(Object.keys(PLAN_CONFIG));

export async function POST(req: NextRequest) {
  if (!STRIPE_SECRET) {
    return NextResponse.json(
      { error: "Payment system is not configured." },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { plan, seats } = body as { plan?: string; seats?: number };

    if (!plan || !VALID_PLANS.has(plan)) {
      return NextResponse.json(
        { error: "Invalid plan selected." },
        { status: 400 }
      );
    }

    const config = PLAN_CONFIG[plan];
    const priceId = process.env[config.priceEnv];
    if (!priceId) {
      return NextResponse.json(
        { error: "This plan is not available yet." },
        { status: 400 }
      );
    }

    const stripe = new Stripe(STRIPE_SECRET, {
      httpClient: Stripe.createFetchHttpClient(),
      maxNetworkRetries: 3,
      timeout: 20000,
    });

    const origin = req.headers.get("origin") || "https://hammerlockai.com";
    const quantity = config.perSeat ? Math.max(1, seats || 5) : 1;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: config.mode,
      line_items: [{ price: priceId, quantity }],
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}&plan=${encodeURIComponent(plan)}`,
      cancel_url: `${origin}/#pricing`,
    };

    // Add trial for subscriptions
    if (config.mode === "subscription" && config.trial) {
      sessionParams.subscription_data = { trial_period_days: config.trial };
    }

    // Allow seat adjustment for Teams
    if (config.perSeat) {
      sessionParams.line_items![0].adjustable_quantity = {
        enabled: true,
        minimum: 1,
        maximum: 500,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Stripe checkout error:", err.message);
    return NextResponse.json(
      { error: "Unable to create checkout session. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "checkout api active",
    configured: !!STRIPE_SECRET,
  });
}
