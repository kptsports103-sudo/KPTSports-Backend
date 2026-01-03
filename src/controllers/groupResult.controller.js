const GroupResult = require('../models/groupResult.model');

const getGroupResults = async (req, res) => {
  try {
    const groupResults = await GroupResult.find().sort({ year: -1 });
    res.json(groupResults);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createGroupResult = async (req, res) => {
  try {
    const groupResult = new GroupResult(req.body);
    await groupResult.save();
    res.status(201).json(groupResult);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateGroupResult = async (req, res) => {
  try {
    const groupResult = await GroupResult.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!groupResult) {
      return res.status(404).json({ message: 'Group result not found' });
    }

    res.json(groupResult);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteGroupResult = async (req, res) => {
  try {
    const groupResult = await GroupResult.findByIdAndDelete(req.params.id);

    if (!groupResult) {
      return res.status(404).json({ message: 'Group result not found' });
    }

    res.json({ message: 'Group result deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getGroupResults,
  createGroupResult,
  updateGroupResult,
  deleteGroupResult,
};