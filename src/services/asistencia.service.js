const pool = require("../db");

async function marcarAsistencia({ personaId, tipo, fecha, hora, dispositivoId }) {
  const [persona] = await pool.query(
    "SELECT id FROM personas WHERE id = ?",
    [personaId]
  );

  if (!persona.length) {
    throw new Error("Persona no encontrada");
  }

  // evitar duplicados
  const [existe] = await pool.query(
    "SELECT id FROM asistencia WHERE persona_id = ? AND tipo = ? AND fecha = ?",
    [personaId, tipo, fecha]
  );

  if (existe.length) {
    throw new Error(`Ya existe ${tipo} para hoy`);
  }

  if (tipo === "SALIDA") {
    const [entrada] = await pool.query(
      "SELECT id FROM asistencia WHERE persona_id = ? AND tipo='ENTRADA' AND fecha = ?",
      [personaId, fecha]
    );
    if (!entrada.length) {
      throw new Error("No puede marcar salida sin entrada");
    }
  }

  const [result] = await pool.query(
    `
    INSERT INTO asistencia
    (persona_id, tipo, fecha, hora, dispositivo_id, creado_en)
    VALUES (?, ?, ?, ?, ?, NOW())
    `,
    [personaId, tipo, fecha, hora, dispositivoId]
  );

  return { asistenciaId: result.insertId };
}

module.exports = { marcarAsistencia };
