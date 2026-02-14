const AdminActivityLog = require('../models/adminActivityLog.model');
const User = require('../models/user.model');

const ALLOWED_PAGE_ACTIONS = {
  'Home Page': 'Updated Home Page Content',
  'About Page': 'Updated About Page Content',
  'History Page': 'Updated History Page Content',
  'Events Page': 'Updated Events Page',
  'Gallery Page': 'Updated Gallery',
  'Results Page': 'Updated Match Results'
};

const resolveIpAddress = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '';
};

// Create a new activity log entry
const createActivityLog = async (req, res) => {
  try {
    const { action, pageName, details } = req.body;
    
    // Get user info from token - support both id and _id
    const tokenUserId = req.user?.id || req.user?._id || req.user?._doc?.id || req.user?._doc?._id;
    const tokenRole = req.user?.role || req.user?._doc?.role || 'admin';
    const tokenEmail = req.user?.email || req.user?._doc?.email || '';
    const tokenName = req.user?.name || req.user?._doc?.name || '';

    if (!tokenUserId) {
      // If no token user, use the details from request body
      console.log('AdminActivityLog: No token user, using request body or default');
    }

    // Skip role check for now - allow all authenticated users
    // The role will be taken from token or set to 'admin' as default
    const finalRole = tokenRole || 'admin';

    // Get user from database to get name and email
    let adminName = tokenName || 'Unknown';
    let adminEmail = tokenEmail || '';
    
    if (tokenUserId) {
      try {
        const user = await User.findById(tokenUserId).select('name email');
        if (user) {
          adminName = user.name || adminName;
          adminEmail = user.email || adminEmail;
        }
      } catch (e) {
        console.log('Could not fetch user:', e.message);
      }
    }

    const newLog = new AdminActivityLog({
      adminId: tokenUserId || 'unknown',
      adminName,
      adminEmail,
      role: finalRole,
      action,
      pageName,
      ipAddress: resolveIpAddress(req),
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

// Get activity logs by page (Admin and Super Admin)
const getActivityLogsByPage = async (req, res) => {
  try {
    const { pageName } = req.params;
    const limit = parseInt(req.query.limit, 10) || 20;

    if (!Object.prototype.hasOwnProperty.call(ALLOWED_PAGE_ACTIONS, pageName)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page name'
      });
    }

    const logs = await AdminActivityLog.find({ pageName })
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
