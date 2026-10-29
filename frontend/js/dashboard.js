/**
 * Health Tech Dashboard Module
 */

let trendChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  const currentUser = requireAuth();
  if (!currentUser) return;

  await loadDashboardData();
  setupSOSModal();
});

const loadDashboardData = async () => {
  try {
    // 1. Fetch Profile and latest measurements
    const [meData, latestRes, trendsRes, appointmentsRes, recordsRes] = await Promise.all([
      apiRequest('/auth/me'),
      apiRequest('/health-measurements/latest'),
      apiRequest('/health-measurements/trends?days=14'),
      apiRequest('/appointments'),
      apiRequest('/health-records')
    ]);

    renderProfileSummary(meData.user);
    renderVitalCards(latestRes.measurement);
    renderTrendChart(trendsRes);
    renderUpcomingAppointment(appointmentsRes.appointments);
    renderRecentRecords(recordsRes.records);
  } catch (err) {
    console.error('Error loading dashboard:', err);
    showToast(`Failed to load some dashboard data: ${err.message}`, 'warning');
  }
};

const renderProfileSummary = (user) => {
  if (!user) return;
  const welcomeEl = document.getElementById('dash-welcome-text');
  if (welcomeEl) {
    welcomeEl.textContent = `Welcome back, ${user.name.split(' ')[0]}!`;
  }

  const patientMetaEl = document.getElementById('dash-patient-meta');
  if (patientMetaEl) {
    const ageText = user.age ? `${user.age} yrs` : 'Age N/A';
    const genderText = user.gender || 'Not specified';
    const bloodText = user.bloodGroup ? `Blood: ${user.bloodGroup}` : 'Blood: Unknown';
    patientMetaEl.textContent = `${ageText} • ${genderText} • ${bloodText}`;
  }

  // Display conditions or allergies if present
  const alertBadgesEl = document.getElementById('dash-patient-tags');
  if (alertBadgesEl) {
    alertBadgesEl.innerHTML = '';
    if (user.allergies && user.allergies.length > 0) {
      user.allergies.forEach((a) => {
        alertBadgesEl.innerHTML += `<span class="badge bg-danger-subtle text-danger me-1"><i class="bi bi-shield-exclamation me-1"></i>Allergy: ${a}</span>`;
      });
    }
    if (user.chronicConditions && user.chronicConditions.length > 0) {
      user.chronicConditions.forEach((c) => {
        alertBadgesEl.innerHTML += `<span class="badge bg-primary-subtle text-primary me-1"><i class="bi bi-heart-pulse me-1"></i>${c}</span>`;
      });
    }
  }
};

