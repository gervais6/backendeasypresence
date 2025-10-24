const User = require('../Models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

// ====================
// Inscription Admin
// ====================
const registerAdmin = async (req, res) => {
  const { name, email, password, qg, position, number } = req.body;
  const image = req.file ? `/uploads/users/${req.file.filename}` : "";

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nom, email et mot de passe requis.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      qg,
      position,
      number,
      image
    });

    await user.save();
    res.status(201).json({ message: "Admin créé avec succès", userId: user._id });

  } catch (error) {
    console.error("Erreur lors de l'inscription admin :", error);

    if (error.code === 11000 && error.keyPattern.email) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    res.status(500).json({ message: 'Erreur du serveur.', error: error.message });
  }
};

// ====================
// Inscription Utilisateur
// ====================
const registerUser = async (req, res) => {
  const { name, email, password, role, number, qg, position } = req.body;
  const image = req.file ? `/uploads/users/${req.file.filename}` : "";

  try {
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Nom, email, mot de passe et rôle requis.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      number,
      qg,
      position,
      image
    });

    await user.save();
    res.status(201).json({ message: 'Utilisateur créé avec succès', userId: user._id });

  } catch (error) {
    console.error('Erreur lors de l\'inscription utilisateur :', error);

    if (error.code === 11000 && error.keyPattern.email) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    res.status(500).json({ message: 'Erreur du serveur.', error: error.message });
  }
};

// ====================
// Mise à jour utilisateur
// ====================
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, position, number, qg, email, role } = req.body;
  const image = req.file ? `/uploads/users/${req.file.filename}` : null;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
      user.email = email;
    }

    user.name = name || user.name;
    user.position = position || user.position;
    user.number = number || user.number;
    user.qg = qg || user.qg;
    user.role = role || user.role;
    if (image) user.image = image;

    await user.save();
    res.json({ message: 'Utilisateur mis à jour avec succès.', user });

  } catch (error) {
    console.error('Erreur update user:', error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ====================
// Connexion, Récupération, Suppression
// ====================
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) return res.status(400).json({ message: 'Email et mot de passe requis.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Identifiants invalides.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Identifiants invalides.' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, role: user.role, userId: user._id });

  } catch (error) {
    console.error('Erreur lors de la connexion :', error);
    res.status(500).json({ message: 'Erreur du serveur.', error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    console.error("Erreur getUsers :", error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    await User.findByIdAndDelete(id);
    res.json({ message: "Utilisateur supprimé avec succès." });
  } catch (error) {
    console.error("Erreur deleteUser :", error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

module.exports = { registerAdmin, registerUser, updateUser, login, getUsers, deleteUser };
