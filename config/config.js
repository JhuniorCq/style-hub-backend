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
