import { Router } from "express";
import { OrderController } from "../controllers/order.controller.js";

const router = Router();

router.get("/", OrderController.getOrders);
router.get("/:id", OrderController.getOrder);
router.post("/", OrderController.createOrder);
router.delete("/:id", OrderController.deleteOrder);

export { router };
