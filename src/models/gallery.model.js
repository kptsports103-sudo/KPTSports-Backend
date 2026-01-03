const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  title: {
    type: String,
  },
  media: [{
    url: {
      type: String,
      required: true,
    },
    overview: {
      type: String,
      default: '',
    },
  }],
  visibility: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Gallery', gallerySchema);