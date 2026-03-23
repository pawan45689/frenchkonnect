import planModel from "../models/planModel.js";

// ══════════════════════════════════════════════════════
// PUBLIC
// ══════════════════════════════════════════════════════

export const getActivePlans = async (req, res) => {
  try {
    const plans = await planModel
      .find({ isActive: true })
      .sort({ order: 1 })
      .select("-__v");
    res.status(200).json({ success: true, count: plans.length, plans });
  } catch (error) {
    console.error("Get Plans Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch plans" });
  }
};

// ══════════════════════════════════════════════════════
// ADMIN
// ══════════════════════════════════════════════════════

export const getAllPlans = async (req, res) => {
  try {
    const plans = await planModel.find().sort({ order: 1 }).select("-__v");
    res.status(200).json({ success: true, count: plans.length, plans });
  } catch (error) {
    console.error("Get All Plans Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch plans" });
  }
};

export const createPlan = async (req, res) => {
  try {
    const {
      planKey, name, description,
      monthlyPrice, annualPrice,
      icon, iconColor, iconBg,
      featured, badge,
      features, notIncluded,
      compareFeatures, order,
    } = req.body;

    const existing = await planModel.findOne({ planKey });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Plan with key "${planKey}" already exists`,
      });
    }

    const plan = await planModel.create({
      planKey, name, description,
      monthlyPrice, annualPrice,
      icon, iconColor, iconBg,
      featured:        featured        || false,
      badge:           badge           || null,
      features:        features        || [],
      notIncluded:     notIncluded     || [],
      compareFeatures: compareFeatures || [],
      order:           order           || 0,
    });

    res.status(201).json({ success: true, plan });
  } catch (error) {
    console.error("Create Plan Error:", error);
    res.status(500).json({ success: false, message: "Failed to create plan" });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const plan = await planModel.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }
    res.status(200).json({ success: true, plan });
  } catch (error) {
    console.error("Update Plan Error:", error);
    res.status(500).json({ success: false, message: "Failed to update plan" });
  }
};

export const deletePlan = async (req, res) => {
  try {
    const plan = await planModel.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }
    await plan.deleteOne();
    res.status(200).json({ success: true, message: "Plan deleted successfully" });
  } catch (error) {
    console.error("Delete Plan Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete plan" });
  }
};