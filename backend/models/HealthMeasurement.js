const mongoose = require('mongoose');

const healthMeasurementSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required']
    },
    systolicBP: {
      type: Number,
      min: [40, 'Systolic blood pressure too low'],
      max: [280, 'Systolic blood pressure too high']
    },
    diastolicBP: {
      type: Number,
      min: [30, 'Diastolic blood pressure too low'],
      max: [180, 'Diastolic blood pressure too high']
    },
    heartRate: {
      type: Number,
      min: [30, 'Heart rate too low'],
      max: [250, 'Heart rate too high']
    },
    bloodGlucose: {
      type: Number,
      min: [20, 'Blood glucose too low'],
      max: [600, 'Blood glucose too high']
    },
    bodyTemperature: {
      type: Number,
      min: [90.0, 'Body temperature too low'],
      max: [110.0, 'Body temperature too high']
    },
    weight: {
      type: Number,
      min: [1.0, 'Weight too low'],
      max: [400.0, 'Weight too high']
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    source: {
      type: String,
      default: 'Manual Entry'
    },
    recordedAt: {
      type: Date,
      default: Date.now
    },
    statusFlags: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    warnings: {
      type: [String],
      default: []
    },
    overallCondition: {
      type: String,
      default: 'Optimal'
    }
  },
  {
    timestamps: true
  }
);

healthMeasurementSchema.index({ patient: 1, recordedAt: -1 });

module.exports = mongoose.model('HealthMeasurement', healthMeasurementSchema);
