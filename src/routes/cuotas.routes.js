const express = require('express');
const { obtenerCuotasPorEstudiante, pagarCuota } = require('../controllers/cuota.controller');
const authMiddleware = require('../middlewares/auth');
const { checkModule } = require('../middlewares/checkModule');
const { checkRole } = require('../middlewares/checkRole');
const router = express.Router();

router.get('/estudiantes/:id/cuotas', obtenerCuotasPorEstudiante);
router.put('/cuotas/:id/pagar', authMiddleware, checkModule('cobros'), checkRole(['Admin', 'Tesorera']), pagarCuota);
module.exports = router;
