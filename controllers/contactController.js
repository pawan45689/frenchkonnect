import contactModel from "../models/contactModel.js";

// ==========================================
// CREATE CONTACT (Public - Client Side)
// ==========================================
export const createContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Simple validation - just check if fields exist
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Create new contact
    const contact = new contactModel({
      name,
      email,
      subject,
      message
    });

    await contact.save();

    res.status(201).json({
      success: true,
      message: "Thank you for contacting us! We'll get back to you soon.",
      contact: {
        _id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        createdAt: contact.createdAt
      }
    });

  } catch (error) {
    console.error("Create Contact Error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later."
    });
  }
};

// ==========================================
// GET ALL CONTACTS (Admin Only)
// ==========================================
export const getAllContacts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const contacts = await contactModel
      .find()
      .sort({ createdAt: -1 }) // Latest first
      .skip(skip)
      .limit(parseInt(limit));

    const totalContacts = await contactModel.countDocuments();

    res.status(200).json({
      success: true,
      count: contacts.length,
      total: totalContacts,
      totalPages: Math.ceil(totalContacts / limit),
      currentPage: parseInt(page),
      contacts
    });

  } catch (error) {
    console.error("Get All Contacts Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contacts"
    });
  }
};

// ==========================================
// GET SINGLE CONTACT (Admin Only)
// ==========================================
export const getContactById = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await contactModel.findById(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    res.status(200).json({
      success: true,
      contact
    });

  } catch (error) {
    console.error("Get Contact Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact"
    });
  }
};

// ==========================================
// DELETE CONTACT (Admin Only)
// ==========================================
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await contactModel.findByIdAndDelete(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Contact deleted successfully"
    });

  } catch (error) {
    console.error("Delete Contact Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete contact"
    });
  }
};

// ==========================================
// GET CONTACT STATISTICS (Admin Only)
// ==========================================
export const getContactStats = async (req, res) => {
  try {
    const totalContacts = await contactModel.countDocuments();

    // Recent contacts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentContacts = await contactModel.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.status(200).json({
      success: true,
      stats: {
        total: totalContacts,
        lastWeek: recentContacts
      }
    });

  } catch (error) {
    console.error("Get Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics"
    });
  }
};