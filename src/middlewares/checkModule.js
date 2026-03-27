const pool = require("../db");

const checkModule = (moduleName) => {
  return async (req, res, next) => {
    try {
      const institucionId = Number(
        req.institucionId ||
        req.user?.institucionId ||
        req.headers["x-institucion-id"] ||
        req.query.institucionId ||
        process.env.DEFAULT_INSTITUCION_ID ||
        1
      );

      if (!institucionId) {
        return res.status(400).json({ message: "Institucion ID is required" });
      }

      const [rows] = await pool.query(
        "SELECT * FROM institucion_modulos WHERE institucion_id = ?",
        [institucionId]
      );

      if (rows.length === 0) {
        return res.status(403).json({ message: "Institucion sin modulos configurados" });
      }

      const mod = rows[0];
      if (moduleName === "asistencia" && !mod.modulo_asistencia) {
        return res.status(403).json({ message: "Modulo de Asistencia no habilitado" });
      }
      if (moduleName === "cobros" && !mod.modulo_cobros) {
        return res.status(403).json({ message: "Modulo de Cobros no habilitado" });
      }
      if (moduleName === "notas" && !mod.modulo_notas) {
        return res.status(403).json({ message: "Modulo de Notas no habilitado" });
      }

      req.institucionId = institucionId;
      next();
    } catch (error) {
      console.error("Error checking module access:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
};

module.exports = { checkModule };
