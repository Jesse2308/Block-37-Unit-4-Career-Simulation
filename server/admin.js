const express = require("express");
const jwt = require("jsonwebtoken");
const adminRoutes = express.Router();
const { client, fetchProducts, getUserById, fetchAllUsers } = require("./db");

async function isAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(403).json({ message: "Forbidden" });

    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getUserById(userId);

    if (user && user.isadmin) next();
    else res.status(403).json({ message: "Forbidden" });
  } catch {
    res.status(403).json({ message: "Forbidden" });
  }
}

adminRoutes.get("/users", isAdmin, async (req, res) => {
  try {
    const users = await fetchAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

adminRoutes.get("/products", isAdmin, async (req, res) => {
  try {
    const products = await fetchProducts();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

adminRoutes.post("/products", isAdmin, async (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name || !price) throw new Error("Invalid name or price");

    const newProduct = await client.query(
      "INSERT INTO products(name, price) VALUES($1, $2) RETURNING *",
      [name, price]
    );

    res.status(201).json(newProduct.rows[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

adminRoutes.put("/products/:id", isAdmin, async (req, res) => {
  try {
    const { name, price } = req.body;
    const { id } = req.params;
    if (!name || !price) throw new Error("Invalid name or price");

    const updatedProduct = await client.query(
      "UPDATE products SET name = $1, price = $2 WHERE id = $3 RETURNING *",
      [name, price, id]
    );

    res.json(updatedProduct.rows[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

adminRoutes.put("/products/:id/name", isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const { id } = req.params;
    if (!name) throw new Error("Invalid name");

    const updatedProduct = await client.query(
      "UPDATE products SET name = $1 WHERE id = $2 RETURNING *",
      [name, id]
    );

    res.json(updatedProduct.rows[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

adminRoutes.put("/products/:id/price", isAdmin, async (req, res) => {
  try {
    const { price } = req.body;
    const { id } = req.params;
    if (!price) throw new Error("Invalid price");

    const updatedProduct = await client.query(
      "UPDATE products SET price = $1 WHERE id = $2 RETURNING *",
      [price, id]
    );

    res.json(updatedProduct.rows[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

adminRoutes.put("/products/:id/image", isAdmin, async (req, res) => {
  try {
    const { image } = req.body;
    const { id } = req.params;
    if (!image) throw new Error("Invalid image");

    const updatedProduct = await client.query(
      "UPDATE products SET image = $1 WHERE id = $2 RETURNING *",
      [image, id]
    );

    res.json(updatedProduct.rows[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

adminRoutes.delete("/products/:id", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (isNaN(id)) throw new Error("Invalid id");

    await client.query("DELETE FROM products WHERE id = $1", [id]);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = adminRoutes;
