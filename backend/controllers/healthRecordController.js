const path = require('path');
const HealthRecord = require('../models/HealthRecord');

// @desc    Get health records for patient (or all if doctor/admin)
// @route   GET /api/health-records
// @access  Private
const getHealthRecords = async (req, res, next) => {
  try {
    const query = {};

    // Patient can only see their own records
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.query.patientId) {
      // Doctor or admin can filter by patientId
      query.patient = req.query.patientId;
    }

    if (req.query.recordType) {
      query.recordType = req.query.recordType;
    }

    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { diagnosis: { $regex: req.query.search, $options: 'i' } },
        { doctorName: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const records = await HealthRecord.find(query)
      .populate('patient', 'name email bloodGroup age gender')
      .populate('createdBy', 'name role')
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      records
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single health record
// @route   GET /api/health-records/:id
// @access  Private
const getHealthRecordById = async (req, res, next) => {
  try {
    const record = await HealthRecord.findById(req.params.id)
      .populate('patient', 'name email bloodGroup age gender')
      .populate('createdBy', 'name role');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Health record not found.'
      });
    }

    // Role verification: only record owner, doctor, or admin can access
    if (
      req.user.role === 'patient' &&
      record.patient._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view this record.'
      });
    }

    res.status(200).json({
      success: true,
      record
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new health record
// @route   POST /api/health-records
// @access  Private
const createHealthRecord = async (req, res, next) => {
  try {
    let patientId = req.user._id;

    // Doctor or Admin can create records on behalf of a patient
    if (['doctor', 'admin'].includes(req.user.role) && req.body.patientId) {
      patientId = req.body.patientId;
    }

    let parsedMedications = [];
    if (req.body.medications) {
      if (typeof req.body.medications === 'string') {
        try {
          parsedMedications = JSON.parse(req.body.medications);
        } catch (e) {
          parsedMedications = [];
        }
      } else if (Array.isArray(req.body.medications)) {
        parsedMedications = req.body.medications;
      }
    }

    let parsedAllergies = [];
    if (req.body.allergies) {
      if (Array.isArray(req.body.allergies)) {
        parsedAllergies = req.body.allergies;
      } else if (typeof req.body.allergies === 'string') {
        parsedAllergies = req.body.allergies.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    let parsedConditions = [];
    if (req.body.existingConditions) {
      if (Array.isArray(req.body.existingConditions)) {
        parsedConditions = req.body.existingConditions;
      } else if (typeof req.body.existingConditions === 'string') {
        parsedConditions = req.body.existingConditions.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    let attachmentUrl = '';
    let attachmentOriginalName = '';
    let attachmentMimeType = '';
    let attachmentSize = 0;

    if (req.file) {
      attachmentUrl = `/uploads/${req.file.filename}`;
      attachmentOriginalName = req.file.originalname;
      attachmentMimeType = req.file.mimetype;
      attachmentSize = req.file.size;
    } else if (req.body.attachmentUrl) {
      attachmentUrl = req.body.attachmentUrl;
    }

    const record = await HealthRecord.create({
      patient: patientId,
      recordType: req.body.recordType || 'Prescription',
      title: req.body.title,
      diagnosis: req.body.diagnosis || '',
      doctorName: req.body.doctorName || req.user.name,
      date: req.body.date ? new Date(req.body.date) : new Date(),
      medications: parsedMedications,
      allergies: parsedAllergies,
      existingConditions: parsedConditions,
      treatmentPlan: req.body.treatmentPlan || '',
      attachmentUrl,
      attachmentOriginalName,
      attachmentMimeType,
      attachmentSize,
      notes: req.body.notes || '',
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Health record successfully saved!',
      record
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update health record
// @route   PUT /api/health-records/:id
// @access  Private
const updateHealthRecord = async (req, res, next) => {
  try {
    let record = await HealthRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Health record not found.'
      });
    }

    // Authorization check
    if (
      req.user.role === 'patient' &&
      record.patient.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot edit this medical record.'
      });
    }

    if (req.file) {
      req.body.attachmentUrl = `/uploads/${req.file.filename}`;
      req.body.attachmentOriginalName = req.file.originalname;
      req.body.attachmentMimeType = req.file.mimetype;
      req.body.attachmentSize = req.file.size;
    }

    if (typeof req.body.medications === 'string') {
      try {
        req.body.medications = JSON.parse(req.body.medications);
      } catch (e) {}
    }

    record = await HealthRecord.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Health record updated successfully!',
      record
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete health record
// @route   DELETE /api/health-records/:id
// @access  Private
const deleteHealthRecord = async (req, res, next) => {
  try {
    const record = await HealthRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Health record not found.'
      });
    }

    if (
      req.user.role === 'patient' &&
      record.patient.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot delete this medical record.'
      });
    }

    await record.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Health record deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealthRecords,
  getHealthRecordById,
  createHealthRecord,
  updateHealthRecord,
  deleteHealthRecord
};
