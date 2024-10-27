import axios from "axios";
import { EXCHANGERATE_API } from "../config/config.js";
import { /*findAmountTotal,*/ roundToDecimals } from "./logic.js";
import { DELIVERY_OPTIONS, SHIPPING_COST } from "./constants.js";

// Lo mejor es solo LLAMAR a la API una vez, para así tener un VALOR del DÓLAR FIJO para una EJECUCIÓN, ya que el Dólar está en constante cambio
const getExchangerate = async () => {
  try {
    const response = await axios.get(EXCHANGERATE_API);
    return response.data.conversion_rates.USD;
  } catch (err) {
    console.error("Error al obtener el tipo de cambio", err);
    throw err;
  }
};

const convertPENToUSD = (amount, exchangerate) => {
  try {
    return roundToDecimals(amount * exchangerate, 2);
  } catch (err) {
    console.error("", err.message);
  }
};

// SI LO USARÉ CREOOOOOOOOOOOOO, REVISAAAAAAAAAR
// Esto usaré en payment.controller.js para así PASAR un VALOR EXACTO a purchase_units y ya NO un ARRAY de PRODUCTOS
// export const findTotalOrderAmountUSD = async (productList, deliveryOption) => {
//   let amountTotal = findAmountTotal(productList);

//   if (deliveryOption === DELIVERY_OPTIONS.SHIPPING) {
//     amountTotal += SHIPPING_COST;
//   }
//   console.log(amountTotal);
//   try {
//     const amountTotalUSD = convertPENToUSD(amountTotal);
//     console.log(amountTotalUSD);
//     return roundToDecimals(amountTotalUSD, 2);
//   } catch (err) {
//     console.error("", err.message);
//   }
// };

// export const convertPENToUSDProductList = async (
//   productList,
//   deliveryOption
// ) => {
//   try {
//     // Con esto nos aseguramos que para UN PEDIDO tenemos un VALOR del DÓLAR FIJO durante TODO el proceso
//     const exchangerate = await getExchangerate();
//     let productListPaypal = [];

//     for (const product of productList) {
//       const amount = product.price * product.quantity;
//       let amountUSD = convertPENToUSD(amount, exchangerate);
//       // amountUSD = roundToDecimals(amountUSD, 2);

//       console.log(
//         `El monto en soles es ${amount}, y en dólares es ${amountUSD}`
//       );

//       // Esta forma es cuando en purchase_units tendremos un ARRAY DE VARIOS OBJETOS
//       productListPaypal.push({
//         reference_id: crypto.randomUUID(),
//         amount: {
//           currency_code: "USD",
//           value: amountUSD,
//         },
//       });
//     }

//     console.log(deliveryOption);
//     if (deliveryOption === DELIVERY_OPTIONS.SHIPPING) {
//       const shippingCostUSD = convertPENToUSD(SHIPPING_COST, exchangerate);

//       productListPaypal.push({
//         reference_id: crypto.randomUUID(),
//         amount: {
//           currency_code: "USD",
//           value: roundToDecimals(shippingCostUSD, 2),
//         },
//       });
//     }

//     const amountTotalUSD = productListPaypal.reduce(
//       (accumulator, item) => item.amount.value,
//       0
//     );

//     console.log("El monto total en dólares es: ", amountTotalUSD);

//     return { productListPaypal, amountTotalUSD };
//   } catch (err) {
//     console.error("", err.message);
//   }
// };

// Esta es la fija
export const getCostUSD = async (productList, deliveryOption) => {
  try {
    const exchangerate = await getExchangerate();

    // Lista de Items USD
    const itemListUSD = productList.map((product) => ({
      name: product.name,
      unit_amount: {
        currency_code: "USD",
        value: String(convertPENToUSD(product.price, exchangerate)),
      },
      quantity: String(product.quantity),
    }));

    if (deliveryOption === DELIVERY_OPTIONS.SHIPPING) {
      itemListUSD.push({
        name: "Shipping Cost",
        unit_amount: {
          currency_code: "USD",
          value: String(convertPENToUSD(SHIPPING_COST, exchangerate)),
        },
        quantity: String(1),
      });
    }

    // Monto Total USD
    const amountTotalUSD = itemListUSD.reduce((accumulator, item) => {
      return (
        Number(item.unit_amount.value) * Number(item.quantity) + accumulator
      );
    }, 0);

    return {
      itemListUSD,
      amountTotalUSD: String(amountTotalUSD),
    };
  } catch (err) {
    console.error("", err.message);
  }
};
