// models/Entreprise.js
const mongoose = require("mongoose");

const entrepriseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qrCode: { type: String, required: true }, // base64 ou string unique
});

module.exports = mongoose.model("Entreprise", entrepriseSchema);
