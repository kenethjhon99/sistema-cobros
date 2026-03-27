const pool = require("../db");

const obtenerModulos = async (req, res) => {
  try {
    const institucionId = Number(
      req.params.institucionId || req.body.institucionId || req.institucionId
    );

    const [rows] = await pool.query(
      "SELECT * FROM institucion_modulos WHERE institucion_id = ?",
      [institucionId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Institucion no encontrada" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener los modulos" });
  }
};

const actualizarModulos = async (req, res) => {
  try {
    const institucionId = req.params.institucionId;
    const { cobros, notas, asistencia } = req.body;

    await pool.query(
      `
      UPDATE institucion_modulos
      SET
        modulo_cobros = ?,
        modulo_notas = ?,
        modulo_asistencia = ?
      WHERE institucion_id = ?
      `,
      [cobros, notas, asistencia, institucionId]
    );

    res.json({ message: "Modulos actualizados correctamente" });
  } catch (error) {
    console.error("Error en actualizarModulos:", error);
    res.status(500).json({ error: "Error al actualizar modulos" });
  }
};

module.exports = {
  obtenerModulos,
  actualizarModulos,
};
