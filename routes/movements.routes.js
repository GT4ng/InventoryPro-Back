const express = require('express');
const router = express.Router();
const movementsController = require('../controllers/movements.controller');
const verifyToken = require('../middlewares/auth.middleware');

// All movements routes require authentication (both admin and operario can view and register movements)
router.use(verifyToken);

// GET /api/movements - List historical log
router.get('/', movementsController.getMovements);

// POST /api/movements - Register new entry/exit
router.post('/', movementsController.registerMovement);

module.exports = router;