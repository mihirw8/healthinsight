const express = require('express');
const router = express.Router();
const healthReportController = require('../controllers/healthReportController');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Routes
router.post('/upload', upload.single('file'), healthReportController.uploadReport);
router.get('/', healthReportController.getAllReports);
router.get('/:id', healthReportController.getReportById);
router.get('/user/:userId', healthReportController.getReportsByUser);
router.post('/', healthReportController.createReport);
router.put('/:id', healthReportController.updateReport);
router.delete('/:id', healthReportController.deleteReport);

module.exports = router;