const Result = require('../models/result.model');

exports.getResults = async (req, res) => {
  try {
    const results = await Result.find().sort({ year: -1 });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createResult = async (req, res) => {
  try {
    const { name, event, year, medal, imageUrl } = req.body;

    const result = new Result({
      name,
      event,
      year,
      medal,
      imageUrl,
    });

    await result.save();
    res.status(201).json(result);
  } catch (error) {
    console.error('Create result error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateResult = async (req, res) => {
  try {
    const result = await Result.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    res.json(result);
  } catch (error) {
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