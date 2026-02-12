const Result = require('../models/result.model');

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
    const { name, playerId, event, year, medal, imageUrl, diplomaYear } = req.body;
    if (!playerId || !name || !event || !year || !medal || !diplomaYear) {
      return res.status(400).json({ message: 'playerId, name, event, year, medal and diplomaYear are required.' });
    }

    const normalizedImageUrl = req.file ? `/uploads/results/${req.file.filename}` : (imageUrl && imageUrl.trim() ? imageUrl : null);

    const result = new Result({
      name,
      playerId,
      event,
      year,
      medal,
      diplomaYear,
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
