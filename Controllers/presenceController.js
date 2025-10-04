const Presence = require("../Models/Presence");

// Ajouter une présence (scan ou manuel si pas encore dans DB)
const addPresence = async (req, res) => {
  try {
    const { userId, date, present, time } = req.body;

    // Vérifie si présence existe déjà
    let presence = await Presence.findOne({ userId, date });
    if (presence) {
      presence.present = present;
      presence.time = time;
      await presence.save();
      return res.json(presence);
    }

    // Sinon créer une nouvelle présence
    presence = new Presence({ userId, date, present, time });
    await presence.save();
    res.json(presence);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Récupérer les présences par date
const getPresencesByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const presences = await Presence.find({ date }).populate("userId", "name email");
    res.json(presences);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Mettre à jour une présence (toggle admin)
const updatePresence = async (req, res) => {
  try {
    const { id } = req.params; // id = userId
    const { date, present, time } = req.body;

    let presence = await Presence.findOne({ userId: id, date });
    if (!presence) {
      presence = new Presence({ userId: id, date, present, time });
    } else {
      presence.present = present;
      presence.time = time;
    }

    await presence.save();
    res.json(presence);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { addPresence, getPresencesByDate, updatePresence };
