// middlewares/upload.js
const multer = require("multer");
const path = require("path");

// Dossier de destination
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/users");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Filtrer les types de fichiers (images seulement)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) return cb(null, true);
  cb("Erreur : seuls les fichiers image sont autorisés !");
};

module.exports = multer({ storage, fileFilter });
