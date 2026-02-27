import mongoose from "mongoose";

/* ══════════════════════════════════════════════════════════════
   CoreValue — 4 value cards in §1
   e.g. "Academic Excellence", "Community First"
══════════════════════════════════════════════════════════════ */
const coreValueSchema = new mongoose.Schema(
  {
    icon:     { type: String, required: [true, "Icon is required"], trim: true }, // e.g. "bi-book"
    title:    { type: String, required: [true, "Title is required"], trim: true },
    text:     { type: String, required: [true, "Text is required"],  trim: true },
    order:    { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

coreValueSchema.index({ order: 1 });

const CoreValue = mongoose.model("CoreValue", coreValueSchema);
export default CoreValue;