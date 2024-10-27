import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller.js";

const router = Router();

router.get("/", (req, res, next) => {
  res.status(200).json({ message: `Estás en ${req.originalUrl}` });
});

// Ruta que genera una vista con la Orden (acá se verá al botón "comprar" y "cancelar")
router.post("/create-order", PaymentController.createOrder);

// Ruta si se presiona "comprar"
router.get("/capture-order", PaymentController.captureOrder);

// Ruta si se presiona "cancelar"
router.get("/cancel-order", PaymentController.cancelOrder);

export { router };
