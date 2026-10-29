const EmergencyContact = require('../models/EmergencyContact');
const EmergencyAlert = require('../models/EmergencyAlert');
const HealthMeasurement = require('../models/HealthMeasurement');
const notificationService = require('../services/notificationService');

// ==============================
// EMERGENCY CONTACTS
// ==============================

// @desc    Get all emergency contacts for current user
// @route   GET /api/emergency-contacts
// @access  Private
const getEmergencyContacts = async (req, res, next) => {
  try {
    const contacts = await EmergencyContact.find({ patient: req.user._id }).sort({
      isPrimary: -1,
      createdAt: -1
    });

    res.status(200).json({
      success: true,
      count: contacts.length,
      contacts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add emergency contact
// @route   POST /api/emergency-contacts
// @access  Private
const createEmergencyContact = async (req, res, next) => {
  try {
    const { name, relationship, phoneNumber, email, isPrimary, notes } = req.body;

    if (!name || !relationship || !phoneNumber || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name, relationship, phone number, and email are required.'
      });
    }

    // If marked as primary, reset existing primary contacts for this patient
    if (isPrimary) {
      await EmergencyContact.updateMany(
        { patient: req.user._id },
        { isPrimary: false }
      );
    }

    const contact = await EmergencyContact.create({
      patient: req.user._id,
      name,
      relationship,
      phoneNumber,
      email,
      isPrimary: Boolean(isPrimary),
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: 'Emergency contact successfully saved!',
      contact
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update emergency contact
// @route   PUT /api/emergency-contacts/:id
// @access  Private
const updateEmergencyContact = async (req, res, next) => {
  try {
    const contact = await EmergencyContact.findOne({
      _id: req.params.id,
      patient: req.user._id
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Emergency contact not found.'
      });
    }

    if (req.body.isPrimary) {
      await EmergencyContact.updateMany(
        { patient: req.user._id },
        { isPrimary: false }
      );
    }

    const updated = await EmergencyContact.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Emergency contact updated successfully!',
      contact: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete emergency contact
// @route   DELETE /api/emergency-contacts/:id
// @access  Private
const deleteEmergencyContact = async (req, res, next) => {
  try {
    const contact = await EmergencyContact.findOne({
      _id: req.params.id,
      patient: req.user._id
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Emergency contact not found.'
      });
    }

    await contact.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Emergency contact deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// ==============================
// EMERGENCY ALERTS / SOS
// ==============================

// @desc    Trigger Emergency SOS Alert
// @route   POST /api/emergency-alerts
// @access  Private
const triggerEmergencyAlert = async (req, res, next) => {
  try {
    const { alertType, locationNotes, customMessage } = req.body;

    // Fetch patient's configured contacts
    const contacts = await EmergencyContact.find({ patient: req.user._id });

    // Fetch latest recorded vitals for context snapshot
    const latestVitals = await HealthMeasurement.findOne({ patient: req.user._id }).sort({
      recordedAt: -1
    });

    const vitalsSnapshot = latestVitals
      ? {
          systolicBP: latestVitals.systolicBP,
          diastolicBP: latestVitals.diastolicBP,
          heartRate: latestVitals.heartRate,
          bloodGlucose: latestVitals.bloodGlucose,
          bodyTemperature: latestVitals.bodyTemperature,
          recordedAt: latestVitals.recordedAt
        }
      : {};

    const alertDetails = {
      reason: customMessage || 'URGENT: Patient pressed Emergency SOS trigger on dashboard.',
      locationNotes: locationNotes || 'Registered Patient Residence / Home',
      vitalsSnapshot
    };

    // Dispatch notifications via email or Demo mode
    const dispatchResult = await notificationService.dispatchEmergencyAlert(
      req.user,
      contacts,
      alertDetails
    );

    const isDemo = dispatchResult.isDemoMode;

    const alert = await EmergencyAlert.create({
      patient: req.user._id,
      alertType: alertType || 'SOS_CRITICAL',
      status: isDemo ? 'Demo_Delivered' : 'Sent',
      locationNotes: alertDetails.locationNotes,
      message: alertDetails.reason,
      vitalsSnapshot,
      contactsNotified: dispatchResult.notifications,
      isDemoMode: isDemo,
      disclaimer:
        'IMPORTANT: This emergency assistance alert operates in Demo/Configured Notification mode and does NOT automatically contact 911 or municipal emergency first responders.'
    });

    res.status(201).json({
      success: true,
      message: isDemo
        ? 'Emergency SOS alert simulated successfully in Demo Notification Mode.'
        : 'Emergency SOS alert dispatched to registered contacts.',
      isDemoMode: isDemo,
      contactsCount: contacts.length,
      alert
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get emergency alert history
// @route   GET /api/emergency-alerts
// @access  Private
const getEmergencyAlerts = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.query.patientId) {
      query.patient = req.query.patientId;
    }

    const alerts = await EmergencyAlert.find(query)
      .populate('patient', 'name email phone bloodGroup')
      .sort({ triggeredAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  triggerEmergencyAlert,
  getEmergencyAlerts
};
