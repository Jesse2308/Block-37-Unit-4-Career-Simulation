// Load environment variables
require("dotenv").config();

// Import dependencies
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const path = require("path");

// Import database functions and setup
const db = require("./db");
const {
  client,
  createUserTable,
  createProductTable,
  createCartTable,
  createOrderTable,
  createOrderProductTable,
  addDetailsColumn,
  setupRoutes,
  fetchProducts,
  fetchUsers,
  editProduct,
} = db;
const helmet = require("helmet");

// Import route files
const authRoutes = require("./auth");
const stripeRoutes = require("./stripeRoutes");
const productRoutes = require("./products");
const orderRoutes = require("./orders");
const cartRoutes = require("./Cart");
const adminRoutes = require("./admin");

// Create Express app
const app = express();
module.exports = app;
app.use(cors());
// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3000/create-checkout-session",
    ],
  })
);
app.use(express.json());

// Use route files as middleware
app.use("/api", authRoutes);
app.use("/api", stripeRoutes);
app.use("/api", productRoutes);
app.use("/api", orderRoutes);
app.use("/api", cartRoutes);
app.use("/api/admin", adminRoutes);
// Error handling middleware
app.use((err, req, res, next) => {
  // Log the error stack trace to the console
  console.error(err.stack);

  // If the environment is development, send the error message and stack trace, else send only the error message
  if (process.env.NODE_ENV === "development") {
    res.status(500).send({ error: err.message, stack: err.stack });
  } else {
    res.status(500).send({ error: err.message });
  }
});

// Function to initialize the app
const init = async () => {
  // Set the port
  const PORT = process.env.PORT || 3000;

  // Connect to the database
  await client.connect();
  console.log("Connected to database");

  // Create the tables
  await createUserTable();
  await createProductTable();
  await createCartTable();
  await createOrderTable();
  await createOrderProductTable();
  await addDetailsColumn();
  console.log("Tables created");

  // Start the app
  app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
};

// Initialize the app
init();
