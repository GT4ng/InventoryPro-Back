const express = require('express');
const router = express.Router();
const componentsController = require('../controllers/components.controller');
const verifyToken = require('../middlewares/auth.middleware');
const isAdmin = require('../middlewares/role.middleware');

// All components routes require authentication
router.use(verifyToken);

// GET /api/components - List components
router.get('/', componentsController.getComponents);

// GET /api/components/:id - Get detailed component specs
router.get('/:id', componentsController.getComponentById);

// POST /api/components - Create component (Admin only)
router.post('/', isAdmin, componentsController.createComponent);

// PUT /api/components/:id - Edit component fields (Admin only)
router.put('/:id', isAdmin, componentsController.updateComponent);

// DELETE /api/components/:id - Delete component (Admin only)
router.delete('/:id', isAdmin, componentsController.deleteComponent);

module.exports = router;