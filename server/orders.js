const express = require("express");
const jwt = require("jsonwebtoken");
const { getUserById, client } = require("./db");

const orderRoutes = express.Router();

async function isAdmin(req, res, next) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const { user_id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getUserById(user_id);

    if (user && user.isAdmin) next();
    else res.status(403).json({ message: "Forbidden" });
  } catch {
    res.status(403).json({ message: "Forbidden" });
  }
}

orderRoutes.post("/api/order", isAdmin, async (req, res, next) => {
  const { user_id } = req.body;
  if (!user_id) {
    return res.status(400).send({ success: false, message: "Missing user_id" });
  }

  const newOrder = await client.query(
    "INSERT INTO orders(user_id) VALUES($1) RETURNING *",
    [user_id]
  );

  res.status(201).json(newOrder.rows[0]);
});

orderRoutes.get("/api/orders/:user_id", isAdmin, async (req, res, next) => {
  const { user_id } = req.params;
  const response = await client.query(
    "SELECT * FROM orders WHERE user_id = $1",
    [user_id]
  );

  res.json(response.rows.length ? response.rows : []);
});

orderRoutes.post("/api/order_product", isAdmin, async (req, res, next) => {
  const { order_id, product_id } = req.body;
  if (!order_id || !product_id) {
    return res
      .status(400)
      .send({ success: false, message: "Missing order_id or product_id" });
  }

  const newOrderProduct = await client.query(
    "INSERT INTO order_products(order_id, product_id) VALUES($1, $2) RETURNING *",
    [order_id, product_id]
  );

  res.status(201).json(newOrderProduct.rows[0]);
});

orderRoutes.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({
    error: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

module.exports = orderRoutes;
