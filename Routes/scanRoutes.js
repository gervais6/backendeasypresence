const express = require("express");
const router = express.Router();
const { scanEntreprise } = require("../Controllers/scanController");

router.post("/scan-company", scanEntreprise);

module.exports = router;
