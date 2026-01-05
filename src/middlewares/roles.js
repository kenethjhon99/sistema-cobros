const roleMiddleware = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({ error: "Acceso denegado: rol no autorizado" });
        }
        next();
    };
};

module.exports = roleMiddleware;