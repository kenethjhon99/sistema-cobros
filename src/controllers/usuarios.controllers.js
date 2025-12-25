const pool = require("../db");
const bcrypt = require("bcrypt");

// Obtener todos los usuarios
const obtenerUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM usuarios");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los usuarios" });
  }
};

// Crear un nuevo usuario
const crearUsuario = async (req, res) => {
  try {
    const { id, usuario, password, nombre, rol, estado } = req.body;
    if (!usuario || !password || !nombre) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const creado_por = "sistema";

    const [result] = await pool.query(
      "INSERT INTO usuarios (usuario, password, nombre, rol, creado_por) VALUES (?, ?, ?, ?, ?)",
      [usuario, hashedPassword, nombre, rol, creado_por]
    );
    res
      .status(201)
      .json({ message: "Usuario creado", usuarioId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el usuario" });
  }
};

module.exports = {
  obtenerUsuarios,
  crearUsuario,
};
