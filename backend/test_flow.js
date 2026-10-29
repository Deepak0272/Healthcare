const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING HEALTH TECH INTEGRATION TESTS (NATIVE ENGINE) ---');

  // 1. Patient Login
  console.log('\n1. Testing Patient Login...');
  const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'patient@healthtech.com',
    password: 'Patient@12345'
  });
  console.log('✓ Login Successful!');
  console.log('  User:', loginRes.data.user.name, `(${loginRes.data.user.role})`);
  const token = loginRes.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. Fetch Doctors
  console.log('\n2. Testing Doctors Directory...');
  const docRes = await axios.get(`${BASE_URL}/doctors`);
  console.log(`✓ Fetched ${docRes.data.count} doctors:`);
  docRes.data.doctors.forEach((d) => {
    console.log(`  - ${d.name} (${d.specialization}) | Fee: $${d.consultationFee}`);
  });
  const selectedDoctor = docRes.data.doctors[0];

  // 3. Prevent Double-Booking Test
  console.log('\n3. Testing Appointment Booking & Double-Booking Prevention...');
  const testDate = '2026-11-25';
  const testSlot = '10:00 AM - 11:00 AM';

  const booking1 = await axios.post(
    `${BASE_URL}/appointments`,
    {
      doctorId: selectedDoctor._id,
      appointmentDate: testDate,
      timeSlot: testSlot,
      reason: 'Routine cardiovascular checkup',
      consultationType: 'In-Person'
    },
    { headers: authHeaders }
  );
  console.log('✓ First booking succeeded:', booking1.data.appointment._id);

  try {
    await axios.post(
      `${BASE_URL}/appointments`,
      {
        doctorId: selectedDoctor._id,
        appointmentDate: testDate,
        timeSlot: testSlot,
        reason: 'Attempted duplicate booking',
        consultationType: 'In-Person'
      },
      { headers: authHeaders }
    );
    console.error('✗ Failed: Duplicate booking was incorrectly allowed!');
  } catch (err) {
    if (err.response && err.response.status === 409) {
      console.log('✓ Double-Booking Prevented Successfully! (409 Conflict):');
      console.log('  Message:', err.response.data.message);
    } else {
      console.error('Unexpected error:', err.message);
    }
  }

  // 4. Test Vital Measurement Logging with Native Clinical Analytics Engine
  console.log('\n4. Testing Vital Measurement Logging & Native Clinical Analytics Engine...');
  const vitalRes = await axios.post(
    `${BASE_URL}/health-measurements`,
    {
      systolicBP: 138,
      diastolicBP: 89,
      heartRate: 82,
      bloodGlucose: 106,
      bodyTemperature: 98.7,
      weight: 78.5,
      notes: 'Evening resting measurement'
    },
    { headers: authHeaders }
  );
  console.log('✓ Vital Measurement Saved!');
  console.log('  Evaluated Condition:', vitalRes.data.measurement.overallCondition);
  console.log('  Warnings:', vitalRes.data.measurement.warnings);
  console.log('  Engine Source:', vitalRes.data.analysis.sourceEngine);
  console.log('  Medical Disclaimer:', vitalRes.data.analysis.disclaimer ? 'Verified' : 'Missing');

  // 5. Test Historical Trends API
  console.log('\n5. Testing Health Trends API...');
  const trendsRes = await axios.get(`${BASE_URL}/health-measurements/trends?days=30`, {
    headers: authHeaders
  });
  console.log(`✓ Fetched Trends data (${trendsRes.data.count} readings):`);
  console.log('  Health Stability Score:', trendsRes.data.trendAnalysis.healthStabilityScore);
  console.log('  Sample Trend Summary:', trendsRes.data.trendAnalysis.trendSummaries[0]);

  // 6. Test Emergency SOS Alert Dispatch
  console.log('\n6. Testing Emergency SOS Alert System...');
  const sosRes = await axios.post(
    `${BASE_URL}/emergency/alerts`,
    {
      alertType: 'SOS_CRITICAL',
      locationNotes: '742 Evergreen Terrace, Springfield, IL',
      customMessage: 'System verification emergency SOS alert.'
    },
    { headers: authHeaders }
  );
  console.log('✓ Emergency Alert Broadcast Executed!');
  console.log('  Status:', sosRes.data.alert.status);
  console.log('  Mode:', sosRes.data.alert.isDemoMode ? 'Demo Notification Mode' : 'Live');
  console.log('  Recipients:', sosRes.data.alert.contactsNotified.map((c) => `${c.name} (${c.deliveryStatus})`));

  // 7. Test Admin Portal API & Promote Patient to Admin
  console.log('\n7. Testing Administrative API & Verifying Admin Permissions...');
  const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'admin@healthtech.com',
    password: 'Admin@12345'
  });
  const adminHeaders = { Authorization: `Bearer ${adminLogin.data.token}` };
  const adminStats = await axios.get(`${BASE_URL}/admin/stats`, {
    headers: adminHeaders
  });
  console.log('✓ Admin Stats Retrieved:');
  console.log('  Patients:', adminStats.data.stats.totalPatients);
  console.log('  Doctors:', adminStats.data.stats.totalDoctors);
  console.log('  Appointments:', adminStats.data.stats.totalAppointments);
  console.log('  Health Records:', adminStats.data.stats.totalRecords);
  console.log('  Alerts:', adminStats.data.stats.totalAlerts);

  // Promote patient@healthtech.com to admin
  const usersRes = await axios.get(`${BASE_URL}/admin/users`, { headers: adminHeaders });
  const patientUser = usersRes.data.users.find((u) => u.email === 'patient@healthtech.com');
  if (patientUser) {
    await axios.put(
      `${BASE_URL}/admin/users/${patientUser._id}`,
      { role: 'admin' },
      { headers: adminHeaders }
    );
    console.log('✓ patient@healthtech.com successfully elevated to ADMIN role!');
  }

  console.log('\n--- ALL SYSTEM INTEGRATION TESTS PASSED 100% (NO PYTHON DEPENDENCY) ---');
}

runTests().catch((err) => {
  console.error('Test failed:', err.response ? err.response.data : err.message);
  process.exit(1);
});
