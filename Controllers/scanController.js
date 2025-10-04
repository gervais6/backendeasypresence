const User = require("../Models/User");
const Entreprise = require("../Models/Entreprise");
const Presence = require("../Models/Presence");
const dayjs = require("dayjs");

const scanEntreprise = async (req, res) => {
  try {
    const { userId, qrCodeEntreprise } = req.body;

    // Vérifier que l'entreprise existe
    const entreprise = await Entreprise.findOne({ qrCode: qrCodeEntreprise });
    if (!entreprise) return res.status(404).json({ message: "Entreprise introuvable" });

    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    const today = dayjs().format("YYYY-MM-DD");
    const currentTime = dayjs().format("HH:mm:ss");

    // Vérifier si déjà enregistré aujourd’hui
    let presence = await Presence.findOne({ userId: user._id, date: today });

    if (presence) {
      return res.json({ message: "Présence déjà enregistrée aujourd'hui" });
    }

    // Créer une nouvelle présence
    presence = new Presence({
      userId: user._id,
      date: today,
      present: true,
      time: currentTime
    });

    await presence.save();

    return res.json({ message: `Présence enregistrée pour ${user.name}`, presence });
  } catch (err) {
    console.error("Erreur scanEntreprise:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports = { scanEntreprise };
