// routes/auth.js
const express = require('express');
const { register, login } = require('../Controllers/authController');
// routes/auth.js
const router = express.Router();

// Route d'inscription
router.post('/register', register);

// Route de connexion
router.post('/login', login);

module.exports = router;