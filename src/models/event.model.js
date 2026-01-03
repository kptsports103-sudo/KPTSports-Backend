const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  event_title: {
    type: String,
    required: true,
  },
  event_level: {
    type: String,
  },
  event_date: {
    type: String,
  },
  venue: {
    type: String,
  },
  city: {
    type: String,
  },
  overall_champion: {
    type: String,
  },
  overall_champion_points: {
    type: Number,
  },
  runner_up: {
    type: String,
  },
  runner_up_points: {
    type: Number,
  },
  mens_individual_champion: {
    type: String,
  },
  mens_champion_institution: {
    type: String,
  },
  womens_individual_champion: {
    type: String,
  },
  womens_champion_institution: {
    type: String,
  },
  news_highlight: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Event', eventSchema);