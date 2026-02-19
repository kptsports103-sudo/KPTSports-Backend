const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    certificateId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    sequence: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      default: '',
      trim: true,
    },
    kpmNo: {
      type: String,
      default: '',
      trim: true,
    },
    semester: {
      type: String,
      default: '',
      trim: true,
    },
    department: {
      type: String,
      default: '',
      trim: true,
    },
    competition: {
      type: String,
      default: '',
      trim: true,
    },
    position: {
      type: String,
      default: '',
      trim: true,
    },
    achievement: {
      type: String,
      default: '',
      trim: true,
    },
    issuedBy: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

certificateSchema.index(
  { studentId: 1, year: 1, competition: 1, position: 1 },
  { unique: true, name: 'uq_student_year_competition_position' }
);

module.exports = mongoose.model('Certificate', certificateSchema);
