import { pool } from "../config/db.js";

export class ProductModel {
  static async getProducts({}) {
    try {
      const [result] = await pool.query(`
          SELECT id_product AS id, show_quantity AS showQuantity, pw.name, price, description, image, c.name AS category
          FROM product p
          INNER JOIN product_warehouse pw ON p.id_product_warehouse = pw.id_product_warehouse
          INNER JOIN category c ON pw.id_category = c.id_category
        `);

      return result;
    } catch (err) {
      console.error("Error en getProducts en product.model.js", err.message);
      throw err;
    }
  }

  static async getProduct({}) {
    try {
    } catch (err) {
      console.error("Error en getProduct en product.model.js", err.message);
      throw err;
    }
  }

  static async getProductShowQuantity({ id }) {
    try {
      const [result] = await pool.query(
        "SELECT show_quantity FROM product WHERE id_product = ?",
        [id]
      );

      return {
        showQuantity: result[0].show_quantity,
      };
    } catch (err) {
      console.error(
        "Error en getProductShowQuantity en product.model.js",
        err.message
      );
      throw err;
    }
  }

  static async createProduct({ productData }) {
    let connection;

    try {
      // Obtenemos una conexión del pool para hacer la Transacción
      connection = await pool.getConnection();

      const { showQuantity, idProductWarehouse } = productData;

      // Validar que el idProductWarehouse EXISTE
      const [selectProductWarehouse] = await connection.query(
        "SELECT quantity FROM product_warehouse WHERE id_product_warehouse = ?",
        [idProductWarehouse]
      );

      // Si el idProductWarehouse no existe lanzamos un error
      if (selectProductWarehouse.length === 0) {
        const error = new Error(
          `El idProductWarehouse: ${idProductWarehouse} no existe.`
        );
        error.statusCode = 404;
        throw error;
      }

      const quantityProductWarehouse = selectProductWarehouse[0].quantity;

      // Obtenemos el nuevo quantity del producto de la Tabla product_warehouse
      const newQuantityProductWarehouse =
        quantityProductWarehouse - showQuantity;

      if (newQuantityProductWarehouse < 0) {
        const error = new Error(
          `La cantidad deseada "${showQuantity}" del producto a mostrar supera la a la cantidad disponible "${quantityProductWarehouse}" en el almacén.`
        );

        error.statusCode = 422;
        throw error;
      }

      await connection.beginTransaction();

      // Insertamos los datos en la tabla product
      const [insertProduct] = await connection.query(
        "INSERT INTO product (show_quantity, id_product_warehouse) VALUES (?, ?)",
        [showQuantity, idProductWarehouse]
      );

      if (insertProduct.affectedRows === 0) {
        const error = new Error(
          "Error al insertar un producto en la tabla product"
        );
        error.statusCode = 500;
        throw error;
      }

      // Actualizamos el quantity del producto de la Tabla product_warehouse
      const [updateProductWarehouse] = await connection.query(
        "UPDATE product_warehouse SET quantity = ? WHERE id_product_warehouse = ?",
        [newQuantityProductWarehouse, idProductWarehouse]
      );

      if (updateProductWarehouse.affectedRows === 0) {
        const error = new Error(
          "Error al actualizar el quantity de la Tabla product_warehouse"
        );
        error.statusCode = 500;
        throw error;
      }

      // Confirmar los cambios
      await connection.commit();

      return `El producto ${idProductWarehouse} del almacén se insertó exitosamente en la Tabla product.`;
    } catch (err) {
      if (connection) {
        await connection.rollback();
      }

      console.error("Error en createProduct en product.model.js", err.message);
      throw err;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  static async partiallyUpdateProduct({}) {
    try {
    } catch (err) {
      console.error(
        "Error en partiallyUpdateProduct en product.model.js",
        err.message
      );
      throw err;
    }
  }

  static async fullyUpdateProduct({}) {
    try {
    } catch (err) {
      console.error(
        "Erro en fullyUpdateProduct en product.model.js",
        err.message
      );
      throw err;
    }
  }

  static async deleteProduct({}) {
    try {
    } catch (err) {
      console.error("Erro en deleteProduct en product.model.js", err.message);
      throw err;
    }
  }
}
