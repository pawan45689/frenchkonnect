import settingModel from "../models/settingModel.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// GET SETTINGS (Single record)
// ==========================================
export const getSettings = async (req, res) => {
  try {
    let settings = await settingModel.findOne();

    // If no settings exist, create default
    if (!settings) {
      settings = new settingModel({
        email: "",
        mobile: "",
        address: "",
        facebook: "",
        twitter: "",
        instagram: "",
        linkedin: "",
        youtube: ""
      });
      await settings.save();
    }

    res.status(200).json({
      success: true,
      settings
    });

  } catch (error) {
    console.error("Get Settings Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch settings"
    });
  }
};

// ==========================================
// UPDATE SETTINGS
// ==========================================
export const updateSettings = async (req, res) => {
  try {
    const { email, mobile, address, facebook, twitter, instagram, linkedin, youtube } = req.body;

    // Validation (only required fields)
    if (!email || !mobile || !address) {
      return res.status(400).json({
        success: false,
        message: "Email, mobile, and address are required"
      });
    }

    // Get existing settings or create new
    let settings = await settingModel.findOne();
    
    if (!settings) {
      settings = new settingModel({
        email,
        mobile,
        address,
        facebook: facebook || "",
        twitter: twitter || "",
        instagram: instagram || "",
        linkedin: linkedin || "",
        youtube: youtube || ""
      });
    } else {
      settings.email = email;
      settings.mobile = mobile;
      settings.address = address;
      settings.facebook = facebook || "";
      settings.twitter = twitter || "";
      settings.instagram = instagram || "";
      settings.linkedin = linkedin || "";
      settings.youtube = youtube || "";
    }

    // Handle logo upload
    if (req.files && req.files.logo) {
      const logoFile = req.files.logo;
      const logoName = `logo_${Date.now()}${path.extname(logoFile.name)}`;
      const logoPath = path.join(__dirname, "../uploads/settings", logoName);

      // Delete old logo if exists
      if (settings.logo) {
        const oldLogoPath = path.join(__dirname, "../uploads/settings", settings.logo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }

      // Save new logo
      await logoFile.mv(logoPath);
      settings.logo = logoName;
    }

    // Handle favicon upload
    if (req.files && req.files.favicon) {
      const faviconFile = req.files.favicon;
      const faviconName = `favicon_${Date.now()}${path.extname(faviconFile.name)}`;
      const faviconPath = path.join(__dirname, "../uploads/settings", faviconName);

      // Delete old favicon if exists
      if (settings.favicon) {
        const oldFaviconPath = path.join(__dirname, "../uploads/settings", settings.favicon);
        if (fs.existsSync(oldFaviconPath)) {
          fs.unlinkSync(oldFaviconPath);
        }
      }

      // Save new favicon
      await faviconFile.mv(faviconPath);
      settings.favicon = faviconName;
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      settings
    });

  } catch (error) {
    console.error("Update Settings Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update settings"
    });
  }
};