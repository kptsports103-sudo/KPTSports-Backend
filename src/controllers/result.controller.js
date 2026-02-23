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
    if (!normalizedMasterId || !event || !year || !medal) {
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

    const result = new Result({
      name: player.name || '',
      playerMasterId: normalizedMasterId,
      playerId: String(player.playerId || '').trim(),
      branch: player.branch || '',
      event,
      year,
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
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateResult = async (req, res) => {
  try {
    const updateData = { ...req.body };
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

    if (req.file) {
      updateData.imageUrl = `/uploads/results/${req.file.filename}`;
    } else if (updateData.imageUrl === '' || !updateData.imageUrl?.trim()) {
      updateData.imageUrl = null;
    }

    const result = await Result.findByIdAndUpdate(
      req.params.id,
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
