import axios from "axios";
import {
  HOST,
  PAYPAL_API,
  PAYPAL_CLIENT_ID,
  PAYPAL_KEY_SECRET,
} from "../config/config.js";

export class PaymentController {
  static async createOrder(req, res, next) {
    try {
      const order = {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: crypto.randomUUID(),
            amount: {
              currency_code: "USD",
              value: "200.00",
            },
          },
          {
            reference_id: crypto.randomUUID(),
            amount: {
              currency_code: "USD",
              value: "300.00",
            },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: "Mi Tienda",
              landing_page: "NO_PREFERENCE",
              user_action: "PAY_NOW",
              return_url: `${HOST}/payment/capture-order`,
              cancel_url: `${HOST}/payment/cancel-order`,
            },
          },
        },
      };

      const params = new URLSearchParams();
      params.append("grand_type", "client_credentials");

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
      // Este "token" lo genera Paypal automáticamente luego de que aceptes y realices el Pago
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

      res.send("Listo, el pedido ha sido pagado.");
    } catch (err) {
      console.error("", err);
      next(err);
    }
  }

  static async cancelOrder(req, res, next) {
    try {
      res.json({ cancelOrder: true });
    } catch (err) {
      console.error("", err);
      next(err);
    }
  }
}
