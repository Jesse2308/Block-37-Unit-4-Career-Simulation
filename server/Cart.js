const express = require("express");
const { client } = require("./db");
const cartRoutes = express.Router();

const INSERT_INTO_CART = `
  INSERT INTO cart (user_id, product_id, quantity)
  VALUES ($1, $2, $3)
  RETURNING *;
`;

const SELECT_FROM_CART = `
  SELECT * FROM cart
  WHERE user_id = $1;
`;

const DELETE_ITEM_FROM_CART = `
  DELETE FROM cart
  WHERE user_id = $1 AND product_id = $2;
`;

cartRoutes.post("/cart/:user_id", async (req, res, next) => {
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

cartRoutes.get("/cart/:user_id", async (req, res, next) => {
  try {
    const user_id = Number(req.params.user_id);

    if (isNaN(user_id)) {
      res.status(400).send({ success: false, message: "Invalid user_id" });
      return;
    }

    const userCart = await client.query(SELECT_FROM_CART, [user_id]);
    res.status(200).json({ cart: userCart.rows });
  } catch (err) {
    next(err);
  }
});

cartRoutes.put("/cart/:user_id", async (req, res, next) => {
  try {
    const user_id = Number(req.params.user_id);
    const { cart } = req.body;

    if (isNaN(user_id) || !Array.isArray(cart)) {
      res.status(400).send({
        success: false,
        message: "Invalid user_id or cart",
      });
      return;
    }

    await client.query("BEGIN");
    const updatePromises = cart.map((item) => {
      const product_id = Number(item.product_id);
      const quantity = Number(item.quantity);

      if (isNaN(product_id) || isNaN(quantity)) {
        throw new Error("Invalid cart item");
      }

      return client.query(
        "INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3) ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = $1",
        [quantity, user_id, product_id]
      );
    });

    await Promise.all(updatePromises);
    await client.query("COMMIT");

    const updatedCart = await client.query(SELECT_FROM_CART, [user_id]);
    res.status(200).json(updatedCart.rows);
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  }
});

cartRoutes.delete("/cart/:user_id/:product_id", async (req, res, next) => {
  try {
    const user_id = Number(req.params.user_id);
    const product_id = Number(req.params.product_id);

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
});

cartRoutes.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: err.message });
});

module.exports = cartRoutes;
