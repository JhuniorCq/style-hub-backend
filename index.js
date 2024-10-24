import express from "express";
import cors from "cors";
import morgan from "morgan";
import { HOST, PORT } from "./config/config.js";
import { errorHandler } from "./util/errorHandler.js";
import { router as routerPayment } from "./routes/payment.routes.js";

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/", (req, res, next) => {
  res.json({ message: `Hola, estás en ${req.url}` });
});

// Rutas de Payment
app.use("/payment", routerPayment);

// Middleware para manejar un Error 404 cuando la Ruta No Existe
app.use((req, res) => {
  res.status(404).json({ message: "Error 404 Not Found" });
});

// Middleware para manejo de errores
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en ${HOST}`);
});
