const Event = require('../models/event.model');
const { deriveRegistrationStatus, normalizeDateInput } = require('../utils/eventRegistration.util');

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeSportType = (value) => {
  const safeValue = String(value || '').trim().toLowerCase();
  if (safeValue === 'team sport' || safeValue === 'team sports') return 'Team Sports';
  if (safeValue === 'athletics') return 'Athletics';
  return 'Others';
};

const serializeEvent = (item) => ({
  ...item,
  sportType: normalizeSportType(item?.sportType),
  teamSizeMin: String(item?.eventType || '') === 'Team' ? item?.teamSizeMin ?? null : 1,
  teamSizeMax: String(item?.eventType || '') === 'Team' ? item?.teamSizeMax ?? null : 1,
  registrationStatus: deriveRegistrationStatus(item?.registrationStartDate, item?.registrationEndDate),
});

const findDuplicateEvent = async (eventName, excludeId = null) => {
  const safeEventName = String(eventName || '').trim();
  if (!safeEventName) return null;

  const query = {
    $or: [
      { eventName: { $regex: `^${escapeRegex(safeEventName)}$`, $options: 'i' } },
      { event_title: { $regex: `^${escapeRegex(safeEventName)}$`, $options: 'i' } },
    ],
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return Event.findOne(query).lean();
};

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().lean();
    res.json(events.map(serializeEvent));
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
    eventDate,
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

    const duplicateEvent = await findDuplicateEvent(resolvedEventName);
    if (duplicateEvent) {
      return res.status(400).json({ error: 'Event name already exists. Use a different event name.' });
    }

    const resolvedSportType = normalizeSportType(sportType);
    const resolvedEventType =
      resolvedSportType === 'Team Sports' || eventType === 'Team' ? 'Team' : 'Individual';
    const minTeamSize =
      resolvedEventType === 'Team' && Number.isFinite(Number(teamSizeMin)) ? Number(teamSizeMin) : 1;
    const maxTeamSize =
      resolvedEventType === 'Team' && Number.isFinite(Number(teamSizeMax)) ? Number(teamSizeMax) : 1;
    const resolvedRegistrationStartDate = normalizeDateInput(registrationStartDate) || 'TBA';
    const resolvedRegistrationEndDate = normalizeDateInput(registrationEndDate) || 'TBA';
    const resolvedRegistrationStatus = deriveRegistrationStatus(
      resolvedRegistrationStartDate,
      resolvedRegistrationEndDate
    );

    if (resolvedEventType === 'Team' && minTeamSize !== null && maxTeamSize !== null && minTeamSize > maxTeamSize) {
      return res.status(400).json({ error: 'teamSizeMin cannot be greater than teamSizeMax' });
    }

    const event = new Event({
      eventName: resolvedEventName,
      category,
      sportType: resolvedSportType,
      eventType: resolvedEventType,
      teamSizeMin: minTeamSize,
      teamSizeMax: maxTeamSize,
      level: '',
      gender,
      date: date || eventDate || event_date,
      eventDate: eventDate || date || event_date || 'TBA',
      eventTime: eventTime || 'TBA',
      registrationStartDate: resolvedRegistrationStartDate,
      registrationEndDate: resolvedRegistrationEndDate,
      registrationStatus: resolvedRegistrationStatus,
      event_title: resolvedEventName,
      event_level: '',
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
    event.event_level = '';
    event.event_date = event.event_date || event.eventDate || event.date || '';

    await event.save();
    res.status(201).json(serializeEvent(event.toObject()));
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const payload = { ...req.body };
    const existingEvent = await Event.findById(id).lean();
    if (!existingEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (payload.eventName || payload.event_title) {
      payload.eventName = String(payload.eventName || payload.event_title || '').trim();
      payload.event_title = payload.event_title || payload.eventName;

      if (!payload.eventName) {
        return res.status(400).json({ error: 'Event name is required' });
      }

      const duplicateEvent = await findDuplicateEvent(payload.eventName, id);
      if (duplicateEvent) {
        return res.status(400).json({ error: 'Event name already exists. Use a different event name.' });
      }
    }

    payload.level = '';
    payload.event_level = '';

    if (payload.date || payload.eventDate || payload.event_date) {
      const resolvedDate = payload.eventDate || payload.date || payload.event_date;
      payload.date = resolvedDate;
      payload.eventDate = resolvedDate;
      payload.event_date = resolvedDate;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'eventTime')) {
      payload.eventTime = payload.eventTime || 'TBA';
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'registrationStartDate')) {
      payload.registrationStartDate = normalizeDateInput(payload.registrationStartDate) || 'TBA';
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'registrationEndDate')) {
      payload.registrationEndDate = normalizeDateInput(payload.registrationEndDate) || 'TBA';
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'sportType')) {
      payload.sportType = normalizeSportType(payload.sportType);
    }

    const resolvedSportType = normalizeSportType(payload.sportType || existingEvent.sportType);
    payload.sportType = resolvedSportType;

    const nextEventType =
      resolvedSportType === 'Team Sports'
        ? 'Team'
        : (payload.eventType || existingEvent.eventType || 'Individual');
    payload.eventType = nextEventType;

    if (nextEventType !== 'Team') {
      payload.teamSizeMin = 1;
      payload.teamSizeMax = 1;
    } else if (
      Number.isFinite(Number(payload.teamSizeMin)) &&
      Number.isFinite(Number(payload.teamSizeMax)) &&
      Number(payload.teamSizeMin) > Number(payload.teamSizeMax)
    ) {
      return res.status(400).json({ error: 'teamSizeMin cannot be greater than teamSizeMax' });
    }

    const nextRegistrationStartDate =
      payload.registrationStartDate ?? existingEvent.registrationStartDate ?? 'TBA';
    const nextRegistrationEndDate =
      payload.registrationEndDate ?? existingEvent.registrationEndDate ?? 'TBA';
    payload.registrationStatus = deriveRegistrationStatus(nextRegistrationStartDate, nextRegistrationEndDate);

    const event = await Event.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    res.json(serializeEvent(event.toObject()));
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
