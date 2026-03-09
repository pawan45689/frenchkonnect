import Event from "../models/eventModel.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

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

/* ─────────────────────────────────────────────────────────
   ADMIN — GET ALL EVENTS
───────────────────────────────────────────────────────── */
export const getAllEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", category = "", isActive = "" } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { title:    { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }
    if (category)   query.category = category;
    if (isActive !== "") query.isActive = isActive === "true";

    const total  = await Event.countDocuments(query);
    const events = await Event.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true, data: events,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
    });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────
   ADMIN — GET SINGLE EVENT
───────────────────────────────────────────────────────── */
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, data: event });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────
   ADMIN — CREATE EVENT
───────────────────────────────────────────────────────── */
export const createEvent = async (req, res) => {
  try {
    const {
      title, day, month, date, time, location, category,
      description, description2, highlights, schedule,
      isFeatured, isActive, displayOrder,
      organizerName, organizerPosition, organizerEmail, organizerPhone,
    } = req.body;

    if (!title || !day || !month)
      return res.status(400).json({ success: false, message: "Title, day and month are required" });

    // ── Banner image → Cloudinary ────────────────────────
    let image = null;
    if (req.files?.image)
      image = await uploadToCloudinary(req.files.image.data, "events");

    // ── Organizer image → Cloudinary ─────────────────────
    let organizerImage = null;
    if (req.files?.organizerImage)
      organizerImage = await uploadToCloudinary(req.files.organizerImage.data, "events/organizers");

    // ── Gallery images → Cloudinary ───────────────────────
    let gallery = [];
    if (req.files?.gallery) {
      const rawGallery = Array.isArray(req.files.gallery) ? req.files.gallery : [req.files.gallery];
      for (const file of rawGallery) {
        const url = await uploadToCloudinary(file.data, "events/gallery");
        gallery.push(url);
      }
    }

    const event = await Event.create({
      title, day, month,
      date:         date     || "",
      time:         time     || "",
      location:     location || "",
      category:     category || "General",
      description:  description  || "",
      description2: description2 || "",
      highlights:   parseArrayField(highlights),
      schedule:     parseArrayField(schedule),
      image, gallery,
      organizer: {
        name:     organizerName     || "",
        position: organizerPosition || "",
        email:    organizerEmail    || "",
        phone:    organizerPhone    || "",
        image:    organizerImage,
      },
      isFeatured:   isFeatured === "true" || isFeatured === true,
      isActive:     isActive   === "false" ? false : true,
      displayOrder: Number(displayOrder) || 0,
    });

    res.status(201).json({ success: true, data: event, message: "Event created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────
   ADMIN — UPDATE EVENT
───────────────────────────────────────────────────────── */
export const updateEvent = async (req, res) => {
  try {
    const existing = await Event.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Event not found" });

    const updates = { ...req.body };

    if (updates.highlights) updates.highlights = parseArrayField(updates.highlights);
    if (updates.schedule)   updates.schedule   = parseArrayField(updates.schedule);

    if (updates.isFeatured !== undefined)
      updates.isFeatured = updates.isFeatured === "true" || updates.isFeatured === true;
    if (updates.isActive !== undefined)
      updates.isActive = updates.isActive === "true" || updates.isActive === true;

    // ── Banner image ─────────────────────────────────────
    if (req.files?.image) {
      await deleteFromCloudinary(existing.image);
      updates.image = await uploadToCloudinary(req.files.image.data, "events");
    } else if (updates.removeImage === "true") {
      await deleteFromCloudinary(existing.image);
      updates.image = null;
    }
    delete updates.removeImage;

    // ── Organizer image ──────────────────────────────────
    const existingOrgImg = existing.organizer?.image;
    if (req.files?.organizerImage) {
      await deleteFromCloudinary(existingOrgImg);
      updates["organizer.image"] = await uploadToCloudinary(req.files.organizerImage.data, "events/organizers");
    } else if (updates.removeOrganizerImage === "true") {
      await deleteFromCloudinary(existingOrgImg);
      updates["organizer.image"] = null;
    }
    delete updates.removeOrganizerImage;

    // ── Organizer flat fields → nested ───────────────────
    const org = existing.organizer?.toObject?.() || existing.organizer || {};
    updates.organizer = {
      name:     updates.organizerName     ?? org.name     ?? "",
      position: updates.organizerPosition ?? org.position ?? "",
      email:    updates.organizerEmail    ?? org.email    ?? "",
      phone:    updates.organizerPhone    ?? org.phone    ?? "",
      image:    updates["organizer.image"] !== undefined
                  ? updates["organizer.image"]
                  : org.image,
    };
    delete updates.organizerName;
    delete updates.organizerPosition;
    delete updates.organizerEmail;
    delete updates.organizerPhone;
    delete updates["organizer.image"];

    // ── Gallery: remove selected ─────────────────────────
    if (updates.removeGallery) {
      const toRemove = parseArrayField(updates.removeGallery);
      const remaining = (existing.gallery || []).filter((url) => !toRemove.includes(url));
      for (const url of toRemove) await deleteFromCloudinary(url);
      updates.gallery = remaining;
    } else {
      updates.gallery = existing.gallery || [];
    }
    delete updates.removeGallery;

    // ── Gallery: add new ─────────────────────────────────
    if (req.files?.gallery) {
      const rawGallery = Array.isArray(req.files.gallery) ? req.files.gallery : [req.files.gallery];
      for (const file of rawGallery) {
        const url = await uploadToCloudinary(file.data, "events/gallery");
        updates.gallery.push(url);
      }
    }

    const event = await Event.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: event, message: "Event updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────
   ADMIN — DELETE EVENT
───────────────────────────────────────────────────────── */
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    await deleteFromCloudinary(event.image);
    await deleteFromCloudinary(event.organizer?.image);
    for (const url of event.gallery || []) await deleteFromCloudinary(url);

    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Event deleted successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────
   ADMIN — TOGGLE isActive
───────────────────────────────────────────────────────── */
export const toggleEventStatus = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    event.isActive = !event.isActive;
    await event.save();
    res.json({ success: true, data: event, message: `Status changed to ${event.isActive ? "Active" : "Inactive"}` });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────
   PUBLIC — GET ALL ACTIVE EVENTS
───────────────────────────────────────────────────────── */
export const getPublicEvents = async (req, res) => {
  try {
    const { category, limit = 10, page = 1 } = req.query;
    const query = { isActive: true };
    if (category) query.category = category;

    const total  = await Event.countDocuments(query);
    const events = await Event.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("title day month date time location category image isFeatured description");

    res.json({
      success: true, data: events,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
    });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────
   PUBLIC — GET SINGLE ACTIVE EVENT
───────────────────────────────────────────────────────── */
export const getPublicEventById = async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, isActive: true });
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, data: event });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};