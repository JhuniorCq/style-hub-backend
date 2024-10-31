import dayjs from "dayjs";
import { OrderModel } from "../models/order.model.js";

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

      // Agregamos las propiedades orderDate e id a checkoutData -> Esto lo haremos desde la misma validación

      checkoutData.idOrder = crypto.randomUUID();
      checkoutData.idPayment = crypto.randomUUID();

      const now = dayjs();
      checkoutData.orderDate = now.format("YYYY-MM-DD HH:mm:ss");

      // ENVIAR LOS DATOS AL MODELO
      const result = await OrderModel.createOrder({
        productList,
        checkoutData,
      });

      res.json({ message: result });
    } catch (err) {
      console.error("Error en createOrder en order.controller.js", err.message);
      next(err);
    }
  }
}
