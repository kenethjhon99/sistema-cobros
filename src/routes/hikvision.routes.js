const express = require("express");
const router = express.Router();
const { recibirEventoHikvision, probarEvento, recibirEvento } = require("../controllers/hikvision.controller");

// Ruta para recibir eventos de Hikvision

router.post("/hikvision/evento", recibirEvento);
router.get("/hikvision/eventos", probarEvento);
router.post("/evento", recibirEventoHikvision);

module.exports = router;
