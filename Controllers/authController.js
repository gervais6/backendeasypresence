// Controllers/authController.js
const User = require('../Models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

// Configuration des types de contrats valides
const VALID_CONTRACT_TYPES = ['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance', ''];
const VALID_ROLES = ['admin', 'employe', 'autre'];

// ====================
// Fonctions utilitaires
// ====================
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateRequiredFields = (fields) => {
  const errors = [];
  if (!fields.name) errors.push('Le nom est requis');
  if (!fields.email) errors.push('L\'email est requis');
  if (!fields.password && !fields.isUpdate) errors.push('Le mot de passe est requis');
  if (fields.email && !validateEmail(fields.email)) errors.push('Format d\'email invalide');
  if (fields.role && !VALID_ROLES.includes(fields.role)) errors.push('Rôle invalide');
  if (fields.contractType && !VALID_CONTRACT_TYPES.includes(fields.contractType)) {
    errors.push('Type de contrat invalide');
  }
  if (fields.contractStart && fields.contractEnd) {
    const start = new Date(fields.contractStart);
    const end = new Date(fields.contractEnd);
    if (end < start) errors.push('La fin du contrat ne peut pas être avant le début');
  }
  if (fields.salary && fields.salary < 0) errors.push('Le salaire ne peut pas être négatif');
  
  return errors;
};

const cleanupFile = async (filePath) => {
  if (filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('Impossible de supprimer le fichier:', filePath);
    }
  }
};

const buildUserData = (req, isUpdate = false) => {
  const {
    name, email, password, role, number, qg, position,
    workLocation, contractStart, contractEnd, salary, contractType,
    activity, activityBy, activityDeadline, birthday, mentor, manager, nationality
  } = req.body;

  // Construction de l'URL de l'image
  const imageUrl = req.file
    ? `${req.protocol}://${req.get('host')}/uploads/users/${req.file.filename}`
    : (isUpdate ? undefined : '');

  const userData = {
    name,
    email,
    position,
    number,
    qg,
    role,
    image: imageUrl,
    // Nouveaux champs avec valeurs par défaut appropriées
    workLocation: workLocation || '',
    contractStart: contractStart || null,
    contractEnd: contractEnd || null,
    salary: salary ? Number(salary) : 0,
    contractType: contractType || '',
    activity: activity || '',
    activityBy: activityBy || '',
    activityDeadline: activityDeadline || null,
    birthday: birthday || null,
    mentor: mentor || '',
    manager: manager || '',
    nationality: nationality || ''
  };

  // Ne pas inclure le mot de passe si vide lors de la mise à jour
  if (password && !isUpdate) {
    userData.password = password;
  }

  return userData;
};

