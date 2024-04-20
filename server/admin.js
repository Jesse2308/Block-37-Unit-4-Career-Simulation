const express = require("express");
const jwt = require("jsonwebtoken");
const adminRoutes = express.Router();
const {
  client,
  fetchProducts,
  one,
  none,
  getUserById,
  fetchAllUsers,
} = require("./db");

// Middleware to check if user is admin
async function isAdmin(req, res, next) {
  try {
    // Check if the Authorization header is present and contains a token
    if (
      !req.headers.authorization ||
      !req.headers.authorization.split(" ")[1]
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Extract the token from the Authorization header
    const token = req.headers.authorization.split(" ")[1];

    // Verify the token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Extract the user id from the token
    const userId = decodedToken.userId;

    // Fetch the user from the database
    const user = await getUserById(userId);

    // If user is an admin, proceed to the next middleware, else send an error message
    if (user && user.isadmin) {
      next();
    } else {
      res.status(403).json({ message: "Forbidden" });
    }
  } catch {
    res.status(403).json({ message: "Forbidden" });
  }
}

// Fetch all users from the database as an admin
adminRoutes.get("/users", isAdmin, async (req, res) => {
  try {
    console.log("Fetching users from the database...");
    const users = await fetchAllUsers();
    console.log(`Fetched ${users.length} users from the database.`);
    res.json(users);
  } catch (err) {
    console.error("Error fetching users from the database:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Fetch all products from the database as an admin
adminRoutes.get("/products", isAdmin, async (req, res) => {
  try {
    const products = await fetchProducts();
    // Send the products as a response
    res.json(products);
  } catch (err) {
    console.error("Error fetching products from the database:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Add a new product to the database as an admin
adminRoutes.post("/products", isAdmin, async (req, res) => {
  try {
    // Extract product details from request body
    const { name, price } = req.body;

    // If name or price is not provided, send an error message
    if (!name || !price) {
      throw new Error("Invalid name or price");
    }

    // SQL query to insert the new product into the database
    const newProduct = await one(
      "INSERT INTO products(name, price) VALUES($1, $2) RETURNING *",
      [name, price]
    );

    // Send the new product
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
// Update a product in the database as an admin
adminRoutes.put("/products/:id", isAdmin, async (req, res) => {
  try {
    // Extract product details from request body
    const { name, price } = req.body;

    // Extract product id from request parameters
    const { id } = req.params;

    // If name or price is not provided, send an error message
    if (!name || !price) {
      throw new Error("Invalid name or price");
    }

    // SQL query to update the product in the database
    const updatedProduct = await one(
      "UPDATE products SET name = $1, price = $2 WHERE id = $3 RETURNING *",
      [name, price, id]
    );

    // Send the updated product
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a product's name in the database as an admin
adminRoutes.put("/products/:id/name", isAdmin, async (req, res) => {
  try {
    // Extract product name from request body
    const { name } = req.body;

    // Extract product id from request parameters
    const { id } = req.params;

    // If name is not provided, send an error message
    if (!name) {
      throw new Error("Invalid name");
    }

    // SQL query to update the product's name in the database
    const updatedProduct = await one(
      "UPDATE products SET name = $1 WHERE id = $2 RETURNING *",
      [name, id]
    );

    // Send the updated product
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a product's price in the database as an admin
adminRoutes.put("/products/:id/price", isAdmin, async (req, res) => {
  try {
    // Extract product price from request body
    const { price } = req.body;

    // Extract product id from request parameters
    const { id } = req.params;

    // If price is not provided, send an error message
    if (!price) {
      throw new Error("Invalid price");
    }

    // SQL query to update the product's price in the database
    const updatedProduct = await one(
      "UPDATE products SET price = $1 WHERE id = $2 RETURNING *",
      [price, id]
    );

    // Send the updated product
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

adminRoutes.delete("/products/:id", isAdmin, async (req, res) => {
  try {
    // Extract the product id from request parameters
    const { id } = req.params;

    // If id is not a number, send an error message
    if (isNaN(id)) {
      throw new Error("Invalid id");
    }

    // SQL query to delete the product from the database
    await none("DELETE FROM products WHERE id = $1", [id]);

    // Send a success message
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = adminRoutes;
