export const roundToDecimals = (number, decimals) => {
  const factor = Math.pow(10, decimals);
  return Math.round(number * factor) / factor;
};

// SÍ LO USARÉ XD, TENGO QUE HACER QUE EL purchase_units SEA UN ARRAY DE UN OBJETO -> YA LO DEL COSTO POR ENVIO DE AHI VEO COMO LE AGREGO
// export const findAmountTotal = (productList) =>
//   productList.reduce((accumulator, item) => {
//     return accumulator + item.price * item.quantity;
//   }, 0);
