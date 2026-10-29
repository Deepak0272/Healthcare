const express = require('express');
const router = express.Router();
const {
  getHealthRecords,
  getHealthRecordById,
  createHealthRecord,
  updateHealthRecord,
  deleteHealthRecord
} = require('../controllers/healthRecordController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router
  .route('/')
  .get(getHealthRecords)
  .post(upload.single('file'), createHealthRecord);

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }
  res.status(200).json({
    success: true,
    fileUrl: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size
  });
});

router
  .route('/:id')
  .get(getHealthRecordById)
  .put(upload.single('file'), updateHealthRecord)
  .delete(deleteHealthRecord);

module.exports = router;
