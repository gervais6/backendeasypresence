const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Dossier de destination
const uploadDir = path.join(__dirname, "../uploads/users");

// Vérifie et crée le dossier s’il n’existe pas
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Filtrer les types de fichiers (images seulement)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Erreur : seuls les fichiers image (jpeg, jpg, png, gif) sont autorisés !"), false);
  }
};

module.exports = multer({ storage, fileFilter });
