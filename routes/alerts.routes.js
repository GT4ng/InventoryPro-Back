const express = require('express');
const router = express.Router();
const alertsController = require('../controllers/alerts.controller');
const verifyToken = require('../middlewares/auth.middleware');

// All alert routes require authentication
router.use(verifyToken);

// GET /api/alerts/stock - List items under min_stock
router.get('/stock', alertsController.getStockAlerts);

module.exports = router;
