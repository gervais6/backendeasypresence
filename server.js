// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const dayjs = require('dayjs');
const scanRoutes = require("./Routes/scanRoutes");
const authRoutes = require('./Routes/auth');
const AjoutMembre = require('./Models/User'); // Assure-toi que le modèle existe
const presenceRoutes = require("./Routes/presenceRoutes");
const Entreprise = require("./Models/Entreprise");

const app = express();
const PORT = process.env.PORT || 8000;

// ---------- Middleware ----------
app.use(express.json({ limit: "10mb" })); // Pour accepter les QR en base64

// ✅ CORS configuration unique
const allowedOrigins = [
  'http://localhost:3000',        // quand tu fais npm start
  'http://192.168.1.2:50395'  ,    // quand tu sers le build avec serve
  'http://192.168.1.2:3000',     // si tu accèdes au frontend depuis ton mobile
  'http://192.168.1.2:8000',     // si tu appelles directement le backend
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ---------- Connexion MongoDB ----------
const mongoDBURL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/mydemoDB';
mongoose.connect(mongoDBURL, { useUnifiedTopology: true, useNewUrlParser: true })
  .then(() => console.log('✅ Connexion à MongoDB réussie'))
  .catch(err => console.error('❌ Erreur de connexion à MongoDB:', err));



   // Initialisation de l'entreprise principale
    const initEntreprise = async () => {
      try {
        const entrepriseExist = await Entreprise.findOne({ qrCode: "company_123" });
        if (!entrepriseExist) {
          const entreprise = new Entreprise({
            name: "MaEntreprise",
            qrCode: "company_123"
          });
          await entreprise.save();
          console.log("Entreprise principale créée !");
        } else {
          console.log("Entreprise principale déjà existante.");
        }
      } catch (err) {
        console.error("Erreur création entreprise :", err);
      }
    };

    initEntreprise();

// ---------- Routes ----------
app.use('/api/auth', authRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/presences", presenceRoutes);


app.get('/', (req, res) => res.send('Bienvenue sur l\'API'));

// ---------- Fonction pour marquer absences manquées ----------
const markMissedAbsences = async () => {
  try {
    const membres = await AjoutMembre.find();
    const today = dayjs();

    for (const membre of membres) {
      membre.history = membre.history || [];

      const lastDate = membre.history.length
        ? dayjs(membre.history[membre.history.length - 1].date)
        : today.subtract(1, 'day');

      let startDate = lastDate.add(1, 'day');

      while (startDate.isBefore(today, 'day')) {
        const dateStr = startDate.format('YYYY-MM-DD');
        if (!membre.history.some(h => h.date === dateStr)) {
          membre.history.push({ date: dateStr, present: false });
          console.log(`❌ Absence automatique pour ${membre.name} le ${dateStr}`);
        }
        startDate = startDate.add(1, 'day');
      }

      // Mettre à jour le statut présent du jour
      membre.present = membre.history.some(h => h.date === today.format('YYYY-MM-DD') && h.present);
      await membre.save();
    }

    console.log("✅ Toutes les absences manquées ont été mises à jour");
  } catch (err) {
    console.error("❌ Erreur lors de la mise à jour des absences manquées :", err);
  }
};

// ---------- Mise à jour au démarrage ----------
markMissedAbsences();

// ---------- Cron minuit ----------
cron.schedule('0 0 * * *', async () => {
  console.log("⏰ Cron de minuit : mise à jour des absences");
  await markMissedAbsences();
});


   
// ---------- Démarrage serveur ----------
app.listen(PORT, () => console.log(`🚀 Server started at port ${PORT}`));
