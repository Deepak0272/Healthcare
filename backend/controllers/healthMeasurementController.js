const HealthMeasurement = require('../models/HealthMeasurement');
const healthAnalysisService = require('../services/healthAnalysisService');

// @desc    Get all health measurements for user
// @route   GET /api/health-measurements
// @access  Private
const getMeasurements = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.query.patientId) {
      query.patient = req.query.patientId;
    }

    const limit = parseInt(req.query.limit, 10) || 50;

    const measurements = await HealthMeasurement.find(query)
      .sort({ recordedAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: measurements.length,
      measurements
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get latest health measurement
// @route   GET /api/health-measurements/latest
// @access  Private
const getLatestMeasurement = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.query.patientId) {
      query.patient = req.query.patientId;
    }

    const latest = await HealthMeasurement.findOne(query).sort({ recordedAt: -1 });

    res.status(200).json({
      success: true,
      measurement: latest || null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new health measurement (evaluated with Python Analytics Service)
// @route   POST /api/health-measurements
// @access  Private
const createMeasurement = async (req, res, next) => {
  try {
    let patientId = req.user._id;
    if (['doctor', 'admin'].includes(req.user.role) && req.body.patientId) {
      patientId = req.body.patientId;
    }

    const measurementPayload = {
      systolicBP: req.body.systolicBP ? Number(req.body.systolicBP) : undefined,
      diastolicBP: req.body.diastolicBP ? Number(req.body.diastolicBP) : undefined,
      heartRate: req.body.heartRate ? Number(req.body.heartRate) : undefined,
      bloodGlucose: req.body.bloodGlucose ? Number(req.body.bloodGlucose) : undefined,
      bodyTemperature: req.body.bodyTemperature ? Number(req.body.bodyTemperature) : undefined,
      weight: req.body.weight ? Number(req.body.weight) : undefined,
      notes: req.body.notes || '',
      source: req.body.source || 'Manual Entry',
      recordedAt: req.body.recordedAt ? new Date(req.body.recordedAt) : new Date()
    };

    // Analyze vital signs with native clinical analytics engine
    const analysisResult = healthAnalysisService.evaluateMeasurement(measurementPayload);

    const measurement = await HealthMeasurement.create({
      patient: patientId,
      ...measurementPayload,
      statusFlags: analysisResult.statusSummary || {},
      warnings: analysisResult.warnings || [],
      overallCondition: analysisResult.overallCondition || 'Optimal'
    });

    res.status(201).json({
      success: true,
      message: 'Health measurement logged successfully!',
      measurement,
      analysis: analysisResult
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get historical health trends and charts data
// @route   GET /api/health-measurements/trends
// @access  Private
const getTrends = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.query.patientId) {
      query.patient = req.query.patientId;
    }

    const days = parseInt(req.query.days, 10) || 30;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // Fetch in chronological order for graphs and trend analysis
    const measurements = await HealthMeasurement.find({
      ...query,
      recordedAt: { $gte: sinceDate }
    }).sort({ recordedAt: 1 });

    // Run clinical analytics engine for statistical analysis
    const analysisTrends = healthAnalysisService.analyzeTrends(measurements);

    // Format data specifically for Chart.js visualization
    const chartLabels = measurements.map((m) =>
      new Date(m.recordedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    );

    const chartData = {
      labels: chartLabels,
      systolic: measurements.map((m) => m.systolicBP || null),
      diastolic: measurements.map((m) => m.diastolicBP || null),
      heartRate: measurements.map((m) => m.heartRate || null),
      bloodGlucose: measurements.map((m) => m.bloodGlucose || null),
      bodyTemperature: measurements.map((m) => m.bodyTemperature || null),
      weight: measurements.map((m) => m.weight || null)
    };

    res.status(200).json({
      success: true,
      count: measurements.length,
      chartData,
      trendAnalysis: analysisTrends
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete health measurement
// @route   DELETE /api/health-measurements/:id
// @access  Private
const deleteMeasurement = async (req, res, next) => {
  try {
    const measurement = await HealthMeasurement.findById(req.params.id);
    if (!measurement) {
      return res.status(404).json({
        success: false,
        message: 'Measurement record not found.'
      });
    }

    if (
      req.user.role === 'patient' &&
      measurement.patient.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot delete this measurement.'
      });
    }

    await measurement.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Measurement record deleted.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMeasurements,
  getLatestMeasurement,
  createMeasurement,
  getTrends,
  deleteMeasurement
};
