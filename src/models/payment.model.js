import { pool } from "../config/db.js";
import { ORDER_STATES } from "../util/constants.js";

export class PaymentModel {
  static async updateOrder({ idOrder, namePaypal, emailPaypal }) {
    let connection;
    try {
      // Obtenemos una conexión del pool de conexions
      connection = await pool.getConnection();

      // Iniciamos la transacción
      await connection.beginTransaction();

      // Actualizamos el pedido de "Pendiente" a "Pagado"
      const [updateStatusOrder] = await connection.query(
        "UPDATE order_customer SET status = ? WHERE id_order = ?",
        [ORDER_STATES.PAID, idOrder]
      );

      // Creamos un error personalizado
      if (updateStatusOrder.affectedRows === 0) {
        const error = new Error(
          "El pedido ha sido pagado exitosamente, pero no se ha podido actualizar su estado."
        );

        error.statusCode = 500;
        throw error;
      }

      // Obtenemos el id_customer
      const [selectIdCustomer] = await connection.query(
        "SELECT id_customer FROM order_customer WHERE id_order = ?",
        [idOrder]
      );

      if (selectIdCustomer.length === 0) {
        const error = new Error(
          "No se encontró un id_customer asociado a este id_order"
        );

        error.statusCode = 404;
        throw error;
      }

      // Actualizamos name_paypal y email_paypal en la tabla customer
      const [updateCustomer] = await connection.query(
        "UPDATE customer SET name_paypal = ?, email_paypal = ? WHERE id_customer = ?",
        [namePaypal, emailPaypal, selectIdCustomer[0].id_customer]
      );

      if (updateCustomer.affectedRows === 0) {
        const error = new Error(
          "El pedido ha sido pagado exitosamente, pero no se ha podido actualizar name_paypal ni email_paypal."
        );

        error.statusCode = 500;
        throw error;
      }

      // Confirmamos la transacción
      await connection.commit();

      return "Se actualizaron correctamos los datos del pedido";
    } catch (err) {
      if (connection) {
        await connection.rollback();
      }
      console.error("Error en updateOrder en payment.model.js", err.message);
      throw err;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
}
