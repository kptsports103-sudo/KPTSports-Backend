const cloudinary = require('../config/cloudinary');
const Winner = require('../models/winner.model');

const ALLOWED_MEDALS = ['Gold', 'Silver', 'Bronze'];

const normalizeWinnerPayload = (payload = {}) => ({
  eventName: String(payload.eventName || '').trim(),
  playerName: String(payload.playerName || '').trim(),
  medal: String(payload.medal || '').trim(),
  imageUrl: String(payload.imageUrl || '').trim(),
  imagePublicId: String(payload.imagePublicId || '').trim(),
});

const validateWinnerPayload = (payload) => {
  const errors = [];

  if (!payload.eventName) errors.push('eventName is required.');
  if (!payload.playerName) errors.push('playerName is required.');
  if (!payload.imageUrl) errors.push('imageUrl is required.');
  if (!ALLOWED_MEDALS.includes(payload.medal)) {
    errors.push(`medal must be one of: ${ALLOWED_MEDALS.join(', ')}.`);
  }

  return errors;
};

const destroyWinnerImage = async (publicId) => {
  const safePublicId = String(publicId || '').trim();
  if (!safePublicId) return;

  try {
    await cloudinary.uploader.destroy(safePublicId);
  } catch (error) {
    console.error('Failed to delete winner image from Cloudinary:', error?.message || error);
  }
};

exports.getWinners = async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 24)
      : null;

    const query = Winner.find({}).sort({ createdAt: -1 });
    if (limit) query.limit(limit);

    const winners = await query.lean();
    res.json(winners);
  } catch (error) {
    console.error('Error fetching winners:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createWinner = async (req, res) => {
  try {
    const payload = normalizeWinnerPayload(req.body);
    const errors = validateWinnerPayload(payload);

    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0], errors });
    }

    const winner = new Winner(payload);
    await winner.save();

    res.status(201).json(winner);
  } catch (error) {
    console.error('Error creating winner:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateWinner = async (req, res) => {
  try {
    const winner = await Winner.findById(req.params.id);
    if (!winner) {
      return res.status(404).json({ message: 'Winner not found' });
    }

    const payload = normalizeWinnerPayload({
      eventName: req.body.eventName ?? winner.eventName,
      playerName: req.body.playerName ?? winner.playerName,
      medal: req.body.medal ?? winner.medal,
      imageUrl: req.body.imageUrl ?? winner.imageUrl,
      imagePublicId: req.body.imagePublicId ?? winner.imagePublicId,
    });
    const errors = validateWinnerPayload(payload);

    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0], errors });
    }

    const previousImagePublicId = String(winner.imagePublicId || '').trim();
    const nextImagePublicId = String(payload.imagePublicId || '').trim();

    winner.eventName = payload.eventName;
    winner.playerName = payload.playerName;
    winner.medal = payload.medal;
    winner.imageUrl = payload.imageUrl;
    winner.imagePublicId = nextImagePublicId;

    await winner.save();

    if (previousImagePublicId && previousImagePublicId !== nextImagePublicId) {
      await destroyWinnerImage(previousImagePublicId);
    }

    res.json(winner);
  } catch (error) {
    console.error('Error updating winner:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteWinner = async (req, res) => {
  try {
    const winner = await Winner.findByIdAndDelete(req.params.id);
    if (!winner) {
      return res.status(404).json({ message: 'Winner not found' });
    }

    await destroyWinnerImage(winner.imagePublicId);

    res.json({ message: 'Winner deleted' });
  } catch (error) {
    console.error('Error deleting winner:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
