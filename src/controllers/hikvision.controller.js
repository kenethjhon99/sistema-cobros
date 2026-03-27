const { obtenerEvento, procesarEvento } = require("../services/hikvision.service");

const recibirEventoHikvision = async (req, res) => {
  try {
    const result = await procesarEvento(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error al recibir el evento de Hikvision:", error);
    res.status(500).json({ error: error.message || "Error al procesar el evento" });
  }
};

const probarEvento = async (req, res) => {
  try {
    const evento = await obtenerEvento();
    res.status(200).json(evento);
  } catch (error) {
    console.error("Error al obtener el evento de Hikvision:", error);
    res.status(500).json({ error: "Error al obtener el evento" });
  }
};

const recibirEvento = async (req, res) => {
  try {
    const result = await procesarEvento(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error al procesar el evento de Hikvision:", error);
    res.status(500).json({ error: error.message || "Error al procesar el evento" });
  }
};

module.exports = {
  recibirEventoHikvision,
  probarEvento,
  recibirEvento,
};
