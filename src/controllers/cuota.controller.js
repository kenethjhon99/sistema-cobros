const { parse } = require("dotenv");
const pool = require("../db");

const obtenerCuotasPorEstudiante = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT ce.id,CAST(ce.monto AS DECIMAL(10,2)) AS monto, tp.nombre AS tipo_pago, m.nombre AS mes, ce.anio,
                    ce.monto, ce.estado, ce.fecha_pago
             FROM cuotas_estudiante ce
             LEFT JOIN tipos_pagos tp ON tp.id = ce.tipo_pago_id
             LEFT JOIN meses m ON m.id = ce.mes_id
             WHERE ce.estudiante_id = ?
             ORDER BY ce.anio, m.orden`,
      [id]
    );

    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener cuotas:", error);
    res.status(500).json({ error: "Error al obtener cuotas del estudiante" });
  }
};

//pagar cuotas
const pagarCuota = async (req, res) => {
  try {
    const { id } = req.params;
    const { monto_pagado, observaciones } = req.body;
    const usuarioPago = "admin_demo";

    //obtener cuota actual
    const [cuotaRows] = await pool.query(
      `SELECT * FROM cuotas_estudiante WHERE id = ?`,
      [id]
    );

    if (!monto_pagado || monto_pagado <= 0) {
      return res
        .status(400)
        .json({ error: "El monto pagado debe ser mayor que cero" });
    }

    const cuota = cuotaRows[0];
    const nuevoMontoPagado =
      (parseFloat(cuota.monto_pagado) || 0) + parseFloat(monto_pagado);

    //calcular estado final
    let nuevoEstado = "pendiente";
    if (nuevoMontoPagado >= cuota.monto) {
      nuevoEstado = "pagado";
    } else nuevoEstado = "parcialmente_pagado";

    await pool.query(
      `UPDATE cuotas_estudiante
             SET estado = ?,
                 fecha_pago = NOW(),
                 monto = ?,
                 observacion = ?
             WHERE id = ?`,
      [nuevoEstado, nuevoMontoPagado, observaciones || null, id]
    );
    res.json({ message: "Cuota pagada exitosamente", estado: nuevoEstado });
  } catch (error) {
    console.error("❌ Error al pagar la cuota:", error);
    res.status(500).json({ error: "Error al procesar el pago de la cuota" });
  }
};

module.exports = { obtenerCuotasPorEstudiante, pagarCuota };
