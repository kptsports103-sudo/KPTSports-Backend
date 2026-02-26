const Event = require('../models/event.model');
const Registration = require('../models/registration.model');

const TEAM_EVENT_KEYWORDS = ['relay', 'cricket', 'kabaddi', 'volleyball', 'march past', 'marchpast'];

const inferTeamEvent = (eventDoc) => {
  if (!eventDoc) return false;
  if (String(eventDoc.eventType || '').toLowerCase() === 'team') return true;
  const name = String(eventDoc.eventName || eventDoc.event_title || '').toLowerCase();
  return TEAM_EVENT_KEYWORDS.some((keyword) => name.includes(keyword));
};

const getTeamSizeRules = (eventDoc) => {
  let min = Number(eventDoc?.teamSizeMin);
  let max = Number(eventDoc?.teamSizeMax);
  if (!Number.isFinite(min) || min < 2) min = 2;
  if (!Number.isFinite(max) || max < min) max = min;
  if (max > 30) max = 30;
  return { min, max };
};

exports.getRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find().sort({ createdAt: -1 });
    res.json(registrations);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createRegistration = async (req, res) => {
  try {
    const { eventId, teamName, teamHeadName, year, sem } = req.body;
    let members = Array.isArray(req.body.members) ? req.body.members : [];

    if (members.length === 0 && req.body.playerName && req.body.registerNumber && req.body.branch) {
      members = [
        {
          name: req.body.playerName,
          branch: req.body.branch,
          registerNumber: req.body.registerNumber,
        },
      ];
    }

    if (!eventId) return res.status(400).json({ error: 'Event is required.' });
    if (!teamHeadName || !String(teamHeadName).trim()) {
      return res.status(400).json({ error: 'Team head name is required.' });
    }
    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'Members are required.' });
    }

    const eventDoc = await Event.findById(eventId);
    if (!eventDoc) return res.status(404).json({ error: 'Event not found.' });

    if (String(eventDoc.registrationStatus || 'Open') === 'Closed') {
      return res.status(403).json({ error: 'Registration closed for this event.' });
    }

    const cleanedMembers = members.map((member) => ({
      name: String(member?.name || '').trim(),
      branch: String(member?.branch || '').trim(),
      registerNumber: String(member?.registerNumber || '').trim(),
      year: String(member?.year || year || '').trim(),
      sem: String(member?.sem || sem || '').trim(),
    }));

    for (let i = 0; i < cleanedMembers.length; i += 1) {
      const row = cleanedMembers[i];
      if (!row.name || !row.branch || !row.registerNumber || !row.year || !row.sem) {
        return res
          .status(400)
          .json({ error: `Row ${i + 1}: Fill Name, Branch, Register Number, Year, Sem.` });
      }
    }

    const registerNumbers = cleanedMembers.map((member) => member.registerNumber.toLowerCase());
    if (new Set(registerNumbers).size !== registerNumbers.length) {
      return res.status(400).json({ error: 'Duplicate Register Number inside roster.' });
    }

    const isTeamEvent = inferTeamEvent(eventDoc);
    if (isTeamEvent) {
      if (!teamName || !String(teamName).trim()) {
        return res.status(400).json({ error: 'Team name is required for team events.' });
      }
      const rules = getTeamSizeRules(eventDoc);
      if (cleanedMembers.length < rules.min) {
        return res.status(400).json({ error: `Minimum ${rules.min} players required.` });
      }
      if (cleanedMembers.length > rules.max) {
        return res.status(400).json({ error: `Maximum ${rules.max} players allowed.` });
      }
    } else if (cleanedMembers.length !== 1) {
      return res.status(400).json({ error: 'Individual event must have exactly 1 player.' });
    }

    const created = await Registration.create({
      eventId: eventDoc._id,
      eventName: eventDoc.eventName || eventDoc.event_title,
      teamName: isTeamEvent ? String(teamName || '').trim() : '',
      teamHeadName: String(teamHeadName).trim(),
      year: String(year || cleanedMembers[0]?.year || '').trim(),
      sem: String(sem || cleanedMembers[0]?.sem || '').trim(),
      members: cleanedMembers,
      status: 'Locked',
    });

    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating registration:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
