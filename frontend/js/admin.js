/**
 * Health Tech Administrator Module
 */

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;

  if (user.role !== 'admin') {
    alert('Access restricted to administrators only.');
    window.location.href = 'dashboard.html';
    return;
  }

  setupAddDoctorForm();
  await loadAdminDashboard();
});

const loadAdminDashboard = async () => {
  try {
    const [statsRes, usersRes, docsRes, apptsRes] = await Promise.all([
      apiRequest('/admin/stats'),
      apiRequest('/admin/users'),
      apiRequest('/doctors'),
      apiRequest('/appointments')
    ]);

    renderAdminStats(statsRes.stats);
    renderAdminUsers(usersRes.users);
    renderAdminDoctors(docsRes.doctors);
    renderAdminAppointments(apptsRes.appointments);
  } catch (err) {
    showToast(`Admin load error: ${err.message}`, 'danger');
  }
};

const renderAdminStats = (stats) => {
  if (!stats) return;
  document.getElementById('statTotalPatients').textContent = stats.totalPatients || 0;
  document.getElementById('statTotalDoctors').textContent = stats.totalDoctors || 0;
  document.getElementById('statTotalAppointments').textContent = stats.totalAppointments || 0;
  document.getElementById('statTotalRecords').textContent = stats.totalRecords || 0;
  document.getElementById('statTotalAlerts').textContent = stats.totalAlerts || 0;
};

const renderAdminUsers = (users) => {
  const tbody = document.getElementById('adminUsersTableBody');
  if (!tbody) return;

  tbody.innerHTML = (users || [])
    .map((u) => {
      return `
        <tr>
          <td class="fw-bold text-dark">${u.name}</td>
          <td>${u.email}</td>
          <td>
            <select class="form-select form-select-sm" onchange="updateUserRole('${u._id}', this.value)" style="width: 120px;">
              <option value="patient" ${u.role === 'patient' ? 'selected' : ''}>Patient</option>
              <option value="doctor" ${u.role === 'doctor' ? 'selected' : ''}>Doctor</option>
              <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
          </td>
          <td>${u.phone || 'N/A'}</td>
          <td><span class="badge ${u.isActive ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}">${u.isActive ? 'Active' : 'Disabled'}</span></td>
        </tr>
      `;
    })
    .join('');
};

window.updateUserRole = async (userId, newRole) => {
  try {
    await apiRequest(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role: newRole })
    });
    showToast(`User role updated to ${newRole}`, 'success');
  } catch (err) {
    showToast(err.message, 'danger');
  }
};

const renderAdminDoctors = (doctors) => {
  const tbody = document.getElementById('adminDoctorsTableBody');
  if (!tbody) return;

  tbody.innerHTML = (doctors || [])
    .map((d) => {
      return `
        <tr>
          <td class="fw-bold text-dark">${d.name}</td>
          <td><span class="badge bg-primary-subtle text-primary">${d.specialization}</span></td>
          <td>${d.hospitalDepartment}</td>
          <td>$${d.consultationFee}</td>
          <td>${d.rating} ★</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-danger" onclick="deleteDoctorItem('${d._id}')">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join('');
};

window.deleteDoctorItem = async (id) => {
  if (!confirm('Are you sure you want to remove this doctor from the active directory?')) return;
  try {
    await apiRequest(`/doctors/${id}`, { method: 'DELETE' });
    showToast('Doctor profile removed.', 'info');
    await loadAdminDashboard();
  } catch (err) {
    showToast(err.message, 'danger');
  }
};

const renderAdminAppointments = (appointments) => {
  const tbody = document.getElementById('adminAppointmentsTableBody');
  if (!tbody) return;

  tbody.innerHTML = (appointments || [])
    .map((a) => {
      const patientName = a.patient ? a.patient.name : 'Unknown Patient';
      const docName = a.doctor ? a.doctor.name : 'Unknown Doctor';

      return `
        <tr>
          <td class="fw-bold text-dark">${patientName}</td>
          <td>${docName}</td>
          <td>${a.appointmentDate}</td>
          <td>${a.timeSlot}</td>
          <td><span class="badge bg-primary-subtle text-primary">${a.status}</span></td>
          <td class="text-end">
            <select class="form-select form-select-sm d-inline-block" style="width: 140px;" onchange="updateAppointmentStatus('${a._id}', this.value)">
              <option value="">Change Status...</option>
              <option value="Confirmed">Confirm</option>
              <option value="Completed">Complete</option>
              <option value="Cancelled">Cancel</option>
            </select>
          </td>
        </tr>
      `;
    })
    .join('');
};

window.updateAppointmentStatus = async (id, status) => {
  if (!status) return;
  try {
    await apiRequest(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    showToast(`Appointment status updated to ${status}`, 'success');
    await loadAdminDashboard();
  } catch (err) {
    showToast(err.message, 'danger');
  }
};

const setupAddDoctorForm = () => {
  const form = document.getElementById('adminAddDoctorForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSubmitDoctor');
    btn.disabled = true;

    const payload = {
      name: document.getElementById('adminDocName').value,
      specialization: document.getElementById('adminDocSpec').value,
      qualification: document.getElementById('adminDocQual').value,
      experienceYears: Number(document.getElementById('adminDocExp').value || 5),
      consultationFee: Number(document.getElementById('adminDocFee').value || 50),
      hospitalDepartment: document.getElementById('adminDocDept').value,
      roomNumber: document.getElementById('adminDocRoom').value,
      bio: document.getElementById('adminDocBio').value
    };

    try {
      await apiRequest('/doctors', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      showToast('Doctor profile created successfully!', 'success');

      const modalEl = document.getElementById('adminAddDoctorModal');
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
      form.reset();

      await loadAdminDashboard();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      btn.disabled = false;
    }
  });
};
