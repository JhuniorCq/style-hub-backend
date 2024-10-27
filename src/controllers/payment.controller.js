import axios from "axios";
import {
  HOST,
  PAYPAL_API,
  PAYPAL_CLIENT_ID,
  PAYPAL_KEY_SECRET,
} from "../config/config.js";
import { getCostUSD } from "../util/convertPENtoUSD.js";

// const productList = [
//   {
//     id: 1,
//     name: "Gorra",
//     price: 10,
//     quantity: 1,
//   },
//   {
//     id: 2,
//     name: "Camisa",
//     price: 35,
//     quantity: 1,
//   },
//   {
//     id: 3,
//     name: "Polo",
//     price: 20,
//     quantity: 2,
//   },
// ];

export class PaymentController {
  static async createOrder(req, res, next) {
    // PEN no acepta creo :,v , USD y MXN sí
    // const productList = req.body;

    const { productList, checkoutData } = req.body;

    try {
      // GUARDAMOS LOS DATOS EN LA BD Y LUEGO CREAMOS EL PEDIDO EN PAYPAL

      const { itemListUSD, amountTotalUSD } = await getCostUSD(
        productList,
        checkoutData.deliveryOption
      );

      console.log("Item List USD: ", itemListUSD);
      console.log("Amount Total USD: ", amountTotalUSD);

      const order = {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: crypto.randomUUID(),
            amount: {
              currency_code: "USD",
              value: amountTotalUSD,
              // La propiedad "breakdown" es necesario solo si usamos la propiedad "items"
              breakdown: {
                item_total: {
                  currency_code: "USD",
                  value: amountTotalUSD,
                },
              },
            },
            // La propiedad "items" NO es OBLIGATORIIA según la Documentación de Paypal
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
              // cancel_url: `${HOST}/payment/cancel-order`,
              cancel_url: "http://localhost:5173/checkout",
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

      // res.send("Listo, el pedido ha sido pagado.");
      res.redirect("http://localhost:5173");

      // LA SOLUCIÓN PARA CONECTAR CON EL FRONTEND SERÍA -> Almacenar en la BD el ID del PEDIDO y también todos los datos necesarios (los datos tanto de los Productos como los del FORMS), y luego usar un "res.redirect(`http://localhost:5173/order-completion?orderId=${response.data.id}`)"
      // res.json({
      //   success: true,
      //   message: "Pago realizado con éxito",
      //   orderData: response.data,
      // });
    } catch (err) {
      console.error("", err);
      next(err);
    }
  }

  static async cancelOrder(req, res, next) {
    try {
      res.json({ success: false });
      // res.redirect("/");
    } catch (err) {
      console.error("", err);
      next(err);
    }
  }
}
