import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;

// Price IDs — set these in .env.local after creating products in Stripe Dashboard
const PRICE_MAP: Record<string, string | undefined> = {
  "lite-monthly": process.env.STRIPE_PRICE_LITE_MONTHLY,
  "lite-annual": process.env.STRIPE_PRICE_LITE_ANNUAL,
  "premium-monthly": process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
  "premium-annual": process.env.STRIPE_PRICE_PREMIUM_ANNUAL,
};

export async function POST(req: NextRequest) {
  if (!STRIPE_SECRET) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(STRIPE_SECRET);

  try {
    const { plan } = await req.json();
    const priceId = PRICE_MAP[plan];

    if (!priceId) {
      return NextResponse.json(
        { error: `Unknown plan: ${plan}. Valid: ${Object.keys(PRICE_MAP).join(", ")}` },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Checkout failed" },
      { status: 500 }
    );
  }
}
