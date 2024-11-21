import axios from "axios";
import { EXCHANGERATE_API } from "../config/config.js";
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

const convertPENToUSD = (amount, exchangerate) => {
  try {
    const amountUSD = amount * exchangerate;
    return amountUSD.toFixed(2);
  } catch (err) {
    console.error("", err.message);
  }
};

export const getCostUSD = async (productList, deliveryOption) => {
  try {
    const exchangerate = await getExchangerate();

    // Lista de Items USD
    const itemListUSD = productList.map((product) => ({
      name: product.name,
      unit_amount: {
        currency_code: "USD",
        value: convertPENToUSD(product.price, exchangerate),
      },
      quantity: String(product.quantity),
    }));

    if (deliveryOption === DELIVERY_OPTIONS.SHIPPING) {
      itemListUSD.push({
        name: "Shipping Cost",
        unit_amount: {
          currency_code: "USD",
          value: convertPENToUSD(SHIPPING_COST, exchangerate),
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
      amountTotalUSD: amountTotalUSD.toFixed(2),
    };
  } catch (err) {
    console.error("", err.message);
  }
};
