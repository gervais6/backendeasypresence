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
const AjoutMembre = require("./Models/User");
const Entreprise = require("./Models/Entreprise");

const app = express();
const PORT = process.env.PORT || 8000;

// ---------- Middleware ----------
app.use(express.json({ limit: "10mb" }));

// ✅ Configuration CORS — autorise Vercel + Localhost
const allowedOrigins = [
  "https://fronteasypresence.vercel.app", // ton frontend déployé
  "http://localhost:3000", // pour développement
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Autorise Postman ou requêtes internes
      if (!origin) return callback(null, true);

      // Vérifie si l'origine est autorisée
      if (
        allowedOrigins.includes(origin) ||
        origin.match(/^http:\/\/192\.168\.\d+\.\d+/)
      ) {
        return callback(null, true);
      }

      console.error("❌ Not allowed by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    },
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

// ---------- Initialisation de l'entreprise ----------
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

// ---------- Fonction de mise à jour automatique des absences ----------
const markMissedAbsences = async () => {
  try {
    const membres = await AjoutMembre.find();
    const today = dayjs();

    for (const membre of membres) {
      membre.history = membre.history || [];
      const lastDate = membre.history.length
        ? dayjs(membre.history[membre.history.length - 1].date)
        : today.subtract(1, "day");

      let startDate = lastDate.add(1, "day");
      while (startDate.isBefore(today, "day")) {
        const dateStr = startDate.format("YYYY-MM-DD");
        if (!membre.history.some((h) => h.date === dateStr)) {
          membre.history.push({ date: dateStr, present: false });
          console.log(`❌ Absence automatique pour ${membre.name} le ${dateStr}`);
        }
        startDate = startDate.add(1, "day");
      }

      membre.present = membre.history.some(
        (h) => h.date === today.format("YYYY-MM-DD") && h.present
      );

      await membre.save();
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

// ---------- Lancement du serveur ----------
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));
