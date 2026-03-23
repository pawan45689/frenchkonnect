import promoCodeModel from "../models/promoCodeModel.js";

// ══════════════════════════════════════════════════════
// PUBLIC
// ══════════════════════════════════════════════════════

// POST /api/v1/promo/verify  — promo code validate karo
export const verifyPromoCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: "Promo code is required" });
    }

    const promo = await promoCodeModel.findOne({ code: code.trim().toUpperCase() });

    if (!promo) {
      return res.status(404).json({ success: false, message: "Invalid promo code" });
    }

    // Active hai?
    if (!promo.isActive) {
      return res.status(400).json({ success: false, message: "This promo code is no longer active" });
    }

    // Expire hua?
    if (promo.expiresAt && new Date() > promo.expiresAt) {
      return res.status(400).json({ success: false, message: "This promo code has expired" });
    }

    // Limit reach hua?
    if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
      return res.status(400).json({ success: false, message: "This promo code has reached its usage limit" });
    }

    res.status(200).json({
      success: true,
      promo: {
        code:     promo.code,
        label:    promo.label,
        discount: promo.discount,
      },
    });
  } catch (error) {
    console.error("Verify Promo Error:", error);
    res.status(500).json({ success: false, message: "Failed to verify promo code" });
  }
};

// ══════════════════════════════════════════════════════
// ADMIN
// ══════════════════════════════════════════════════════

// GET /api/v1/admin/promo  — saare promo codes
export const getAllPromoCodes = async (req, res) => {
  try {
    const promos = await promoCodeModel.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: promos.length, promos });
  } catch (error) {
    console.error("Get Promos Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch promo codes" });
  }
};

// POST /api/v1/admin/promo  — naya promo code banao
export const createPromoCode = async (req, res) => {
  try {
    const { code, label, discount, usageLimit, expiresAt } = req.body;

    const existing = await promoCodeModel.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: "Promo code already exists" });
    }

    const promo = await promoCodeModel.create({
      code:       code.trim().toUpperCase(),
      label,
      discount,
      usageLimit: usageLimit || null,
      expiresAt:  expiresAt  || null,
    });

    res.status(201).json({ success: true, promo });
  } catch (error) {
    console.error("Create Promo Error:", error);
    res.status(500).json({ success: false, message: "Failed to create promo code" });
  }
};

// PUT /api/v1/admin/promo/:id  — promo update karo
export const updatePromoCode = async (req, res) => {
  try {
    const promo = await promoCodeModel.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    if (!promo) {
      return res.status(404).json({ success: false, message: "Promo code not found" });
    }

    res.status(200).json({ success: true, promo });
  } catch (error) {
    console.error("Update Promo Error:", error);
    res.status(500).json({ success: false, message: "Failed to update promo code" });
  }
};

// DELETE /api/v1/admin/promo/:id  — promo delete karo
export const deletePromoCode = async (req, res) => {
  try {
    const promo = await promoCodeModel.findByIdAndDelete(req.params.id);

    if (!promo) {
      return res.status(404).json({ success: false, message: "Promo code not found" });
    }

    res.status(200).json({ success: true, message: "Promo code deleted successfully" });
  } catch (error) {
    console.error("Delete Promo Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete promo code" });
  }
};