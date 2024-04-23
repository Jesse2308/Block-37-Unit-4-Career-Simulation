const express = require("express");
const cartRoutes = express.Router();
const { client } = require("./db");

const INSERT_INTO_CART = `
  INSERT INTO cart_item (cart_id, product_id, quantity)
  VALUES( (SELECT id FROM cart WHERE user_id = $1), $2, $3)
  RETURNING *;
`;

const SELECT_CART_FOR_USER = `
  SELECT cart.id AS cart_id, cart_item.*
  FROM cart_item
  JOIN cart ON cart_item.cart_id = cart.id
  WHERE cart.user_id = $1;
`;

const DELETE_ITEM_FROM_CART = `
  DELETE FROM cart_item
  WHERE cart_id = (SELECT id FROM cart WHERE user_id = $1) AND product_id = $2;
`;

const UPDATE_CART_ITEM = `
  UPDATE cart_item
  SET quantity = $3
  WHERE cart_id = (SELECT id FROM cart WHERE user_id = $1) AND product_id = $2
  RETURNING *;
`;

const SELECT_ITEMS_FOR_CART = `
  SELECT *
  FROM cart_item
  WHERE cart_id = $1;
`;

cartRoutes.post("/users/:user_id/cart", async (req, res, next) => {
  const user_id = req.params.user_id;
  const { product_id, quantity } = req.body;

  if (isNaN(user_id) || isNaN(product_id) || isNaN(quantity)) {
    return res.status(400).send({
      success: false,
      message: "user_id, product_id and quantity must be numbers",
    });
  }

  const newCartItem = await client.query(INSERT_INTO_CART, [
    user_id,
    product_id,
    quantity,
  ]);
  res.status(201).json(newCartItem.rows[0]);
});

cartRoutes.delete(
  "/users/:user_id/cart/:product_id",
  async (req, res, next) => {
    const { user_id, product_id } = req.params;
    if (isNaN(user_id) || isNaN(product_id)) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid user_id or product_id" });
    }

    const deletedCartItem = await client.query(DELETE_ITEM_FROM_CART, [
      user_id,
      product_id,
    ]);

    if (deletedCartItem.rowCount === 0) {
      return res
        .status(404)
        .send({ success: false, message: "Item not found in cart" });
    }

    res.status(200).json(deletedCartItem.rows[0]);
  }
);

cartRoutes.put("/users/:user_id/cart/:product_id", async (req, res, next) => {
  const { user_id, product_id, quantity } = req.params;
  if (isNaN(user_id) || isNaN(product_id) || isNaN(quantity)) {
    return res.status(400).send({
      success: false,
      message: "user_id, product_id and quantity must be numbers",
    });
  }

  const updatedCartItem = await client.query(UPDATE_CART_ITEM, [
    user_id,
    product_id,
    quantity,
  ]);

  if (updatedCartItem.rowCount === 0) {
    return res
      .status(404)
      .send({ success: false, message: "Item not found in cart" });
  }

  res.status(200).send({
    success: true,
    message: "Cart updated successfully",
    item: updatedCartItem.rows[0],
  });
});

cartRoutes.get("/users/:user_id/cart", async (req, res, next) => {
  const user_id = Number(req.params.user_id);
  if (isNaN(user_id)) {
    return res.status(400).send({ success: false, message: "Invalid user_id" });
  }

  const { rows } = await client.query(SELECT_CART_FOR_USER, [user_id]);

  if (rows.length === 0) {
    return res
      .status(404)
      .send({ success: false, message: "Cart not found for user" });
  }

  const cart = { id: rows[0].cart_id, items: rows };
  res.status(200).json(cart);
});

cartRoutes.get("/cart_items/:cart_id", async (req, res, next) => {
  const cart_id = Number(req.params.cart_id);
  if (isNaN(cart_id)) {
    return res.status(400).send({ success: false, message: "Invalid cart_id" });
  }

  const { rows } = await client.query(SELECT_ITEMS_FOR_CART, [cart_id]);

  if (rows.length === 0) {
    return res
      .status(404)
      .send({ success: false, message: "No items found for this cart" });
  }

  res.status(200).json(rows);
});

module.exports = cartRoutes;
