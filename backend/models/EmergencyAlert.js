const mongoose = require('mongoose');

const contactNotifiedSchema = new mongoose.Schema(
  {
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmergencyContact'
    },
    name: String,
    phone: String,
    email: String,
    deliveryStatus: {
      type: String,
      enum: ['Sent', 'Demo Simulated', 'Failed', 'Pending'],
      default: 'Demo Simulated'
    },
    deliveryChannel: {
      type: String,
      default: 'Demo Simulation (Email/SMS)'
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    details: String
  },
  { _id: false }
);

const emergencyAlertSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required']
    },
    alertType: {
      type: String,
      enum: ['SOS_CRITICAL', 'RAPID_ASSISTANCE', 'VITAL_SIGNS_CONCERN', 'MANUAL_DISPATCH'],
      default: 'SOS_CRITICAL'
    },
    status: {
      type: String,
      enum: ['Pending', 'Sent', 'Demo_Delivered', 'Failed', 'Acknowledged', 'Resolved'],
      default: 'Demo_Delivered'
    },
    triggeredAt: {
      type: Date,
      default: Date.now
    },
    locationNotes: {
      type: String,
      default: 'Home / Default patient registered location'
    },
    message: {
      type: String,
      default: 'EMERGENCY ALERT: Patient has triggered an urgent SOS notification.'
    },
    vitalsSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    contactsNotified: {
      type: [contactNotifiedSchema],
      default: []
    },
    isDemoMode: {
      type: Boolean,
      default: true
    },
    disclaimer: {
      type: String,
      default:
        'IMPORTANT: This emergency assistance alert operates in Demo/Configured Notification mode and does NOT automatically contact 911 or municipal emergency first responders.'
    }
  },
  {
    timestamps: true
  }
);

emergencyAlertSchema.index({ patient: 1, triggeredAt: -1 });

module.exports = mongoose.model('EmergencyAlert', emergencyAlertSchema);
