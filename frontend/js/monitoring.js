/**
 * Health Tech Health Monitoring Module
 * Integrates manual vital logging, Python Analytics microservice results, and historical charts
 */

let monitoringChart = null;
let currentChartMode = 'bp';
let cachedTrendsData = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;

  setupMeasurementForm();
  await refreshMonitoringPage();
});

const refreshMonitoringPage = async () => {
  try {
    const [latestRes, trendsRes, measurementsRes] = await Promise.all([
      apiRequest('/health-measurements/latest'),
      apiRequest('/health-measurements/trends?days=30'),
      apiRequest('/health-measurements?limit=30')
    ]);

    cachedTrendsData = trendsRes;
    renderLatestVitals(latestRes.measurement);
    renderMonitoringChart(trendsRes, currentChartMode);
    renderTrendsNarrative(trendsRes.trendAnalysis);
    renderMeasurementsTable(measurementsRes.measurements);
  } catch (err) {
    console.error('Error refreshing monitoring:', err);
    showToast(`Error loading health data: ${err.message}`, 'danger');
  }
};

const renderLatestVitals = (vital) => {
  if (!vital) return;

  document.getElementById('mon-bp-val').textContent =
    vital.systolicBP && vital.diastolicBP ? `${vital.systolicBP}/${vital.diastolicBP} mmHg` : '--/--';
  document.getElementById('mon-hr-val').textContent = vital.heartRate ? `${vital.heartRate} bpm` : '--';
  document.getElementById('mon-glucose-val').textContent = vital.bloodGlucose ? `${vital.bloodGlucose} mg/dL` : '--';
  document.getElementById('mon-temp-val').textContent = vital.bodyTemperature ? `${vital.bodyTemperature} °F` : '--';
  document.getElementById('mon-weight-val').textContent = vital.weight ? `${vital.weight} kg` : '--';

  // Last updated timestamp
  const dateEl = document.getElementById('mon-last-updated');
  if (dateEl && vital.recordedAt) {
    dateEl.textContent = new Date(vital.recordedAt).toLocaleString();
  }
};

const renderTrendsNarrative = (analysis) => {
  const container = document.getElementById('mon-analysis-insights');
  if (!container || !analysis) return;

  const score = analysis.healthStabilityScore || 85;
  const summaries = analysis.trendSummaries || [];

  container.innerHTML = `
    <div class="d-flex align-items-center justify-content-between p-3 bg-light rounded-3 mb-3 border">
      <div>
        <h6 class="fw-bold mb-1 text-dark">Health Stability Index</h6>
        <p class="small text-muted mb-0">Calculated from chronological biometric variations.</p>
      </div>
      <div class="text-end">
        <span class="fs-3 fw-bold text-primary">${score}/100</span>
        <div class="small fw-semibold text-${score >= 80 ? 'success' : score >= 60 ? 'warning' : 'danger'}">
          ${score >= 80 ? 'Stable Target' : 'Observation Advised'}
        </div>
      </div>
    </div>
    <h6 class="fw-bold text-dark mb-2">Automated Statistical Summary:</h6>
    <ul class="list-unstyled mb-3">
      ${summaries
        .map(
          (s) =>
            `<li class="mb-2 small text-secondary d-flex align-items-start">
               <i class="bi bi-activity text-primary me-2 mt-1"></i> <span>${s}</span>
             </li>`
        )
        .join('')}
    </ul>
    <div class="disclaimer-banner">
      <i class="bi bi-shield-check me-1"></i> ${analysis.disclaimer}
    </div>
  `;
};

const renderMonitoringChart = (trendsData, mode = 'bp') => {
  const ctx = document.getElementById('fullMonitoringChart');
  if (!ctx || !trendsData || !trendsData.chartData) return;

  const labels = trendsData.chartData.labels || [];
  let datasets = [];

  if (mode === 'bp') {
    datasets = [
      {
        label: 'Systolic BP (mmHg)',
        data: trendsData.chartData.systolic,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.3
      },
      {
        label: 'Diastolic BP (mmHg)',
        data: trendsData.chartData.diastolic,
        borderColor: '#0284c7',
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.3
      }
    ];
  } else if (mode === 'glucose') {
    datasets = [
      {
        label: 'Blood Glucose (mg/dL)',
        data: trendsData.chartData.bloodGlucose,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.3
      }
    ];
  } else if (mode === 'hr') {
    datasets = [
      {
        label: 'Heart Rate (bpm)',
        data: trendsData.chartData.heartRate,
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.12)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.3
      }
    ];
  } else if (mode === 'weight') {
    datasets = [
      {
        label: 'Weight (kg)',
        data: trendsData.chartData.weight,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.3
      }
    ];
  }

  if (monitoringChart) {
    monitoringChart.destroy();
  }

  monitoringChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { family: 'Plus Jakarta Sans', weight: '600' } } },
        tooltip: { padding: 12, cornerRadius: 8 }
      },
      scales: {
        y: { grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Plus Jakarta Sans' } } },
        x: { grid: { display: false }, ticks: { font: { family: 'Plus Jakarta Sans' } } }
      }
    }
  });
};

