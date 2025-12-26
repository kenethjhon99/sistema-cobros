const express = require('express');
const {
  obtenerEstudiantes,
  crearEstudiante,
} = require("../controllers/estudiantes.controller.js");

const router = express.Router();

router.get("/", obtenerEstudiantes);
router.post("/", crearEstudiante);

module.exports = router;