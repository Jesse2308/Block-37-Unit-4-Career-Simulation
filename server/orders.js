const express = require("express");
const client = require("./db");

// Create Express router
const orderRoutes = express.Router();

// Route to create an order
orderRoutes.post("/api/order", async (req, res, next) => {
  try {
    // Extract user_id from request body
    const { user_id } = req.body;

    // Check if user_id is provided
    if (!user_id) {
      res.status(400).send({ success: false, message: "Missing user_id" });
      return;
    }

    // SQL query to insert the new order into the database
    const newOrder = await client.query(
      "INSERT INTO orders(user_id) VALUES($1) RETURNING *",
      [user_id]
    );

    // Send the new order
    res.status(201).json(newOrder.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Route to fetch a user's orders
orderRoutes.get("/api/orders/:user_id", async (req, res, next) => {
  try {
    // Extract user_id from request parameters
    const { user_id } = req.params;

    // SQL query to fetch the user's orders
    const SQL = `
        SELECT * FROM orders
        WHERE user_id = $1;
        `;
    const response = await client.query(SQL, [user_id]);

    // Send the orders
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

// Route to add a product to an order
orderRoutes.post("/api/order_product", async (req, res, next) => {
  try {
    // Extract order_id and product_id from request body
    const { order_id, product_id } = req.body;

    // Check if order_id and product_id are provided
    if (!order_id || !product_id) {
      res
        .status(400)
        .send({ success: false, message: "Missing order_id or product_id" });
      return;
    }

    // SQL query to insert the new product into the order
    const newOrderProduct = await client.query(
      "INSERT INTO order_products(order_id, product_id) VALUES($1, $2) RETURNING *",
      [order_id, product_id]
    );

    // Send the new order product
    res.status(201).json(newOrderProduct.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Error handling middleware
orderRoutes.use((err, req, res, next) => {
  // Log the error stack trace to the console
  console.error(err.stack);

  // If the environment is development, send the error message and stack trace, else send only the error message
  if (process.env.NODE_ENV === "development") {
    res.status(500).send({ error: err.message, stack: err.stack });
  } else {
    res.status(500).send({ error: err.message });
  }
});
module.exports = orderRoutes;
