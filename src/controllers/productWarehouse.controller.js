import { ProductWarehouseModel } from "../models/productWarehouse.model.js";

export class ProductWarehouseController {
  static async getProducts(req, res, next) {
    try {
      const result = await ProductWarehouseModel.getProducts({});

      res.status(200).json(result);
    } catch (err) {
      console.error(
        "Error en getProducts en productWarehouse.controller.js",
        err.message
      );
      next(err);
    }
  }

  static async getProduct(req, res, next) {
    try {
    } catch (err) {
      console.error("Error en getProduct en productWarehouse.controller.js"),
        err.message;
    }
  }

  static async createProduct(req, res, next) {
    try {
      const productData = req.body;

      const result = await ProductWarehouseModel.createProduct({
        productData,
      });

      res.json(result);
    } catch (err) {
      console.error(
        "Error en createProduct en productWarehouse.controller.js",
        err
      );
      next(err);
    }
  }

  static async partiallyUpdateProduct(req, res, next) {
    try {
    } catch (err) {
      console.error(
        "Error en partiallyUpdateProduct en productWarehouse.controller.js",
        err.message
      );
      next(err);
    }
  }

  static async fullyUpdateProduct(req, res, next) {
    try {
    } catch (err) {
      console.error(
        "Erro en fullyUpdateProduct en productWarehouse.controller.js",
        err.message
      );
    }
  }

  static async deleteProduct(req, res, next) {
    try {
    } catch (err) {
      console.error(
        "Erro en deleteProduct en productWarehouse.controller.js",
        err.message
      );
    }
  }
}
