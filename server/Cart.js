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
const SELECT_CART_FOR_USER = `
  SELECT cart.id AS cart_id, cart_item.*
  FROM cart_item
  JOIN cart ON cart_item.cart_id = cart.id
  WHERE cart.user_id = $1;
`;

// SQL query to delete an item from the cart
const DELETE_ITEM_FROM_CART = `
  DELETE FROM cart_item
  WHERE cart_id = (SELECT id FROM cart WHERE user_id = $1) AND product_id = $2;
`;

// Updated SQL query to update an item in the cart
const UPDATE_CART_ITEM = `
  UPDATE cart_item
  SET quantity = $3
  WHERE cart_id = (SELECT id FROM cart WHERE user_id = $1) AND product_id = $2
  RETURNING *;
`;

// SQL query to select the items for a specific cart
const SELECT_ITEMS_FOR_CART = `
  SELECT *
  FROM cart_item
  WHERE cart_id = $1;
`;

// Route to add an item to the cart
cartRoutes.post("/users/:user_id/cart", async (req, res, next) => {
  try {
    const user_id = Number(req.params.user_id);
    const product_id = Number(req.body.product_id);
    const quantity = Number(req.body.quantity);

    if (isNaN(user_id) || isNaN(product_id) || isNaN(quantity)) {
      res.status(400).send({
        success: false,
        message: "user_id, product_id and quantity must be numbers",
      });
      return;
    }

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
cartRoutes.delete(
  "/users/:user_id/cart/:product_id",
  async (req, res, next) => {
    try {
      const user_id = Number(req.params.user_id);
      const product_id = Number(req.params.product_id);

      console.log(
        `Trying to delete item with product_id ${product_id} from user with user_id ${user_id}'s cart`
      );

      if (isNaN(user_id) || isNaN(product_id)) {
        res
          .status(400)
          .send({ success: false, message: "Invalid user_id or product_id" });
        return;
      }

      const deletedCartItem = await client.query(DELETE_ITEM_FROM_CART, [
        user_id,
        product_id,
      ]);

      console.log(`Result of DELETE_ITEM_FROM_CART query:`, deletedCartItem);

      if (deletedCartItem.rowCount === 0) {
        res
          .status(404)
          .send({ success: false, message: "Item not found in cart" });
        return;
      }

      res.status(200).json(deletedCartItem.rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// route to update the cart for a specific user and product
cartRoutes.put("/users/:user_id/cart/:product_id", async (req, res, next) => {
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

    if (updatedCartItem.rowCount === 0) {
      res
        .status(404)
        .send({ success: false, message: "Item not found in cart" });
      return;
    }

    res.status(200).send({
      success: true,
      message: "Cart updated successfully",
      item: updatedCartItem.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// Route to update the cart for a specific user
cartRoutes.put("/users/:user_id/cart", async (req, res, next) => {
  try {
    const user_id = Number(req.params.user_id);
    const cartItem = req.body;

    if (isNaN(user_id) || typeof cartItem !== "object") {
      res.status(400).send({
        success: false,
        message: "user_id must be a number and cartItem must be an object",
      });
      return;
    }

    const product_id = Number(cartItem.product_id);
    const quantity = Number(cartItem.quantity);

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

// Route to get the cart for a specific user
cartRoutes.get("/users/:user_id/cart", async (req, res, next) => {
  try {
    const user_id = Number(req.params.user_id);

    if (isNaN(user_id)) {
      res.status(400).send({ success: false, message: "Invalid user_id" });
      return;
    }

    const { rows } = await client.query(SELECT_CART_FOR_USER, [user_id]);

    if (rows.length === 0) {
      res
        .status(404)
        .send({ success: false, message: "Cart not found for user" });
    } else {
      const cart = { id: rows[0].cart_id, items: rows };
      res.status(200).json(cart);
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
});
// Route to get the items for a specific cart
cartRoutes.get("/cart_items/:cart_id", async (req, res, next) => {
  try {
    const cart_id = Number(req.params.cart_id);

    if (isNaN(cart_id)) {
      res.status(400).send({ success: false, message: "Invalid cart_id" });
      return;
    }

    const { rows } = await client.query(SELECT_ITEMS_FOR_CART, [cart_id]);

    if (rows.length === 0) {
      res
        .status(404)
        .send({ success: false, message: "No items found for this cart" });
    } else {
      res.status(200).json(rows);
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = cartRoutes;