window.switchChartMetric = (metric) => {
  currentChartMode = metric;
  document.querySelectorAll('.btn-metric-tab').forEach((b) => b.classList.remove('active'));
  const activeBtn = document.getElementById(`tab-metric-${metric}`);
  if (activeBtn) activeBtn.classList.add('active');

  if (cachedTrendsData) {
    renderMonitoringChart(cachedTrendsData, metric);
  }
};

const renderMeasurementsTable = (measurements) => {
  const tbody = document.getElementById('measurementsTableBody');
  if (!tbody) return;

  if (!measurements || measurements.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No measurements logged yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = measurements
    .map((m) => {
      const dateStr = new Date(m.recordedAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const bpDisplay = m.systolicBP && m.diastolicBP ? `${m.systolicBP}/${m.diastolicBP}` : '--';
      const hrDisplay = m.heartRate ? `${m.heartRate} bpm` : '--';
      const bgDisplay = m.bloodGlucose ? `${m.bloodGlucose} mg/dL` : '--';
      const tempDisplay = m.bodyTemperature ? `${m.bodyTemperature} °F` : '--';
      const weightDisplay = m.weight ? `${m.weight} kg` : '--';

      const conditionBadge =
        m.overallCondition === 'Optimal'
          ? '<span class="badge bg-success-subtle text-success">Optimal</span>'
          : '<span class="badge bg-warning-subtle text-warning">Observation</span>';

      return `
        <tr>
          <td class="fw-semibold text-dark">${dateStr}</td>
          <td>${bpDisplay}</td>
          <td>${hrDisplay}</td>
          <td>${bgDisplay}</td>
          <td>${tempDisplay}</td>
          <td>${weightDisplay}</td>
          <td>${conditionBadge}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-danger" onclick="deleteMeasurementRecord('${m._id}')">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join('');
};

window.deleteMeasurementRecord = async (id) => {
  if (!confirm('Are you sure you want to delete this vital reading?')) return;
  try {
    await apiRequest(`/health-measurements/${id}`, { method: 'DELETE' });
    showToast('Measurement removed.', 'info');
    await refreshMonitoringPage();
  } catch (err) {
    showToast(err.message, 'danger');
  }
};

const setupMeasurementForm = () => {
  const form = document.getElementById('addMeasurementForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSaveMeasurement');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Evaluating Biometrics...';

    const payload = {
      systolicBP: document.getElementById('inputSystolic').value || undefined,
      diastolicBP: document.getElementById('inputDiastolic').value || undefined,
      heartRate: document.getElementById('inputHeartRate').value || undefined,
      bloodGlucose: document.getElementById('inputGlucose').value || undefined,
      bodyTemperature: document.getElementById('inputTemperature').value || undefined,
      weight: document.getElementById('inputWeight').value || undefined,
      notes: document.getElementById('inputNotes').value || ''
    };

    try {
      const res = await apiRequest('/health-measurements', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      showToast('Vital signs logged and analyzed successfully!', 'success');

      // Close modal
      const modalEl = document.getElementById('addMeasurementModal');
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
      form.reset();

      // Show Analysis Feedback Modal
      showAnalysisFeedbackModal(res.analysis);

      await refreshMonitoringPage();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Save & Analyze Biometrics';
    }
  });
};

const showAnalysisFeedbackModal = (analysis) => {
  if (!analysis) return;

  const warningsList = (analysis.warnings || [])
    .map((w) => `<li class="text-danger small mb-1"><i class="bi bi-exclamation-triangle-fill me-2"></i>${w}</li>`)
    .join('');

  const modalHtml = `
    <div class="modal fade show" id="analysisResultModal" tabindex="-1" style="display: block; background: rgba(0,0,0,0.6);" aria-modal="true" role="dialog">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-header bg-primary text-white rounded-top-4">
            <h5 class="modal-title fw-bold"><i class="bi bi-cpu me-2"></i>Automated Biometric Evaluation</h5>
            <button type="button" class="btn-close btn-close-white" onclick="document.getElementById('analysisResultModal').remove()"></button>
          </div>
          <div class="modal-body p-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="fw-semibold">Engine Source:</span>
              <span class="badge bg-secondary-subtle text-secondary">${analysis.sourceEngine || 'Health Tech Clinical Analytics Engine'}</span>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="fw-semibold">Evaluated Condition:</span>
              <span class="badge ${analysis.hasAbnormalities ? 'bg-warning-subtle text-warning' : 'bg-success-subtle text-success'} fs-6">
                ${analysis.overallCondition}
              </span>
            </div>
            ${warningsList ? `<h6 class="fw-bold mt-3 mb-2">Informational Observations:</h6><ul class="list-unstyled p-2 bg-light rounded-3 border">${warningsList}</ul>` : '<div class="alert alert-success border-0 small"><i class="bi bi-check-circle-fill me-2"></i>All vital signs recorded fall within standard normal reference ranges.</div>'}
            <div class="disclaimer-banner">
              <strong>Medical Notice:</strong> ${analysis.disclaimer}
            </div>
          </div>
          <div class="modal-footer border-0">
            <button type="button" class="btn btn-primary-ht w-100 rounded-3" onclick="document.getElementById('analysisResultModal').remove()">Understood</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
};
