import mongoose from "mongoose";

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    discount: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageLimit: {
      type: Number,
      default: null, // null = unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      default: null, // null = no expiry
    },
  },
  {
    timestamps: true,
  }
);

// ── Virtual: check karo promo abhi valid hai ya nahi ──
promoCodeSchema.virtual("isValid").get(function () {
  if (!this.isActive) return false;
  if (this.usageLimit !== null && this.usedCount >= this.usageLimit) return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  return true;
});

export default mongoose.model("PromoCode", promoCodeSchema);