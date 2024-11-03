import { pool } from "../config/db.js";
import {
  DELIVERY_OPTIONS,
  ORDER_STATES,
  PAYMENT_OPTIONS,
  SHIPPING_COST,
} from "../util/constants.js";
import { findAmountTotal } from "../util/logic.js";

export class OrderModel {
  static async getOrders({}) {
    try {
    } catch (err) {
      console.error("Error en getOrders en order.controller.js", err.message);
      throw err;
    }
  }

  static async createOrder({ productList, checkoutData }) {
    let connection;
    try {
      // Obtenemos una conexión del pool
      connection = await pool.getConnection();

      for (const product of productList) {
        // Verificamos la existencia de los productos
        const [productSelect] = await pool.query(
          "SELECT show_quantity FROM product WHERE id_product = ?",
          [product.id]
        );

        // Si no existe el producto lanzamos un error
        if (productSelect.length === 0) {
          const error = new Error(`El producto "${product.name}" no existe.`);
          error.statusCode = 404;

          throw error;
        }

        // Comprabamos que la cantidad solicitada está permitida
        const newQuantityShowProduct =
          productSelect.show_quantity - product.quantity;

        if (newQuantityShowProduct < 0) {
          const error = new Error(
            `La cantidad solicitada "${product.quantity}" del producto "${product.name}" supera el stock permitido "${productSelect.show_quantity}"`
          );

          error.statusCode = 422;
          throw error;
        }
      }

      // Iniciamos la Transacción
      await connection.beginTransaction();

      // Insertamos datos del comprador
      let insertCustomer;
      [insertCustomer] = await connection.query(
        "INSERT INTO customer (first_name, last_name, dni, cell_phone, email) VALUES (?, ?, ?, ?, ?)",
        [
          checkoutData.firstName,
          checkoutData.lastName,
          checkoutData.dni,
          checkoutData.cellPhone,
          checkoutData.email,
        ]
      );
      // if (checkoutData.paymentOption === PAYMENT_OPTIONS.PAYPAL) {
      //   // Dato: Para este entonces ya debe estar validado que las opciones de PAGO solo son TRES
      //   [insertCustomer] = await connection.query(
      //     "INSERT INTO customer (first_name, last_name, dni, cell_phone, email, name_paypal, email_paypal)",
      //     [
      //       checkoutData.firstName,
      //       checkoutData.lastName,
      //       checkoutData.dni,
      //       checkoutData.cellPhone,
      //       checkoutData.email,
      //       checkoutData,
      //     ]
      //   );
      // } else {
      //   // Inserción si el Tipo de Pago es por "Yape" o "Depósito"
      //   [insertCustomer] = await connection.query(
      //     "INSERT INTO customer (first_name, last_name, dni, cell_phone, email) VALUES (?, ?, ?, ?, ?)",
      //     [
      //       checkoutData.firstName,
      //       checkoutData.lastName,
      //       checkoutData.dni,
      //       checkoutData.cellPhone,
      //       checkoutData.email,
      //     ]
      //   );
      // }

      if (insertCustomer.affectedRows === 0) {
        const error = new Error(
          "Error al insertar un clinete en la tabla customer"
        );
        error.statusCode = 500;

        throw error;
      }

      // Insertamos la ubicación de envío del pedido
      if (checkoutData.deliveryOption === DELIVERY_OPTIONS.SHIPPING) {
        const [insertLocation] = await connection.query(
          "INSERT INTO location (address, district, province, department, country, id_customer) VALUES (?, ?, ?, ?, ?, ?)",
          [
            checkoutData.address,
            checkoutData.district,
            checkoutData.province,
            checkoutData.department,
            checkoutData.country,
            insertCustomer.insertId,
          ]
        );

        if (insertLocation.affectedRows === 0) {
          const error = new Error(
            "Error al insertar los datos de la ubicación del pedido en la tabla location"
          );
          error.statusCode = 500;

          throw error;
        }
      }

      // Insertamos los datos del pedido
      const [insertOrder] = await connection.query(
        "INSERT INTO order_customer (id_order, order_date, status, delivery_type, id_customer) VALUES (?, ?, ?, ?, ?)",
        [
          checkoutData.idOrder,
          checkoutData.orderDate,
          ORDER_STATES.PENDING,
          checkoutData.deliveryOption,
          insertCustomer.insertId,
        ]
      );

      if (insertOrder.affectedRows === 0) {
        const error = new Error(
          "Error al insertar los datos del pedido en la tabla order_customer"
        );
        error.statusCode = 500;

        throw error;
      }

      // Obtenemos el Monto Total a pagar
      let amountTotal = findAmountTotal(productList);

      if (checkoutData.deliveryOption === DELIVERY_OPTIONS.SHIPPING) {
        amountTotal += SHIPPING_COST;
      }

      // Insertamos los datos del pago
      const [insertPayment] = await connection.query(
        "INSERT INTO payment (id_payment, amount, payment_type, id_order) VALUES (?, ?, ?, ?)",
        [
          checkoutData.idPayment,
          amountTotal,
          checkoutData.paymentOption,
          checkoutData.idOrder,
        ]
      );

      if (insertPayment.affectedRows === 0) {
        const error = new Error(
          "Error al insertar los datos del pago en la tabla payment"
        );
        error.statusCode = 500;

        throw error;
      }

      // Insertamos los detalles del pedido
      for (const product of productList) {
        const [insertOrderDetails] = await connection.query(
          "INSERT INTO order_details (quantity, unit_price, id_order, id_product) VALUES (?, ?, ?, ?)",
          [product.quantity, product.price, checkoutData.idOrder, product.id]
        );

        if (insertOrderDetails.affectedRows === 0) {
          const error = new Error(
            "Error al insertar los detalles del pedido en la tabla order_details"
          );
          error.statusCode = 500;

          throw error;
        }

        // Actualizamos el show_quantity del producto de la tabla product (Este SELECT se repite en el for de arriba, tal vez se puede mejorar)
        const [productSelect] = await connection.query(
          "SELECT show_quantity FROM product WHERE id_product = ?",
          [product.id]
        );

        const newQuantityShowProduct =
          productSelect[0].show_quantity - product.quantity;

        const [updateProduct] = await connection.query(
          "UPDATE product SET show_quantity = ? WHERE id_product = ?",
          [newQuantityShowProduct, product.id]
        );

        if (updateProduct.affectedRows === 0) {
          const error = new Error(
            `Error al actualizar la nueva cantidad a mostrar del producto "${product.name}"`
          );
          error.statusCode = 500;

          throw error;
        }
      }

      // Confirmamos los cambios
      await connection.commit();

      // return `El pedido N° ${checkoutData.idOrder} ha sido insertado exitosamente.`;
      const responseCheckoutData = {
        ...checkoutData,
      };

      delete responseCheckoutData.idOrder;
      delete responseCheckoutData.idPayment;

      return {
        productList,
        checkoutData: responseCheckoutData,
      };
    } catch (err) {
      // Revertimos los cambios
      if (connection) {
        await connection.rollback();
      }

      console.error("Error en createOrder en order.controller.js", err.message);
      throw err;
    } finally {
      if (connection) {
        // Liberamos la conexión
        connection.release();
      }
    }
  }
}
