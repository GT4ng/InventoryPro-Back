const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const verifyToken = require('../middlewares/auth.middleware');
const isAdmin = require('../middlewares/role.middleware');

// All user routes require authentication
router.use(verifyToken);

// GET /api/users - List users (any logged-in user can view, or restrict if desired. Let's allow view, but restrict modifications)
router.get('/', usersController.getUsers);

// POST /api/users - Register new user (Admin only)
router.post('/', isAdmin, usersController.createUser);

// PUT /api/users/:id/status - Toggle status (Admin only)
router.put('/:id/status', isAdmin, usersController.updateUserStatus);

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', isAdmin, usersController.deleteUser);

module.exports = router;