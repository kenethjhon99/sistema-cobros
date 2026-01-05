const express = require('express');
const { obtenerCuotasPorEstudiante, pagarCuota } = require('../controllers/cuota.controller');
const router = express.Router();

router.get('/estudiantes/:id/cuotas', obtenerCuotasPorEstudiante);
router.put('/cuotas/:id/pagar', pagarCuota);
module.exports = router;