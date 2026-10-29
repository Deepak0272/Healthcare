const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getUsers,
  updateUser
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);

module.exports = router;