const renderVitalCards = (vital) => {
  if (!vital) {
    // Default placeholder values
    return;
  }

  // Blood Pressure
  const bpValEl = document.getElementById('stat-bp-val');
  const bpBadgeEl = document.getElementById('stat-bp-badge');
  if (bpValEl && vital.systolicBP && vital.diastolicBP) {
    bpValEl.innerHTML = `${vital.systolicBP}/${vital.diastolicBP} <span class="stat-unit">mmHg</span>`;
    let bpStatus = 'Normal';
    let badgeClass = 'normal';
    if (vital.systolicBP > 130 || vital.diastolicBP > 85) {
      bpStatus = 'Elevated';
      badgeClass = 'elevated';
    }
    if (vital.systolicBP >= 140 || vital.diastolicBP >= 90) {
      bpStatus = 'Hypertension';
      badgeClass = 'hypertension';
    }
    bpBadgeEl.className = `badge-status ${badgeClass}`;
    bpBadgeEl.textContent = bpStatus;
  }

  // Heart Rate
  const hrValEl = document.getElementById('stat-hr-val');
  const hrBadgeEl = document.getElementById('stat-hr-badge');
  if (hrValEl && vital.heartRate) {
    hrValEl.innerHTML = `${vital.heartRate} <span class="stat-unit">bpm</span>`;
    const isNormal = vital.heartRate >= 60 && vital.heartRate <= 100;
    hrBadgeEl.className = `badge-status ${isNormal ? 'normal' : 'elevated'}`;
    hrBadgeEl.textContent = isNormal ? 'Normal Rhythm' : 'Outside Target';
  }

  // Blood Glucose
  const glucoseValEl = document.getElementById('stat-glucose-val');
  const glucoseBadgeEl = document.getElementById('stat-glucose-badge');
  if (glucoseValEl && vital.bloodGlucose) {
    glucoseValEl.innerHTML = `${vital.bloodGlucose} <span class="stat-unit">mg/dL</span>`;
    const isNormal = vital.bloodGlucose >= 70 && vital.bloodGlucose <= 99;
    glucoseBadgeEl.className = `badge-status ${isNormal ? 'normal' : 'elevated'}`;
    glucoseBadgeEl.textContent = isNormal ? 'Fasting Normal' : 'Check Range';
  }

  // Body Temperature
  const tempValEl = document.getElementById('stat-temp-val');
  const tempBadgeEl = document.getElementById('stat-temp-badge');
  if (tempValEl && vital.bodyTemperature) {
    tempValEl.innerHTML = `${vital.bodyTemperature} <span class="stat-unit">°F</span>`;
    const isNormal = vital.bodyTemperature >= 97.0 && vital.bodyTemperature <= 99.0;
    tempBadgeEl.className = `badge-status ${isNormal ? 'normal' : 'hypertension'}`;
    tempBadgeEl.textContent = isNormal ? 'Normal' : 'Elevated Temp';
  }

  // Weight
  const weightValEl = document.getElementById('stat-weight-val');
  const weightBadgeEl = document.getElementById('stat-weight-badge');
  if (weightValEl && vital.weight) {
    weightValEl.innerHTML = `${vital.weight} <span class="stat-unit">kg</span>`;
    weightBadgeEl.className = 'badge-status optimal';
    weightBadgeEl.textContent = 'Stable';
  }

  // Overall condition banner
  const condBannerEl = document.getElementById('dash-condition-alert');
  if (condBannerEl && vital.warnings && vital.warnings.length > 0) {
    condBannerEl.style.display = 'block';
    condBannerEl.innerHTML = `
      <div class="alert alert-warning d-flex align-items-center mb-4 rounded-3 shadow-sm border-warning" role="alert">
        <i class="bi bi-info-circle-fill me-3 fs-4 text-warning"></i>
        <div>
          <strong>Informational Vital Alert:</strong> ${vital.warnings[0]}
          <div class="small text-muted mt-1">Evaluated by Health Tech Analytics Engine. Informational only, not a medical diagnosis.</div>
        </div>
      </div>
    `;
  }
};

const renderTrendChart = (trendsRes) => {
  const ctx = document.getElementById('dashboardTrendChart');
  if (!ctx || !trendsRes || !trendsRes.chartData) return;

  const labels = trendsRes.chartData.labels || [];
  const systolic = trendsRes.chartData.systolic || [];
  const diastolic = trendsRes.chartData.diastolic || [];
  const glucose = trendsRes.chartData.bloodGlucose || [];

  if (trendChartInstance) {
    trendChartInstance.destroy();
  }

  trendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length > 0 ? labels : ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'],
      datasets: [
        {
          label: 'Systolic BP (mmHg)',
          data: systolic.length > 0 ? systolic : [136, 132, 128, 124, 120],
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          borderWidth: 2.5,
          tension: 0.35,
          fill: true
        },
        {
          label: 'Diastolic BP (mmHg)',
          data: diastolic.length > 0 ? diastolic : [88, 85, 84, 80, 78],
          borderColor: '#0284c7',
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.35,
          borderDash: [4, 4]
        },
        {
          label: 'Blood Glucose (mg/dL)',
          data: glucose.length > 0 ? glucose : [104, 99, 95, 94, 93],
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.35
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' }
          }
        },
        tooltip: {
          padding: 12,
          cornerRadius: 8,
          titleFont: { family: 'Plus Jakarta Sans', weight: '700' },
          bodyFont: { family: 'Plus Jakarta Sans' }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: '#f1f5f9' },
          ticks: { font: { family: 'Plus Jakarta Sans', size: 11 } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Plus Jakarta Sans', size: 11 } }
        }
      }
    }
  });

  // Display trend summary bullets
  const trendSummaryEl = document.getElementById('dash-trend-bullets');
  if (trendSummaryEl && trendsRes.trendAnalysis && trendsRes.trendAnalysis.trendSummaries) {
    trendSummaryEl.innerHTML = trendsRes.trendAnalysis.trendSummaries
      .slice(0, 3)
      .map(
        (s) =>
          `<li class="mb-2 text-muted small"><i class="bi bi-graph-up-arrow text-primary me-2"></i>${s}</li>`
      )
      .join('');
  }
};

