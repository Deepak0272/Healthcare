const express = require('express');
const router = express.Router();
const {
  getMeasurements,
  getLatestMeasurement,
  createMeasurement,
  getTrends,
  deleteMeasurement
} = require('../controllers/healthMeasurementController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(getMeasurements)
  .post(createMeasurement);

router.get('/latest', getLatestMeasurement);
router.get('/trends', getTrends);
router.delete('/:id', deleteMeasurement);

module.exports = router;
