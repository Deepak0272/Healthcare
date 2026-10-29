/**
 * Health Tech Digital Health Records Module
 */

let allRecords = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;

  setupRecordFilters();
  setupAddRecordForm();
  await loadRecords();
});

const loadRecords = async () => {
  try {
    const res = await apiRequest('/health-records');
    allRecords = res.records || [];
    renderRecordsList(allRecords);
  } catch (err) {
    showToast(`Failed to load health records: ${err.message}`, 'danger');
  }
};

const renderRecordsList = (records) => {
  const container = document.getElementById('recordsContainer');
  if (!container) return;

  if (records.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-folder2-open text-muted fs-1 mb-3 d-block"></i>
        <h5 class="fw-bold text-dark">No Health Records Found</h5>
        <p class="text-muted">Upload doctor prescriptions, diagnostic reports, and medical notes.</p>
        <button class="btn btn-primary-ht" data-bs-toggle="modal" data-bs-target="#addRecordModal">
          <i class="bi bi-plus-lg me-1"></i>Add New Record
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = records
    .map((r) => {
      const dateStr = new Date(r.date || r.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const badgeColors = {
        Prescription: 'primary',
        'Lab Report': 'success',
        Diagnosis: 'warning',
        Vaccination: 'info',
        'Imaging/X-Ray': 'secondary'
      };
      const badgeType = badgeColors[r.recordType] || 'primary';

      const medsCount = r.medications ? r.medications.length : 0;
      const hasAttachment = Boolean(r.attachmentUrl);

      return `
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card card-ht h-100 p-4 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex justify-content-between align-items-start mb-2">
                <span class="badge bg-${badgeType}-subtle text-${badgeType} fw-bold">${r.recordType}</span>
                <span class="small text-muted">${dateStr}</span>
              </div>
              <h5 class="fw-bold text-dark mb-1">${r.title}</h5>
              <div class="small text-muted mb-3">
                <i class="bi bi-person-badge me-1"></i>${r.doctorName || 'Attending Doctor'}
              </div>

              ${r.diagnosis ? `<p class="small text-secondary mb-2"><strong>Diagnosis:</strong> ${r.diagnosis}</p>` : ''}
              ${r.treatmentPlan ? `<p class="small text-muted mb-3 text-truncate"><strong>Plan:</strong> ${r.treatmentPlan}</p>` : ''}

              <div class="d-flex flex-wrap gap-1 mb-3">
                ${medsCount > 0 ? `<span class="badge bg-light text-dark border"><i class="bi bi-capsule me-1 text-primary"></i>${medsCount} Meds</span>` : ''}
                ${hasAttachment ? `<span class="badge bg-light text-dark border"><i class="bi bi-paperclip me-1 text-success"></i>Report Attached</span>` : ''}
              </div>
            </div>

            <div class="pt-3 border-top d-flex gap-2">
              <button class="btn btn-outline-ht btn-sm w-100" onclick="viewRecordDetails('${r._id}')">
                <i class="bi bi-eye me-1"></i>Details
              </button>
              <button class="btn btn-outline-danger btn-sm" onclick="deleteRecord('${r._id}')">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
};

const setupRecordFilters = () => {
  const searchInput = document.getElementById('recordSearchInput');
  const typeFilter = document.getElementById('recordTypeSelect');

  const applyFilters = () => {
    const term = (searchInput.value || '').toLowerCase();
    const type = typeFilter.value;

    const filtered = allRecords.filter((r) => {
      const matchSearch =
        r.title.toLowerCase().includes(term) ||
        (r.diagnosis && r.diagnosis.toLowerCase().includes(term)) ||
        (r.doctorName && r.doctorName.toLowerCase().includes(term));
      const matchType = !type || r.recordType === type;
      return matchSearch && matchType;
    });

    renderRecordsList(filtered);
  };

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (typeFilter) typeFilter.addEventListener('change', applyFilters);
};

window.viewRecordDetails = (id) => {
  const record = allRecords.find((r) => r._id === id);
  if (!record) return;

  const dateStr = new Date(record.date || record.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const medsHtml =
    record.medications && record.medications.length > 0
      ? `
      <h6 class="fw-bold mt-3 mb-2 text-dark">Prescribed Medications:</h6>
      <div class="table-responsive">
        <table class="table table-sm table-bordered">
          <thead class="table-light">
            <tr>
              <th>Medication</th>
              <th>Dosage</th>
              <th>Frequency</th>
              <th>Duration</th>
              <th>Instructions</th>
            </tr>
          </thead>
          <tbody>
            ${record.medications
              .map(
                (m) => `
              <tr>
                <td class="fw-bold text-primary">${m.name}</td>
                <td>${m.dosage || '-'}</td>
                <td>${m.frequency || '-'}</td>
                <td>${m.duration || '-'}</td>
                <td>${m.instructions || '-'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `
      : '';

  const attachmentHtml = record.attachmentUrl
    ? `
      <div class="p-3 bg-light rounded-3 border d-flex align-items-center justify-content-between mt-3">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-file-earmark-medical text-primary fs-3"></i>
          <div>
            <div class="fw-semibold text-dark">${record.attachmentOriginalName || 'Medical Report File'}</div>
            <div class="small text-muted">${record.attachmentSize ? `${Math.round(record.attachmentSize / 1024)} KB` : ''}</div>
          </div>
        </div>
        <a href="${record.attachmentUrl}" target="_blank" class="btn btn-sm btn-primary-ht">
          <i class="bi bi-download me-1"></i>View / Download
        </a>
      </div>
    `
    : '';

  const modalHtml = `
    <div class="modal fade show" id="recordDetailModal" tabindex="-1" style="display: block; background: rgba(0,0,0,0.6);" aria-modal="true" role="dialog">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-header border-bottom p-4">
            <div>
              <span class="badge bg-primary-subtle text-primary mb-1">${record.recordType}</span>
              <h4 class="modal-title fw-bold text-dark">${record.title}</h4>
              <div class="small text-muted"><i class="bi bi-calendar3 me-1"></i>${dateStr} • Attending: ${record.doctorName ? (record.doctorName.startsWith('Dr.') ? record.doctorName : `Dr. ${record.doctorName}`) : 'Doctor'}</div>
            </div>
            <button type="button" class="btn-close" onclick="document.getElementById('recordDetailModal').remove()"></button>
          </div>
          <div class="modal-body p-4">
            ${record.diagnosis ? `<div class="mb-3"><h6 class="fw-bold text-dark mb-1">Clinical Diagnosis:</h6><p class="text-secondary">${record.diagnosis}</p></div>` : ''}
            ${record.treatmentPlan ? `<div class="mb-3"><h6 class="fw-bold text-dark mb-1">Treatment Plan:</h6><p class="text-secondary">${record.treatmentPlan}</p></div>` : ''}
            ${medsHtml}
            ${record.notes ? `<div class="mb-3"><h6 class="fw-bold text-dark mb-1">Clinical Notes:</h6><p class="text-secondary">${record.notes}</p></div>` : ''}
            ${attachmentHtml}
          </div>
          <div class="modal-footer border-0">
            <button type="button" class="btn btn-secondary rounded-3" onclick="document.getElementById('recordDetailModal').remove()">Close</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.deleteRecord = async (id) => {
  if (!confirm('Are you sure you want to delete this health record?')) return;
  try {
    await apiRequest(`/health-records/${id}`, { method: 'DELETE' });
    showToast('Record deleted.', 'info');
    await loadRecords();
  } catch (err) {
    showToast(err.message, 'danger');
  }
};

const setupAddRecordForm = () => {
  const form = document.getElementById('addRecordForm');
  if (!form) return;

  // Dynamic medication row addition
  const addMedBtn = document.getElementById('btnAddMedicationRow');
  const medsContainer = document.getElementById('medicationsRowContainer');

  if (addMedBtn && medsContainer) {
    addMedBtn.addEventListener('click', () => {
      const row = document.createElement('div');
      row.className = 'row g-2 mb-2 med-input-row';
      row.innerHTML = `
        <div class="col-md-3"><input type="text" class="form-control form-control-sm form-control-ht med-name" placeholder="Medication (e.g. Lisinopril)" required></div>
        <div class="col-md-2"><input type="text" class="form-control form-control-sm form-control-ht med-dose" placeholder="Dose (10mg)"></div>
        <div class="col-md-3"><input type="text" class="form-control form-control-sm form-control-ht med-freq" placeholder="Freq (Once daily)"></div>
        <div class="col-md-3"><input type="text" class="form-control form-control-sm form-control-ht med-dur" placeholder="Duration (30 days)"></div>
        <div class="col-md-1 d-flex align-items-center"><button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('.med-input-row').remove()"><i class="bi bi-x"></i></button></div>
      `;
      medsContainer.appendChild(row);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSubmitRecord');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving Record...';

    const formData = new FormData();
    formData.append('title', document.getElementById('recTitle').value);
    formData.append('recordType', document.getElementById('recType').value);
    formData.append('doctorName', document.getElementById('recDoctor').value);
    formData.append('date', document.getElementById('recDate').value || new Date().toISOString());
    formData.append('diagnosis', document.getElementById('recDiagnosis').value);
    formData.append('treatmentPlan', document.getElementById('recPlan').value);
    formData.append('notes', document.getElementById('recNotes').value);

    // Extract medications
    const medRows = document.querySelectorAll('.med-input-row');
    const meds = [];
    medRows.forEach((row) => {
      const name = row.querySelector('.med-name').value;
      if (name) {
        meds.push({
          name,
          dosage: row.querySelector('.med-dose').value,
          frequency: row.querySelector('.med-freq').value,
          duration: row.querySelector('.med-dur').value
        });
      }
    });
    formData.append('medications', JSON.stringify(meds));

    // File attachment
    const fileInput = document.getElementById('recAttachment');
    if (fileInput.files.length > 0) {
      formData.append('file', fileInput.files[0]);
    }

    try {
      await apiRequest('/health-records', {
        method: 'POST',
        body: formData
      });

      showToast('Health record uploaded and saved successfully!', 'success');

      const modalEl = document.getElementById('addRecordModal');
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
      form.reset();
      if (medsContainer) medsContainer.innerHTML = '';

      await loadRecords();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Save Medical Record';
    }
  });
};
