const AjoutMembre = require("../Models/AjoutMembre");

// Créer un nouveau membre (une seule fois)
exports.createMembre = async (req, res) => {
  try {
    const { name, position, number, qg } = req.body;
    const newMembre = new AjoutMembre({ name, position, number, qg, history: [] });
    const savedMembre = await newMembre.save();
    res.status(201).json(savedMembre);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de l'ajout du membre" });
  }
};

// Obtenir tous les membres et réinitialiser le statut "present" si besoin
// Obtenir tous les membres (sans réinitialiser 'present')
exports.getAllMembres = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const membres = await AjoutMembre.find();

    // Mettre à jour présent selon lastScan
    const updated = membres.map(m => {
      if (m.lastScan === today) {
        m.present = true;
      } else {
        m.present = false; // facultatif, si tu veux réinitialiser seulement au serveur
      }
      return m;
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des membres" });
  }
};



// Obtenir un membre par ID
exports.getMembreById = async (req, res) => {
  try {
    const membre = await AjoutMembre.findById(req.params.id);
    if (!membre) return res.status(404).json({ error: "Membre non trouvé" });
    res.json(membre);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération du membre" });
  }
};

// Mettre à jour un membre
exports.updateMembre = async (req, res) => {
  try {
    const updatedMembre = await AjoutMembre.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedMembre) return res.status(404).json({ error: "Membre non trouvé" });
    res.json(updatedMembre);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la mise à jour du membre" });
  }
};

// Supprimer un membre
exports.deleteMembre = async (req, res) => {
  try {
    const deletedMembre = await AjoutMembre.findByIdAndDelete(req.params.id);
    if (!deletedMembre) return res.status(404).json({ error: "Membre non trouvé" });
    res.json({ message: "Membre supprimé", deletedMembre });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la suppression du membre" });
  }
};

// Scanner / marquer la présence
// Scanner / marquer la présence
exports.scanQr = async (req, res) => {
  try {
    const { id } = req.body; 
    const today = new Date().toISOString().split('T')[0];

    const membre = await AjoutMembre.findById(id);
    if (!membre) return res.status(404).json({ message: "Membre non trouvé" });

    if (membre.lastScan === today) {
      return res.status(400).json({ message: `${membre.name} a déjà été scanné aujourd'hui !` });
    }

    // Ajouter à l'historique
    if (!membre.history) membre.history = [];
    membre.history.push({ date: today, present: true });

    // Mettre à jour le statut actuel
    membre.present = true;
    membre.lastScan = today;
    membre.day = today; // <--- ICI on met à jour le "jour"

    await membre.save();
    res.status(200).json(membre);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// Obtenir l'historique de tous les membres
exports.getHistorique = async (req, res) => {
  try {
    const membres = await AjoutMembre.find({}, { name: 1, history: 1 });
    res.json(membres);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération de l'historique" });
  }
};

// Obtenir l'historique d'un membre spécifique
exports.getHistoriqueMembre = async (req, res) => {
  try {
    const membre = await AjoutMembre.findById(req.params.id, { name: 1, history: 1 });
    if (!membre) return res.status(404).json({ error: "Membre non trouvé" });
    res.json(membre);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération de l'historique du membre" });
  }
};
