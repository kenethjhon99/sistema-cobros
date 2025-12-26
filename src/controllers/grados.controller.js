const pool = require("../db");

// Obtener todos los grados
const obtenerGrados = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM grados");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los grados" });
  }
};

// Crear un nuevo grado
const crearGrado = async (req, res) => {
  try {
    const { nombre, nivel } = req.body;
    if (!nombre || !nivel) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }
    const creado_por = "admin_demo";
    const query = `
            INSERT INTO grados (nombre, nivel, creado_por) VALUES (?, ?, ?)`;
    const params = [nombre, nivel, creado_por];
    const [result] = await pool.query(query, params);
    const [rows] = await pool.query("SELECT * FROM grados WHERE id = ?", [
      result.insertId,
    ]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el grado" });
  }
};

module.exports = {
  obtenerGrados,
  crearGrado,
};
