const AdminActivityLog = require('../models/adminActivityLog.model');

// Create a new activity log entry
const createActivityLog = async (req, res) => {
  try {
    const { adminId, adminName, role, action, pageName, details } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || '';

    const newLog = new AdminActivityLog({
      adminId,
      adminName,
      role,
      action,
      pageName,
      ipAddress,
      details: details || ''
    });

    await newLog.save();

    res.status(201).json({
      success: true,
      message: 'Activity logged successfully',
      data: newLog
    });
  } catch (error) {
    console.error('Error creating activity log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create activity log',
      error: error.message
    });
  }
};

// Get activity logs for current admin
const getMyActivityLogs = async (req, res) => {
  try {
    // Convert to string for query
    const adminIdStr = req.user._id ? req.user._id.toString() : String(req.user._id);
    const limit = parseInt(req.query.limit) || 15;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const logs = await AdminActivityLog.find({ adminId: adminIdStr })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AdminActivityLog.countDocuments({ adminId: adminIdStr });

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message
    });
  }
};

// Get all activity logs (Super Admin only)
const getAllActivityLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Filter by date if provided
    let query = {};
    if (req.query.from && req.query.to) {
      query.createdAt = {
        $gte: new Date(req.query.from),
        $lte: new Date(req.query.to)
      };
    }

    // Search by admin name
    if (req.query.search) {
      query.adminName = { $regex: req.query.search, $options: 'i' };
    }

    const logs = await AdminActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('adminId', 'name email');

    const total = await AdminActivityLog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message
    });
  }
};

// Get activity logs by admin ID
const getActivityLogsByAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const limit = parseInt(req.query.limit) || 15;

    const logs = await AdminActivityLog.find({ adminId })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message
    });
  }
};

module.exports = {
  createActivityLog,
  getMyActivityLogs,
  getAllActivityLogs,
  getActivityLogsByAdmin
};
