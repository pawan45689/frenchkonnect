import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
  time:  { type: String },
  title: { type: String },
  desc:  { type: String },
}, { _id: false });

const organizerSchema = new mongoose.Schema({
  name:     { type: String },
  position: { type: String },
  email:    { type: String },
  phone:    { type: String },
  image:    { type: String },
}, { _id: false });

const eventSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    day:         { type: String, required: true },
    month:       { type: String, required: true },
    date:        { type: String },
    time:        { type: String },
    location:    { type: String },
    category:    { type: String },
    seatsCount:  { type: String },       

    description:  { type: String },
    description2: { type: String },
    highlights:   [{ type: String }],
    schedule:     [scheduleSchema],

    image:   { type: String },
    gallery: [{ type: String }],

    organizer: organizerSchema,

    isFeatured:   { type: Boolean, default: false },
    isActive:     { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);