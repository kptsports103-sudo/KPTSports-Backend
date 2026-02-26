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
    eventName,
    category,
    sportType,
    eventType,
    teamSizeMin,
    teamSizeMax,
    level,
    gender,
    date,
    eventTime,
    registrationStartDate,
    registrationEndDate,
    registrationStatus,
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
    const resolvedEventName = String(eventName || event_title || '').trim();
    if (!resolvedEventName) {
      return res.status(400).json({ error: 'Event name is required' });
    }

    const resolvedEventType = eventType === 'Team' ? 'Team' : 'Individual';
    const minTeamSize =
      resolvedEventType === 'Team' && Number.isFinite(Number(teamSizeMin)) ? Number(teamSizeMin) : null;
    const maxTeamSize =
      resolvedEventType === 'Team' && Number.isFinite(Number(teamSizeMax)) ? Number(teamSizeMax) : null;

    if (resolvedEventType === 'Team' && minTeamSize !== null && maxTeamSize !== null && minTeamSize > maxTeamSize) {
      return res.status(400).json({ error: 'teamSizeMin cannot be greater than teamSizeMax' });
    }

    const event = new Event({
      eventName: resolvedEventName,
      category,
      sportType,
      eventType: resolvedEventType,
      teamSizeMin: minTeamSize,
      teamSizeMax: maxTeamSize,
      level: level || event_level,
      gender,
      date: date || event_date,
      eventTime: eventTime || '',
      registrationStartDate: registrationStartDate || '',
      registrationEndDate: registrationEndDate || '',
      registrationStatus: registrationStatus || 'Open',
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
      news_highlight,
    });

    // Keep legacy fields in sync so old pages continue to work
    event.event_title = event.event_title || resolvedEventName;
    event.event_level = event.event_level || event.level || 'Open';
    event.event_date = event.event_date || event.date || '';

    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const payload = { ...req.body };

    if (payload.eventName || payload.event_title) {
      payload.eventName = String(payload.eventName || payload.event_title || '').trim();
      payload.event_title = payload.event_title || payload.eventName;
    }

    if (payload.level || payload.event_level) {
      payload.level = payload.level || payload.event_level;
      payload.event_level = payload.event_level || payload.level;
    }

    if (payload.date || payload.event_date) {
      payload.date = payload.date || payload.event_date;
      payload.event_date = payload.event_date || payload.date;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'eventTime')) {
      payload.eventTime = payload.eventTime || '';
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'registrationStartDate')) {
      payload.registrationStartDate = payload.registrationStartDate || '';
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'registrationEndDate')) {
      payload.registrationEndDate = payload.registrationEndDate || '';
    }

    if (payload.eventType !== 'Team') {
      payload.teamSizeMin = null;
      payload.teamSizeMax = null;
    } else if (
      Number.isFinite(Number(payload.teamSizeMin)) &&
      Number.isFinite(Number(payload.teamSizeMax)) &&
      Number(payload.teamSizeMin) > Number(payload.teamSizeMax)
    ) {
      return res.status(400).json({ error: 'teamSizeMin cannot be greater than teamSizeMax' });
    }

    const event = await Event.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
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
