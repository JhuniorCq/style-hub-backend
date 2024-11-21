import axios from "axios";
import {
  HOST,
  HOST_CLIENT,
  PAYPAL_API,
  PAYPAL_CLIENT_ID,
  PAYPAL_KEY_SECRET,
} from "../config/config.js";
import { getCostUSD } from "../util/convertPENtoUSD.js";
import {
  validateCheckoutData,
  validateProductList,
} from "../util/validations/orderValidations.js";
import { OrderModel } from "../models/order.model.js";
import { PaymentModel } from "../models/payment.model.js";

export class PaymentController {
  static async createOrder(req, res, next) {
    const { productList, checkoutData } = req.body;

    try {
      // VALIDAMOS LOS DATOS ENVIADOS POR EL USUARIO
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

      const { data: orderData } = await OrderModel.createOrder({
        productList: productListValidated.data,
        checkoutData: checkoutDataValidated.data,
      });

      const { itemListUSD, amountTotalUSD } = await getCostUSD(
        productList,
        checkoutData.deliveryOption
      );

      // CREAMOS EL PEDIDO EN PAYPAL
      const order = {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: orderData.idOrder,
            amount: {
              currency_code: "USD",
              value: amountTotalUSD,
              breakdown: {
                item_total: {
                  currency_code: "USD",
                  value: amountTotalUSD,
                },
              },
            },
            items: itemListUSD,
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: "Mi Tienda",
              landing_page: "NO_PREFERENCE",
              user_action: "PAY_NOW",
              return_url: `${HOST}/payment/capture-order`,
              cancel_url: `${HOST}/payment/cancel-order?idOrder=${orderData.idOrder}`,
            },
          },
        },
      };

      const params = new URLSearchParams();
      params.append("grant_type", "client_credentials");

      // Solicitud POST para obtener el access_token
      const {
        data: { access_token },
      } = await axios.post(`${PAYPAL_API}/v1/oauth2/token`, params, {
        auth: {
          username: PAYPAL_CLIENT_ID,
          password: PAYPAL_KEY_SECRET,
        },
      });

      // Solicitud POST para enviar la Orden a Paypal
      const response = await axios.post(
        `${PAYPAL_API}/v2/checkout/orders`,
        order,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      res.json(response.data);
    } catch (err) {
      console.error("", err);
      next(err);
    }
  }

  static async captureOrder(req, res, next) {
    try {
      const { token } = req.query;

      const response = await axios.post(
        `${PAYPAL_API}/v2/checkout/orders/${token}/capture`,
        {},
        {
          auth: {
            username: PAYPAL_CLIENT_ID,
            password: PAYPAL_KEY_SECRET,
          },
        }
      );

      const idOrder = response.data.purchase_units[0].reference_id;
      const namePaypal = `${response.data.payer.name.given_name} ${response.data.payer.name.surname}`;
      const emailPaypal = response.data.payer.email_address;

      const resultOrder = await OrderModel.getOrder({ id: idOrder });

      const {
        data: { productList },
      } = resultOrder;

      await PaymentModel.updateOrder({
        idOrder,
        namePaypal,
        emailPaypal,
        productList,
      });

      res.redirect(`${HOST_CLIENT}/order-completion?idOrder=${idOrder}`);
    } catch (err) {
      console.error(
        "Error en captureOrder en payment.controller.js",
        err.message
      );

      next(err);
    }
  }

  static async cancelOrder(req, res, next) {
    try {
      const { idOrder } = req.query;

      await OrderModel.deleteOrder({ id: idOrder });

      res.redirect("http://localhost:5173/checkout");
    } catch (err) {
      console.error(
        "Error en cancelOrder en payment.controller.js",
        err.message
      );
      next(err);
    }
  }
}
