/**
 * Native Health & Biometric Analytics Engine for Health Tech
 * Evaluates vital measurements, statistical historical trends, and stability indices
 * based on clinical standards (AHA / ADA / WHO guidelines).
 */

const MEDICAL_DISCLAIMER =
  'Medical Disclaimer: This health analysis and any associated alerts are generated for informational purposes only. They do not constitute a clinical diagnosis, treatment plan, or professional healthcare advice. Always consult a qualified medical professional for health evaluations and treatment decisions.';

const evaluateMeasurement = (data) => {
  const warnings = [];
  const statusSummary = {};

  // 1. Blood Pressure evaluation
  const systolic = data.systolicBP !== undefined && data.systolicBP !== null ? Number(data.systolicBP) : null;
  const diastolic = data.diastolicBP !== undefined && data.diastolicBP !== null ? Number(data.diastolicBP) : null;

  if (systolic !== null && diastolic !== null) {
    let bpStatus = 'Normal';
    if (systolic < 90 || diastolic < 60) {
      bpStatus = 'Low (Hypotension)';
      warnings.push(`Informational Warning: Blood pressure (${systolic}/${diastolic} mmHg) is lower than typical reference range (90/60 mmHg).`);
    } else if (systolic <= 120 && diastolic <= 80) {
      bpStatus = 'Normal';
    } else if (systolic <= 129 && diastolic <= 80) {
      bpStatus = 'Elevated';
      warnings.push(`Informational Warning: Systolic blood pressure is elevated (${systolic} mmHg). Recommend monitoring lifestyle and sodium intake.`);
    } else if (systolic <= 139 || diastolic <= 89) {
      bpStatus = 'Stage 1 Hypertension';
      warnings.push(`Informational Warning: Blood pressure (${systolic}/${diastolic} mmHg) falls in Stage 1 Hypertension range. Consider consulting your doctor.`);
    } else {
      bpStatus = 'Stage 2 Hypertension';
      warnings.push(`Important Alert: Blood pressure (${systolic}/${diastolic} mmHg) is in Stage 2 Hypertension range. Please discuss this reading promptly with your healthcare team.`);
    }

    statusSummary.bloodPressure = {
      status: bpStatus,
      systolic,
      diastolic,
      isAbnormal: bpStatus !== 'Normal'
    };
  }

  // 2. Heart Rate evaluation
  const hr = data.heartRate !== undefined && data.heartRate !== null ? Number(data.heartRate) : null;
  if (hr !== null) {
    let hrStatus = 'Normal';
    if (hr < 60) {
      hrStatus = 'Bradycardia (Low)';
      warnings.push(`Informational Warning: Heart rate is ${hr} bpm (below standard reference range 60-100 bpm).`);
    } else if (hr > 100) {
      hrStatus = 'Tachycardia (High)';
      warnings.push(`Informational Warning: Heart rate is ${hr} bpm (above standard reference range 60-100 bpm).`);
    }

    statusSummary.heartRate = {
      status: hrStatus,
      value: hr,
      unit: 'bpm',
      isAbnormal: hrStatus !== 'Normal'
    };
  }

  // 3. Blood Glucose evaluation
  const glucose = data.bloodGlucose !== undefined && data.bloodGlucose !== null ? Number(data.bloodGlucose) : null;
  if (glucose !== null) {
    let bgStatus = 'Normal';
    if (glucose < 70) {
      bgStatus = 'Hypoglycemia (Low)';
      warnings.push(`Informational Alert: Blood glucose (${glucose} mg/dL) is below normal fasting levels (<70 mg/dL).`);
    } else if (glucose <= 99) {
      bgStatus = 'Normal';
    } else if (glucose <= 125) {
      bgStatus = 'Prediabetes Range';
      warnings.push(`Informational Warning: Blood glucose (${glucose} mg/dL) is in prediabetes range (100-125 mg/dL).`);
    } else {
      bgStatus = 'High Glucose';
      warnings.push(`Important Alert: Blood glucose (${glucose} mg/dL) is elevated (>=126 mg/dL). Routine consultation recommended.`);
    }

    statusSummary.bloodGlucose = {
      status: bgStatus,
      value: glucose,
      unit: 'mg/dL',
      isAbnormal: bgStatus !== 'Normal'
    };
  }

  // 4. Body Temperature evaluation
  const temp = data.bodyTemperature !== undefined && data.bodyTemperature !== null ? Number(data.bodyTemperature) : null;
  if (temp !== null) {
    let tempStatus = 'Normal';
    if (temp < 97.0) {
      tempStatus = 'Low (Hypothermic Risk)';
      warnings.push(`Informational Warning: Body temperature (${temp}°F) is below normal range.`);
    } else if (temp <= 99.0) {
      tempStatus = 'Normal';
    } else if (temp < 100.4) {
      tempStatus = 'Mildly Elevated';
      warnings.push(`Informational Warning: Temperature is slightly elevated (${temp}°F).`);
    } else if (temp < 102.0) {
      tempStatus = 'Fever';
      warnings.push(`Informational Alert: Fever detected (${temp}°F). Stay hydrated and monitor symptoms.`);
    } else {
      tempStatus = 'High Fever';
      warnings.push(`Important Alert: High fever recorded (${temp}°F). Seek medical attention if fever persists.`);
    }

    statusSummary.bodyTemperature = {
      status: tempStatus,
      value: temp,
      unit: '°F',
      isAbnormal: tempStatus !== 'Normal'
    };
  }

  // 5. Weight
  const weight = data.weight !== undefined && data.weight !== null ? Number(data.weight) : null;
  if (weight !== null) {
    statusSummary.weight = {
      status: 'Recorded',
      value: weight,
      unit: 'kg',
      isAbnormal: false
    };
  }

  let overallCondition = 'Optimal';
  const abnormalCount = Object.values(statusSummary).filter((v) => v.isAbnormal).length;
  if (abnormalCount >= 2) {
    overallCondition = 'Needs Attention';
  } else if (abnormalCount === 1) {
    overallCondition = 'Moderate Observation';
  }

  return {
    statusSummary,
    warnings,
    overallCondition,
    hasAbnormalities: abnormalCount > 0,
    disclaimer: MEDICAL_DISCLAIMER,
    sourceEngine: 'Health Tech Clinical Analytics Engine'
  };
};