const renderUpcomingAppointment = (appointments) => {
  const container = document.getElementById('dash-upcoming-appointment-card');
  if (!container) return;

  const upcoming = (appointments || []).find(
    (a) => a.status === 'Confirmed' || a.status === 'Scheduled'
  );

  if (!upcoming) {
    container.innerHTML = `
      <div class="text-center py-4">
        <i class="bi bi-calendar-check text-muted fs-1 mb-2 d-block"></i>
        <p class="text-muted mb-3">No upcoming appointments scheduled.</p>
        <a href="appointments.html" class="btn btn-primary-ht btn-sm">Book an Appointment</a>
      </div>
    `;
    return;
  }

  const doctorName = upcoming.doctor ? upcoming.doctor.name : 'Attending Physician';
  const specialization = upcoming.doctor ? upcoming.doctor.specialization : 'General Medicine';
  const room = upcoming.doctor && upcoming.doctor.roomNumber ? upcoming.doctor.roomNumber : 'Room 101';

  container.innerHTML = `
    <div class="d-flex align-items-start gap-3 mb-3">
      <div class="doctor-avatar-circle" style="width: 52px; height: 52px; font-size: 1.25rem;">
        ${doctorName.replace('Dr. ', '').substring(0, 2).toUpperCase()}
      </div>
      <div>
        <h6 class="mb-1 fw-bold text-dark">${doctorName}</h6>
        <span class="badge bg-primary-subtle text-primary mb-2">${specialization}</span>
        <div class="small text-muted"><i class="bi bi-geo-alt me-1"></i>${room}</div>
      </div>
    </div>
    <div class="bg-light p-3 rounded-3 mb-3">
      <div class="d-flex justify-content-between mb-1">
        <span class="small text-muted">Date & Time:</span>
        <span class="small fw-bold text-dark">${upcoming.appointmentDate} • ${upcoming.timeSlot}</span>
      </div>
      <div class="d-flex justify-content-between">
        <span class="small text-muted">Reason:</span>
        <span class="small fw-semibold text-dark">${upcoming.reason}</span>
      </div>
    </div>
    <div class="d-flex gap-2">
      <a href="appointments.html" class="btn btn-outline-ht btn-sm w-100">View All</a>
      <button class="btn btn-sm btn-outline-danger w-100" onclick="cancelDashAppointment('${upcoming._id}')">Cancel</button>
    </div>
  `;
};

