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

    console.log("Esto es lo que el usuario envió: ", req.body);

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

      console.log(
        "Estos son los datos validados: ",
        productListValidated.data,
        checkoutDataValidated.data
      );

      // GUARDAMOS LOS DATOS EN LA BD -> Si ocurre un error en la creación del pedido, createOrder devolverá success: false
      const { success: orderSuccess, data: orderData } =
        await OrderModel.createOrder({
          productList: productListValidated.data,
          checkoutData: checkoutDataValidated.data,
        });

      if (!orderSuccess) {
        const error = new Error("Hubo un error en la creación del pedido.");
        error.statusCode = 500;
        throw error;
      }

      const { itemListUSD, amountTotalUSD } = await getCostUSD(
        productList,
        checkoutData.deliveryOption
      );

      console.log("Item List USD: ", itemListUSD);
      console.log("Amount Total USD: ", amountTotalUSD);

      // CREAMOS EL PEDIDO EN PAYPAL
      const order = {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: orderData.idOrder, // Pasamos el ID del pedido para recuperarlo en /capture-order
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
              cancel_url: `${HOST}/payment/cancel-order?idOrder=${orderData.idOrder}`,
              // cancel_url: "http://localhost:5173/checkout",
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

      // Obtenemos algunos datos del pedido
      const idOrder = response.data.purchase_units[0].reference_id;
      const namePaypal = `${response.data.payer.name.given_name} ${response.data.payer.name.surname}`;
      const emailPaypal = response.data.payer.email_address;

      const resultUpdate = await PaymentModel.updateOrder({
        idOrder,
        namePaypal,
        emailPaypal,
      });

      // res.json({
      //   success: true,
      //   message: "Pago realizado con éxito",
      //   idOrder: response.data.purchase_units[0].reference_id,
      //   name: response.data.payer.name.given_name,
      //   surname: response.data.payer.name.surname,
      //   email: response.data.payer.email_address,
      //   update: resultUpdate,
      //   orderData: response.data,
      // });
      res.redirect(`${HOST_CLIENT}/order-completion?idOrder=${idOrder}`);
    } catch (err) {
      console.error("", err);
      next(err);
    }
  }

  static async cancelOrder(req, res, next) {
    try {
      const { idOrder } = req.query;

      console.log(req.originalUrl, idOrder);

      const resultDelete = await OrderModel.deleteOrder({ id: idOrder });

      res.json({ success: resultDelete });
      // res.redirect("http://localhost:5173/checkout");
    } catch (err) {
      console.error("", err);
      next(err);
    }
  }
}
