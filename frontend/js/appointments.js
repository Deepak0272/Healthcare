/**
 * Health Tech Appointment Management Module
 */

let allDoctors = [];
let allAppointments = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;

  setupBookingForm();
  await loadDoctorsAndAppointments();
});

const loadDoctorsAndAppointments = async () => {
  try {
    const [docRes, apptRes] = await Promise.all([
      apiRequest('/doctors'),
      apiRequest('/appointments')
    ]);

    allDoctors = docRes.doctors || [];
    allAppointments = apptRes.appointments || [];

    renderDoctorsDirectory(allDoctors);
    renderAppointments(allAppointments);
    setupDoctorSearch();
  } catch (err) {
    showToast(`Error: ${err.message}`, 'danger');
  }
};

const renderDoctorsDirectory = (doctors) => {
  const container = document.getElementById('doctorsDirectoryContainer');
  if (!container) return;

  if (doctors.length === 0) {
    container.innerHTML = `<div class="col-12 text-center py-4 text-muted">No doctors found matching criteria.</div>`;
    return;
  }

  container.innerHTML = doctors
    .map((doc) => {
      const initials = doc.name.replace('Dr. ', '').substring(0, 2).toUpperCase();

      return `
        <div class="col-md-6 col-lg-3 mb-4">
          <div class="doctor-card">
            <div class="d-flex justify-content-between align-items-start">
              <div class="doctor-avatar-circle">${initials}</div>
              <span class="badge bg-warning-subtle text-warning fw-bold"><i class="bi bi-star-fill me-1"></i>${doc.rating || 4.8}</span>
            </div>
            <h5 class="fw-bold text-dark mb-1">${doc.name}</h5>
            <span class="badge bg-primary-subtle text-primary mb-2 align-self-start">${doc.specialization}</span>
            <div class="small text-muted mb-2"><i class="bi bi-mortarboard me-1"></i>${doc.qualification}</div>
            <div class="small text-muted mb-3"><i class="bi bi-building me-1"></i>${doc.hospitalDepartment}</div>
            <p class="small text-secondary mb-3 flex-grow-1">${doc.bio ? doc.bio.substring(0, 95) + '...' : ''}</p>
            
            <div class="pt-3 border-top mt-auto d-flex justify-content-between align-items-center">
              <div>
                <span class="small text-muted d-block">Fee</span>
                <span class="fw-bold text-dark">$${doc.consultationFee}</span>
              </div>
              <button class="btn btn-primary-ht btn-sm" onclick="openBookingModalForDoctor('${doc._id}')">
                <i class="bi bi-calendar-plus me-1"></i>Book
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
};

const setupDoctorSearch = () => {
  const searchInput = document.getElementById('doctorSearchInput');
  const specFilter = document.getElementById('doctorSpecFilter');

  const filterDocs = () => {
    const term = (searchInput.value || '').toLowerCase();
    const spec = specFilter.value;

    const filtered = allDoctors.filter((d) => {
      const matchSearch =
        d.name.toLowerCase().includes(term) ||
        d.specialization.toLowerCase().includes(term) ||
        d.hospitalDepartment.toLowerCase().includes(term);
      const matchSpec = !spec || d.specialization === spec;
      return matchSearch && matchSpec;
    });

    renderDoctorsDirectory(filtered);
  };

  if (searchInput) searchInput.addEventListener('input', filterDocs);
  if (specFilter) specFilter.addEventListener('change', filterDocs);
};

const renderAppointments = (appointments) => {
  const upcomingContainer = document.getElementById('upcomingAppointmentsContainer');
  const pastContainer = document.getElementById('pastAppointmentsContainer');

  const todayStr = new Date().toISOString().split('T')[0];

  const upcoming = appointments.filter(
    (a) => (a.status === 'Confirmed' || a.status === 'Scheduled') && a.appointmentDate >= todayStr
  );
  const past = appointments.filter(
    (a) => a.status === 'Completed' || a.status === 'Cancelled' || a.appointmentDate < todayStr
  );

  if (upcomingContainer) {
    if (upcoming.length === 0) {
      upcomingContainer.innerHTML = `<div class="text-center text-muted py-4">No upcoming appointments scheduled.</div>`;
    } else {
      upcomingContainer.innerHTML = upcoming
        .map((a) => {
          const docName = a.doctor ? a.doctor.name : 'Doctor';
          const spec = a.doctor ? a.doctor.specialization : 'General Medicine';
          const fee = a.doctor ? `$${a.doctor.consultationFee}` : '$50';

          return `
            <div class="card card-ht p-3 mb-3 border">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h6 class="fw-bold text-dark mb-1">${docName}</h6>
                  <span class="badge bg-primary-subtle text-primary">${spec}</span>
                </div>
                <span class="badge bg-success-subtle text-success">${a.status}</span>
              </div>
              <div class="p-2 bg-light rounded-2 small text-dark mb-2">
                <div><i class="bi bi-calendar3 me-2 text-primary"></i><strong>Date:</strong> ${a.appointmentDate} • <strong>Slot:</strong> ${a.timeSlot}</div>
                <div><i class="bi bi-chat-left-text me-2 text-primary"></i><strong>Reason:</strong> ${a.reason}</div>
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <span class="small text-muted">Consultation: <strong>${a.consultationType}</strong> (${fee})</span>
                <button class="btn btn-sm btn-outline-danger" onclick="cancelAppointmentItem('${a._id}')">Cancel</button>
              </div>
            </div>
          `;
        })
        .join('');
    }
  }

  if (pastContainer) {
    if (past.length === 0) {
      pastContainer.innerHTML = `<div class="text-center text-muted py-4">No past appointment history.</div>`;
    } else {
      pastContainer.innerHTML = past
        .map((a) => {
          const docName = a.doctor ? a.doctor.name : 'Doctor';
          const spec = a.doctor ? a.doctor.specialization : 'General Medicine';
          const isCancelled = a.status === 'Cancelled';

          return `
            <div class="p-3 mb-2 bg-white rounded-3 border">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="fw-bold text-dark">${docName} (${spec})</span>
                <span class="badge ${isCancelled ? 'bg-danger-subtle text-danger' : 'bg-secondary-subtle text-secondary'}">${a.status}</span>
              </div>
              <div class="small text-muted">${a.appointmentDate} • ${a.timeSlot} • ${a.reason}</div>
              ${a.doctorNotes ? `<div class="small text-secondary mt-1"><strong>Doctor Notes:</strong> ${a.doctorNotes}</div>` : ''}
            </div>
          `;
        })
        .join('');
    }
  }
};

window.openBookingModalForDoctor = async (doctorId) => {
  const doctor = allDoctors.find((d) => d._id === doctorId);
  if (!doctor) return;

  const docSelect = document.getElementById('bookDoctorSelect');
  if (docSelect) {
    docSelect.innerHTML = allDoctors
      .map((d) => `<option value="${d._id}" ${d._id === doctorId ? 'selected' : ''}>${d.name} (${d.specialization}) - $${d.consultationFee}</option>`)
      .join('');
  }

  // Pre-fill slots
  updateSlotsForDoctor(doctor);

  const modalEl = document.getElementById('bookAppointmentModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
};

const updateSlotsForDoctor = async (doctor) => {
  const slotSelect = document.getElementById('bookTimeSlotSelect');
  const dateInput = document.getElementById('bookDateInput');
  if (!slotSelect || !doctor) return;

  const dateVal = dateInput ? dateInput.value : '';
  let bookedSlots = [];

  if (dateVal) {
    try {
      const res = await apiRequest(`/doctors/${doctor._id}?date=${dateVal}`);
      bookedSlots = res.bookedSlots || [];
    } catch (e) {}
  }

  const slots = doctor.timeSlots || [
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '02:00 PM - 03:00 PM',
    '03:00 PM - 04:00 PM'
  ];

  slotSelect.innerHTML = slots
    .map((s) => {
      const isBooked = bookedSlots.includes(s);
      return `<option value="${s}" ${isBooked ? 'disabled' : ''}>${s} ${isBooked ? '(Already Booked)' : ''}</option>`;
    })
    .join('');
};

const setupBookingForm = () => {
  const form = document.getElementById('bookAppointmentForm');
  const docSelect = document.getElementById('bookDoctorSelect');
  const dateInput = document.getElementById('bookDateInput');

  // Set minimum date to today
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;

    dateInput.addEventListener('change', () => {
      const doc = allDoctors.find((d) => d._id === docSelect.value);
      if (doc) updateSlotsForDoctor(doc);
    });
  }

  if (docSelect) {
    docSelect.addEventListener('change', () => {
      const doc = allDoctors.find((d) => d._id === docSelect.value);
      if (doc) updateSlotsForDoctor(doc);
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btnConfirmBooking');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Confirming Slot...';

      const payload = {
        doctorId: docSelect.value,
        appointmentDate: dateInput.value,
        timeSlot: document.getElementById('bookTimeSlotSelect').value,
        reason: document.getElementById('bookReasonInput').value,
        symptoms: document.getElementById('bookSymptomsInput').value,
        consultationType: document.getElementById('bookConsultationType').value
      };

      try {
        const res = await apiRequest('/appointments', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        showToast('Appointment successfully confirmed and booked!', 'success');

        const modalEl = document.getElementById('bookAppointmentModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
        form.reset();

        await loadDoctorsAndAppointments();
      } catch (err) {
        showToast(err.message, 'danger');
      } finally {
        btn.disabled = false;
        btn.innerHTML = 'Confirm Appointment';
      }
    });
  }
};

window.cancelAppointmentItem = async (id) => {
  const reason = prompt('Please state the cancellation reason (optional):', 'Schedule conflict');
  if (reason === null) return;

  try {
    await apiRequest(`/appointments/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    });
    showToast('Appointment cancelled successfully.', 'info');
    await loadDoctorsAndAppointments();
  } catch (err) {
    showToast(err.message, 'danger');
  }
};
