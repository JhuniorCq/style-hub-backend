import { pool } from "../config/db.js";

export class ProductModel {
  static async getProducts({}) {
    try {
      const [result] = await pool.query("SELECT * FROM product");

      return result;
    } catch (err) {
      console.error("Error en getProducts en product.model.js", err.message);
      throw err;
    }
  }

  static async getProduct({}) {
    try {
    } catch (err) {
      console.error("Error en getProduct en product.model.js"), err.message;
      throw err;
    }
  }

  // Con este método CREAMOS un Producto en la Tabla "product", el cual tendrá una cantidad específica, pero para aumentar o disminuir esa cantidad manualmente, hay otros métodos
  static async createProduct({ productData }) {
    let connection;

    try {
      // Obtenemos una conexión del pool para hacer la Transacción
      connection = await pool.getConnection();

      const { showQuantity, idProductWarehouse } = productData;

      // Validar que el idProductWarehouse EXISTE
      const [selectProductWarehouse] = await connection.query(
        "SELECT id_product_warehouse, quantity FROM product_warehouse WHERE id_product_warehouse = ?",
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

      console.log(selectProductWarehouse);

      // Obtenemos el quantity del producto de la Tabla product_warehouse -> Para este entonces ya sabemos que idProductWarehouse SÍ existe
      const quantityProductWarehouse = selectProductWarehouse[0].quantity;

      // Obtenemos el nuevo quantity del produco de la Tabla product_warehouse
      const newQuantityProductWarehouse =
        quantityProductWarehouse - showQuantity;

      if (newQuantityProductWarehouse < 0) {
        const error = new Error(
          `La cantidad deseada "${showQuantity}" del producto a mostrar supera la a la cantidad disponible "${quantityProductWarehouse}" en el almacén.`
        );

        error.statusCode = 422;
        throw error;
      }

      // Iniciar la Transacción -> Es más eficiente para la Transacción que empiece acá, ya que las Operación Anterior (el SELECT) NO modifica la BD, solo consulta datos
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

      console.log(
        `En el almacén hay ${quantityProductWarehouse}, y pondré ${showQuantity} unidades en la tienda, quedando en el almacén: ${newQuantityProductWarehouse}`
      );

      return `El producto ${idProductWarehouse} del almacén se insertó exitosamente en la Tabla product.`;
    } catch (err) {
      // Revertir cambios en caso de error (El if es por si NO se obtiene una conexión y salta un ERROR, así cuando se entre el catch por el error, NO haremos un callback a un connection que no existe)
      if (connection) {
        await connection.rollback();
      }

      console.error("Error en createProduct en product.model.js", err.message);
      throw err;
    } finally {
      // Si al inicio se obtuvo correctamente la conexión -> La liberamos luego de finalizar la Transacción
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
