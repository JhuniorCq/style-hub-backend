import axios from "axios";
import {
  HOST,
  PAYPAL_API,
  PAYPAL_CLIENT_ID,
  PAYPAL_KEY_SECRET,
} from "../config/config.js";
import { convertPENToUSDProductList } from "../util/convertPENtoUSD.js";

const productList = [
  {
    id: 1,
    name: "Gorra",
    price: 10,
  },
  {
    id: 2,
    name: "Camisa",
    price: 35,
  },
  {
    id: 3,
    name: "Polo",
    price: 20,
  },
];

export class PaymentController {
  static async createOrder(req, res, next) {
    // PEN no acepta creo :,v , USD y MXN sí
    // const productList = req.body;

    const productListPaypal = await convertPENToUSDProductList(productList);

    console.log(productListPaypal);

    try {
      const order = {
        intent: "CAPTURE",
        purchase_units: productListPaypal,
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
      // Este "token" lo genera Paypal automáticamente luego de que aceptes y realices el Pago
      const { token } = req.query;

      // En el "data" de este "response" está TODA la información del PEDIDO, del COMPRADOR, de los PRODUCTOS, etc. -> De acá podemos sacar algunos DATOS para almacenar en la BD (aparte de los que se obtiene del formulario)
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
      // res.json({ cancelOrder: true });
      res.redirect("/");
    } catch (err) {
      console.error("", err);
      next(err);
    }
  }
}
