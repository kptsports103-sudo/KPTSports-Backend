const Achievement = require('../models/achievement.model');

exports.getAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.find();
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createAchievement = async (req, res) => {
  const { title, year, teamOrPlayer, description } = req.body;
  try {
    const achievement = new Achievement({ title, year, teamOrPlayer, description });
    await achievement.save();
    res.status(201).json(achievement);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateAchievement = async (req, res) => {
  const { id } = req.params;
  try {
    const achievement = await Achievement.findByIdAndUpdate(id, req.body, { new: true });
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }
    res.json(achievement);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteAchievement = async (req, res) => {
  const { id } = req.params;
  try {
    const achievement = await Achievement.findByIdAndDelete(id);
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }
    res.json({ message: 'Achievement deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};