const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

// ========================
// DOCTORS MANAGEMENT
// ========================

// @desc    Get all doctors (searchable by specialization / name)
// @route   GET /api/doctors
// @access  Public / Private
const getDoctors = async (req, res, next) => {
  try {
    const query = { isActive: true };

    if (req.query.specialization) {
      query.specialization = { $regex: req.query.specialization, $options: 'i' };
    }

    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { specialization: { $regex: req.query.search, $options: 'i' } },
        { hospitalDepartment: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const doctors = await Doctor.find(query).sort({ rating: -1, name: 1 });

    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get doctor by ID with their available slots for a given date
// @route   GET /api/doctors/:id
// @access  Public / Private
const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found.'
      });
    }

    // Check booked slots for this doctor on requested date
    let bookedSlots = [];
    if (req.query.date) {
      const existingAppointments = await Appointment.find({
        doctor: doctor._id,
        appointmentDate: req.query.date,
        status: { $in: ['Scheduled', 'Confirmed'] }
      }).select('timeSlot');
      bookedSlots = existingAppointments.map((a) => a.timeSlot);
    }

    res.status(200).json({
      success: true,
      doctor,
      bookedSlots
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create doctor (Admin only)
// @route   POST /api/doctors
// @access  Private (Admin)
const createDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Doctor created successfully!',
      doctor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update doctor (Admin only)
// @route   PUT /api/doctors/:id
// @access  Private (Admin)
const updateDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found.'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Doctor updated successfully!',
      doctor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Deactivate doctor (Admin only)
// @route   DELETE /api/doctors/:id
// @access  Private (Admin)
const deleteDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found.'
      });
    }
    await doctor.deleteOne();
    res.status(200).json({
      success: true,
      message: 'Doctor removed successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// ========================
// APPOINTMENTS MANAGEMENT
// ========================

// @desc    Get appointments (Patient: own, Doctor: assigned, Admin: all)
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res, next) => {
  try {
    const query = {};

    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      // Find doctor profile associated with this user
      const doctorProfile = await Doctor.findOne({ user: req.user._id });
      if (doctorProfile) {
        query.doctor = doctorProfile._id;
      }
    } else if (req.user.role === 'admin' && req.query.patientId) {
      query.patient = req.query.patientId;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone bloodGroup age gender')
      .populate('doctor', 'name specialization roomNumber consultationFee hospitalDepartment email contactNumber')
      .sort({ appointmentDate: -1, timeSlot: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Book a new appointment (with double-booking prevention)
// @route   POST /api/appointments
// @access  Private
const bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, appointmentDate, timeSlot, reason, symptoms, consultationType } = req.body;

    if (!doctorId || !appointmentDate || !timeSlot || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Doctor, appointment date, time slot, and reason are required.'
      });
    }

    // Verify doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'The selected doctor was not found.'
      });
    }

    // Check for double-booking conflict:
    // Is there already a confirmed/scheduled appointment for this doctor at the exact date and slot?
    const existingConflict = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate,
      timeSlot,
      status: { $in: ['Scheduled', 'Confirmed'] }
    });

    if (existingConflict) {
      const docDisplayName = doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`;
      return res.status(409).json({
        success: false,
        message: `Conflict: ${docDisplayName} is already booked for ${timeSlot} on ${appointmentDate}. Please choose another time slot.`
      });
    }

    let patientId = req.user._id;
    if (['admin'].includes(req.user.role) && req.body.patientId) {
      patientId = req.body.patientId;
    }

    const appointment = await Appointment.create({
      patient: patientId,
      doctor: doctorId,
      appointmentDate,
      timeSlot,
      reason,
      symptoms: symptoms || '',
      consultationType: consultationType || 'In-Person',
      status: 'Confirmed'
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization roomNumber consultationFee hospitalDepartment');

    res.status(201).json({
      success: true,
      message: 'Appointment successfully confirmed!',
      appointment: populatedAppointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment (status, rescheduling, doctor notes)
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = async (req, res, next) => {
  try {
    let appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.'
      });
    }

    // Verify access
    if (
      req.user.role === 'patient' &&
      appointment.patient.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot edit this appointment.'
      });
    }

    // If rescheduling (changing date or time slot), check for conflict
    if (
      (req.body.appointmentDate && req.body.appointmentDate !== appointment.appointmentDate) ||
      (req.body.timeSlot && req.body.timeSlot !== appointment.timeSlot)
    ) {
      const checkDate = req.body.appointmentDate || appointment.appointmentDate;
      const checkSlot = req.body.timeSlot || appointment.timeSlot;

      const conflict = await Appointment.findOne({
        _id: { $ne: appointment._id },
        doctor: appointment.doctor,
        appointmentDate: checkDate,
        timeSlot: checkSlot,
        status: { $in: ['Scheduled', 'Confirmed'] }
      });

      if (conflict) {
        return res.status(409).json({
          success: false,
          message: 'The selected rescheduled time slot is already booked for this doctor.'
        });
      }
    }

    appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization roomNumber consultationFee hospitalDepartment');

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully!',
      appointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private
const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.'
      });
    }

    if (
      req.user.role === 'patient' &&
      appointment.patient.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot cancel this appointment.'
      });
    }

    appointment.status = 'Cancelled';
    appointment.cancellationReason = req.body.reason || 'Cancelled by patient';
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment has been cancelled.',
      appointment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getAppointments,
  bookAppointment,
  updateAppointment,
  cancelAppointment
};
