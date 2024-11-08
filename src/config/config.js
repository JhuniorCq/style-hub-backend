// PUERTO DEL SERVIDOR
export const PORT = process.env.PORT ?? 1234;

// HOST DEL SERVIDOR LOCAL
export const HOST = `http://localhost:${PORT}`;

// HOST DEL CLIENTE LOCAL
export const HOST_CLIENT = `http://localhost:5173`;

// DATOS PARA LA BD
export const DB_HOST = process.env.DB_HOST;
export const DB_USER = process.env.DB_USER;
export const DB_PASSWORD = process.env.DB_PASSWORD;
export const DB_DATABASE = process.env.DB_DATABASE;
export const DB_PORT = process.env.DB_PORT;

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
