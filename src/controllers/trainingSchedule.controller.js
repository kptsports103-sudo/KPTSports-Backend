const TrainingSchedule = require('../models/trainingSchedule.model');

exports.getTrainingSchedules = async (req, res) => {
  try {
    const schedules = await TrainingSchedule.find({ coachId: req.user.id }).sort({ createdAt: -1 });
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching training schedules:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.saveTrainingSchedules = async (req, res) => {
  try {
    const { schedules } = req.body;

    // Delete existing schedules for this coach
    await TrainingSchedule.deleteMany({ coachId: req.user.id });

    // Save new schedules
    const savedSchedules = [];
    for (const schedule of schedules) {
      const newSchedule = new TrainingSchedule({
        ...schedule,
        coachId: req.user.id
      });
      await newSchedule.save();
      savedSchedules.push(newSchedule);
    }

    res.json({ message: 'Training schedules saved successfully', schedules: savedSchedules });
  } catch (error) {
    console.error('Error saving training schedules:', error);
    res.status(500).json({ message: 'Server error' });
  }
};