import axios from "axios";
import { EXCHANGERATE_API } from "../config/config.js";
import { findAmountTotal, roundToDecimals } from "./logic.js";
import { DELIVERY_OPTIONS, SHIPPING_COST } from "./constants.js";

const getExchangerate = async () => {
  try {
    const response = await axios.get(EXCHANGERATE_API);
    return response.data.conversion_rates.USD;
  } catch (err) {
    console.error("Error al obtener el tipo de cambio", err);
    throw err;
  }
};

const convertPENToUSD = async (amount) => {
  try {
    const exchangerate = await getExchangerate();
    return amount * exchangerate;
  } catch (err) {
    console.error("", err.message);
  }
};

// Esto usaré en payment.controller.js para así PASAR un VALOR EXACTO a purchase_units y ya NO un ARRAY de PRODUCTOS
export const findTotalOrderAmountUSD = async (productList, deliveryOption) => {
  let amountTotal = findAmountTotal(productList);

  if (deliveryOption === DELIVERY_OPTIONS.SHIPPING) {
    amountTotal += SHIPPING_COST;
  }
  console.log(amountTotal);
  try {
    const amountTotalUSD = await convertPENToUSD(amountTotal);
    console.log(amountTotalUSD);
    return amountTotalUSD;
  } catch (err) {
    console.error("", err.message);
  }
};

export const convertPENToUSDProductList = async (productList) => {
  try {
    let productListPaypal = [];

    for (const product of productList) {
      const totalAmount = product.price * product.quantity;
      let totalAmountUSD = await convertPENToUSD(totalAmount);
      totalAmountUSD = roundToDecimals(totalAmountUSD, 2);

      console.log(
        `El monto en soles es ${totalAmount}, y en dólares es ${totalAmountUSD}`
      );
      productListPaypal.push({
        reference_id: product.id,
        amount: {
          currency_code: "USD",
          value: totalAmountUSD,
        },
      });
    }

    return productListPaypal;
  } catch (err) {
    console.error("", err.message);
  }
};

const productList = [
  {
    id: 1,
    name: "Gorra",
    price: 10,
    quantity: 1,
  },
  {
    id: 2,
    name: "Camisa",
    price: 35,
    quantity: 1,
  },
  {
    id: 3,
    name: "Polo",
    price: 20,
    quantity: 2,
  },
];

// REDONDEAR LAS CONVERSIONES
const productListPaypal = await convertPENToUSDProductList(productList);
console.log(productListPaypal);

const xd = await findTotalOrderAmountUSD(
  productList,
  DELIVERY_OPTIONS.SHIPPING
);

console.log(xd);
