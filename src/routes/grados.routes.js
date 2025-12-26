const express = require("express");

const {
  obtenerGrados,
  crearGrado,
} = require("../controllers/grados.controller.js");
const router = express.Router();

router.get("/", obtenerGrados);
router.post("/", crearGrado);

module.exports = router;
