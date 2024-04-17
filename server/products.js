const express = require("express");
const jwt = require("jsonwebtoken");
const { client } = require("./db");
// Create Express router
const productRoutes = express.Router();

// Route to fetch all products
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
    const { name, price } = req.body;

    // If name or price is not provided, send an error message
    if (!name || !price) {
      throw new Error("Invalid name or price");
    }

    // SQL query to insert the new product into the database
    const newProduct = await client.query(
      "INSERT INTO products(name, price) VALUES($1, $2) RETURNING *",
      [name, price]
    );

    // Send the new product
    res.status(201).json(newProduct.rows[0]);
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