const analyzeTrends = (measurements) => {
  if (!measurements || measurements.length === 0) {
    return {
      totalReadings: 0,
      healthStabilityScore: 85,
      metrics: {},
      trendSummaries: ['No historical measurements available to analyze.'],
      disclaimer: MEDICAL_DISCLAIMER,
      sourceEngine: 'Health Tech Clinical Analytics Engine'
    };
  }

  // Sort chronological
  const sorted = [...measurements].sort((a, b) => {
    const da = new Date(a.recordedAt || a.createdAt || 0);
    const db = new Date(b.recordedAt || b.createdAt || 0);
    return da - db;
  });

  const metrics = {};
  const vitalKeys = [
    { key: 'systolicBP', label: 'Systolic Blood Pressure', unit: 'mmHg' },
    { key: 'diastolicBP', label: 'Diastolic Blood Pressure', unit: 'mmHg' },
    { key: 'heartRate', label: 'Heart Rate', unit: 'bpm' },
    { key: 'bloodGlucose', label: 'Blood Glucose', unit: 'mg/dL' },
    { key: 'bodyTemperature', label: 'Body Temperature', unit: '°F' },
    { key: 'weight', label: 'Weight', unit: 'kg' }
  ];

  const trendSummaries = [];

  for (const { key, label, unit } of vitalKeys) {
    const values = sorted
      .map((m) => m[key])
      .filter((v) => v !== undefined && v !== null && !isNaN(Number(v)))
      .map((v) => Number(v));

    if (values.length === 0) continue;

    const min = Math.round(Math.min(...values) * 10) / 10;
    const max = Math.round(Math.max(...values) * 10) / 10;
    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = Math.round((sum / values.length) * 10) / 10;
    const latest = Math.round(values[values.length - 1] * 10) / 10;
    const baseline = Math.round(values[0] * 10) / 10;
    const diff = Math.round((latest - baseline) * 10) / 10;

    let direction = 'Baseline Only';
    if (values.length >= 2) {
      if (Math.abs(diff) < 1.0) {
        direction = 'Stable';
      } else if (diff > 0) {
        direction = 'Increasing';
      } else {
        direction = 'Decreasing';
      }
    }

    metrics[key] = {
      label,
      unit,
      count: values.length,
      latest,
      min,
      max,
      average: avg,
      changeFromBaseline: diff,
      trendDirection: direction
    };

    if (values.length >= 2) {
      trendSummaries.push(
        `${label}: Latest ${latest} ${unit} (Avg ${avg} ${unit}, Range ${min}–${max} ${unit}). Trend is ${direction.toLowerCase()} (${diff > 0 ? '+' : ''}${diff} ${unit} net change).`
      );
    } else {
      trendSummaries.push(`${label}: Baseline measurement recorded at ${latest} ${unit}.`);
    }
  }

  // Health Stability Score calculation (40-100)
  let score = 100;
  if (metrics.systolicBP) {
    if (metrics.systolicBP.latest > 135) score -= 15;
    else if (metrics.systolicBP.latest > 120) score -= 5;
  }
  if (metrics.bloodGlucose) {
    if (metrics.bloodGlucose.latest > 115) score -= 15;
    else if (metrics.bloodGlucose.latest > 100) score -= 5;
  }
  if (metrics.heartRate) {
    if (metrics.heartRate.latest > 100 || metrics.heartRate.latest < 55) score -= 10;
  }
  score = Math.max(40, Math.min(100, score));

  return {
    totalReadings: sorted.length,
    healthStabilityScore: score,
    metrics,
    trendSummaries,
    disclaimer: MEDICAL_DISCLAIMER,
    sourceEngine: 'Health Tech Clinical Analytics Engine'
  };
};

module.exports = {
  evaluateMeasurement,
  analyzeTrends,
  MEDICAL_DISCLAIMER
};
