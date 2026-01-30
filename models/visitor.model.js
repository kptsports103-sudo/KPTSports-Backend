import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema({
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    unique: true
  },
  count: {
    type: Number,
    default: 1
  }
});

export default mongoose.model("Visitor", visitorSchema);
