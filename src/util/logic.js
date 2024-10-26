export const roundToDecimals = (number, decimals) => {
  const factor = Math.pow(10, decimals);
  return Math.round(number * factor) / factor;
};

export const findAmountTotal = (productList) =>
  productList.reduce((accumulator, item) => {
    return accumulator + item.price * item.quantity;
  }, 0);
