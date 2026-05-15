import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    planKey: {
      type:     String,
      enum:     ["tef", "tcf", "combo"],
      required: true,
    },
    billingType: {
      type:     String,
      enum:     ["monthly", "annual"],
      required: true,
    },
    stripeSessionId: {
      type:     String,
      required: true,
      unique:   true,
    },
    stripeCustomerEmail: {
      type:    String,
      default: "",
    },
    amountPaid: {
      type:    Number,
      default: 0,
    },
    currency: {
      type:    String,
      default: "usd",
    },
    // pending → active (after payment) → expired / cancelled
    status: {
      type:    String,
      enum:    ["pending", "active", "expired", "cancelled"],
      default: "pending",
    },
    paidAt: {
      type:    Date,
      default: null,
    },
    // When subscription expires and level should lock again
    expiresAt: {
      type:    Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for fast lookup
subscriptionSchema.index({ user: 1, planKey: 1, status: 1 });
subscriptionSchema.index({ expiresAt: 1 });

export default mongoose.model("Subscription", subscriptionSchema);