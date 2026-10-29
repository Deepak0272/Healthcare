/**
 * Health Tech Emergency Contacts & SOS Alert Module
 */

let allContacts = [];
let allAlerts = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;

  setupAddContactForm();
  setupSOSButton();
  await loadEmergencyData();
});

const loadEmergencyData = async () => {
  try {
    const [contactsRes, alertsRes] = await Promise.all([
      apiRequest('/emergency/contacts'),
      apiRequest('/emergency/alerts')
    ]);

    allContacts = contactsRes.contacts || [];
    allAlerts = alertsRes.alerts || [];

    renderContactsList(allContacts);
    renderAlertsHistory(allAlerts);
  } catch (err) {
    showToast(`Error: ${err.message}`, 'danger');
  }
};

const renderContactsList = (contacts) => {
  const container = document.getElementById('emergencyContactsList');
  if (!container) return;

  if (contacts.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-4 text-muted">
        <i class="bi bi-person-x fs-1 mb-2 d-block"></i>
        <p class="mb-2">No emergency contacts added yet.</p>
        <button class="btn btn-sm btn-primary-ht" data-bs-toggle="modal" data-bs-target="#addContactModal">
          Add Emergency Contact
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = contacts
    .map((c) => {
      return `
        <div class="col-md-6 mb-3">
          <div class="card card-ht p-3 border position-relative">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div>
                <h6 class="fw-bold text-dark mb-0">${c.name}</h6>
                <span class="small text-muted">${c.relationship}</span>
              </div>
              ${c.isPrimary ? '<span class="badge bg-danger-subtle text-danger fw-bold"><i class="bi bi-star-fill me-1"></i>Primary</span>' : ''}
            </div>
            <div class="small text-secondary mb-1">
              <i class="bi bi-telephone-fill me-2 text-primary"></i><strong>Phone:</strong> ${c.phoneNumber}
            </div>
            <div class="small text-secondary mb-2">
              <i class="bi bi-envelope-fill me-2 text-primary"></i><strong>Email:</strong> ${c.email}
            </div>
            ${c.notes ? `<div class="small text-muted bg-light p-2 rounded mb-2">Note: ${c.notes}</div>` : ''}
            <div class="d-flex justify-content-end gap-2 pt-2 border-top">
              <button class="btn btn-sm btn-outline-danger" onclick="deleteEmergencyContactItem('${c._id}')">
                <i class="bi bi-trash me-1"></i>Remove
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
};

const renderAlertsHistory = (alerts) => {
  const tbody = document.getElementById('emergencyAlertsHistoryBody');
  if (!tbody) return;

  if (alerts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No emergency alerts on record.</td></tr>`;
    return;
  }

  tbody.innerHTML = alerts
    .map((a) => {
      const dateStr = new Date(a.triggeredAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const notifiedCount = a.contactsNotified ? a.contactsNotified.length : 0;
      const statusBadge =
        a.status === 'Sent'
          ? '<span class="badge bg-success-subtle text-success">Sent (Live)</span>'
          : '<span class="badge bg-info-subtle text-info">Demo Delivered</span>';

      return `
        <tr>
          <td class="fw-semibold text-dark">${dateStr}</td>
          <td><span class="badge bg-danger-subtle text-danger">${a.alertType}</span></td>
          <td>${statusBadge}</td>
          <td class="small text-muted">${a.locationNotes || 'Residence'}</td>
          <td><span class="badge bg-light text-dark border">${notifiedCount} Contacts</span></td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-ht" onclick="viewAlertLog('${a._id}')">
              <i class="bi bi-info-circle me-1"></i>Log
            </button>
          </td>
        </tr>
      `;
    })
    .join('');
};

window.viewAlertLog = (id) => {
  const alert = allAlerts.find((a) => a._id === id);
  if (!alert) return;

  const contactsHtml = (alert.contactsNotified || [])
    .map(
      (c) => `
        <div class="p-2 mb-2 bg-light rounded border">
          <div class="fw-bold text-dark">${c.name} (${c.phone || c.email})</div>
          <div class="small text-muted">${c.deliveryChannel} • <strong>${c.deliveryStatus}</strong></div>
          <div class="small text-secondary">${c.details || ''}</div>
        </div>
      `
    )
    .join('');

  const modalHtml = `
    <div class="modal fade show" id="alertLogModal" tabindex="-1" style="display: block; background: rgba(0,0,0,0.6);" aria-modal="true" role="dialog">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-header border-bottom p-4">
            <h5 class="modal-title fw-bold text-dark"><i class="bi bi-clock-history me-2 text-danger"></i>Emergency Alert Dispatch Log</h5>
            <button type="button" class="btn-close" onclick="document.getElementById('alertLogModal').remove()"></button>
          </div>
          <div class="modal-body p-4">
            <div class="mb-3">
              <strong>Triggered At:</strong> ${new Date(alert.triggeredAt).toLocaleString()}
            </div>
            <div class="mb-3">
              <strong>Message:</strong> <span class="text-secondary">${alert.message}</span>
            </div>
            <div class="mb-3">
              <strong>Location:</strong> <span class="text-secondary">${alert.locationNotes}</span>
            </div>
            <h6 class="fw-bold mt-3 mb-2">Notification Dispatch Status:</h6>
            ${contactsHtml || '<p class="text-muted small">No contacts recorded in log.</p>'}
            <div class="disclaimer-banner mt-3">
              <strong>Notice:</strong> ${alert.disclaimer}
            </div>
          </div>
          <div class="modal-footer border-0">
            <button type="button" class="btn btn-secondary rounded-3" onclick="document.getElementById('alertLogModal').remove()">Close</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
};

const setupAddContactForm = () => {
  const form = document.getElementById('addEmergencyContactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSaveContact');
    btn.disabled = true;

    const payload = {
      name: document.getElementById('contactName').value,
      relationship: document.getElementById('contactRelationship').value,
      phoneNumber: document.getElementById('contactPhone').value,
      email: document.getElementById('contactEmail').value,
      isPrimary: document.getElementById('contactIsPrimary').checked,
      notes: document.getElementById('contactNotes').value
    };

    try {
      await apiRequest('/emergency/contacts', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      showToast('Emergency contact added successfully!', 'success');

      const modalEl = document.getElementById('addContactModal');
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
      form.reset();

      await loadEmergencyData();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      btn.disabled = false;
    }
  });
};

window.deleteEmergencyContactItem = async (id) => {
  if (!confirm('Are you sure you want to remove this emergency contact?')) return;
  try {
    await apiRequest(`/emergency/contacts/${id}`, { method: 'DELETE' });
    showToast('Contact removed.', 'info');
    await loadEmergencyData();
  } catch (err) {
    showToast(err.message, 'danger');
  }
};

const setupSOSButton = () => {
  const sosBtn = document.getElementById('btnEmergencyPageSOS');
  if (!sosBtn) return;

  sosBtn.addEventListener('click', async () => {
    const loc = prompt('Enter your current location or notes (optional):', 'Registered Residence');
    if (loc === null) return;

    try {
      sosBtn.disabled = true;
      sosBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Broadcasting Emergency SOS...';

      const res = await apiRequest('/emergency/alerts', {
        method: 'POST',
        body: JSON.stringify({
          alertType: 'SOS_CRITICAL',
          locationNotes: loc,
          customMessage: 'URGENT: Patient activated Emergency SOS broadcast.'
        })
      });

      showToast('Emergency SOS alert processed successfully!', 'danger');
      await loadEmergencyData();

      // Show log
      viewAlertLog(res.alert._id);
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      sosBtn.disabled = false;
      sosBtn.innerHTML = '<span class="pulse-dot"></span> TRIGGER EMERGENCY SOS NOW';
    }
  });
};
