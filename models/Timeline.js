import mongoose from "mongoose";

/* ══════════════════════════════════════════════════════════════
   Timeline — Year-wise milestones
   e.g. 2015 → "Platform launched..."
══════════════════════════════════════════════════════════════ */
const timelineSchema = new mongoose.Schema(
  {
    year:     { type: String, required: [true, "Year is required"], trim: true },
    text:     { type: String, required: [true, "Text is required"], trim: true },
    order:    { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

timelineSchema.index({ order: 1 });

const Timeline = mongoose.model("Timeline", timelineSchema);
export default Timeline;