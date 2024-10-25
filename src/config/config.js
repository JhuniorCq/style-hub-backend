// PUERTO DEL SERVIDOR
export const PORT = process.env.PORT ?? 1234;

// HOST DEL SERVIDOR LOCAL
export const HOST = `http://localhost:${PORT}`;

// CREDENCIALES PAYPAL
export const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
export const PAYPAL_KEY_SECRET = process.env.PAYPAL_KEY_SECRET;

// API PARA DESARROLLO - PAYPAL
export const PAYPAL_API = "https://api-m.sandbox.paypal.com";

// API PARA PRODUCCIÓN - PAYPAL
// export const PAYPAL_API = "https://api-m.paypal.com";

// API KEY - EXCHANGERATE
export const EXCHANGERATE_KEY_SECRET = process.env.EXCHANGERATE_KEY_SECRET;

// API EXCHANGERATE
export const EXCHANGERATE_API = `https://v6.exchangerate-api.com/v6/${EXCHANGERATE_KEY_SECRET}/latest/PEN`;
console.log(
  process.env.EXCHANGERATE_KEY_SECRET,
  " ",
  EXCHANGERATE_KEY_SECRET,
  " ",
  EXCHANGERATE_API
);
