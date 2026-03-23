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

export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, data: event });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createEvent = async (req, res) => {
  try {
    const {
      title, day, month, date, time, location, category,
      description, description2, highlights, schedule,
      isFeatured, isActive, displayOrder,
      organizerName, organizerPosition, organizerEmail, organizerPhone,
      seatsCount,
    } = req.body;

    if (!title || !day || !month)
      return res.status(400).json({ success: false, message: "Title, day and month are required" });

    // ✅ multer syntax — req.files.image[0].buffer
    let image = null;
    if (req.files?.image?.[0])
      image = await uploadToCloudinary(req.files.image[0].buffer, "events");

    let organizerImage = null;
    if (req.files?.organizerImage?.[0])
      organizerImage = await uploadToCloudinary(req.files.organizerImage[0].buffer, "events/organizers");

    let gallery = [];
    if (req.files?.gallery) {
      for (const file of req.files.gallery) {
        const url = await uploadToCloudinary(file.buffer, "events/gallery");
        gallery.push(url);
      }
    }

    const event = await Event.create({
      title, day, month,
      date:         date        || "",
      time:         time        || "",
      location:     location    || "",
      category:     category    || "",
      seatsCount:   seatsCount  || "",
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

    // ✅ multer syntax — image
    if (req.files?.image?.[0]) {
      await deleteFromCloudinary(existing.image);
      updates.image = await uploadToCloudinary(req.files.image[0].buffer, "events");
    } else if (updates.removeImage === "true") {
      await deleteFromCloudinary(existing.image);
      updates.image = null;
    }
    delete updates.removeImage;

    // ✅ multer syntax — organizerImage
    const existingOrgImg = existing.organizer?.image;
    if (req.files?.organizerImage?.[0]) {
      await deleteFromCloudinary(existingOrgImg);
      updates["organizer.image"] = await uploadToCloudinary(req.files.organizerImage[0].buffer, "events/organizers");
    } else if (updates.removeOrganizerImage === "true") {
      await deleteFromCloudinary(existingOrgImg);
      updates["organizer.image"] = null;
    }
    delete updates.removeOrganizerImage;

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

    // ✅ seatsCount explicitly set
    if (req.body.seatsCount !== undefined) {
      updates.seatsCount = req.body.seatsCount;
    }

    // ✅ gallery — remove selected
    if (updates.removeGallery) {
      const toRemove = parseArrayField(updates.removeGallery);
      const remaining = (existing.gallery || []).filter((url) => !toRemove.includes(url));
      for (const url of toRemove) await deleteFromCloudinary(url);
      updates.gallery = remaining;
    } else {
      updates.gallery = existing.gallery || [];
    }
    delete updates.removeGallery;

    // ✅ multer syntax — gallery new files
    if (req.files?.gallery) {
      for (const file of req.files.gallery) {
        const url = await uploadToCloudinary(file.buffer, "events/gallery");
        updates.gallery.push(url);
      }
    }

    const event = await Event.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: event, message: "Event updated successfully" });
  } catch (error) {
    
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

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

export const getPublicEvents = async (req, res) => {
  try {
    const { category, limit = 10, page = 1, search = "" } = req.query;
    const query = { isActive: true };
    if (category) query.category = { $regex: category, $options: "i" };
    if (search) {
      query.$or = [
        { title:    { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const total  = await Event.countDocuments(query);
    const events = await Event.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("title day month date time location category image isFeatured description seatsCount");

    res.json({
      success: true, data: events,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
    });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getPublicEventById = async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, isActive: true });
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, data: event });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};