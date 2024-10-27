import { Router } from "express";
import { ProductWarehouseController } from "../controllers/productWarehouse.controller.js";

const router = Router();

router.get("/", ProductWarehouseController.getProducts);
router.get("/:id", ProductWarehouseController.getProduct);
router.post("/", ProductWarehouseController.createProduct);
router.patch("/:id", ProductWarehouseController.partiallyUpdateProduct);
router.put("/:id", ProductWarehouseController.fullyUpdateProduct);
router.delete("/:id", ProductWarehouseController.deleteProduct);

export { router };
