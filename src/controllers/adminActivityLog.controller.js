const AdminActivityLog = require('../models/adminActivityLog.model');
const {
  createActivityLogEntry,
  resolvePageName,
} = require('../services/activityLog.service');

const buildSearchQuery = (search) => {
  const value = String(search || '').trim();
  if (!value) return null;

  return {
    $or: [
      { adminName: { $regex: value, $options: 'i' } },
      { adminEmail: { $regex: value, $options: 'i' } },
      { action: { $regex: value, $options: 'i' } },
      { pageName: { $regex: value, $options: 'i' } },
      { details: { $regex: value, $options: 'i' } },
      { route: { $regex: value, $options: 'i' } },
      { clientPath: { $regex: value, $options: 'i' } },
    ],
  };
};

// Create a new activity log entry
const createActivityLog = async (req, res) => {
  try {
    const {
      action,
      pageName,
      details,
      changes,
      source,
      method,
      route,
      clientPath,
      statusCode,
      metadata,
    } = req.body || {};

    const newLog = await createActivityLogEntry({
      req,
      user: req.user,
      action,
      pageName,
      details,
      changes,
      source,
      method,
      route,
      clientPath,
      statusCode,
      metadata,
    });

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

// Get activity logs by page (Admin and Super Admin)
const getActivityLogsByPage = async (req, res) => {
  try {
    const { pageName } = req.params;
    const limit = parseInt(req.query.limit, 10) || 20;
    const resolvedPageName = resolvePageName({ pageName });

    const logs = await AdminActivityLog.find({ pageName: resolvedPageName })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching page activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch page activity logs',
      error: error.message
    });
  }
};

// Get activity logs for current admin
const getMyActivityLogs = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User identity missing in token'
      });
    }

    const adminIdStr = String(userId);
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

    let query = {};
    if (req.query.from && req.query.to) {
      query.createdAt = {
        $gte: new Date(req.query.from),
        $lte: new Date(req.query.to)
      };
    }

    const searchQuery = buildSearchQuery(req.query.search);
    if (searchQuery) {
      query = { ...query, ...searchQuery };
    }

    if (req.query.role) {
      query.role = String(req.query.role).trim().toLowerCase();
    }

    if (req.query.source) {
      query.source = String(req.query.source).trim().toLowerCase();
    }

    if (req.query.pageName) {
      query.pageName = resolvePageName({ pageName: req.query.pageName });
    }

    if (req.query.method) {
      query.method = String(req.query.method).trim().toUpperCase();
    }

    if (req.query.action) {
      query.action = { $regex: String(req.query.action).trim(), $options: 'i' };
    }

    const logs = await AdminActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

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
  getActivityLogsByAdmin,
  getActivityLogsByPage
};
