import axios from "axios";
import { EXCHANGERATE_API } from "../config/config.js";
import { roundToDecimals } from "./roundToDecimal.js";

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

const result = await convertPENToUSD(100);
console.log(`${100} soles son ${result} dólares`);

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
