const express = require("express");
const { client } = require("./db");

const productRoutes = express.Router();

productRoutes.get("/products", async (req, res, next) => {
  try {
    const response = await client.query("SELECT * FROM products");
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

productRoutes.post("/products", async (req, res, next) => {
  const { name, category, price, details, quantity, image, sellerId } =
    req.body;
  if (
    !name ||
    !category ||
    !price ||
    !details ||
    !quantity ||
    !image ||
    !sellerId
  ) {
    return next(new Error("All fields are required"));
  }

  const newProduct = await client.query(
    "INSERT INTO products(name, category, price, details, quantity, image, seller_id) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    [name, category, price, details, quantity, image, sellerId]
  );

  res.status(201).json(newProduct.rows[0]);
});

productRoutes.put("/products/:productId", async (req, res, next) => {
  const { name, category, price, details, quantity, image, sellerId } =
    req.body;
  const { productId } = req.params;
  if (
    !name ||
    !category ||
    !price ||
    !details ||
    !quantity ||
    !image ||
    !sellerId
  ) {
    return next(new Error("All fields are required"));
  }

  const updatedProduct = await client.query(
    "UPDATE products SET name = $1, category = $2, price = $3, details = $4, quantity = $5, image = $6, seller_id = $7 WHERE id = $8 RETURNING *",
    [name, category, price, details, quantity, image, sellerId, productId]
  );

  res.json(updatedProduct.rows[0]);
});

productRoutes.get("/products/:item_id", async (req, res, next) => {
  try {
    const { item_id } = req.params;
    const response = await client.query(
      "SELECT * FROM products WHERE id = $1",
      [item_id]
    );
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

productRoutes.get("/products/user/:user_id", async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const response = await client.query(
      "SELECT * FROM products WHERE seller_id = $1",
      [user_id]
    );
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

productRoutes.get("/orders/:user_id", async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const response = await client.query(
      "SELECT * FROM orders WHERE user_id = $1",
      [user_id]
    );
    res.json(response.rows.length ? response.rows : []);
  } catch (error) {
    next(error);
  }
});

productRoutes.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ success: false, message: "Something went wrong!" });
});

module.exports = productRoutes;
