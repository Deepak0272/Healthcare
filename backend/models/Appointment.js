const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required']
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor reference is required']
    },
    appointmentDate: {
      type: String, // Stored as ISO YYYY-MM-DD for precise slot indexing
      required: [true, 'Appointment date is required']
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required']
    },
    reason: {
      type: String,
      required: [true, 'Reason for appointment is required'],
      trim: true
    },
    symptoms: {
      type: String,
      default: ''
    },
    consultationType: {
      type: String,
      enum: ['In-Person', 'Video Consultation', 'Follow-up'],
      default: 'In-Person'
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'Rescheduled'],
      default: 'Confirmed'
    },
    doctorNotes: {
      type: String,
      default: ''
    },
    cancellationReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Prevent double-booking index: for active appointments with same doctor, date, and slot
appointmentSchema.index(
  { doctor: 1, appointmentDate: 1, timeSlot: 1, status: 1 },
  { name: 'doctor_slot_unique' }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
