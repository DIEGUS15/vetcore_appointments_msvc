import express from "express";
import dotenv from "dotenv";
import { sequelize, testConnection } from "./src/db.js";
import Routes from "./src/routes/Routes.js";
import { connectRabbitMQ, closeConnection } from "./src/config/rabbitmq.js";
// Importar modelos y asociaciones para que Sequelize los sincronice
import "./src/models/associations.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middlewares - NO aplicar JSON parser a rutas de PDF
app.use((req, res, next) => {
  // Excluir rutas de PDF del middleware JSON
  if (req.path.includes('/pdf') || req.path.endsWith('/download')) {
    return next();
  }
  express.json()(req, res, next);
});

app.use((req, res, next) => {
  // Excluir rutas de PDF del middleware urlencoded
  if (req.path.includes('/pdf') || req.path.endsWith('/download')) {
    return next();
  }
  express.urlencoded({ extended: true })(req, res, next);
});

// Rutas
app.use("/api/appointments", Routes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ message: "API funcionando correctamente" });
});

// Iniciar servidor y sincronizar base de datos
const startServer = async () => {
  try {
    // Probar conexión
    await testConnection();

    // Sincronizar modelos con la base de datos
    await sequelize.sync({ alter: true });
    console.log("Modelos sincronizados con la base de datos");

    // Conectar RabbitMQ (no crítico - el servicio puede funcionar sin él)
    try {
      await connectRabbitMQ();
      console.log("RabbitMQ conectado exitosamente");
    } catch (error) {
      console.warn("⚠️  Warning: RabbitMQ connection failed. Service will continue without event publishing.");
      console.warn("RabbitMQ error:", error.message);
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

// Manejar cierre graceful
process.on("SIGINT", async () => {
  console.log("\nCerrando servidor...");
  await closeConnection();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nCerrando servidor...");
  await closeConnection();
  process.exit(0);
});

startServer();
