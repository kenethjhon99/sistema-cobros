const pool = require("../db");
const { marcarAsistencia } = require("../services/asistencia.service");

const marcar = async (req, res) => {
  try {
    const { personaId, tipo, dispositivoId } = req.body;

    if (!personaId || !tipo) {
      return res.status(400).json({ message: "Falta personaId o tipo" });
    }

    const t = String(tipo).toUpperCase();
    if (!["ENTRADA", "SALIDA"].includes(t)) {
      return res.status(400).json({ message: "tipo debe ser ENTRADA o SALIDA" });
    }

    const now = new Date();
    const fecha = now.toISOString().slice(0, 10);
    const hora = now.toTimeString().slice(0, 8);

    const result = await marcarAsistencia({
      personaId,
      tipo: t,
      fecha,
      hora,
      dispositivoId: dispositivoId ? Number(dispositivoId) : null,
    });

    res.status(201).json({
      message: "Asistencia marcada",
      asistenciaId: result.asistenciaId,
    });
  } catch (err) {
    res.status(400).json({ message: err.message || "Error marcando asistencia" });
  }
};

const asistenciaHoy = async (req, res) => {
  try {
    const institucionId = req.institucionId;

    const [rows] = await pool.query(
      `SELECT a.id, a.fecha, a.hora, a.tipo,
              p.tipo AS persona_tipo, p.referencia_id,
              p.institucion_id
       FROM asistencia a
       JOIN personas p ON p.id = a.persona_id
       WHERE a.fecha = CURDATE()
         AND p.institucion_id = ?
       ORDER BY a.hora DESC`,
      [institucionId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error consultando asistencia de hoy" });
  }
};

const historialPersona = async (req, res) => {
  try {
    const { personaId } = req.params;

    const [rows] = await pool.query(
      `SELECT a.id, a.fecha, a.hora, a.tipo, a.dispositivo_id
       FROM asistencia a
       JOIN personas p ON p.id = a.persona_id
       WHERE a.persona_id = ?
         AND p.institucion_id = ?
       ORDER BY a.fecha DESC, a.hora DESC`,
      [personaId, req.institucionId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error consultando historial" });
  }
};

const resumenDiario = async (req, res) => {
  try {
    const institucionId = req.institucionId;
    const fecha = req.query.fecha || new Date().toISOString().slice(0, 10);

    const [rows] = await pool.query(
      `SELECT p.id AS persona_id,
              p.tipo AS persona_tipo,
              p.referencia_id,
              MIN(CASE WHEN a.tipo='ENTRADA' THEN a.hora END) AS entrada,
              MAX(CASE WHEN a.tipo='SALIDA' THEN a.hora END) AS salida
       FROM personas p
       LEFT JOIN asistencia a
         ON a.persona_id = p.id AND a.fecha = ?
       WHERE (? IS NULL OR p.institucion_id = ?)
       GROUP BY p.id, p.tipo, p.referencia_id
       ORDER BY p.tipo, p.referencia_id`,
      [fecha, institucionId || null, institucionId || null]
    );

    res.json({ fecha, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generando resumen" });
  }
};

const asistenciaPorGrado = async (req, res) => {
  try {
    const { gradoId } = req.params;

    const [rows] = await pool.query(
      `SELECT e.primer_nombre, e.primer_apellido,
              MIN(CASE WHEN a.tipo='ENTRADA' THEN a.hora END) AS entrada,
              MAX(CASE WHEN a.tipo='SALIDA' THEN a.hora END) AS salida
       FROM asistencia a
       JOIN personas p ON p.id = a.persona_id
       JOIN estudiantes e ON e.id = p.referencia_id
       WHERE e.grado_id = ?
         AND p.institucion_id = ?
         AND a.fecha = CURDATE()
       GROUP BY e.id`,
      [gradoId, req.institucionId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error consultando asistencia por grado" });
  }
};

module.exports = {
  marcar,
  asistenciaHoy,
  historialPersona,
  resumenDiario,
  asistenciaPorGrado,
};