// ====================
// Inscription Admin
// ====================
const registerAdmin = async (req, res) => {
  let tempFile = null;
  
  try {
    const userData = buildUserData(req);
    
    // Validation des champs requis
    const validationErrors = validateRequiredFields(userData);
    if (validationErrors.length > 0) {
      if (req.file) await cleanupFile(req.file.path);
      return res.status(400).json({ 
        message: 'Données invalides', 
        errors: validationErrors 
      });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      if (req.file) await cleanupFile(req.file.path);
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    userData.password = hashedPassword;
    userData.role = 'admin';

    const user = new User(userData);
    await user.save();

    res.status(201).json({ 
      message: "Admin créé avec succès", 
      userId: user._id, 
      imageUrl: userData.image,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    if (req.file) await cleanupFile(req.file.path);
    console.error("Erreur registerAdmin :", error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }
    
    res.status(500).json({ 
      message: 'Erreur du serveur.', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// ====================
// Inscription Utilisateur
// ====================
const registerUser = async (req, res) => {
  try {
    const userData = buildUserData(req);
    
    // Validation
    const validationErrors = validateRequiredFields(userData);
    if (validationErrors.length > 0) {
      if (req.file) await cleanupFile(req.file.path);
      return res.status(400).json({ 
        message: 'Données invalides', 
        errors: validationErrors 
      });
    }

    // Vérifier email existant
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      if (req.file) await cleanupFile(req.file.path);
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    userData.password = hashedPassword;

    const user = new User(userData);
    await user.save();

    // Retourner l'utilisateur sans le mot de passe
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ 
      message: 'Utilisateur créé avec succès', 
      userId: user._id, 
      imageUrl: userData.image,
      user: userResponse
    });

  } catch (error) {
    if (req.file) await cleanupFile(req.file.path);
    console.error('Erreur registerUser :', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Données invalides', 
        errors 
      });
    }
    
    res.status(500).json({ 
      message: 'Erreur du serveur.', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// ====================
// Mise à jour utilisateur - VERSION AMÉLIORÉE
// ====================
const updateUser = async (req, res) => {
  let tempFile = null;
  
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      if (req.file) await cleanupFile(req.file.path);
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    const userData = buildUserData(req, true);
    
    // Validation pour la mise à jour
    const validationErrors = validateRequiredFields({
      ...userData,
      email: userData.email || user.email,
      isUpdate: true
    });
    
    if (validationErrors.length > 0) {
      if (req.file) await cleanupFile(req.file.path);
      return res.status(400).json({ 
        message: 'Données invalides', 
        errors: validationErrors 
      });
    }

    // Vérifier email unique si modifié
    if (userData.email && userData.email !== user.email) {
      const emailExists = await User.findOne({ email: userData.email });
      if (emailExists) {
        if (req.file) await cleanupFile(req.file.path);
        return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
      }
    }

    // Gestion de l'image
    if (req.file) {
      // Supprimer l'ancienne image si elle existe
      if (user.image) {
        const oldFilename = path.basename(user.image);
        const oldPath = path.join(__dirname, '../uploads/users', oldFilename);
        await cleanupFile(oldPath);
      }
      userData.image = `${req.protocol}://${req.get('host')}/uploads/users/${req.file.filename}`;
    }

    // Mise à jour du mot de passe si fourni
    if (req.body.password) {
      userData.password = await bcrypt.hash(req.body.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      id, 
      { $set: userData }, 
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ 
      message: 'Utilisateur mis à jour avec succès.', 
      user: updatedUser 
    });

  } catch (error) {
    if (req.file) await cleanupFile(req.file.path);
    console.error('Erreur updateUser :', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Données invalides', 
        errors 
      });
    }
    
    res.status(500).json({ 
      message: 'Erreur serveur.', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// ====================
// Suppression utilisateur
// ====================
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Supprimer l'image associée si elle existe
    if (user.image) {
      const filename = path.basename(user.image);
      const imagePath = path.join(__dirname, '../uploads/users', filename);
      await cleanupFile(imagePath);
    }

    await User.findByIdAndDelete(id);
    res.json({ message: "Utilisateur supprimé avec succès." });
    
  } catch (error) {
    console.error("Erreur deleteUser :", error);
    res.status(500).json({ 
      message: "Erreur serveur.", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// ====================
// Login amélioré
// ====================
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Identifiants invalides.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Identifiants invalides.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    res.json({ 
      token, 
      role: user.role, 
      userId: user._id,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        position: user.position,
        role: user.role,
        workLocation: user.workLocation,
        contractType: user.contractType,
        // Autres champs si nécessaires
      }
    });

  } catch (error) {
    console.error('Erreur login :', error);
    res.status(500).json({ 
      message: 'Erreur du serveur.', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// ====================
// Récupération des utilisateurs avec filtres
// ====================
const getUsers = async (req, res) => {
  try {
    const { role, qg, search } = req.query;
    let filter = {};

    // Filtres optionnels
    if (role) filter.role = role;
    if (qg) filter.qg = qg;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter).select("-password").sort({ name: 1 });
    res.json(users);
  } catch (error) {
    console.error("Erreur getUsers :", error);
    res.status(500).json({ 
      message: "Erreur serveur.", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// ====================
// Récupération d'un utilisateur par ID
// ====================
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    res.json(user);
  } catch (error) {
    console.error("Erreur getUserById :", error);
    res.status(500).json({ 
      message: "Erreur serveur.", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

module.exports = { 
  registerAdmin, 
  registerUser, 
  updateUser, 
  login, 
  getUsers, 
  deleteUser,
  getUserById 
};
