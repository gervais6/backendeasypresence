// models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },        // Nom complet
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "employe"], required: true }, // Rôle
    phone: { type: String },                       // Téléphone, seulement pour employé
    qg: { type: String },                          // Département ou QG
    qrCode: { type: String },                      // QR code unique pour l'employé
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
