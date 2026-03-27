module.exports = (req, res, next) => {
  const headerId = req.headers["x-institucion-id"];
  const queryId = req.query?.institucionId;

  if (headerId || queryId) {
    req.institucionId = Number(headerId || queryId);
  }

  next();
};
