import Stripe from "stripe";
import Subscription from "../models/subscriptionModel.js";
import User from "../models/userModel.js";
import Plan from "../models/planModel.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const getFrontendUrl = () => {
  const url = process.env.FRONTEND_URL ;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `http://${url}`;
  }
  return url.replace(/\/$/, "");
};

const getExpiryDate = (billingType) => {
  const now = new Date();
  if (billingType === "annual") {
    now.setFullYear(now.getFullYear() + 1);
  } else {
    now.setMonth(now.getMonth() + 1);
  }
  return now;
};

export const createCheckoutSession = async (req, res) => {
  try {
    const { planKey, billingType } = req.body;
    const userId = req.user._id;

    if (!planKey || !["tef", "tcf", "combo"].includes(planKey)) {
      return res.status(400).json({ success: false, message: "Invalid planKey" });
    }
    if (!billingType || !["monthly", "annual"].includes(billingType)) {
      return res.status(400).json({ success: false, message: "Invalid billingType" });
    }

    const existing = await Subscription.findOne({
      user: userId,
      planKey,
      status: "active",
      expiresAt: { $gt: new Date() },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `You already have an active ${planKey.toUpperCase()} plan valid till ${existing.expiresAt.toDateString()}`,
      });
    }

    const plan = await Plan.findOne({ planKey, isActive: true });
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    const priceInUSD   = billingType === "annual" ? plan.annualPrice : plan.monthlyPrice;
    const priceInCents = Math.round(priceInUSD * 100);
    const frontendUrl  = getFrontendUrl();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency:     "usd",
            unit_amount:  priceInCents,
            product_data: {
              name:        `${plan.name} — ${billingType === "annual" ? "Annual" : "Monthly"} Plan`,
              description: plan.description,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId:     userId.toString(),
        planKey,
        billingType,
        planName:   plan.name,
        amountPaid: priceInUSD,
      },
      success_url:    `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:     `${frontendUrl}/pricing?cancelled=true`,
      customer_email: req.user.email,
    });

    // ✅ NO pending record — sirf payment hone ke baad verify mein save hoga
    res.status(200).json({ success: true, checkoutUrl: session.url });
  } catch (error) {
    console.error("Checkout Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ success: false, message: "session_id required" });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return res.status(200).json({ success: false, message: "Payment not completed yet" });
    }

    const { userId, planKey, billingType, amountPaid } = session.metadata;

    let subscription = await Subscription.findOne({ stripeSessionId: session_id });

    if (!subscription) {
      subscription = await Subscription.create({
        user:                userId,
        planKey,
        billingType,
        stripeSessionId:     session_id,
        stripeCustomerEmail: session.customer_email || "",
        amountPaid:          Number(amountPaid),
        currency:            "usd",
        status:              "active",
        paidAt:              new Date(),
        expiresAt:           getExpiryDate(billingType),
      });
    } else if (subscription.status !== "active") {
      subscription.status    = "active";
      subscription.paidAt    = new Date();
      subscription.expiresAt = getExpiryDate(billingType);
      await subscription.save();
    }

    const user = await User.findById(userId);
    if (user) {
      if (planKey === "combo") {
        user.purchasedPlans = ["tef", "tcf", "combo"];
      } else {
        if (!user.purchasedPlans.includes(planKey)) {
          user.purchasedPlans.addToSet(planKey);
        }
      }
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      subscription: {
        planKey:     subscription.planKey,
        billingType: subscription.billingType,
        status:      subscription.status,
        paidAt:      subscription.paidAt,
        expiresAt:   subscription.expiresAt,
        amountPaid:  subscription.amountPaid,
      },
    });
  } catch (error) {
    console.error("Verify Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const stripeWebhook = async (req, res) => {
  const sig    = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  if (secret && secret.trim() !== "") {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, secret);
    } catch (err) {
      console.error("Webhook signature failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    try {
      event = JSON.parse(req.body.toString());
    } catch {
      return res.status(400).send("Invalid webhook body");
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.payment_status === "paid") {
      const { userId, planKey, billingType, amountPaid } = session.metadata || {};
      if (userId && planKey) {
        try {
          let sub = await Subscription.findOne({ stripeSessionId: session.id });

          if (!sub) {
            sub = await Subscription.create({
              user:                userId,
              planKey,
              billingType,
              stripeSessionId:     session.id,
              stripeCustomerEmail: session.customer_email || "",
              amountPaid:          Number(amountPaid),
              currency:            "usd",
              status:              "active",
              paidAt:              new Date(),
              expiresAt:           getExpiryDate(billingType),
            });
          } else {
            sub.status    = "active";
            sub.paidAt    = new Date();
            sub.expiresAt = getExpiryDate(billingType);
            sub.stripeCustomerEmail = session.customer_email || "";
            await sub.save();
          }

          const user = await User.findById(userId);
          if (user) {
            if (planKey === "combo") {
              user.purchasedPlans = ["tef", "tcf", "combo"];
            } else {
              if (!user.purchasedPlans.includes(planKey)) {
                user.purchasedPlans.push(planKey);
              }
            }
            await user.save();
          }
          console.log(`✅ Webhook: Plan ${planKey} activated for user ${userId}`);
        } catch (err) {
          console.error("Webhook DB error:", err);
        }
      }
    }
  }

  res.json({ received: true });
};

export const getMySubscription = async (req, res) => {
  try {
    const now = new Date();

    const subscriptions = await Subscription.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    for (const sub of subscriptions) {
      if (sub.status === "active" && sub.expiresAt && sub.expiresAt < now) {
        sub.status = "expired";
        await sub.save();
      }
    }

    const active = subscriptions.filter(
      (s) => s.status === "active" && s.expiresAt > now
    );

    const user           = await User.findById(req.user._id);
    const activePlanKeys = active.map((s) => s.planKey);
    const effectivePlans = activePlanKeys.includes("combo")
      ? ["tef", "tcf", "combo"]
      : activePlanKeys;

    if (JSON.stringify(user.purchasedPlans.sort()) !== JSON.stringify(effectivePlans.sort())) {
      user.purchasedPlans = effectivePlans;
      await user.save();
    }

    res.status(200).json({
      success: true,
      activePlans: active.map((s) => ({
        planKey:     s.planKey,
        billingType: s.billingType,
        status:      s.status,
        paidAt:      s.paidAt,
        expiresAt:   s.expiresAt,
        amountPaid:  s.amountPaid,
        currency:    s.currency,
        daysLeft:    Math.ceil((new Date(s.expiresAt) - now) / (1000 * 60 * 60 * 24)),
      })),
      history: subscriptions.map((s) => ({
        _id:         s._id,
        planKey:     s.planKey,
        billingType: s.billingType,
        status:      s.status,
        paidAt:      s.paidAt,
        expiresAt:   s.expiresAt,
        amountPaid:  s.amountPaid,
        currency:    s.currency,
        createdAt:   s.createdAt,
      })),
    });
  } catch (error) {
    console.error("Subscription fetch error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    const sub = await Subscription.findOne({
      _id:  subscriptionId,
      user: req.user._id,
    });

    if (!sub) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    sub.status = "cancelled";
    await sub.save();

    const otherActive = await Subscription.findOne({
      user:      req.user._id,
      planKey:   sub.planKey,
      status:    "active",
      expiresAt: { $gt: new Date() },
    });

    if (!otherActive) {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { purchasedPlans: sub.planKey },
      });
    }

    res.status(200).json({ success: true, message: "Subscription cancelled" });
  } catch (error) {
    console.error("Cancel error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllTransactions = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.status)  filter.status  = req.query.status;
    if (req.query.planKey) filter.planKey = req.query.planKey;

    const [transactions, total] = await Promise.all([
      Subscription.find(filter)
        .populate("user", "fullName email mobile")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Subscription.countDocuments(filter),
    ]);

    const now = new Date();
    for (const t of transactions) {
      if (t.status === "active" && t.expiresAt && t.expiresAt < now) {
        t.status = "expired";
        await t.save();
      }
    }

    const stats = await Subscription.aggregate([
      { $match: { status: { $in: ["active", "expired"] } } },
      {
        $group: {
          _id:          "$planKey",
          totalRevenue: { $sum: "$amountPaid" },
          count:        { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      pages:        Math.ceil(total / limit),
      transactions: transactions.map((t) => ({
        _id:             t._id,
        user:            t.user,
        planKey:         t.planKey,
        billingType:     t.billingType,
        status:          t.status,
        amountPaid:      t.amountPaid,
        currency:        t.currency,
        paidAt:          t.paidAt,
        expiresAt:       t.expiresAt,
        createdAt:       t.createdAt,
        stripeSessionId: t.stripeSessionId,
      })),
      revenueByPlan: stats,
    });
  } catch (error) {
    console.error("Admin transactions error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};