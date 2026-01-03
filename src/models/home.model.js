const mongoose = require('mongoose');

const homeSchema = new mongoose.Schema({
  welcomeText: {
    type: String,
    default: ''
  },
  banners: [{
    image: {
      type: String,
      required: true
    },
    year: {
      type: Number,
      required: false
    },
    fixed: {
      type: Boolean,
      default: false
    }
  }],
  highlights: [{
    title: {
      type: String,
      required: true
    },
    overview: {
      type: String,
      required: true
    },
    url: {
      type: String,
      default: ''
    },
    urlFixed: {
      type: Boolean,
      default: false
    }
  }],
  about: {
    type: String,
    default: ''
  },
  history: {
    type: String,
    default: ''
  },
  // About page specific fields
  bannerVideo: {
    type: String,
    default: ''
  },
  boxes: [{
    type: String
  }],
  bigHeader: {
    type: String,
    default: ''
  },
  bigText: {
    type: String,
    default: ''
  },
  timeline: [{
    year: {
      type: String,
      default: ''
    },
    host: {
      type: String,
      default: ''
    },
    venue: {
      type: String,
      default: ''
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Home', homeSchema);