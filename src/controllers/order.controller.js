import dayjs from "dayjs";
import { OrderModel } from "../models/order.model.js";
import {
  validateCheckoutData,
  validateProductList,
} from "../util/validations/orderValidations.js";

export class OrderController {
  static async getOrders(req, res, next) {
    try {
    } catch (err) {
      console.error("Error en getOrders en order.controller.js", err.message);
      next(err);
    }
  }

  static async createOrder(req, res, next) {
    try {
      const { productList, checkoutData } = req.body;

      // VALIDAR LOS DATOS ENVIADOS POR EL USUARIO
      const productListValidated = validateProductList(productList);
      const checkoutDataValidated = validateCheckoutData(
        checkoutData,
        checkoutData.deliveryOption
      );

      if (!productListValidated.success || !checkoutDataValidated.success) {
        const error = new Error("Error en la Validación de los datos.");
        error.statusCode = 400;
        throw error;
      }

      // ENVIAR LOS DATOS AL MODELO
      const result = await OrderModel.createOrder({
        productList: productListValidated.data,
        checkoutData: checkoutDataValidated.data,
      });

      console.log("Estos son los datos enviados por el usuario: ", result);

      res.json(result);
    } catch (err) {
      console.error("Error en createOrder en order.controller.js", err.message);
      next(err);
    }
  }
}
