const mongoose = require("mongoose");

const ajoutMembreSchema = new mongoose.Schema({
    name: { type: String, required: true },
    position: { type: String, required: true },
    number: { type: String, required: true },
    qg: { type: String, required: true },
     day: { 
    type: String, 
    required: true, 
    default: () => new Date().toISOString().split('T')[0] // YYYY-MM-DD
  },
    present: { type: Boolean, default: false },
    lastScan: { type: String, default: null },
    qrCode: { type: String, default: null } ,// base64 du QR code
     history: [
        {
            date: { type: String },
            present: { type: Boolean }
        }
    ]
});

module.exports = mongoose.model("AjoutMembre", ajoutMembreSchema);
