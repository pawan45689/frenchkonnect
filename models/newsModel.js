import mongoose from "mongoose";

const newsSchema = new mongoose.Schema(
  {
    // ── Core Info ──────────────────────────────────────────
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [300, "Title cannot exceed 300 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Politics", "Sports", "Business", "Technology", "Entertainment",
        "Health", "Science", "Travel", "Finance", "Innovation",
        "Leadership", "Marketing", "Strategy", "Style", "Other",
      ],
      default: "Other",
    },
    // Additional category badges shown on details page
    secondaryCategories: {
      type: [String],
      default: [],
    },

    // ── Author Info ────────────────────────────────────────
    author: {
      type: String,
      required: [true, "Author is required"],
      trim: true,
    },
    authorRole: {
      type: String,
      trim: true,
      default: "",
    },
    authorImage: {
      type: String,
      default: null,
    },

    // ── Date & Time ────────────────────────────────────────
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    readTime: {
      type: String,
      default: "",
    },

    // ── Content ────────────────────────────────────────────
    excerpt: {
      type: String,
      trim: true,
      maxlength: [500, "Excerpt cannot exceed 500 characters"],
    },
    content: {
      type: String,
      trim: true,
    },

    // ── Images ─────────────────────────────────────────────
    // Primary / hero image (filename or full URL)
    image: {
      type: String,
      default: null,
    },
    featuredImageCaption: {
      type: String,
      trim: true,
      default: "",
    },
    // Additional gallery / inline images (filenames or URLs)
    images: {
      type: [String],
      default: [],
    },

    // ── Taxonomy & Discovery ──────────────────────────────
    tags: {
      type: [String],
      default: [],
    },

    // ── Engagement ────────────────────────────────────────
    commentCount: {
      type: Number,
      default: 0,
    },

    // ── Layout / Display ──────────────────────────────────
    tab: {
      type: String,
      enum: ["top-stories", "trending", "latest", "featured", "secondary"],
      default: "latest",
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    displayOrder: {
      type: Number,
      default: 0,
    },

    // ── Source ────────────────────────────────────────────
    source: {
      type: String,
      enum: ["manual", "csv", "excel"],
      default: "manual",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast queries
newsSchema.index({ category: 1, status: 1 });
newsSchema.index({ tab: 1, status: 1 });
newsSchema.index({ isFeatured: 1, status: 1 });
newsSchema.index({ tags: 1 });

const News = mongoose.model("News", newsSchema);
export default News;