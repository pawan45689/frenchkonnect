import News from "../models/newsModel.js";
import path from "path";
import XLSX from "xlsx";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

// ── fs aur ensureDir hata diye — ab disk pe kuch save nahi hoga ──

const normalizeHeaders = (rows) => {
  return rows.map((row) => {
    const normalized = {};
    Object.keys(row).forEach((key) => {
      const cleanKey = key.toLowerCase().replace(/[^a-z]/g, "");
      normalized[cleanKey] = row[key];
    });
    return normalized;
  });
};

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
   GET ALL NEWS (Admin)
───────────────────────────────────────────────────────── */
export const getAllNews = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", category = "", tab = "", status = "" } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { title:    { $regex: search, $options: "i" } },
        { author:   { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }
    if (category) query.category = category;
    if (tab)      query.tab      = tab;
    if (status)   query.status   = status;

    const total = await News.countDocuments(query);
    const news  = await News.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true, data: news,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
    });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────
   GET SINGLE NEWS (Admin)
───────────────────────────────────────────────────────── */
export const getNewsById = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ success: false, message: "News not found" });
    res.json({ success: true, data: news });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────
   CREATE NEWS
───────────────────────────────────────────────────────── */
export const createNews = async (req, res) => {
  try {
    const {
      title, category, author, authorRole, date,
      readTime, excerpt, content, featuredImageCaption,
      tags, secondaryCategories,
      tab, isFeatured, status, displayOrder,
    } = req.body;

    if (!title || !category || !author) {
      return res.status(400).json({ success: false, message: "Title, category and author are required" });
    }

    let image = null;
    if (req.files?.image) {
      image = await uploadToCloudinary(req.files.image.data, "news");
    }

    let authorImage = null;
    if (req.files?.authorImage) {
      authorImage = await uploadToCloudinary(req.files.authorImage.data, "news/authors");
    }

    let images = [];
    if (req.files?.images) {
      const rawImages = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      for (const file of rawImages) {
        const url = await uploadToCloudinary(file.data, "news/extra");
        images.push(url);
      }
    }

    const news = await News.create({
      title, category,
      author, authorRole: authorRole || "",
      date: date || Date.now(),
      readTime: readTime || "",
      excerpt, content,
      featuredImageCaption: featuredImageCaption || "",
      tags:                parseArrayField(tags),
      secondaryCategories: parseArrayField(secondaryCategories),
      image, authorImage, images,
      tab:          tab      || "latest",
      isFeatured:   isFeatured === "true" || isFeatured === true,
      status:       status   || "active",
      displayOrder: Number(displayOrder) || 0,
      source: "manual",
    });

    res.status(201).json({ success: true, data: news, message: "News created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────
   UPDATE NEWS
───────────────────────────────────────────────────────── */
export const updateNews = async (req, res) => {
  try {
    const existing = await News.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "News not found" });

    const updates = { ...req.body };

    if (updates.tags)                updates.tags                = parseArrayField(updates.tags);
    if (updates.secondaryCategories) updates.secondaryCategories = parseArrayField(updates.secondaryCategories);

    if (updates.isFeatured !== undefined) {
      updates.isFeatured = updates.isFeatured === "true" || updates.isFeatured === true;
    }

    if (req.files?.image) {
      await deleteFromCloudinary(existing.image);
      updates.image = await uploadToCloudinary(req.files.image.data, "news");
    } else if (updates.removeImage === "true") {
      await deleteFromCloudinary(existing.image);
      updates.image = null;
    }
    delete updates.removeImage;

    if (req.files?.authorImage) {
      await deleteFromCloudinary(existing.authorImage);
      updates.authorImage = await uploadToCloudinary(req.files.authorImage.data, "news/authors");
    } else if (updates.removeAuthorImage === "true") {
      await deleteFromCloudinary(existing.authorImage);
      updates.authorImage = null;
    }
    delete updates.removeAuthorImage;

    if (updates.removeImages) {
      const toRemove = parseArrayField(updates.removeImages);
      const remaining = (existing.images || []).filter((img) => !toRemove.includes(img));
      for (const img of toRemove) await deleteFromCloudinary(img);
      updates.images = remaining;
    } else {
      updates.images = existing.images || [];
    }
    delete updates.removeImages;

    if (req.files?.images) {
      const rawImages = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      for (const file of rawImages) {
        const url = await uploadToCloudinary(file.data, "news/extra");
        updates.images.push(url);
      }
    }

    const news = await News.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: news, message: "News updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────
   DELETE NEWS
───────────────────────────────────────────────────────── */
export const deleteNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ success: false, message: "News not found" });

    await deleteFromCloudinary(news.image);
    await deleteFromCloudinary(news.authorImage);
    for (const img of news.images || []) await deleteFromCloudinary(img);

    await News.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "News deleted successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────
   TOGGLE STATUS
───────────────────────────────────────────────────────── */
export const toggleNewsStatus = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ success: false, message: "News not found" });
    news.status = news.status === "active" ? "inactive" : "active";
    await news.save();
    res.json({ success: true, data: news, message: `Status changed to ${news.status}` });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────
   CSV / EXCEL IMPORT — Buffer se directly parse (disk pe kuch save nahi)
