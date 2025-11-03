require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cron = require("node-cron");
const dayjs = require("dayjs");
const path = require("path");

// Import des routes et modèles
const authRoutes = require("./Routes/auth");
const scanRoutes = require("./Routes/scanRoutes");
const presenceRoutes = require("./Routes/presenceRoutes");
const User = require("./Models/User");
const Entreprise = require("./Models/Entreprise");

const app = express();
const PORT = process.env.PORT || 8000;

// ---------- Middleware ----------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ---------- Static folder pour les images ----------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------- CORS ----------
const allowedOrigins = [
  "https://fronteasypresence.vercel.app",
  "https://fronteasypresence-git-hr-gervais6s-projects.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://10.0.2.2:8081",
  "http://192.168.1.3:8081",
  "http://192.168.1.4:8081",
  "http://192.168.1.30:8081", // ← AJOUTEZ VOTRE IP ACTUELLE
  "exp://192.168.1.3:8081",
  "exp://192.168.1.4:8081", 
  "exp://192.168.1.30:8081", // ← AJOUTEZ POUR EXPO
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      
      // Autoriser aussi les variantes d'IP
      if (origin.includes('192.168.1.30') || 
          origin.includes('//192.168.1.30') ||
          origin.startsWith('exp://192.168.1.30')) {
        return callback(null, true);
      }
      
      console.error("❌ Not allowed by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ---------- Connexion MongoDB ----------
mongoose
  .connect(process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/mydemoDB")
  .then(() => console.log("✅ Connexion à MongoDB réussie"))
  .catch((err) => console.error("❌ Erreur de connexion à MongoDB:", err));

// ---------- Initialisation entreprise ----------
const initEntreprise = async () => {
  try {
    const entrepriseExist = await Entreprise.findOne({ qrCode: "company_123" });
    if (!entrepriseExist) {
      const entreprise = new Entreprise({
        name: "MaEntreprise",
        qrCode: "company_123",
      });
      await entreprise.save();
      console.log("🏢 Entreprise principale créée !");
    } else {
      console.log("🏢 Entreprise principale déjà existante.");
    }
  } catch (err) {
    console.error("❌ Erreur création entreprise :", err);
  }
};
initEntreprise();

// ---------- Routes ----------
app.use("/api/auth", authRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/presences", presenceRoutes);

// Route de test pour mobile
app.get("/api/mobile-test", (req, res) => {
  console.log("✅ Requête mobile reçue de:", req.headers.origin);
  res.json({ 
    success: true, 
    message: "Backend accessible depuis mobile!",
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

app.get("/", (req, res) => res.send("🚀 Bienvenue sur l'API Présence"));

// ---------- Fonction mise à jour automatique des absences ----------
const markMissedAbsences = async () => {
  try {
    const users = await User.find();
    const today = dayjs();

    for (const user of users) {
      user.history = user.history || [];
      const lastDate = user.history.length
        ? dayjs(user.history[user.history.length - 1].date, "YYYY-MM-DD")
        : today.subtract(1, "day");

      let startDate = lastDate.add(1, "day");
      while (startDate.isBefore(today, "day")) {
        const dateStr = startDate.format("YYYY-MM-DD");
        if (!user.history.some((h) => h.date === dateStr)) {
          user.history.push({ date: dateStr, present: false });
          console.log(`❌ Absence automatique pour ${user.name} le ${dateStr}`);
        }
        startDate = startDate.add(1, "day");
      }

      user.present = user.history.some(
        (h) => h.date === today.format("YYYY-MM-DD") && h.present
      );

      await user.save();
    }

    console.log("✅ Absences manquées mises à jour !");
  } catch (err) {
    console.error("❌ Erreur lors de la mise à jour des absences :", err);
  }
};

// ---------- Cron minuit ----------
markMissedAbsences();
cron.schedule("0 0 * * *", async () => {
  console.log("⏰ Cron minuit : mise à jour des absences...");
  await markMissedAbsences();
});

// ---------- Lancement serveur ----------
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));
