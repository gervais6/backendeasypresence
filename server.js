require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cron = require("node-cron");
const dayjs = require("dayjs");

// Importation des routes et modèles
const scanRoutes = require("./Routes/scanRoutes");
const authRoutes = require("./Routes/auth");
const presenceRoutes = require("./Routes/presenceRoutes");
const User = require("./Models/User");
const Entreprise = require("./Models/Entreprise");

const app = express();
const PORT = process.env.PORT || 8000;

// ---------- Middleware ----------
app.use(express.json({ limit: "10mb" }));

// ---------- CORS ----------
const allowedOrigins = [
  "https://fronteasypresence.vercel.app", // Frontend déployé
  "http://localhost:3000",                 // Dev web
  "http://127.0.0.1:3000",                 // Dev web
  "http://localhost:8081",                 // Expo web
  "http://10.0.2.2:8081",                  // Android Emulator
  "http://192.168.1.4:8081",               // Mobile réel local
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman / serveur interne

      if (allowedOrigins.includes(origin)) return callback(null, true);

      console.error("❌ Not allowed by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ---------- Connexion MongoDB ----------
const mongoDBURL =
  process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/mydemoDB";

mongoose
  .connect(mongoDBURL)
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

app.get("/", (req, res) => res.send("🚀 Bienvenue sur l'API Présence"));

// ---------- Fonction mise à jour automatique des absences ----------
const markMissedAbsences = async () => {
  try {
    const users = await User.find();
    const today = dayjs();

    for (const user of users) {
      user.history = user.history || [];
      const lastDate = user.history.length
        ? dayjs(user.history[user.history.length - 1].date)
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

// ---------- Exécution immédiate + Cron ----------
markMissedAbsences();
cron.schedule("0 0 * * *", async () => {
  console.log("⏰ Cron minuit : mise à jour des absences...");
  await markMissedAbsences();
});

// ---------- Lancement serveur ----------
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));
