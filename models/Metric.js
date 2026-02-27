import mongoose from "mongoose";

/* ══════════════════════════════════════════════════════════════
   Metric — Stats cards in §2
   e.g. "96%", "First-Attempt Pass Rate"
══════════════════════════════════════════════════════════════ */
const metricSchema = new mongoose.Schema(
  {
    icon:     { type: String, required: [true, "Icon is required"],  trim: true }, // e.g. "bi-mortarboard-fill"
    value:    { type: String, required: [true, "Value is required"], trim: true }, // e.g. "96%"
    label:    { type: String, required: [true, "Label is required"], trim: true }, // e.g. "First-Attempt Pass Rate"
    sub:      { type: String, default: "", trim: true },                           // small description
    order:    { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

metricSchema.index({ order: 1 });

const Metric = mongoose.model("Metric", metricSchema);
export default Metric;