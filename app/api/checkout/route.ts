import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;

const PRICE_MAP: Record<string, string | undefined> = {
  "lite-monthly": process.env.STRIPE_PRICE_LITE_MONTHLY,
  "lite-annual": process.env.STRIPE_PRICE_LITE_ANNUAL,
  "premium-monthly": process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
  "premium-annual": process.env.STRIPE_PRICE_PREMIUM_ANNUAL,
};

const VALID_PLANS = new Set(Object.keys(PRICE_MAP));

export async function POST(req: NextRequest) {
  if (!STRIPE_SECRET) {
    return NextResponse.json(
      { error: "Payment system is not configured." },
      { status: 500 }
    );
  }

  try {
    const { plan } = await req.json();

    if (!plan || !VALID_PLANS.has(plan)) {
      return NextResponse.json(
        { error: "Invalid plan selected." },
        { status: 400 }
      );
    }

    const priceId = PRICE_MAP[plan];
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

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { trial_period_days: 7 },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}&plan=${encodeURIComponent(plan)}`,
      cancel_url: `${origin}/#pricing`,
    });

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
