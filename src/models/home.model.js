const mongoose = require('mongoose');

const homeSchema = new mongoose.Schema({
  welcomeText: {
    type: String,
    default: ''
  },
  banners: [{
    video: {
      type: String,
      default: ''
    },
    year: {
      type: Number,
      default: 0
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
  bannerImages: [{
    image: {
      type: String,
      default: ''
    },
    year: {
      type: Number,
      default: 0
    },
    fixed: {
      type: Boolean,
      default: false
    }
  }],
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