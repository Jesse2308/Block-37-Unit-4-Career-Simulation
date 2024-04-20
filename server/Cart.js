const express = require("express");
const cartRoutes = express.Router();
const { client } = require("./db");

// SQL query to insert a new item into the cart
const INSERT_INTO_CART = `
  WITH upsert AS (
    UPDATE cart_item 
    SET quantity = quantity + $3
    WHERE cart_id = (SELECT id FROM cart WHERE user_id = $1) AND product_id = $2
    RETURNING *
  )
  INSERT INTO cart_item (cart_id, product_id, quantity)
  SELECT (SELECT id FROM cart WHERE user_id = $1), $2, $3
  WHERE NOT EXISTS (SELECT * FROM upsert)
  RETURNING *;
`;

// SQL query to select all items from the cart for a specific user
const SELECT_FROM_CART = `
  SELECT cart_item.id, cart_item.cart_id, cart_item.product_id, cart_item.quantity,
         products.name, products.category, products.price, products.description,
         products.image, products.stock
  FROM cart_item
  JOIN products ON cart_item.product_id = products.id
  JOIN cart ON cart_item.cart_id = cart.id
  WHERE cart.user_id = $1;
`;

// SQL query to delete an item from the cart
const DELETE_ITEM_FROM_CART = `
  DELETE FROM cart_item
  WHERE cart_id = (SELECT id FROM cart WHERE user_id = $1) AND product_id = $2;
`;

// SQL query to update an item in the cart
const UPDATE_CART_ITEM = `
  UPDATE cart_item
  SET quantity = $3
  WHERE cart_id = (SELECT id FROM cart WHERE user_id = $1) AND product_id = $2
  RETURNING *;
`;

// Route to add an item to the cart
cartRoutes.post("/cart/:user_id", async (req, res, next) => {
  try {
    // Parse user_id, product_id, and quantity from the request
    const user_id = Number(req.params.user_id);
    const product_id = Number(req.body.product_id);
    const quantity = Number(req.body.quantity);

    // If any of the parsed values are not numbers, send a 400 status code and an error message
    if (isNaN(user_id) || isNaN(product_id) || isNaN(quantity)) {
      res.status(400).send({
        success: false,
        message: "user_id, product_id and quantity must be numbers",
      });
      return;
    }

    // Insert the new item into the cart and return the inserted item
    const newCartItem = await client.query(INSERT_INTO_CART, [
      user_id,
      product_id,
      quantity,
    ]);
    res.status(201).json(newCartItem.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Route to delete an item from the cart
cartRoutes.delete("/cart/:user_id/:product_id", async (req, res, next) => {
  try {
    // Parse user_id and product_id from the request
    const user_id = Number(req.params.user_id);
    const product_id = Number(req.params.product_id);

    // If user_id or product_id is not a number, send a 400 status code and an error message
    if (isNaN(user_id) || isNaN(product_id)) {
      res
        .status(400)
        .send({ success: false, message: "Invalid user_id or product_id" });
      return;
    }

    // Delete the item from the cart
    const deletedCartItem = await client.query(DELETE_ITEM_FROM_CART, [
      user_id,
      product_id,
    ]);

    // If no rows were deleted, send a 404 status code and an error message
    if (deletedCartItem.rowCount === 0) {
      res
        .status(404)
        .send({ success: false, message: "Item not found in cart" });
      return;
    }

    // Return the deleted item
    res.status(200).json(deletedCartItem.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Route to update the cart for a specific user and product
cartRoutes.put("/api/cart/:user_id/:product_id", async (req, res, next) => {
  try {
    const user_id = Number(req.params.user_id);
    const product_id = Number(req.params.product_id);
    const quantity = Number(req.body.quantity);

    if (isNaN(user_id) || isNaN(product_id) || isNaN(quantity)) {
      res.status(400).send({
        success: false,
        message: "user_id, product_id and quantity must be numbers",
      });
      return;
    }

    const updatedCartItem = await client.query(UPDATE_CART_ITEM, [
      user_id,
      product_id,
      quantity,
    ]);

    // If no rows were updated, send a 404 status code and an error message
    if (updatedCartItem.rowCount === 0) {
      res
        .status(404)
        .send({ success: false, message: "Item not found in cart" });
      return;
    }

    res
      .status(200)
      .send({ success: true, message: "Cart updated successfully" });
  } catch (err) {
    next(err);
  }
});

// Route to update the cart for a specific user
cartRoutes.put("/api/cart/:user_id", async (req, res, next) => {
  try {
    const user_id = Number(req.params.user_id);
    const cartItems = req.body; // This should be an array of cart items

    if (isNaN(user_id) || !Array.isArray(cartItems)) {
      res.status(400).send({
        success: false,
        message: "user_id must be a number and cartItems must be an array",
      });
      return;
    }

    // Loop through cartItems and update each item in the database
    for (let item of cartItems) {
      const product_id = Number(item.product_id);
      const quantity = Number(item.quantity);

      if (isNaN(product_id) || isNaN(quantity)) {
        res.status(400).send({
          success: false,
          message: "product_id and quantity must be numbers",
        });
        return;
      }

      const updatedCartItem = await client.query(UPDATE_CART_ITEM, [
        user_id,
        product_id,
        quantity,
      ]);

      // If no rows were updated, send a 404 status code and an error message
      if (updatedCartItem.rowCount === 0) {
        res
          .status(404)
          .send({ success: false, message: "Item not found in cart" });
        return;
      }
    }

    res
      .status(200)
      .send({ success: true, message: "Cart updated successfully" });
  } catch (err) {
    next(err);
  }
});

// Route to get all items in the cart for a specific user
cartRoutes.get("/cart/:user_id", async (req, res, next) => {
  try {
    // Parse user_id from the request
    const user_id = Number(req.params.user_id);

    // If user_id is not a number, send a 400 status code and an error message
    if (isNaN(user_id)) {
      res.status(400).send({ success: false, message: "Invalid user_id" });
      return;
    }

    // Get all items in the cart for the user and return them
    const cartItems = await client.query(SELECT_FROM_CART, [user_id]);
    res.status(200).json(cartItems.rows);
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = cartRoutes;
