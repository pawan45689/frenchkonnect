import LiveClass from "../models/liveClassModel.js";

// ── PUBLIC ──────────────────────────────────────────────────

// GET /api/v1/live-classes?status=upcoming
export const getLiveClasses = async (req, res) => {
  try {
    const { status = "upcoming" } = req.query;
    const classes = await LiveClass.find({ status, isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 });
    res.json({ success: true, data: classes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADMIN ────────────────────────────────────────────────────

// GET /api/v1/admin/live-classes
export const adminGetLiveClasses = async (req, res) => {
  try {
    const { status = "" } = req.query;
    const query = {};
    if (status) query.status = status;

    const classes = await LiveClass.find(query)
      .sort({ displayOrder: 1, createdAt: -1 });
    res.json({ success: true, data: classes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/admin/live-classes
export const adminCreateLiveClass = async (req, res) => {
  try {
    const { title, host, day, month, time, platform, status, isBig, bullets, joinUrl, displayOrder } = req.body;

    if (!title || !host || !day || !month || !time)
      return res.status(400).json({ success: false, message: "Title, host, day, month and time are required" });

    const liveClass = await LiveClass.create({
      title, host, day, month, time,
      platform:     platform     || "",
      status:       status       || "upcoming",
      isBig:        isBig === "true" || isBig === true,
      bullets:      Array.isArray(bullets) ? bullets : [],
      joinUrl:      joinUrl      || "",
      displayOrder: Number(displayOrder) || 0,
    });

    res.status(201).json({ success: true, data: liveClass, message: "Live class created" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/admin/live-classes/:id
export const adminUpdateLiveClass = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (updates.isBig !== undefined)
      updates.isBig = updates.isBig === "true" || updates.isBig === true;
    if (updates.displayOrder !== undefined)
      updates.displayOrder = Number(updates.displayOrder);

    const liveClass = await LiveClass.findByIdAndUpdate(
      req.params.id, updates, { new: true, runValidators: true }
    );
    if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });
    res.json({ success: true, data: liveClass, message: "Live class updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/v1/admin/live-classes/:id
export const adminDeleteLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findByIdAndDelete(req.params.id);
    if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });
    res.json({ success: true, message: "Live class deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/v1/admin/live-classes/:id/toggle
export const adminToggleLiveClass = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) return res.status(404).json({ success: false, message: "Class not found" });
    liveClass.isActive = !liveClass.isActive;
    await liveClass.save();
    res.json({ success: true, data: liveClass, message: `Status changed to ${liveClass.isActive ? "Active" : "Inactive"}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};