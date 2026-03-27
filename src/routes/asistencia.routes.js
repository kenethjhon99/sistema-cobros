const express = require("express");
const router = express.Router();
const {
  marcar,
  asistenciaHoy,
  historialPersona,
  resumenDiario,
  asistenciaPorGrado,
} = require("../controllers/asistencia.controller");
const { checkModule } = require("../middlewares/checkModule");
const authMiddleware = require("../middlewares/auth");

router.use(authMiddleware, checkModule("asistencia"));

router.post("/marcar", marcar);
router.get("/hoy", asistenciaHoy);
router.get("/persona/:personaId", historialPersona);
router.get("/resumen/diario", resumenDiario);
router.get("/grado/:gradoId", asistenciaPorGrado);

module.exports = router;
