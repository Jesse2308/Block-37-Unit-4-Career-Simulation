const express = require("express");
const client = require("./db");

// Create Express router
const cartRoutes = express.Router();

// SQL queries for cart operations
const INSERT_INTO_CART = `
  INSERT INTO cart (user_id, product_id, quantity)
  VALUES ($1, $2, $3)
  RETURNING *;
`;

const SELECT_FROM_CART = `
  SELECT * FROM cart
  WHERE user_id = $1;
`;

const DELETE_FROM_CART = "DELETE FROM cart WHERE user_id = $1";

// SQL query to delete an item from the cart
const DELETE_ITEM_FROM_CART = `
  DELETE FROM cart
  WHERE user_id = $1 AND product_id = $2;
`;

// Route to add an item to the cart
cartRoutes.post("/api/cart/:userId", async (req, res, next) => {
  try {
    const { user_id, product_id } = req.body;
    if (!user_id || !product_id) {
      res
        .status(400)
        .send({ success: false, message: "Missing user_id or product_id" });
      return;
    }
    const newCartItem = await client.query(
      INSERT_INTO_CART,
      [user_id, product_id, 1] // Assuming quantity is 1
    );
    res.status(201).json(newCartItem.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Route to get a user's cart
cartRoutes.get("/api/cart/:user_id", async (req, res, next) => {
  try {
    // Extract user_id from request parameters
    const { user_id } = req.params;

    // SQL query to fetch the user's cart
    const SQL = `
        SELECT * FROM cart
        WHERE user_id = $1;
        `;
    const response = await client.query(SQL, [user_id]);

    // Send the cart
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

// Route to update a user's cart
cartRoutes.put("/api/cart/:user_id", async (req, res, next) => {
  try {
    const { user_id, cart } = req.body;
    if (!user_id || !cart) {
      res
        .status(400)
        .send({ success: false, message: "Missing user_id or cart" });
      return;
    }
    // Assuming cart is an array of { product_id, quantity }
    for (let item of cart) {
      await client.query(
        "UPDATE cart SET quantity = $1 WHERE user_id = $2 AND product_id = $3",
        [item.quantity, user_id, item.product_id]
      );
    }
    const updatedCart = await client.query(SELECT_FROM_CART, [user_id]);
    res.status(200).json(updatedCart.rows);
  } catch (err) {
    next(err);
  }
});

// Route to remove an item from the cart
cartRoutes.delete("/api/cart/:user_id/:product_id", async (req, res, next) => {
  try {
    // Extract user_id and product_id from request parameters
    const { user_id, product_id } = req.params;

    // Check if user_id and product_id are provided
    if (!user_id || !product_id) {
      res
        .status(400)
        .send({ success: false, message: "Missing user_id or product_id" });
      return;
    }

    // SQL query to delete the item from the cart
    const deletedCartItem = await client.query(
      "DELETE FROM cart WHERE user_id = $1 AND product_id = $2 RETURNING *",
      [user_id, product_id]
    );

    // Send the deleted item
    res.status(200).json(deletedCartItem.rows[0]);
  } catch (err) {
    next(err);
  }
});
//Error handling middleware
cartRoutes.use((err, req, res, next) => {
  // Log the error stack trace to the console
  console.error(err.stack);

  // If the environment is development, send the error message and stack trace, else send
  // only the error message
  if (process.env.NODE_ENV === "development") {
    res.status(500).send({ error: err.message, stack: err.stack });
  } else {
    res.status(500).send({ error: err.message });
  }
});
module.exports = cartRoutes;
