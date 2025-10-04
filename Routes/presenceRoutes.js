// routes/presenceRoutes.js
const express = require("express");
const router = express.Router();
const { addPresence, getPresencesByDate,updatePresence  } = require("../Controllers/presenceController");
const verifyToken = require("../middlewares/authMiddleware");

router.post("/", verifyToken, addPresence); // Ajouter présence
router.get("/", verifyToken, getPresencesByDate); // Récupérer présences du jour via ?date=YYYY-MM-DD
router.put("/:id", verifyToken, updatePresence);    // ✅ Update présence
module.exports = router;
