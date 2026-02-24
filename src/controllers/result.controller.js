const Result = require('../models/result.model');
const Player = require('../models/player.model');

exports.getResults = async (req, res) => {
  try {
    const { year, medal, search } = req.query;

    const query = {};
    if (year && year !== 'all') query.year = Number(year);
    if (medal && medal !== 'all') query.medal = medal;
    if (search) query.name = new RegExp(search, 'i');

    const results = await Result.find(query).sort({ order: 1 });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createResult = async (req, res) => {
  try {
    const {
      playerMasterId,
      event,
      year,
      medal,
      imageUrl
    } = req.body;
    const normalizedMasterId = String(playerMasterId || '').trim();
    const normalizedEvent = String(event || '').trim();
    const normalizedYear = Number(year);

    if (!normalizedMasterId || !normalizedEvent || !normalizedYear || !medal) {
      return res.status(400).json({ message: 'playerMasterId, event, year and medal are required.' });
    }

    const player = await Player.findOne({ masterId: normalizedMasterId })
      .sort({ year: -1, updatedAt: -1, createdAt: -1 })
      .lean();

    if (!player) {
      return res.status(400).json({ message: 'Selected player not found in players master data.' });
    }

    const normalizedImageUrl = req.file ? `/uploads/results/${req.file.filename}` : (imageUrl && imageUrl.trim() ? imageUrl : null);
    const resolvedDiplomaYear = Number(player.currentDiplomaYear || player.baseDiplomaYear || player.diplomaYear || null);
    if (![1, 2, 3].includes(resolvedDiplomaYear)) {
      return res.status(400).json({ message: 'Selected player has invalid diploma year in master data.' });
    }

    const existing = await Result.findOne({
      playerMasterId: normalizedMasterId,
      event: normalizedEvent,
      year: normalizedYear
    }).lean();

    if (existing) {
      return res.status(400).json({
        message: 'Result already exists for this player in this event.'
      });
    }

    const result = new Result({
      name: player.name || '',
      playerMasterId: normalizedMasterId,
      playerId: String(player.playerId || '').trim(),
      branch: player.branch || '',
      event: normalizedEvent,
      year: normalizedYear,
      medal,
      diplomaYear: resolvedDiplomaYear,
      imageUrl: normalizedImageUrl,
    });

    await result.save();
    res.status(201).json(result);
  } catch (error) {
    console.error('Create result error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    if (error?.code === 11000) {
      return res.status(400).json({
        message: 'Result already exists for this player in this event.'
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateResult = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (Object.prototype.hasOwnProperty.call(updateData, 'event')) {
      updateData.event = String(updateData.event || '').trim();
    }
    if (Object.prototype.hasOwnProperty.call(updateData, 'year')) {
      updateData.year = Number(updateData.year);
      if (!updateData.year) {
        return res.status(400).json({ message: 'year is required.' });
      }
    }
    if (Object.prototype.hasOwnProperty.call(updateData, 'playerMasterId')) {
      updateData.playerMasterId = String(updateData.playerMasterId || '').trim();
      if (!updateData.playerMasterId) {
        return res.status(400).json({ message: 'playerMasterId is required.' });
      }

      const player = await Player.findOne({ masterId: updateData.playerMasterId })
        .sort({ year: -1, updatedAt: -1, createdAt: -1 })
        .lean();

      if (!player) {
        return res.status(400).json({ message: 'Selected player not found in players master data.' });
      }

      updateData.name = player.name || '';
      updateData.branch = player.branch || '';
      updateData.playerId = String(player.playerId || '').trim();
      updateData.diplomaYear = Number(player.currentDiplomaYear || player.baseDiplomaYear || player.diplomaYear || null);
      if (![1, 2, 3].includes(updateData.diplomaYear)) {
        return res.status(400).json({ message: 'Selected player has invalid diploma year in master data.' });
      }
    }

    const current = await Result.findById(req.params.id).lean();
    if (!current) {
      return res.status(404).json({ message: 'Result not found' });
    }

    const finalMasterId = Object.prototype.hasOwnProperty.call(updateData, 'playerMasterId')
      ? updateData.playerMasterId
      : current.playerMasterId;
    const finalEvent = Object.prototype.hasOwnProperty.call(updateData, 'event')
      ? String(updateData.event || '').trim()
      : String(current.event || '').trim();
    const finalYear = Object.prototype.hasOwnProperty.call(updateData, 'year')
      ? Number(updateData.year)
      : Number(current.year);

    if (!finalMasterId || !finalEvent || !finalYear) {
      return res.status(400).json({ message: 'playerMasterId, event and year are required.' });
    }

    const duplicate = await Result.findOne({
      _id: { $ne: req.params.id },
      playerMasterId: finalMasterId,
      event: finalEvent,
      year: finalYear
    }).lean();

    if (duplicate) {
      return res.status(400).json({
        message: 'Result already exists for this player in this event.'
      });
    }

    updateData.playerMasterId = finalMasterId;
    updateData.event = finalEvent;
    updateData.year = finalYear;

    if (req.file) {
      updateData.imageUrl = `/uploads/results/${req.file.filename}`;
    } else if (updateData.imageUrl === '' || !updateData.imageUrl?.trim()) {
      updateData.imageUrl = null;
    }

    const result = await Result.findByIdAndUpdate(
      current._id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    res.json(result);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    if (error?.code === 11000) {
      return res.status(400).json({
        message: 'Result already exists for this player in this event.'
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteResult = async (req, res) => {
  try {
    const result = await Result.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    res.json({ message: 'Result deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.reorderResults = async (req, res) => {
  try {
    const { year, order } = req.body;

    const bulk = order.map((id, index) => ({
      updateOne: {
        filter: { _id: id, year },
        update: { order: index }
      }
    }));

    await Result.bulkWrite(bulk);
    res.json({ success: true });
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
