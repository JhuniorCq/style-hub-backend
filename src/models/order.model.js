import { pool } from "../config/db.js";
import {
  DELIVERY_OPTIONS,
  ORDER_STATES,
  PAYMENT_OPTIONS,
  SHIPPING_COST,
} from "../util/constants.js";
import { findAmountTotal } from "../util/logic.js";
import dayjs from "dayjs";

export class OrderModel {
  static async getOrders({ deliveryOption, paymentOption }) {
    try {
      let queryOrder = `
          SELECT 
            oc.id_order AS idOrder,
            c.first_name AS firstName, 
              c.last_name AS lastName,
              c.dni,
              c.cell_phone AS cellPhone,
              c.email,
              c.name_paypal AS namePaypal,
              c.email_paypal AS emailPaypal,
              l.address,
              l.district,
              l.province,
              l.department,
              l.country,
              oc.order_date AS orderDate,
              oc.status,
              oc.delivery_type AS deliveryOption,
              p.amount,
              p.payment_type AS paymentOption
          FROM order_customer oc 
          INNER JOIN customer c ON oc.id_customer = c.id_customer
          LEFT JOIN location l ON c.id_customer = l.id_customer
          INNER JOIN payment p ON oc.id_order = p.id_order
          WHERE 1=1
      `;

      const params = [];

      // Filtro en base al Tipo de Entrega
      if (deliveryOption) {
        queryOrder += "AND LOWER(oc.delivery_type) = LOWER(?)";
        params.push(deliveryOption);
      }

      // Filtro en base al Tipo de Pago
      if (paymentOption) {
        queryOrder += "AND LOWER(p.payment_type) = LOWER(?)";
        params.push(paymentOption);
      }

      // Ordenamiento Ascendente por defecto (en base a la fecha de creación del pedido)
      queryOrder += "ORDER BY oc.order_date";

      // Obtener la orden
      const [orders] = await pool.query(queryOrder, params);

      // Obtener la orden completa (con cada producto en cada orden)
      for (const order of orders) {
        const { idOrder, orderDate, deliveryOption, paymentOption } = order;

        // Formatear la fecha
        const unformattedDate = dayjs(orderDate);
        const formattedDate = unformattedDate.format("YYYY-MM-DD HH:mm:ss");
        order.orderDate = formattedDate;

        if (deliveryOption === DELIVERY_OPTIONS.PICK_UP) {
          delete order.address;
          delete order.district;
          delete order.province;
          delete order.department;
          delete order.country;
        }

        if (paymentOption !== PAYMENT_OPTIONS.PAYPAL) {
          delete order.namePaypal;
          delete order.emailPaypal;
        }

        // Asignar los detalles a cada orden
        const [result] = await pool.query(
          `
            SELECT  
              od.id_order_details AS idOrderDetails,
              od.quantity,
              od.unit_price AS unitPrice,
              pw.name,
              ca.name AS category,
              pw.price AS precioOriginalAlmacen
            FROM order_details od
            INNER JOIN product p ON od.id_product = p.id_product
            INNER JOIN product_warehouse pw ON p.id_product_warehouse = pw.id_product_warehouse
            INNER JOIN category ca ON pw.id_category = ca.id_category
            WHERE id_order = ?
        `,
          [idOrder]
        );

        order.productList = result;
      }

      return orders;
    } catch (err) {
      console.error("Error en getOrders en order.controller.js", err.message);
      throw err;
    }
  }

  static async getOrder({ id }) {
    try {
      // Obtener la orden
      const [selectOrder] = await pool.query(
        `
          SELECT 
            oc.id_order AS idOrder,
            c.first_name AS firstName, 
              c.last_name AS lastName,
              c.dni,
              c.cell_phone AS cellPhone,
              c.email,
              c.name_paypal AS namePaypal,
              c.email_paypal AS emailPaypal,
              l.address,
              l.district,
              l.province,
              l.department,
              l.country,
              oc.order_date AS orderDate,
              oc.status,
              oc.delivery_type AS deliveryOption,
              p.amount,
              p.payment_type AS paymentOption
          FROM order_customer oc 
          INNER JOIN customer c ON oc.id_customer = c.id_customer
          LEFT JOIN location l ON c.id_customer = l.id_customer
          INNER JOIN payment p ON oc.id_order = p.id_order
          WHERE oc.id_order = ?
        `,
        [id]
      );

      if (selectOrder.length === 0) {
        const error = new Error("El pedido no existe.");
        error.statusCode = 404;
        throw error;
      }

      const order = selectOrder[0];

      const { orderDate, deliveryOption, paymentOption } = order;

      // Formatear la fecha
      const unformattedDate = dayjs(orderDate);
      const formattedDate = unformattedDate.format("YYYY-MM-DD HH:mm:ss");
      order.orderDate = formattedDate;

      if (deliveryOption === DELIVERY_OPTIONS.PICK_UP) {
        delete order.address;
        delete order.district;
        delete order.province;
        delete order.department;
        delete order.country;
      }

      if (paymentOption !== PAYMENT_OPTIONS.PAYPAL) {
        delete order.namePaypal;
        delete order.emailPaypal;
      }

      // Obtener la orden completa
      const [selectOrderDetails] = await pool.query(
        `
        SELECT
          p.id_product AS id,
          od.quantity,
          od.unit_price AS price,
          pw.name,
          pw.image,
          ca.name AS category,
          pw.price AS precioOriginalAlmacen
        FROM order_details od
        INNER JOIN product p ON od.id_product = p.id_product
        INNER JOIN product_warehouse pw ON p.id_product_warehouse = pw.id_product_warehouse
        INNER JOIN category ca ON pw.id_category = ca.id_category
        WHERE id_order = ?
      `,
        [id]
      );

      order.productList = selectOrderDetails;

      // return order;
      return {
        success: true,
        data: order,
      };
    } catch (err) {
      console.error("Error en getOrder en order.model.js");
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

        // Comprobamos que la cantidad solicitada está permitida
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
      const [insertCustomer] = await connection.query(
        "INSERT INTO customer (first_name, last_name, dni, cell_phone, email, name_paypal, email_paypal) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          checkoutData.firstName,
          checkoutData.lastName,
          checkoutData.dni,
          checkoutData.cellPhone,
          checkoutData.email,
          "-",
          "-",
        ]
      );

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
      }

