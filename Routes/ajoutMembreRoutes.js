const express = require('express');
const router = express.Router();
const ajoutMembreController = require('../Controllers/ajoutMembreController');

router.post('/membres', ajoutMembreController.createMembre);
router.get('/membres', ajoutMembreController.getAllMembres);
router.get('/membres/:id', ajoutMembreController.getMembreById);
router.put('/membres/:id', ajoutMembreController.updateMembre);
router.delete('/membres/:id', ajoutMembreController.deleteMembre);
router.post('/scan', ajoutMembreController.scanQr);

// **Nouvelle route pour l'historique**
router.get('/historique', ajoutMembreController.getHistorique);
router.get('/historique/:id', ajoutMembreController.getHistoriqueMembre);


module.exports = router;


