const Attendance = require('../models/attendance.model');

exports.getAttendances = async (req, res) => {
  try {
    const attendances = await Attendance.find({ coachId: req.user.id }).sort({ date: -1 });
    res.json(attendances);
  } catch (error) {
    console.error('Error fetching attendances:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.saveAttendance = async (req, res) => {
  try {
    const { date, year, records } = req.body;

    // Check if attendance for this date already exists
    const existing = await Attendance.findOne({
      coachId: req.user.id,
      date: new Date(date)
    });

    if (existing) {
      // Update existing
      existing.records = records;
      await existing.save();
      res.json({ message: 'Attendance updated successfully', attendance: existing });
    } else {
      // Create new
      const newAttendance = new Attendance({
        date,
        year,
        records,
        coachId: req.user.id
      });
      await newAttendance.save();
      res.json({ message: 'Attendance saved successfully', attendance: newAttendance });
    }
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
};