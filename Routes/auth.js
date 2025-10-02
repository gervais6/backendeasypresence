const express = require('express');
const router = express.Router();
const { registerUser, registerAdmin, login, updateUser,getUsers, deleteUser } = require('../Controllers/authController');
const verifyToken = require('../middlewares/authMiddleware');


router.post('/register-user', registerUser);
router.post('/register-admin', registerAdmin);
router.post('/login', login);
router.put('/update-user/:id',verifyToken, updateUser);
router.get('/users',verifyToken, getUsers);

router.delete('/users/:id',verifyToken,deleteUser);

module.exports = router;
