import { pool } from "../config/db.js";

export class ProductWarehouseModel {
  static async getProducts({}) {
    try {
      const [result] = await pool.query("SELECT * FROM product_warehouse");

      return result;
    } catch (err) {
      console.error(
        "Error en getProducts en productWarehouse.model.js",
        err.message
      );
      throw err;
    }
  }

  static async getProduct({}) {
    try {
    } catch (err) {
      console.error("Error en getProduct en productWarehouse.model.js"),
        err.message;
      throw err;
    }
  }

  static async createProduct({ productData }) {
    // Para este caso NO es necesario una Transacción
    try {
      const { name, price, description, idCategory, image, quantity } =
        productData;

      console.log("POST: ", price, typeof price);

      // Verificar existencia de la categoría
      const [selectCategory] = await pool.query(
        "SELECT id_category FROM category WHERE id_category = ?",
        [idCategory]
      );

      // Lanzar error si no existe la categoría
      if (selectCategory.length === 0) {
        const error = new Error(`El ${idCategory} no existe.`);
        error.statusCode = 404;
        throw error;
      }

      console.log(selectCategory);

      // Insertar datos en Product
      const [insertProduct] = await pool.query(
        "INSERT INTO product_warehouse (name, price, description, id_category, image, quantity) VALUES (?, ?, ?, ?, ?, ?)",
        [name, price, description, idCategory, image, quantity]
      );

      console.log(insertProduct);

      // Lanzar error si no se hizo alguna inserción
      if (insertProduct.affectedRows === 0) {
        const error = new Error("Error al realizar la inserción del producto.");
        error.statusCode = 500;
        throw error;
      }

      // return `El producto "${name}" ha sido insertado con éxito en el almacén.`;
      return {
        message: "Producto insertado en el almacén",
        dataInsert: insertProduct,
      };
    } catch (err) {
      console.error(
        "Error en createProduct en productWarehouse.model.js",
        err.message
      );
      throw err;
    }
  }

  static async partiallyUpdateProduct({}) {
    try {
    } catch (err) {
      console.error(
        "Error en partiallyUpdateProduct en productWarehouse.model.js",
        err.message
      );
      throw err;
    }
  }

  static async fullyUpdateProduct({}) {
    try {
    } catch (err) {
      console.error(
        "Erro en fullyUpdateProduct en productWarehouse.model.js",
        err.message
      );
      throw err;
    }
  }

  static async deleteProduct({}) {
    try {
    } catch (err) {
      console.error(
        "Erro en deleteProduct en productWarehouse.model.js",
        err.message
      );
      throw err;
    }
  }
}