window.cancelDashAppointment = async (id) => {
  if (!confirm('Are you sure you want to cancel this appointment?')) return;
  try {
    await apiRequest(`/appointments/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason: 'Cancelled by patient via dashboard' })
    });
    showToast('Appointment cancelled successfully.', 'info');
    loadDashboardData();
  } catch (err) {
    showToast(err.message, 'danger');
  }
};

const renderRecentRecords = (records) => {
  const container = document.getElementById('dash-recent-records-list');
  if (!container) return;

  if (!records || records.length === 0) {
    container.innerHTML = `<p class="text-muted text-center py-3">No medical records uploaded yet.</p>`;
    return;
  }

  container.innerHTML = records
    .slice(0, 4)
    .map((r) => {
      const dateStr = new Date(r.date || r.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const medBadges = (r.medications || [])
        .map((m) => `<span class="medication-pill">${m.name} ${m.dosage || ''}</span>`)
        .join('');

      return `
        <div class="record-item-card">
          <div class="d-flex justify-content-between align-items-start mb-1">
            <h6 class="fw-bold mb-0 text-dark">${r.title}</h6>
            <span class="badge bg-secondary-subtle text-secondary">${r.recordType}</span>
          </div>
          <div class="small text-muted mb-2">
            <i class="bi bi-calendar3 me-1"></i>${dateStr} • <i class="bi bi-person-badge me-1"></i>${r.doctorName || 'Doctor'}
          </div>
          ${r.diagnosis ? `<div class="small mb-2 text-dark"><strong>Diagnosis:</strong> ${r.diagnosis}</div>` : ''}
          ${medBadges ? `<div class="mb-1">${medBadges}</div>` : ''}
        </div>
      `;
    })
    .join('');
};

const setupSOSModal = () => {
  const sosTriggerBtn = document.getElementById('btn-dash-sos-trigger');
  if (!sosTriggerBtn) return;

  sosTriggerBtn.addEventListener('click', async () => {
    const confirmTrigger = confirm(
      'EMERGENCY SOS ALERT CONFIRMATION:\n\nAre you sure you want to send an urgent emergency notification to your configured emergency contacts?\n\n(Note: This operates in Demo / Configured Notification Mode and does not automatically dial 911 emergency services).'
    );
    if (!confirmTrigger) return;

    try {
      sosTriggerBtn.disabled = true;
      sosTriggerBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Dispatching SOS...';

      const res = await triggerGlobalSOS();

      // Show comprehensive SOS alert feedback modal
      showSOSFeedbackModal(res.alert);
    } catch (err) {
      console.error(err);
    } finally {
      sosTriggerBtn.disabled = false;
      sosTriggerBtn.innerHTML = '<span class="pulse-dot"></span> Emergency SOS';
    }
  });
};

const showSOSFeedbackModal = (alert) => {
  const contactsList = (alert.contactsNotified || [])
    .map(
      (c) => `
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <div>
            <strong>${c.name}</strong> (${c.phone || c.email})
            <div class="small text-muted">${c.deliveryChannel} • ${c.details || ''}</div>
          </div>
          <span class="badge bg-success-subtle text-success">${c.deliveryStatus}</span>
        </li>
      `
    )
    .join('');

  const modalHtml = `
    <div class="modal fade show" id="sosResultModal" tabindex="-1" style="display: block; background: rgba(0,0,0,0.6);" aria-modal="true" role="dialog">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-header bg-danger text-white rounded-top-4">
            <h5 class="modal-title fw-bold"><i class="bi bi-shield-fill-exclamation me-2"></i>Emergency SOS Broadcast Active</h5>
            <button type="button" class="btn-close btn-close-white" onclick="document.getElementById('sosResultModal').remove()"></button>
          </div>
          <div class="modal-body p-4">
            <div class="alert alert-info border-0 rounded-3 mb-3">
              <i class="bi bi-info-circle-fill me-2"></i><strong>Status:</strong> ${alert.status} (${alert.isDemoMode ? 'Demo Simulation Mode' : 'Live Broadcast'})
            </div>
            <p class="mb-2 fw-semibold">Emergency Contacts Notified:</p>
            <ul class="list-group mb-3">
              ${contactsList || '<li class="list-group-item text-muted">No emergency contacts configured yet. Add contacts in Emergency menu.</li>'}
            </ul>
            <div class="disclaimer-banner">
              <strong>Mandatory Notice:</strong> ${alert.disclaimer}
            </div>
          </div>
          <div class="modal-footer border-0">
            <button type="button" class="btn btn-secondary rounded-3" onclick="document.getElementById('sosResultModal').remove()">Close</button>
            <a href="emergency.html" class="btn btn-primary-ht rounded-3">Manage Emergency Contacts</a>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
};
