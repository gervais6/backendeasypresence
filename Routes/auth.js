const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload'); // Multer
const verifyToken = require('../middlewares/authMiddleware');

const { registerUser, registerAdmin, login, updateUser, getUsers, deleteUser } = require('../Controllers/authController');

// Routes avec upload d'image
router.post('/register-user', upload.single('image'), registerUser);
router.post('/register-admin', upload.single('image'), registerAdmin);
router.put('/update-user/:id', verifyToken, upload.single('image'), updateUser);

// Routes classiques
router.post('/login', login);
router.get('/users', verifyToken, getUsers);
router.delete('/users/:id', verifyToken, deleteUser);

module.exports = router;
