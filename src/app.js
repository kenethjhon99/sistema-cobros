const express = require("express");
const pool = require("./db");
const cors = require("cors");
require("dotenv").config();

const gradosRoutes = require("./routes/grados.routes");
const estudiantesRoutes = require("./routes/estudiantes.routes");
const usuariosRoutes = require("./routes/usuarios.routes");
const cuotasRoutes = require("./routes/cuotas.routes");
const authRoutes = require("./routes/auth.routes");

const app = express();
app.use(cors());
app.use(express.json());

// conexion test
(async () => {
  try {
    await pool.getConnection();
    console.log("Conectado a la base de datos MySQL");
  } catch (error) {
    console.error("Error al conectar a la base de datos MySQL:", error);
  }
})();

// Rutas
// app.use("/api", (req, res) => {
//   res.json({
//     nombre: "API de Gestión Escolar",
//     descripción:
//       "API para gestionar grados y estudiantes en una institución educativa",
//     versión: "1.0.0",
//     rutas: [
//       "/ api / grados - para gestionar los grados escolares",
//       "/ api / estudiantes - para gestionar los estudiantes",
//     ],
//   });
// });
app.use("/api/grados", gradosRoutes);
app.use("/api/estudiantes", estudiantesRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api", cuotasRoutes);
app.use("/api/auth", authRoutes);
app.use(express.json());


// prueba de servidor
app.get("/", (req, res) => {
  res.send("Servidor funcionando correctamente");
});

//servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
