const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const verifyToken = require('../middlewares/auth.middleware');

// All reports routes require authentication
router.use(verifyToken);

// GET /api/reports/summary - Dashboard statistics
router.get('/summary', reportsController.getSummary);

// GET /api/reports/valuation - Valuation table list
router.get('/valuation', reportsController.getValuation);

// GET /api/reports/export - Export detailed CSV data
router.get('/export', reportsController.exportReport);

module.exports = router;