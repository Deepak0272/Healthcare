const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const HealthRecord = require('../models/HealthRecord');
const HealthMeasurement = require('../models/HealthMeasurement');
const EmergencyAlert = require('../models/EmergencyAlert');

// @desc    Get administrative dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      totalRecords,
      totalAlerts,
      recentAppointments,
      recentAlerts
    ] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      Doctor.countDocuments({ isActive: true }),
      Appointment.countDocuments(),
      HealthRecord.countDocuments(),
      EmergencyAlert.countDocuments(),
      Appointment.find()
        .populate('patient', 'name email phone')
        .populate('doctor', 'name specialization')
        .sort({ createdAt: -1 })
        .limit(5),
      EmergencyAlert.find()
        .populate('patient', 'name phone')
        .sort({ triggeredAt: -1 })
        .limit(5)
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalPatients,
        totalDoctors,
        totalAppointments,
        totalRecords,
        totalAlerts
      },
      recentAppointments,
      recentAlerts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (with optional role filter)
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.role) {
      query.role = req.query.role;
    }
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role or status
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
const updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const updates = {};
    if (role) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully!',
      user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getUsers,
  updateUser
};
