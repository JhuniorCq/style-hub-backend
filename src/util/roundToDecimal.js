export const roundToDecimals = (number, decimals) => {
  const factor = Math.pow(10, decimals);
  return Math.round(number * factor) / factor;
};
