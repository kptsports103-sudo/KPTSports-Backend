const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    branch: { type: String, required: true, trim: true },
    registerNumber: { type: String, required: true, trim: true },
    year: { type: String, required: true, trim: true },
    sem: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const registrationSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    eventName: { type: String, required: true, trim: true },
    teamName: { type: String, default: '', trim: true },
    teamHeadName: { type: String, required: true, trim: true },
    year: { type: String, default: '', trim: true },
    sem: { type: String, default: '', trim: true },
    members: { type: [memberSchema], default: [] },
    status: { type: String, enum: ['Locked'], default: 'Locked' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Registration', registrationSchema);
