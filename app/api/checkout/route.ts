import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;

const PRICE_MAP: Record<string, string | undefined> = {
  "lite-monthly": process.env.STRIPE_PRICE_LITE_MONTHLY,
  "lite-annual": process.env.STRIPE_PRICE_LITE_ANNUAL,
  "premium-monthly": process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
  "premium-annual": process.env.STRIPE_PRICE_PREMIUM_ANNUAL,
};

export async function POST(req: NextRequest) {
  if (!STRIPE_SECRET) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY is missing from environment." },
      { status: 500 }
    );
  } 

  try {
    const { plan } = await req.json();
    const priceId = PRICE_MAP[plan];

    if (!priceId) {
      return NextResponse.json(
        { error: `Unknown plan: ${plan}. Loaded: ${JSON.stringify(Object.fromEntries(Object.entries(PRICE_MAP).map(([k, v]) => [k, v ? "SET" : "MISSING"])))}` },
        { status: 400 }
      );
    }

    const stripe = new Stripe(STRIPE_SECRET, {
      maxNetworkRetries: 3,
      timeout: 20000,
    });

    const origin = req.headers.get("origin") || "https://personalvaultai.com";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { trial_period_days: 7 },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const err = error as Error & { type?: string; statusCode?: number; code?: string };
    console.error("Stripe error:", err.message, err.type, err.code);
    return NextResponse.json(
      {
        error: err.message || "Checkout failed",
        type: err.type || "unknown",
        code: err.code || "none",
        keyPrefix: STRIPE_SECRET?.substring(0, 8) || "not set",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "checkout api running",
    secretKeySet: !!STRIPE_SECRET,
    secretKeyPrefix: STRIPE_SECRET ? STRIPE_SECRET.substring(0, 8) + "..." : "NOT SET",
    priceIds: Object.fromEntries(
      Object.entries(PRICE_MAP).map(([k, v]) => [k, v ? v.substring(0, 12) + "..." : "MISSING"])
    ),
  });
}
