const Event = require('../models/event.model');

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createEvent = async (req, res) => {
  const {
    event_title,
    event_level,
    event_date,
    venue,
    city,
    overall_champion,
    overall_champion_points,
    runner_up,
    runner_up_points,
    mens_individual_champion,
    mens_champion_institution,
    womens_individual_champion,
    womens_champion_institution,
    news_highlight
  } = req.body;
  try {
    const event = new Event({
      event_title,
      event_level,
      event_date,
      venue,
      city,
      overall_champion,
      overall_champion_points,
      runner_up,
      runner_up_points,
      mens_individual_champion,
      mens_champion_institution,
      womens_individual_champion,
      womens_champion_institution,
      news_highlight
    });
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const event = await Event.findByIdAndUpdate(id, req.body, { new: true });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const event = await Event.findByIdAndDelete(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.saveEventsBulk = async (req, res) => {
  try {
    const { events } = req.body;
    // Clear existing events
    await Event.deleteMany({});
    // Save new events
    for (const eventData of events) {
      await Event.create(eventData);
    }
    res.json({ message: 'Events saved successfully' });
  } catch (error) {
    console.error('Error saving events:', error);
    res.status(500).json({ message: 'Server error' });
  }
};