      // Confirmamos los cambios
      await connection.commit();

      const responseCheckoutData = {
        ...checkoutData,
      };

      responseCheckoutData.productList = productList;
      delete responseCheckoutData.idPayment;

      return {
        success: true,
        data: responseCheckoutData,
      };
    } catch (err) {
      // Revertimos los cambios
      if (connection) {
        await connection.rollback();
      }

      console.error("Error en createOrder en order.model.js", err.message);
      throw err;
    } finally {
      if (connection) {
        // Liberamos la conexión
        connection.release();
      }
    }
  }

  static async deleteOrder({ id }) {
    let connection;
    try {
      // Obtenemos una conexión del pool
      connection = await pool.getConnection();

      const [selectOrder] = await connection.query(
        "SELECT id_customer, delivery_type FROM order_customer WHERE id_order = ?",
        [id]
      ); // Uso del connection en el SELECT para ahorrar recursos

      if (selectOrder.length === 0) {
        const error = new Error(`El pedido "${id}" no existe.`);
        error.statusCode = 404;

        throw error;
      }

      // Obtenemos el id_customer del pedido
      const { id_customer: idCustomer, delivery_type: deliveryOption } =
        selectOrder[0];

      // Iniciamos la Transacción
      await connection.beginTransaction();

      // Eliminamos los datos de order_details
      const [deleteOrderDetails] = await connection.query(
        "DELETE FROM order_details WHERE id_order = ?",
        [id]
      );

      if (deleteOrderDetails.affectedRows === 0) {
        const error = new Error("No se eliminaron los datos de order_details");
        error.statusCode = 500;
        throw error;
      }

      // Eliminamos los datos de payment
      const [deletePayment] = await connection.query(
        "DELETE FROM payment WHERE id_order = ?",
        [id]
      );

      if (deletePayment.affectedRows === 0) {
        const error = new Error("No se eliminaron los datos de payment");
        error.statusCode = 500;
        throw error;
      }

      // Eliminamos los datos de order
      const [deleteOrder] = await connection.query(
        "DELETE FROM order_customer WHERE id_order = ?",
        [id]
      );

      if (deleteOrder.affectedRows === 0) {
        const error = new Error("No se eliminaron los datos de order");
        error.statusCode = 500;
        throw error;
      }

      if (deliveryOption === DELIVERY_OPTIONS.SHIPPING) {
        // Eliminamos los datos de location
        const [deleteLocation] = await connection.query(
          "DELETE FROM location WHERE id_customer = ?",
          [idCustomer]
        );

        if (deleteLocation.affectedRows === 0) {
          const error = new Error("No se eliminaron los datos de location");
          error.statusCode = 500;
          throw error;
        }
      }

      // Eliminamos los datos de customer
      const [deleteCustomer] = await connection.query(
        "DELETE FROM customer WHERE id_customer = ?",
        [idCustomer]
      );

      if (deleteCustomer.affectedRows === 0) {
        const error = new Error("No se eliminaron los datos de customer");
        error.statusCode = 500;
        throw error;
      }

      // Confirmamos los cambios
      await connection.commit();

      return `Se ha eliminado exitosamente el pedido con ID "${id}"`;
    } catch (err) {
      if (connection) {
        // Revertimos los cambios
        await connection.rollback();
      }

      console.error("Error en deleteOrder en order.model.js", err.message);
      throw err;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  static async deletePendingOrders({ hours }) {
    try {
      const [oldOrders] = await pool.query(
        `
        SELECT id_order FROM order_customer
        WHERE status = 'pending' AND order_date + INTERVAL ? HOUR <= NOW()
      `,
        [hours]
      );

      if (oldOrders.length === 0) {
        return;
      }

      for (const order of oldOrders) {
        try {
          await this.deleteOrder({ id: order.id_order });
        } catch (err) {
          console.error(
            "Error eliminando el pedido ID ${order.id_order}. Continuando... ",
            err.message
          );
        }
      }
    } catch (err) {
      console.error(
        "Error en deletePendingOrder en order.model.js",
        err.message
      );
    }
  }
}
