// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

// Middleware pour vérifier le token JWT
const verifyToken = (req, res, next) => {
  try {
    // Récupérer le token depuis l'en-tête Authorization
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    // Format attendu : "Bearer <token>"
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token invalide' });
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contient id et role de l'utilisateur
    next();
  } catch (err) {
    console.error('Erreur vérification token:', err);
    return res.status(403).json({ message: 'Token invalide ou expiré' });
  }
};

module.exports = verifyToken;
