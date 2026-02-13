import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

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
      // Note: Subscription activation happens client-side via success page.
      // This webhook serves as an audit log. Server-side enforcement
      // would require a database (planned for v0.2).
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      console.log("[webhook] Subscription updated:", {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      console.log("[webhook] Subscription cancelled:", {
        id: subscription.id,
        status: subscription.status,
      });
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      console.log("[webhook] Payment failed:", {
        invoiceId: invoice.id,
        customerId: invoice.customer,
        amountDue: invoice.amount_due,
      });
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
