// Models/Presence.js
const mongoose = require("mongoose");

const presenceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  present: { type: Boolean, default: false },
  time: { type: String, default: null }
});

module.exports = mongoose.model("Presence", presenceSchema);
