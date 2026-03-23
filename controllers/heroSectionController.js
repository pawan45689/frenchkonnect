import HeroSection from "../models/HeroSection.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

/* ══════════════════════════════════════════════════════════════
   PUBLIC — GET HERO SECTION
   GET /api/v1/hero
══════════════════════════════════════════════════════════════ */
export const getHeroSection = async (req, res) => {
  try {
    let hero = await HeroSection.findOne({ isActive: true });
    if (!hero) hero = await HeroSection.create({});
    res.status(200).json({ success: true, data: hero });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — GET HERO (for edit form)
   GET /api/v1/admin/hero
══════════════════════════════════════════════════════════════ */
export const getHeroAdmin = async (req, res) => {
  try {
    let hero = await HeroSection.findOne();
    if (!hero) hero = await HeroSection.create({});
    res.status(200).json({ success: true, data: hero });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════════
   ADMIN — UPDATE HERO SECTION
   PUT /api/v1/admin/hero
══════════════════════════════════════════════════════════════ */
export const updateHeroSection = async (req, res) => {
  try {
    let hero = await HeroSection.findOne();
    if (!hero) hero = new HeroSection();

    const {
      heading, description, badgeText,
      primaryBtnText, primaryBtnLink,
      secondaryBtnText, secondaryBtnLink,
      stats, featureCards,
      eventDay, eventMonth, eventTitle,
      eventDescription, eventBtnText, eventBtnLink,
      eventCountdown, showEvent, removeImage,
    } = req.body;

    // Image handle
    if (removeImage === "true" || removeImage === true) {
      if (hero.image && hero.image.startsWith("http")) {
        await deleteFromCloudinary(hero.image).catch(() => {});
      }
      hero.image = "";
    } else if (req.files?.image) {
      if (hero.image && hero.image.startsWith("http")) {
        await deleteFromCloudinary(hero.image).catch(() => {});
      }
      hero.image = await uploadToCloudinary(req.files.image.data, "hero");
    }

    if (heading          !== undefined) hero.heading          = heading;
    if (description      !== undefined) hero.description      = description;
    if (badgeText        !== undefined) hero.badgeText        = badgeText;
    if (primaryBtnText   !== undefined) hero.primaryBtnText   = primaryBtnText;
    if (primaryBtnLink   !== undefined) hero.primaryBtnLink   = primaryBtnLink;
    if (secondaryBtnText !== undefined) hero.secondaryBtnText = secondaryBtnText;
    if (secondaryBtnLink !== undefined) hero.secondaryBtnLink = secondaryBtnLink;
    if (eventDay         !== undefined) hero.eventDay         = eventDay;
    if (eventMonth       !== undefined) hero.eventMonth       = eventMonth;
    if (eventTitle       !== undefined) hero.eventTitle       = eventTitle;
    if (eventDescription !== undefined) hero.eventDescription = eventDescription;
    if (eventBtnText     !== undefined) hero.eventBtnText     = eventBtnText;
    if (eventBtnLink     !== undefined) hero.eventBtnLink     = eventBtnLink;
    if (eventCountdown   !== undefined) hero.eventCountdown   = eventCountdown;
    if (showEvent        !== undefined) hero.showEvent        = showEvent === "true" || showEvent === true;

    if (stats) {
      hero.stats = typeof stats === "string" ? JSON.parse(stats) : stats;
    }

    if (featureCards) {
      hero.featureCards = typeof featureCards === "string" ? JSON.parse(featureCards) : featureCards;
    }

    await hero.save();
    res.status(200).json({ success: true, message: "Hero section updated", data: hero });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};