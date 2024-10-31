import express from "express";
import cors from "cors";
import morgan from "morgan";
import { HOST, PORT } from "./src/config/config.js";
import { errorHandler } from "./src/util/errorHandler.js";
import { router as routerOrder } from "./src/routes/order.routes.js";
import { router as routerPayment } from "./src/routes/payment.routes.js";
import { router as routerProduct } from "./src/routes/product.routes.js";
import { router as routerProductWarehouse } from "./src/routes/productWarehouse.routes.js";
import path from "node:path";

const app = express();

app.disabled("x-powered-by");
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use(express.static(path.resolve("src", "public")));

app.get("/", (req, res, next) => {
  res.json({ message: `Hola, estás en ${req.url}` });
});

// Rutas de Order
app.use("/order", routerOrder);

// Rutas de Product
app.use("/product", routerProduct);

// Rutas de ProductWarehouse
app.use("/product-warehouse", routerProductWarehouse);

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
