const express = require('express');
const router = express.Router();
const {
  getAppointments,
  bookAppointment,
  updateAppointment,
  cancelAppointment
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(getAppointments)
  .post(bookAppointment);

router.route('/:id').put(updateAppointment);
router.route('/:id/cancel').put(cancelAppointment);

module.exports = router;
