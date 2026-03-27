const checkRole = (rolesPermitidos = []) => {
  return (req, res, next) => {
    const rol = req.user?.rol; // viene del token

    if (!rol) {
      return res.status(401).json({ message: "No autenticado" });
    }

    if (!rolesPermitidos.includes(rol)) {
      return res.status(403).json({
        message: "No tienes permiso para esta acción",
      });
    }

    next();
  };
};

module.exports = { checkRole };
