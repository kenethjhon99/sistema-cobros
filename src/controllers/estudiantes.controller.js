const pool = require("../db");
const { generarCuotasParaEstudiantes } = require("../services/cobros.service");

// Obtener todos los estudiantes
const obtenerEstudiantes = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT e.id,e.carne, e.cui, e.primer_nombre, e.segundo_nombre, e.primer_apellido, e.segundo_apellido, g.nombre AS grado FROM estudiantes e JOIN grados g ON e.grado_id = g.id"
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los estudiantes" });
  }
};
// Crear un nuevo estudiante
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
    const creado_por = "admin_demo";
    const query = `
            INSERT INTO estudiantes
            (cui, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, grado_id, creado_por) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      cui,
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      grado_id,
      creado_por,
    ];
    const [result] = await pool.query(query, params);
    console.log("Estudiante creado con ID:", result.insertId);
    console.log("grado recibido:", grado_id);
    console.log()
    const nuevoId = result.insertId;
    console.log("Estudiante creado con ID:", nuevoId);
    //generar año actual
    const anioActual = new Date().getFullYear();
    // generar cuotas automaticamente
    await generarCuotasParaEstudiantes(nuevoId, grado_id, anioActual);
    console.log("Cuotas generadas para el estudiante ID:", nuevoId);

    // obtener el estudiante creado
    const [rows] = await pool.query("SELECT * FROM estudiantes WHERE id = ?", [
      nuevoId,
    ]);
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("❌ ERROR EN CREAR ESTUDIANTE:", error);
    console.error(error);
    res.status(500).json({ error: "Error al crear el estudiante" });
  }
};
module.exports = {
  obtenerEstudiantes,
  crearEstudiante,
};
