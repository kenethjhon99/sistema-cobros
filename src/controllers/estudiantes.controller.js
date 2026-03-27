const pool = require("../db");
const { generarCuotasParaEstudiantes } = require("../services/cobros.service");
const { registrarUsuarioHikvision } = require("../services/hikvision.service");
const { ensurePersonaForStudent } = require("../services/personas.service");

const obtenerEstudiantes = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT e.id, e.carne, e.cui, e.primer_nombre, e.segundo_nombre, e.primer_apellido, e.segundo_apellido, g.nombre AS grado FROM estudiantes e JOIN grados g ON e.grado_id = g.id"
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los estudiantes" });
  }
};

const crearEstudiante = async (req, res) => {
  try {
    const {
      cui,
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      grado_id,
    } = req.body;

    if (!cui || !primer_nombre || !primer_apellido || !grado_id) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const creado_por = req.user?.usuario || "admin_demo";
    const query = `
      INSERT INTO estudiantes
      (cui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, grado_id, creado_por)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      cui,
      primer_nombre,
      segundo_nombre || null,
      primer_apellido,
      segundo_apellido || null,
      grado_id,
      creado_por,
    ];

    const [result] = await pool.query(query, params);
    const nuevoId = result.insertId;
    const anioActual = new Date().getFullYear();

    await generarCuotasParaEstudiantes(nuevoId, grado_id, anioActual);

    const [rows] = await pool.query("SELECT * FROM estudiantes WHERE id = ?", [
      nuevoId,
    ]);

    const estudianteCreado = rows[0];
    const persona = await ensurePersonaForStudent({
      estudianteId: estudianteCreado.id,
      institucionId: req.institucionId || req.user?.institucionId,
      creadoPor: creado_por,
      carne: estudianteCreado.carne,
    });

    const hikvisionSync = await registrarUsuarioHikvision(estudianteCreado);

    res.status(201).json({
      ...estudianteCreado,
      personaId: persona.id,
      hikvisionSync,
    });
  } catch (error) {
    console.error("ERROR EN CREAR ESTUDIANTE:", error);
    res.status(500).json({ error: "Error al crear el estudiante" });
  }
};

module.exports = {
  obtenerEstudiantes,
  crearEstudiante,
};
