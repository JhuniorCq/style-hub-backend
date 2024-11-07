import dayjs from "dayjs";
import { OrderModel } from "../models/order.model.js";
import {
  validateCheckoutData,
  validateProductList,
} from "../util/validations/orderValidations.js";
import { DELIVERY_OPTIONS } from "../util/constants.js";

export class OrderController {
  static async getOrders(req, res, next) {
    try {
      const { deliveryOption, paymentOption } = req.query;

      const orders = await OrderModel.getOrders({
        deliveryOption,
        paymentOption,
      });

      console.log(orders.length);
      res.json(orders);
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

  static async deleteOrder(req, res, next) {
    try {
      const { id } = req.params;

      console.log("Eliminaré el pedido con el ID: ", id);

      const result = await OrderModel.deleteOrder({ id });

      res.json({
        message: `Eliminaré el pedido con el ID: ${id}`,
      });
    } catch (err) {
      console.error("Error en deleteOrder en order.controller.js", err.message);
      next(err);
    }
  }
}
