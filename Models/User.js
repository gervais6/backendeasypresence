// models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },        // Nom complet
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "employe"], required: true }, // Rôle 
    number: { type: String },                      // Numéro de téléphone
    position: { type: String },                    // Poste
    qg: { type: String },                          // Département ou QG
    qrCode: { type: String },                      // QR code unique pour l'employé
    image: { type: String, default: "" },          // URL ou chemin de l'image de profil
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
