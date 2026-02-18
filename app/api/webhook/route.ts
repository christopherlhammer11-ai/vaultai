import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { generateLicenseKey } from "@/lib/license-keys";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/** Map a Stripe price ID to a tier name */
function determineTierFromPrice(priceId: string | undefined): string {
  if (!priceId) return "core";
  if (priceId === process.env.STRIPE_PRICE_CORE_ONETIME) return "core";
  if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY) return "pro";
  if (priceId === process.env.STRIPE_PRICE_TEAMS_MONTHLY) return "teams";
  return "core"; // fallback
}

export async function POST(req: NextRequest) {
  if (!STRIPE_SECRET) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  // Require webhook secret in production — reject unsigned payloads
  const signature = req.headers.get("stripe-signature");
  if (!WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET not set — rejecting webhook");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const stripe = new Stripe(STRIPE_SECRET, {
    httpClient: Stripe.createFetchHttpClient(),
  });

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", (err as Error).message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Log all events for audit trail
  console.log(`[webhook] ${event.type}`, event.id);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("[webhook] Checkout completed:", {
        sessionId: session.id,
        customerId: session.customer,
        subscriptionId: session.subscription,
        email: session.customer_details?.email,
      });

      try {
        // Determine tier from line items
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const priceId = lineItems.data[0]?.price?.id;
        const tier = determineTierFromPrice(priceId);
        const billingType = session.mode === "payment" ? "onetime" : "subscription";

        // Generate unique license key
        const licenseKey = generateLicenseKey();

        // For subscriptions, get the current period end
        let currentPeriodEnd: Date | null = null;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string) as Stripe.Subscription;
          // In Stripe API v2 (npm v20+), current_period_end is on subscription items
          const periodEnd = (sub as unknown as Record<string, unknown>).current_period_end
            ?? sub.items?.data?.[0]?.current_period_end;
          if (typeof periodEnd === "number") {
            currentPeriodEnd = new Date(periodEnd * 1000);
          }
        }

        // Create license record in database
        await prisma.license.create({
          data: {
            key: licenseKey,
            tier,
            status: "active",
            billingType,
            stripeCustomerId: (session.customer as string) ?? null,
            stripeSessionId: session.id,
            stripeSubscriptionId: (session.subscription as string) ?? null,
            customerEmail: session.customer_details?.email ?? null,
            currentPeriodEnd,
          },
        });

        console.log("[webhook] License created:", { licenseKey, tier, billingType });

        // Store license key in Stripe session metadata so success page can retrieve it
        // Note: checkout.sessions.update may not support metadata on all session types,
        // but the license/key endpoint reads from our DB, so this is optional.
        try {
          await stripe.checkout.sessions.update(session.id, {
            metadata: { license_key: licenseKey },
          });
        } catch (metaErr) {
          console.warn("[webhook] Could not update session metadata:", (metaErr as Error).message);
        }
      } catch (err) {
        console.error("[webhook] Failed to create license:", (err as Error).message);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      console.log("[webhook] Subscription updated:", {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });

      try {
        const license = await prisma.license.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (license) {
          await prisma.license.update({
            where: { id: license.id },
            data: {
              currentPeriodEnd: (() => {
                const periodEnd = (subscription as unknown as Record<string, unknown>).current_period_end
                  ?? subscription.items?.data?.[0]?.current_period_end;
                return typeof periodEnd === "number" ? new Date(periodEnd * 1000) : null;
              })(),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              status: subscription.status === "active" || subscription.status === "trialing"
                ? "active"
                : "expired",
            },
          });
          console.log("[webhook] License updated for subscription:", subscription.id);
        }
      } catch (err) {
        console.error("[webhook] Failed to update license:", (err as Error).message);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      console.log("[webhook] Subscription cancelled:", {
        id: subscription.id,
        status: subscription.status,
      });

      try {
        await prisma.license.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { status: "expired" },
        });
        console.log("[webhook] License expired for subscription:", subscription.id);
      } catch (err) {
        console.error("[webhook] Failed to expire license:", (err as Error).message);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      console.log("[webhook] Payment failed:", {
        invoiceId: invoice.id,
        customerId: invoice.customer,
        amountDue: invoice.amount_due,
      });
      // Don't immediately revoke — Stripe retries. After all retries fail,
      // Stripe sends customer.subscription.deleted which will expire the license.
      break;
    }

    case "customer.subscription.trial_will_end": {
      const subscription = event.data.object as Stripe.Subscription;
      console.log("[webhook] Trial ending soon:", {
        id: subscription.id,
        trialEnd: subscription.trial_end,
      });
      break;
    }

    default:
      console.log(`[webhook] Unhandled: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ status: "active" });
}