───────────────────────────────────────────────────────── */
export const uploadNewsFile = async (req, res) => {
  try {
    if (!req.files?.file) {
      return res.status(400).json({ success: false, message: "Please upload a CSV or Excel file" });
    }

    const file = req.files.file;
    const ext  = path.extname(file.name).toLowerCase();

    if (![".csv", ".xlsx", ".xls"].includes(ext)) {
      return res.status(400).json({ success: false, message: "Only .csv, .xlsx, .xls files are allowed" });
    }

    // ── Disk pe save nahi — buffer se directly parse ──
    let rows = [];

    if (ext === ".csv") {
      // Buffer ko string mein convert karo
      const content = file.data.toString("utf-8");
      const lines   = content.split("\n").filter((l) => l.trim());
      const headers = lines[0]
        .split(",")
        .map((h) => h.trim().replace(/"/g, "").toLowerCase().replace(/[^a-z]/g, ""));

      rows = lines.slice(1).map((line) => {
        const values = [];
        let current  = "";
        let inQuotes = false;
        for (const char of line) {
          if (char === '"')                   { inQuotes = !inQuotes; }
          else if (char === "," && !inQuotes) { values.push(current.trim()); current = ""; }
          else                                { current += char; }
        }
        values.push(current.trim());
        const obj = {};
        headers.forEach((h, i) => { obj[h] = (values[i] || "").replace(/"/g, ""); });
        return obj;
      });

    } else {
      // XLSX — buffer se directly read karo (file.data already Buffer hai)
      const workbook = XLSX.read(file.data, { type: "buffer" });
      const rawRows  = XLSX.utils.sheet_to_json(
        workbook.Sheets[workbook.SheetNames[0]],
        { defval: "", raw: false }
      );
      rows = normalizeHeaders(rawRows);
    }

    if (!rows.length) {
      return res.status(400).json({ success: false, message: "File is empty or has no valid rows" });
    }

    const validCategories = [
      "Politics","Sports","Business","Technology","Entertainment",
      "Health","Science","Travel","Finance","Innovation",
      "Leadership","Marketing","Strategy","Style","Other",
    ];
    const validTabs = ["top-stories","trending","latest","featured","secondary"];

    const newsToInsert = [];
    const errors       = [];

    rows.forEach((row, index) => {
      const title = (row.title || "").toString().trim();
      if (!title) {
        errors.push(`Row ${index + 2}: Title is required`);
        return;
      }

      const category   = (row.category   || "Other").toString().trim();
      const tab        = (row.tab        || "latest").toString().trim();
      const status     = (row.status     || "active").toString().toLowerCase().trim();
      const isFeatured = (row.isfeatured || "false").toString().toLowerCase().trim();

      const imageVal       = (row.image       || "").toString().trim();
      const authorImageVal = (row.authorimage || "").toString().trim();
      const imagesRaw      = (row.images      || "").toString().trim();
      const images         = imagesRaw
        ? imagesRaw.split("|").map((s) => s.trim()).filter(Boolean)
        : [];

      const tagsRaw = (row.tags || "").toString().trim();
      const tags    = tagsRaw ? tagsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];

      const secRaw = (row.secondarycategories || "").toString().trim();
      const secondaryCategories = secRaw
        ? secRaw.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      newsToInsert.push({
        title,
        category:             validCategories.includes(category) ? category : "Other",
        secondaryCategories,
        author:               (row.author     || "Admin").toString().trim(),
        authorRole:           (row.authorrole || "").toString().trim(),
        date:                 row.date ? new Date(row.date) : new Date(),
        readTime:             (row.readtime   || "").toString().trim(),
        excerpt:              (row.excerpt    || "").toString().trim(),
        content:              (row.content    || "").toString().trim(),
        featuredImageCaption: (row.featuredimagecaption || "").toString().trim(),
        tags,
        tab:          validTabs.includes(tab) ? tab : "latest",
        isFeatured:   isFeatured === "true",
        status:       status === "active" ? "active" : "inactive",
        displayOrder: parseInt(row.displayorder || 0) || 0,
        source:       ext === ".csv" ? "csv" : "excel",
        image:        imageVal       || null,
        authorImage:  authorImageVal || null,
        images,
      });
    });

    let insertedCount = 0;
    if (newsToInsert.length > 0) {
      const result = await News.insertMany(newsToInsert, { ordered: false });
      insertedCount = result.length;
    }

    res.json({
      success: true,
      message: `Import complete! ${insertedCount} news articles imported.`,
      summary: {
        totalRows: rows.length,
        inserted:  insertedCount,
        skipped:   rows.length - newsToInsert.length,
        errors:    errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error("uploadNewsFile error:", error);
    res.status(500).json({ success: false, message: error.message || "Import failed" });
  }
};

/* ─────────────────────────────────────────────────────────
   PUBLIC NEWS (Frontend Website)
───────────────────────────────────────────────────────── */
export const getPublicNews = async (req, res) => {
  try {
    const { tab, category, limit = 10, page = 1 } = req.query;
    const query = { status: "active" };
    if (tab)      query.tab      = tab;
    if (category) query.category = category;

    const total = await News.countDocuments(query);
    const news  = await News.find(query)
      .sort({ displayOrder: 1, date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("title category secondaryCategories author authorRole authorImage date readTime excerpt image images tab isFeatured tags commentCount");

    res.json({
      success: true, data: news,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
    });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────
   PUBLIC SINGLE NEWS (Frontend Details Page)
───────────────────────────────────────────────────────── */
export const getPublicNewsById = async (req, res) => {
  try {
    const news = await News.findOne({ _id: req.params.id, status: "active" });
    if (!news) return res.status(404).json({ success: false, message: "News not found" });
    res.json({ success: true, data: news });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};