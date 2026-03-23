import settingModel from "../models/settingModel.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

export const getSettings = async (req, res) => {
  try {
    let settings = await settingModel.findOne();

    if (!settings) {
      settings = new settingModel({
        siteName: "",
        email: "", mobile: "", address: "",
        facebook: "", twitter: "", instagram: "", linkedin: "", youtube: ""
      });
      await settings.save();
    }

    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch settings" });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { siteName, email, mobile, address, facebook, twitter, instagram, linkedin, youtube } = req.body;

    if (!email || !mobile || !address) {
      return res.status(400).json({ success: false, message: "Email, mobile, and address are required" });
    }

    let settings = await settingModel.findOne();

    if (!settings) {
      settings = new settingModel({
        siteName: siteName || "",
        email, mobile, address,
        facebook: facebook || "", twitter: twitter || "",
        instagram: instagram || "", linkedin: linkedin || "", youtube: youtube || ""
      });
    } else {
      settings.siteName  = siteName  || "";
      settings.email     = email;
      settings.mobile    = mobile;
      settings.address   = address;
      settings.facebook  = facebook  || "";
      settings.twitter   = twitter   || "";
      settings.instagram = instagram || "";
      settings.linkedin  = linkedin  || "";
      settings.youtube   = youtube   || "";
    }

    if (req.files?.logo) {
      await deleteFromCloudinary(settings.logo);
      settings.logo = await uploadToCloudinary(req.files.logo.data, "settings");
    }

    if (req.files?.favicon) {
      await deleteFromCloudinary(settings.favicon);
      settings.favicon = await uploadToCloudinary(req.files.favicon.data, "settings");
    }

    await settings.save();

    res.status(200).json({ success: true, message: "Settings updated successfully", settings });
  } catch (error) {
    console.error("Update Settings Error:", error);
    res.status(500).json({ success: false, message: "Failed to update settings" });
  }
};