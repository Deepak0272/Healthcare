const express = require('express');
const router = express.Router();
const {
  getEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  triggerEmergencyAlert,
  getEmergencyAlerts
} = require('../controllers/emergencyController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Emergency Contacts CRUD
router
  .route('/contacts')
  .get(getEmergencyContacts)
  .post(createEmergencyContact);

router
  .route('/contacts/:id')
  .put(updateEmergencyContact)
  .delete(deleteEmergencyContact);

// Emergency SOS Alerts
router
  .route('/alerts')
  .get(getEmergencyAlerts)
  .post(triggerEmergencyAlert);

module.exports = router;
