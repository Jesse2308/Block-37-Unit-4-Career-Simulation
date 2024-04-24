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
const { client, createUserTable, createProductsTable } = db;

// Import route files
const authRoutes = require("./auth");
const stripeRoutes = require("./stripeRoutes");
const productRoutes = require("./products");
const orderRoutes = require("./orders");
const cartRoutes = require("./Cart");
const adminRoutes = require("./admin");
const { create } = require("domain");

// Create Express app
const app = express();
module.exports = app;

// Define the allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "http://your-production-url.com",
  "http://localhost:5173",
];

// Configure CORS
app.use(
  cors({
    origin: function (origin, callback) {
      console.log("Origin:", origin);
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        var msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  })
);

//Middleware
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "script-src 'self' https://js.stripe.com; img-src 'self' https://q.stripe.com data: https://shorturl.at/cpJWX https://shorturl.at/bL359 https://shorturl.at/qrvE8 https://shorturl.at/ilrGV https://shorturl.at/uwNOX https://shorturl.at/cstU5 https://shorturl.at/iruU8 https://shorturl.at/lmEGX https://tinyurl.com/24o53crt https://m.stripe.network https://m.stripe.com https://b.stripecdn.com"
  );
  next();
});

app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../client/dist/index.html"))
);
app.use(
  "/assets",
  express.static(path.join(__dirname, "../client/dist/assets"))
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
  await createProductsTable();
  console.log("Tables created");

  // Create the admin user
  await db.createAdminAccount();
  console.log("Admin user created");

  // Start the app
  app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
};

// Initialize the app
init();
