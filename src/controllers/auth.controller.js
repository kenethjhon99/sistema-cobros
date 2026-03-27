const pool = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const login = async (req, res) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
      return res
        .status(400)
        .json({ error: "El nombre de usuario y la contrasena son obligatorios" });
    }

    const [rows] = await pool.query(
      "SELECT * FROM usuarios WHERE usuario = ?",
      [usuario]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciales invalidas" });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Credenciales invalidas" });
    }

    const institucionId = user.institucion_id ?? user.institucionId ?? null;

    const token = jwt.sign(
      {
        id: user.id,
        usuario: user.usuario,
        rol: user.rol,
        institucionId,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    res.json({
      token,
      user: {
        id: user.id,
        usuario: user.usuario,
        nombre: user.nombre,
        rol: user.rol,
        institucionId,
      },
    });
  } catch (error) {
    console.error("Error durante el login:", error);
    res.status(500).json({ error: "Error del servidor durante el login" });
  }
};

module.exports = { login };
