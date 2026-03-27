const express = require('express');
const router = express.Router();
const { obtenerModulos, actualizarModulos } = require('../controllers/modulos.controller');
const { checkModule } = require('../middlewares/checkModule');

router.get('/modulos/:institucionId', obtenerModulos);
router.put('/modulos/:institucionId', actualizarModulos);

module.exports = router;