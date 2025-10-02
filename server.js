require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const dayjs = require('dayjs');
const scanRoutes = require("./Routes/scanRoutes");
const authRoutes = require('./Routes/auth');

const app = express();
const PORT = process.env.PORT || 8000;

app.use("/api/scan", scanRoutes);
app.use(cors({
  origin: 'http://localhost:3000', // autoriser ton frontend
  credentials: true,
}));
app.use(cors());
app.use(express.json({ limit: "10mb" })); // pour accepter les QR en base64

// ---------- Connexion MongoDB ----------
const mongoDBURL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/mydemoDB';
mongoose.connect(mongoDBURL, { useUnifiedTopology: true, useNewUrlParser: true })
.then(() => console.log('✅ Connexion à MongoDB réussie'))
.catch(err => console.error('❌ Erreur de connexion à MongoDB:', err));

// ---------- Routes ----------
app.use('/api/auth', authRoutes);
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
                : today.subtract(1, 'day'); // si jamais pas d'historique

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
