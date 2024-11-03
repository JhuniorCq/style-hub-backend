import { Router } from "express";
import { ProductController } from "../controllers/product.controller.js";

const router = Router();

router.get("/", ProductController.getProducts);
router.get("/:id", ProductController.getProduct);
router.get("/show-quantity/:id", ProductController.getProductShowQuantity);
router.post("/", ProductController.createProduct);
router.patch("/:id", ProductController.partiallyUpdateProduct);
router.put("/:id", ProductController.fullyUpdateProduct);
router.delete("/:id", ProductController.deleteProduct);

export { router };
