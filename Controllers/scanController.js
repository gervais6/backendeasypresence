const User = require("../Models/User");
const Entreprise = require("../Models/Entreprise");

// Scanner le QR code de l'entreprise
const scanEntreprise = async (req, res) => {
  try {
    const { userId, qrCodeEntreprise } = req.body;

    // Vérifier que l'entreprise existe
    const entreprise = await Entreprise.findOne({ qrCode: qrCodeEntreprise });
    if (!entreprise) return res.status(404).json({ message: "Entreprise introuvable" });

    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    // Mettre à jour la présence
    user.present = true;
    user.lastScan = new Date();
    user.history = user.history || [];
    user.history.push({ date: new Date(), present: true });
    await user.save();

    return res.json({ message: `Présence enregistrée pour ${user.name}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports = { scanEntreprise };
