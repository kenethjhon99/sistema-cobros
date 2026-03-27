const pool = require("../db");

let personasColumnsCache = null;

async function getPersonasColumns() {
  if (personasColumnsCache) {
    return personasColumnsCache;
  }

  const [rows] = await pool.query("SHOW COLUMNS FROM personas");
  personasColumnsCache = rows.map((row) => row.Field);
  return personasColumnsCache;
}

async function getExistingPersona(estudianteId) {
  const [rows] = await pool.query(
    `SELECT id, tipo, referencia_id, institucion_id
     FROM personas
     WHERE tipo = ? AND referencia_id = ?
     LIMIT 1`,
    ["ESTUDIANTE", estudianteId]
  );

  return rows[0] || null;
}

async function ensurePersonaForStudent({ estudianteId, institucionId, creadoPor, carne }) {
  const existing = await getExistingPersona(estudianteId);
  if (existing) {
    return existing;
  }

  const columns = await getPersonasColumns();
  const insertColumns = [];
  const insertValues = [];

  if (columns.includes("tipo")) {
    insertColumns.push("tipo");
    insertValues.push("ESTUDIANTE");
  }

  if (columns.includes("referencia_id")) {
    insertColumns.push("referencia_id");
    insertValues.push(estudianteId);
  }

  if (columns.includes("institucion_id")) {
    insertColumns.push("institucion_id");
    insertValues.push(Number(institucionId) || Number(process.env.DEFAULT_INSTITUCION_ID) || 1);
  }

  if (columns.includes("codigo_externo")) {
    insertColumns.push("codigo_externo");
    insertValues.push(carne || String(estudianteId));
  }

  if (columns.includes("creado_por")) {
    insertColumns.push("creado_por");
    insertValues.push(creadoPor || "sistema");
  }

  if (!insertColumns.length) {
    throw new Error("La tabla personas no tiene columnas compatibles para enlazar estudiantes");
  }

  const placeholders = insertColumns.map(() => "?").join(", ");

  const [result] = await pool.query(
    `INSERT INTO personas (${insertColumns.join(", ")}) VALUES (${placeholders})`,
    insertValues
  );

  return {
    id: result.insertId,
    tipo: "ESTUDIANTE",
    referencia_id: estudianteId,
    institucion_id: Number(institucionId) || Number(process.env.DEFAULT_INSTITUCION_ID) || 1,
  };
}

async function findStudentPersonaByEmployeeNo(employeeNo) {
  const [rows] = await pool.query(
    `SELECT
        p.id AS persona_id,
        p.institucion_id,
        e.id AS estudiante_id,
        e.carne
     FROM estudiantes e
     LEFT JOIN personas p
       ON p.referencia_id = e.id AND p.tipo = 'ESTUDIANTE'
     WHERE e.carne = ? OR CAST(e.id AS CHAR) = ?
     LIMIT 1`,
    [employeeNo, employeeNo]
  );

  return rows[0] || null;
}

module.exports = {
  ensurePersonaForStudent,
  findStudentPersonaByEmployeeNo,
};
