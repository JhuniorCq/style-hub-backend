import { OrderModel } from "../models/order.model.js";
import {
  validateCheckoutData,
  validateProductList,
} from "../util/validations/orderValidations.js";

export class OrderController {
  static async getOrders(req, res, next) {
    try {
      const { deliveryOption, paymentOption } = req.query;

      const orders = await OrderModel.getOrders({
        deliveryOption,
        paymentOption,
      });

      res.json(orders);
    } catch (err) {
      console.error("Error en getOrders en order.controller.js", err.message);
      next(err);
    }
  }

  static async getOrder(req, res, next) {
    try {
      const { id } = req.params;

      const order = await OrderModel.getOrder({ id });

      res.json(order);
    } catch (err) {
      console.error("Error en getOrder en order.controller.js", err.message);
      next(err);
    }
  }

  static async createOrder(req, res, next) {
    try {
      const { productList, checkoutData } = req.body;

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

      const result = await OrderModel.createOrder({
        productList: productListValidated.data,
        checkoutData: checkoutDataValidated.data,
      });

      res.json(result);
    } catch (err) {
      console.error("Error en createOrder en order.controller.js", err.message);
      next(err);
    }
  }

  static async deleteOrder(req, res, next) {
    try {
      const { id } = req.params;

      const result = await OrderModel.deleteOrder({ id });

      res.json({
        message: result,
      });
    } catch (err) {
      console.error("Error en deleteOrder en order.controller.js", err.message);
      next(err);
    }
  }
}

export const deletePendingOrders = async (hours) => {
  try {
    await OrderModel.deletePendingOrders({ hours });
  } catch (err) {
    console.error(
      "Error en deletePendingOrders en order.controller.js",
      err.message
    );
  }
};
