import { ProductModel } from "../models/product.model.js";

export class ProductController {
  static async getProducts(req, res, next) {
    try {
      const result = await ProductModel.getProducts({});

      res.status(200).json(result);
    } catch (err) {
      console.error(
        "Error en getProducts en product.controller.js",
        err.message
      );
      next(err);
    }
  }

  static async getProduct(req, res, next) {
    try {
    } catch (err) {
      console.error("Error en getProduct en product.controller.js"),
        err.message;
      next(err);
    }
  }

  static async getProductShowQuantity(req, res, next) {
    try {
      const { id } = req.params;

      const result = await ProductModel.getProductShowQuantity({ id });

      res.json(result);
    } catch (err) {
      console.error(
        "Error en getProductShowQuantity en product.controller.js",
        err.message
      );
      next(err);
    }
  }

  static async createProduct(req, res, next) {
    try {
      const productData = req.body;

      const result = await ProductModel.createProduct({ productData });

      res.json({ message: result });
    } catch (err) {
      console.error("Error en createProduct en product.controller.js", err);
      next(err);
    }
  }

  static async partiallyUpdateProduct(req, res, next) {
    try {
    } catch (err) {
      console.error(
        "Error en partiallyUpdateProduct en product.controller.js",
        err.message
      );
      next(err);
    }
  }

  static async fullyUpdateProduct(req, res, next) {
    try {
    } catch (err) {
      console.error(
        "Erro en fullyUpdateProduct en product.controller.js",
        err.message
      );
    }
  }

  static async deleteProduct(req, res, next) {
    try {
    } catch (err) {
      console.error(
        "Erro en deleteProduct en product.controller.js",
        err.message
      );
    }
  }
}
