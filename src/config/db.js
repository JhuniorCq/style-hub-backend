import mysql from "mysql2/promise";
import {
  DB_DATABASE,
  DB_HOST,
  DB_PASSWORD,
  DB_PORT,
  DB_USER,
} from "./config.js";

const config = {
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  port: DB_PORT,
  // connectionLimit: 10 -> Si no se especifica, por defecto es 10
  decimalNumbers: true,
};

const pool = mysql.createPool(config);

// Función para verificar la conexión a la BD
const verifyConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Conexión exitosa a la Base de Datos.");
    connection.release();
  } catch (err) {
    console.error("Error en la conexión a la Base de Datos", err.message);
  }
};

// Verificando
verifyConnection();

export { pool };
