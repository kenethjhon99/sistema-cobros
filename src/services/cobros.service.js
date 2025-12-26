const pool = require("../db");
console.log("Servicio de cobros cargado correctamente.");
async function generarCuotasParaEstudiantes(estudianteId, gradoId, anio) {
    console.log("Iniciando generación de cuotas para el estudiante:", estudianteId);
    console.log("Grado ID:", gradoId, "Año:", anio);
  const [confRows] = await pool.query(
    "SELECT meses_escolares FROM configuraciones ORDER BY id DESC LIMIT 1"
  );
  const mesesEscolares = confRows[0]?.meses_escolares || 10;

  const [pagosGrado] = await pool.query(
    `SELECT pg.tipo_pago_id, pg.monto, tp.nombre
     FROM pagos_grado pg
     INNER JOIN tipos_pagos tp ON tp.id = pg.tipo_pago_id
     WHERE pg.grado_id = ?`,
    [gradoId]
  );

  if (pagosGrado.length === 0) {
    console.error("⚠ ERROR: No hay pagos configurados para grado:", gradoId);
    return;
  }

  const [meses] = await pool.query(
    "SELECT id FROM meses ORDER BY orden LIMIT ?",
    [mesesEscolares]
  );

  console.log("Generando cuotas para estudiante:", estudianteId);

  for (const pago of pagosGrado) {
    if (pago.nombre !== "Mensualidad") {
      await pool.query(
        `INSERT INTO cuotas_estudiante (estudiante_id, tipo_pago_id, mes_id, anio, monto)
         VALUES (?, ?, NULL, ?, ?)`,
        [estudianteId, pago.tipo_pago_id, anio, pago.monto]
      );
    } else {
      for (const mes of meses) {
        await pool.query(
          `INSERT INTO cuotas_estudiante (estudiante_id, tipo_pago_id, mes_id, anio, monto)
           VALUES (?, ?, ?, ?, ?)`,
          [estudianteId, pago.tipo_pago_id, mes.id, anio, pago.monto]
          
        );
        console.log("Pagos encontrados:", pagosGrado);
      }
    }
  }

  console.log("Cuotas generadas correctamente ✔");
}

module.exports = { generarCuotasParaEstudiantes };
