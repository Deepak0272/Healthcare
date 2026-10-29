const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true
    },
    qualification: {
      type: String,
      default: 'MD, MBBS'
    },
    experienceYears: {
      type: Number,
      default: 5
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    contactNumber: {
      type: String,
      trim: true
    },
    consultationFee: {
      type: Number,
      default: 50
    },
    hospitalDepartment: {
      type: String,
      default: 'General Medicine'
    },
    roomNumber: {
      type: String,
      default: 'Room 101'
    },
    bio: {
      type: String,
      default: 'Experienced healthcare practitioner committed to comprehensive patient wellness.'
    },
    availableDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    timeSlots: {
      type: [String],
      default: [
        '09:00 AM - 10:00 AM',
        '10:00 AM - 11:00 AM',
        '11:00 AM - 12:00 PM',
        '02:00 PM - 03:00 PM',
        '03:00 PM - 04:00 PM',
        '04:00 PM - 05:00 PM'
      ]
    },
    rating: {
      type: Number,
      default: 4.8
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Doctor', doctorSchema);
