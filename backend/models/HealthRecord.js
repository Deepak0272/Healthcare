const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, default: '' },
  frequency: { type: String, default: '' },
  duration: { type: String, default: '' },
  instructions: { type: String, default: '' }
}, { _id: false });

const healthRecordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required']
    },
    recordType: {
      type: String,
      enum: [
        'Prescription',
        'Lab Report',
        'Diagnosis',
        'Vaccination',
        'Imaging/X-Ray',
        'Discharge Summary',
        'General Note'
      ],
      default: 'Prescription',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Record title is required'],
      trim: true
    },
    diagnosis: {
      type: String,
      trim: true,
      default: ''
    },
    doctorName: {
      type: String,
      trim: true,
      default: ''
    },
    date: {
      type: Date,
      default: Date.now
    },
    medications: {
      type: [medicationSchema],
      default: []
    },
    allergies: {
      type: [String],
      default: []
    },
    existingConditions: {
      type: [String],
      default: []
    },
    treatmentPlan: {
      type: String,
      default: ''
    },
    attachmentUrl: {
      type: String,
      default: ''
    },
    attachmentOriginalName: {
      type: String,
      default: ''
    },
    attachmentMimeType: {
      type: String,
      default: ''
    },
    attachmentSize: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Index for quick lookup per patient
healthRecordSchema.index({ patient: 1, date: -1 });

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
