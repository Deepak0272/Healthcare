const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const HealthRecord = require('../models/HealthRecord');
const HealthMeasurement = require('../models/HealthMeasurement');
const Appointment = require('../models/Appointment');
const EmergencyContact = require('../models/EmergencyContact');
const EmergencyAlert = require('../models/EmergencyAlert');

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedData = async () => {
  try {
    console.log('[Seeder] Checking and populating synthetic demo data...');

    // 1. Seed Admin
    let admin = await User.findOne({ email: 'admin@healthtech.com' });
    if (!admin) {
      admin = await User.create({
        name: 'System Administrator',
        email: 'admin@healthtech.com',
        password: 'Admin@12345',
        role: 'admin',
        age: 38,
        gender: 'Prefer not to say',
        phone: '+1 (555) 019-2834',
        bloodGroup: 'O+'
      });
      console.log('[Seeder] Admin user created: admin@healthtech.com / Admin@12345');
    }

    // 2. Seed Demo Patient
    let patient = await User.findOne({ email: 'patient@healthtech.com' });
    if (!patient) {
      patient = await User.create({
        name: 'Johnathan Doe',
        email: 'patient@healthtech.com',
        password: 'Patient@12345',
        role: 'patient',
        age: 42,
        gender: 'Male',
        phone: '+1 (555) 234-5678',
        bloodGroup: 'O+',
        allergies: ['Penicillin', 'Peanuts'],
        chronicConditions: ['Stage 1 Hypertension (Mild)'],
        emergencyContactInfo: {
          name: 'Jane Doe',
          relationship: 'Spouse',
          phone: '+1 (555) 987-6543'
        },
        address: {
          street: '742 Evergreen Terrace',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62704'
        }
      });
      console.log('[Seeder] Demo Patient created: patient@healthtech.com / Patient@12345');
    }

    // 3. Seed Doctors
    const doctorCount = await Doctor.countDocuments();
    let doctors = [];
    if (doctorCount === 0) {
      doctors = await Doctor.insertMany([
        {
          name: 'Dr. Sarah Jenkins',
          specialization: 'Cardiology',
          qualification: 'MD, FACC - Harvard Medical School',
          experienceYears: 14,
          email: 'sjenkins@healthtech.org',
          contactNumber: '+1 (555) 432-1001',
          consultationFee: 120,
          hospitalDepartment: 'Cardiovascular Institute',
          roomNumber: 'Suite 402 - Heart Center',
          bio: 'Specialist in non-invasive cardiovascular therapeutics, hypertension control, and preventative longevity cardiology.',
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          timeSlots: [
            '09:00 AM - 10:00 AM',
            '10:00 AM - 11:00 AM',
            '11:00 AM - 12:00 PM',
            '02:00 PM - 03:00 PM',
            '03:00 PM - 04:00 PM'
          ],
          rating: 4.9
        },
        {
          name: 'Dr. Robert Patel',
          specialization: 'Endocrinology & Diabetology',
          qualification: 'MD, FACE - Johns Hopkins Medicine',
          experienceYears: 12,
          email: 'rpatel@healthtech.org',
          contactNumber: '+1 (555) 432-1002',
          consultationFee: 110,
          hospitalDepartment: 'Metabolic & Endocrine Health',
          roomNumber: 'Suite 210 - East Wing',
          bio: 'Expert in glycemic management, metabolic disorder therapies, and continuous health biomarker tracking.',
          availableDays: ['Monday', 'Wednesday', 'Friday'],
          timeSlots: [
            '10:00 AM - 11:00 AM',
            '11:00 AM - 12:00 PM',
            '01:00 PM - 02:00 PM',
            '02:00 PM - 03:00 PM'
          ],
          rating: 4.8
        },
        {
          name: 'Dr. Emily Chen',
          specialization: 'Internal Medicine',
          qualification: 'MD, FACP - Stanford University',
          experienceYears: 9,
          email: 'echen@healthtech.org',
          contactNumber: '+1 (555) 432-1003',
          consultationFee: 85,
          hospitalDepartment: 'Primary Care & Family Medicine',
          roomNumber: 'Clinic 105 - West Wing',
          bio: 'Compassionate primary care physician dedicated to holistic preventative checkups, wellness reviews, and patient education.',
          availableDays: ['Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
          timeSlots: [
            '09:00 AM - 10:00 AM',
            '10:00 AM - 11:00 AM',
            '01:00 PM - 02:00 PM',
            '03:00 PM - 04:00 PM'
          ],
          rating: 4.9
        },
        {
          name: 'Dr. Marcus Vance',
          specialization: 'Neurology',
          qualification: 'MD, PhD - Columbia University',
          experienceYears: 16,
          email: 'mvance@healthtech.org',
          contactNumber: '+1 (555) 432-1004',
          consultationFee: 140,
          hospitalDepartment: 'Neuroscience Center',
          roomNumber: 'Tower B - Floor 5',
          bio: 'Clinical neurophysiologist focusing on headache management, autonomic nervous system stability, and sleep health.',
          availableDays: ['Monday', 'Thursday'],
          timeSlots: ['09:30 AM - 10:30 AM', '11:00 AM - 12:00 PM', '02:30 PM - 03:30 PM'],
          rating: 4.7
        }
      ]);
      console.log(`[Seeder] Seeded ${doctors.length} Doctors.`);
    } else {
      doctors = await Doctor.find();
    }

    // 4. Seed Emergency Contacts for John Doe
    const contactCount = await EmergencyContact.countDocuments({ patient: patient._id });
    if (contactCount === 0) {
      await EmergencyContact.insertMany([
        {
          patient: patient._id,
          name: 'Jane Doe',
          relationship: 'Spouse',
          phoneNumber: '+1 (555) 987-6543',
          email: 'jane.doe@example.com',
          isPrimary: true,
          notes: 'Home residence contact. Available 24/7.'
        },
        {
          patient: patient._id,
          name: 'David Doe',
          relationship: 'Brother',
          phoneNumber: '+1 (555) 678-1234',
          email: 'david.doe@example.com',
          isPrimary: false,
          notes: 'Secondary emergency contact.'
        }
      ]);
      console.log('[Seeder] Seeded Emergency Contacts for demo patient.');
    }

    // 5. Seed Historical Health Measurements for John Doe
    const measurementCount = await HealthMeasurement.countDocuments({ patient: patient._id });
    if (measurementCount === 0) {
      const now = new Date();
      const measurements = [
        {
          daysAgo: 12,
          systolicBP: 136,
          diastolicBP: 88,
          heartRate: 78,
          bloodGlucose: 104,
          bodyTemperature: 98.6,
          weight: 79.4,
          notes: 'Evening reading after long commute.',
          overallCondition: 'Moderate Observation',
          warnings: ['Informational Warning: Systolic blood pressure is elevated (136 mmHg).']
        },
        {
          daysAgo: 10,
          systolicBP: 132,
          diastolicBP: 85,
          heartRate: 75,
          bloodGlucose: 99,
          bodyTemperature: 98.4,
          weight: 79.2,
          notes: 'Morning measurement before breakfast.',
          overallCondition: 'Moderate Observation',
          warnings: ['Informational Warning: Blood pressure falls in Stage 1 Hypertension range.']
        },
        {
          daysAgo: 8,
          systolicBP: 128,
          diastolicBP: 84,
          heartRate: 73,
          bloodGlucose: 95,
          bodyTemperature: 98.6,
          weight: 78.9,
          notes: 'Following low sodium dietary plan.',
          overallCondition: 'Moderate Observation',
          warnings: ['Informational Warning: Systolic blood pressure is mildly elevated (128 mmHg).']
        },
        {
          daysAgo: 6,
          systolicBP: 126,
          diastolicBP: 82,
          heartRate: 71,
          bloodGlucose: 92,
          bodyTemperature: 98.2,
          weight: 78.7,
          notes: 'Resting measurement after 30-minute walk.',
          overallCondition: 'Optimal',
          warnings: []
        },
        {
          daysAgo: 4,
          systolicBP: 124,
          diastolicBP: 80,
          heartRate: 70,
          bloodGlucose: 94,
          bodyTemperature: 98.4,
          weight: 78.5,
          notes: 'Consistent routine established.',
          overallCondition: 'Optimal',
          warnings: []
        },
        {
          daysAgo: 2,
          systolicBP: 122,
          diastolicBP: 79,
          heartRate: 68,
          bloodGlucose: 91,
          bodyTemperature: 98.6,
          weight: 78.4,
          notes: 'Feeling energized, well-rested.',
          overallCondition: 'Optimal',
          warnings: []
        },
        {
          daysAgo: 0,
          systolicBP: 120,
          diastolicBP: 78,
          heartRate: 72,
          bloodGlucose: 93,
          bodyTemperature: 98.5,
          weight: 78.2,
          notes: 'Latest checkup reading. All indicators in target ranges.',
          overallCondition: 'Optimal',
          warnings: []
        }
      ];

      for (const m of measurements) {
        const recordDate = new Date(now.getTime() - m.daysAgo * 24 * 60 * 60 * 1000);
        await HealthMeasurement.create({
          patient: patient._id,
          systolicBP: m.systolicBP,
          diastolicBP: m.diastolicBP,
          heartRate: m.heartRate,
          bloodGlucose: m.bloodGlucose,
          bodyTemperature: m.bodyTemperature,
          weight: m.weight,
          notes: m.notes,
          source: 'Manual Entry',
          recordedAt: recordDate,
          overallCondition: m.overallCondition,
          warnings: m.warnings,
          statusFlags: {
            bloodPressure: {
              status: m.systolicBP > 129 ? 'Stage 1 Hypertension' : 'Normal',
              systolic: m.systolicBP,
              diastolic: m.diastolicBP
            },
            heartRate: { status: 'Normal', value: m.heartRate },
            bloodGlucose: { status: 'Normal', value: m.bloodGlucose },
            bodyTemperature: { status: 'Normal', value: m.bodyTemperature },
            weight: { status: 'Recorded', value: m.weight }
          }
        });
      }
      console.log('[Seeder] Seeded 7 historical health measurements.');
    }

    // 6. Seed Health Records
    const recordCount = await HealthRecord.countDocuments({ patient: patient._id });
    if (recordCount === 0) {
      await HealthRecord.insertMany([
        {
          patient: patient._id,
          recordType: 'Prescription',
          title: 'Hypertension Management Regimen',
          diagnosis: 'Essential (Primary) Hypertension',
          doctorName: 'Dr. Sarah Jenkins',
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          medications: [
            {
              name: 'Lisinopril',
              dosage: '10mg',
              frequency: 'Once daily in the morning',
              duration: '90 days',
              instructions: 'Take with full glass of water. Monitor BP regularly.'
            },
            {
              name: 'CoQ10 Heart Support',
              dosage: '100mg',
              frequency: 'Once daily with meals',
              duration: '60 days',
              instructions: 'Nutritional cardiovascular co-factor.'
            }
          ],
          allergies: ['Penicillin'],
          existingConditions: ['Hypertension'],
          treatmentPlan: 'Maintain low-sodium dietary habits, 150 minutes of weekly moderate aerobic exercise, and log daily blood pressure readings.',
          notes: 'Follow-up appointment scheduled in 4 weeks to review systolic trends.',
          createdBy: admin._id
        },
        {
          patient: patient._id,
          recordType: 'Lab Report',
          title: 'Comprehensive Metabolic & Lipid Panel',
          diagnosis: 'Routine Metabolic Wellness Profile',
          doctorName: 'Dr. Robert Patel',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          medications: [],
          allergies: [],
          existingConditions: ['Stage 1 Hypertension (Mild)'],
          treatmentPlan: 'Total cholesterol 188 mg/dL (Normal < 200). HDL 52 mg/dL. Triglycerides 130 mg/dL. Fasting glucose 94 mg/dL. Kidney and liver functions within standard reference margins.',
          notes: 'Lab values demonstrate excellent response to dietary adjustments.',
          createdBy: admin._id
        },
        {
          patient: patient._id,
          recordType: 'Vaccination',
          title: 'Annual Quadrivalent Influenza Immunization',
          diagnosis: 'Seasonal Flu Prophylaxis',
          doctorName: 'Dr. Emily Chen',
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          medications: [],
          treatmentPlan: 'Administered 0.5 mL intramuscular in left deltoid. Patient tolerated injection without immediate adverse reaction.',
          notes: 'Next annual booster due Autumn 2027.',
          createdBy: admin._id
        }
      ]);
      console.log('[Seeder] Seeded digital health records.');
    }

    // 7. Seed Appointments
    const appointmentCount = await Appointment.countDocuments({ patient: patient._id });
    if (appointmentCount === 0 && doctors.length > 0) {
      // Create one upcoming appointment (e.g. 5 days from now)
      const upcomingDate = new Date();
      upcomingDate.setDate(upcomingDate.getDate() + 5);
      const dateStr = upcomingDate.toISOString().split('T')[0];

      await Appointment.create({
        patient: patient._id,
        doctor: doctors[0]._id,
        appointmentDate: dateStr,
        timeSlot: '10:00 AM - 11:00 AM',
        reason: 'Hypertension Follow-Up & Medication Review',
        symptoms: 'Mild evening fatigue, occasional elevated systolic readings.',
        consultationType: 'In-Person',
        status: 'Confirmed',
        doctorNotes: 'Bring previous 2-week home blood pressure log.'
      });

      // Past appointment
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 14);
      const pastDateStr = pastDate.toISOString().split('T')[0];

      await Appointment.create({
        patient: patient._id,
        doctor: doctors[1]._id,
        appointmentDate: pastDateStr,
        timeSlot: '11:00 AM - 12:00 PM',
        reason: 'Metabolic & Glycemic Screening Review',
        symptoms: 'Annual checkup consultation.',
        consultationType: 'In-Person',
        status: 'Completed',
        doctorNotes: 'Patient completed lipid panel. Fasting glucose normal at 94 mg/dL.'
      });

      console.log('[Seeder] Seeded Appointments (1 upcoming, 1 past).');
    }

    // 8. Seed Emergency Alert History
    const alertCount = await EmergencyAlert.countDocuments({ patient: patient._id });
    if (alertCount === 0) {
      await EmergencyAlert.create({
        patient: patient._id,
        alertType: 'SOS_CRITICAL',
        status: 'Demo_Delivered',
        locationNotes: '742 Evergreen Terrace, Springfield, IL',
        message: 'EMERGENCY TEST ALERT: Patient activated the Emergency SOS button (System verification test).',
        vitalsSnapshot: {
          systolicBP: 122,
          diastolicBP: 80,
          heartRate: 74
        },
        contactsNotified: [
          {
            name: 'Jane Doe',
            phone: '+1 (555) 987-6543',
            email: 'jane.doe@example.com',
            deliveryStatus: 'Demo Simulated',
            deliveryChannel: 'Demo Simulation (Email/SMS)',
            sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            details: 'Demo notification dispatched to primary emergency contact.'
          }
        ],
        isDemoMode: true,
        triggeredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      });
      console.log('[Seeder] Seeded Demo Emergency Alert record.');
    }

    console.log('[Seeder] Synthetic seeding completed successfully!');
  } catch (err) {
    console.error('[Seeder] Seeding error:', err.message);
  }
};

module.exports = seedData;

if (require.main === module) {
  const { connectDB, disconnectDB } = require('../config/db');
  (async () => {
    await connectDB();
    await seedData();
    await disconnectDB();
    process.exit(0);
  })();
}
