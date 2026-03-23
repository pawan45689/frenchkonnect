import Registration from "../models/registrationModel.js";
import Event         from "../models/eventModel.js";
import { sendEmail } from "../services/emailService.js";

const parseArrayField = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return val.toString().split(",").map((s) => s.trim()).filter(Boolean);
  }
};

export const createRegistration = async (req, res) => {
  try {
    const { event, name, email, phone, type } = req.body;

    if (!event || !name || !email)
      return res.status(400).json({ success: false, message: "Event, name and email are required" });

    const eventDoc = await Event.findOne({ _id: event, isActive: true });
    if (!eventDoc)
      return res.status(404).json({ success: false, message: "Event not found or inactive" });

    const existing = await Registration.findOne({ event, email });
    if (existing)
      return res.status(400).json({ success: false, message: "You have already registered for this event" });

    const registration = await Registration.create({ event, name, email, phone, type });

    // ✅ ADDED — Send confirmation email to user after registration
    try {
      await sendEmail({
        to:      email,
        subject: `Registration Received — ${eventDoc.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1B3A5C;">Registration Received!</h2>
            <p>Hi <strong>${name}</strong>,</p>
            <p>Thank you for registering. Your registration is currently <strong>pending review</strong>. We will confirm it shortly.</p>
            <div style="background: #f8f9fa; border-left: 4px solid #2D6A9F; padding: 16px; margin: 16px 0; border-radius: 4px;">
              <h3 style="margin: 0 0 10px;">${eventDoc.title}</h3>
              <p style="margin: 4px 0;">📅 <strong>Date:</strong> ${eventDoc.day} ${eventDoc.month}</p>
              <p style="margin: 4px 0;">⏰ <strong>Time:</strong> ${eventDoc.time || "To be announced"}</p>
              <p style="margin: 4px 0;">📍 <strong>Location:</strong> ${eventDoc.location || "To be announced"}</p>
            </div>
            <p>You will receive another email once your registration is confirmed or if any changes occur.</p>
            <p style="color: #6c757d; font-size: 13px;">If you have any questions, please contact the event organizer.</p>
          </div>
        `,
      });
    } catch (emailErr) {
      // Email fail hone par bhi registration save hogi — sirf log karega
      console.error("Registration email send failed:", emailErr.message);
    }

    res.status(201).json({
      success: true,
      data:    registration,
      message: "Registration successful!",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

export const getAllRegistrations = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", event = "", type = "", status = "" } = req.query;

    const query = {};
    if (event)  query.event  = event;
    if (type)   query.type   = type;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name:  { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const total         = await Registration.countDocuments(query);
    const registrations = await Registration.find(query)
      .populate("event", "title day month location")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: registrations,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
    });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getRegistrationById = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate("event", "title day month location");
    if (!registration)
      return res.status(404).json({ success: false, message: "Registration not found" });
    res.json({ success: true, data: registration });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getRegistrationsByEvent = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const eventId = req.params.eventId;

    const total         = await Registration.countDocuments({ event: eventId });
    const registrations = await Registration.find({ event: eventId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: registrations,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
    });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateRegistrationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "confirmed", "cancelled"].includes(status))
      return res.status(400).json({ success: false, message: "Invalid status" });

    // ✅ ADDED — Once confirmed or cancelled, status cannot be changed
    const existing = await Registration.findById(req.params.id);
    if (!existing)
      return res.status(404).json({ success: false, message: "Registration not found" });

    if (existing.status === "confirmed" || existing.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: `Registration is already ${existing.status} and cannot be changed`,
      });
    }

    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("event", "title day month location time");

    if (!registration)
      return res.status(404).json({ success: false, message: "Registration not found" });

    try {
      if (status === "confirmed") {
        await sendEmail({
          to:      registration.email,
          subject: `Registration Confirmed — ${registration.event.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #28a745;">Your Registration is Confirmed!</h2>
              <p>Hi <strong>${registration.name}</strong>,</p>
              <p>Your registration for the following event has been <strong>confirmed</strong>:</p>
              <div style="background: #f8f9fa; border-left: 4px solid #28a745; padding: 16px; margin: 16px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 10px;">${registration.event.title}</h3>
                <p style="margin: 4px 0;">📅 <strong>Date:</strong> ${registration.event.day} ${registration.event.month}</p>
                <p style="margin: 4px 0;">⏰ <strong>Time:</strong> ${registration.event.time}</p>
                <p style="margin: 4px 0;">📍 <strong>Location:</strong> ${registration.event.location}</p>
              </div>
              <p>Please arrive on time. We look forward to seeing you!</p>
              <p style="color: #6c757d; font-size: 13px;">If you have any questions, please contact the event organizer.</p>
            </div>
          `,
        });
      }

      if (status === "cancelled") {
        await sendEmail({
          to:      registration.email,
          subject: `Registration Cancelled — ${registration.event.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc3545;">Registration Cancelled</h2>
              <p>Hi <strong>${registration.name}</strong>,</p>
              <p>Unfortunately your registration for <strong>${registration.event.title}</strong> has been <strong>cancelled</strong>.</p>
              <p>If you believe this is a mistake, please contact us.</p>
              <p style="color: #6c757d; font-size: 13px;">We hope to see you at future events.</p>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.error("Email send failed:", emailErr.message);
    }

    res.json({ success: true, data: registration, message: `Status updated to ${status}` });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteRegistration = async (req, res) => {
  try {
    const registration = await Registration.findByIdAndDelete(req.params.id);
    if (!registration)
      return res.status(404).json({ success: false, message: "Registration not found" });
    res.json({ success: true, message: "Registration deleted" });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getRegistrationStats = async (req, res) => {
  try {
    const [total, confirmed, pending, cancelled] = await Promise.all([
      Registration.countDocuments(),
      Registration.countDocuments({ status: "confirmed" }),
      Registration.countDocuments({ status: "pending" }),
      Registration.countDocuments({ status: "cancelled" }),
    ]);
    res.json({ success: true, data: { total, confirmed, pending, cancelled } });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};