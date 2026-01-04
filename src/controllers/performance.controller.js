const Performance = require('../models/performance.model');

exports.getPerformances = async (req, res) => {
  try {
    const performances = await Performance.find({ coachId: req.user.id }).sort({ createdAt: -1 });
    res.json(performances);
  } catch (error) {
    console.error('Error fetching performances:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.savePerformances = async (req, res) => {
  try {
    const { performances } = req.body;

    // Delete existing performances for this coach
    await Performance.deleteMany({ coachId: req.user.id });

    // Save new performances
    const savedPerformances = [];
    for (const performance of performances) {
      const newPerformance = new Performance({
        ...performance,
        coachId: req.user.id
      });
      await newPerformance.save();
      savedPerformances.push(newPerformance);
    }

    res.json({ message: 'Performances saved successfully', performances: savedPerformances });
  } catch (error) {
    console.error('Error saving performances:', error);
    res.status(500).json({ message: 'Server error' });
  }
};