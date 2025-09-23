// controllers/authController.js
const User = require('../Models/User ');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Inscription// controllers/authController.js
exports.register = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const existingUser  = await User.findOne({ email });
        if (existingUser ) {
            return res.status(400).json({ message: 'L\'utilisateur existe déjà.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();

        res.status(201).json({ message: 'Utilisateur créé avec succès.' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur du serveur.' });
    }
};

// Connexion
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Identifiants invalides.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Identifiants invalides.' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Erreur du serveur.' });
    }
};