const express = require("express");
const jwt = require("jsonwebtoken");
const { client } = require("./db");
// Create Express router
const productRoutes = express.Router();

productRoutes.get("/products", async (req, res, next) => {
  try {
    // SQL query to fetch all products
    const SQL = `
        SELECT * FROM products;
    `;
    const response = await client.query(SQL);

    // Send the products
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

// Route to add a new product
productRoutes.post("/products", async (req, res, next) => {
  try {
    // Extract product details from request body
    const { name, category, price, details, quantity, image, sellerId } =
      req.body;

    // If any field is not provided, send an error message
    if (
      !name ||
      !category ||
      !price ||
      !details ||
      !quantity ||
      !image ||
      !sellerId
    ) {
      throw new Error("All fields are required");
    }

    // SQL query to insert the new product into the database
    const newProduct = await client.query(
      "INSERT INTO products(name, category, price, details, quantity, image, seller_id) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [name, category, price, details, quantity, image, sellerId]
    );

    // Send the new product
    res.status(201).json(newProduct.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Route to update a product
productRoutes.put("/products/:productId", async (req, res, next) => {
  try {
    // Extract product details from request body
    const { name, category, price, details, quantity, image, sellerId } =
      req.body;
    const { productId } = req.params;

    // If any field is not provided, send an error message
    if (
      !name ||
      !category ||
      !price ||
      !details ||
      !quantity ||
      !image ||
      !sellerId
    ) {
      throw new Error("All fields are required");
    }

    // SQL query to update the product in the database
    const updatedProduct = await client.query(
      "UPDATE products SET name = $1, category = $2, price = $3, details = $4, quantity = $5, image = $6, seller_id = $7 WHERE id = $8 RETURNING *",
      [name, category, price, details, quantity, image, sellerId, productId]
    );

    // Send the updated product
    res.json(updatedProduct.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Route to fetch a product by id
productRoutes.get("/products/:item_id", async (req, res, next) => {
  try {
    // Extract the product id from request parameters
    const { item_id } = req.params;

    // SQL query to fetch the product by id
    const SQL = `
        SELECT * FROM products
        WHERE id = $1;
        `;
    const response = await client.query(SQL, [item_id]);

    // Send the product
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Route to fetch all products of a user
productRoutes.get("/products/user/:user_id", async (req, res, next) => {
  try {
    // Extract the user id from request parameters
    const { user_id } = req.params;

    // SQL query to fetch all products of a user
    const SQL = `
    SELECT * FROM products
    WHERE seller_id = $1;
    `;
    const response = await client.query(SQL, [user_id]);

    // Send the products
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});
// Route to fetch the user's orders
productRoutes.get("/orders/:user_id", async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const SQL = `
      SELECT * FROM orders
      WHERE user_id = $1;
    `;
    const response = await client.query(SQL, [user_id]);

    // If no orders are found, return an empty array
    if (response.rows.length === 0) {
      res.json([]);
    } else {
      res.json(response.rows);
    }
  } catch (error) {
    next(error);
  }
});

// Error handling middleware
productRoutes.use((err, req, res, next) => {
  console.error(err.stack); // Log error stack to console
  res.status(500).send({ success: false, message: "Something went wrong!" });
});

module.exports = productRoutes;
