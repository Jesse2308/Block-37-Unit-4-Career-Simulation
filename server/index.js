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

// Define utility functions
async function deleteProduct(product_id, sellerId) {
  const SQL = `
    DELETE FROM products
    WHERE id = $1 AND seller_id = $2;
  `;
  await client.query(SQL, [product_id, sellerId]);
}

// Create Express app
const app = express();
module.exports = app;

// Middleware
app.use(cors());
app.use(express.json());
setupRoutes(app);

// Static
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../client/dist/index.html"))
);
app.use(
  "/assets",
  express.static(path.join(__dirname, "../client/dist/assets"))
);

// Email transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // your Gmail password
  },
});

// Route to get user details
app.get("/api/user", async (req, res, next) => {
  try {
    // Check if the Authorization header is present
    if (!req.headers.authorization) {
      return res
        .status(401)
        .send({ success: false, message: "No token provided" });
    }

    // Extract the token from the Authorization header
    const token = req.headers.authorization.split(" ")[1];

    // Verify the token
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).send({ success: false, message: "Invalid token" });
    }

    // Find the user with the userId from the token's payload
    const SQL = "SELECT * FROM users WHERE id = $1";
    const response = await client.query(SQL, [payload.userId]);

    // If user is found, send user details, else send error message
    if (response.rows.length > 0) {
      const user = response.rows[0];
      res.send({ success: true, user });
    } else {
      res.status(404).send({ success: false, message: "User not found" });
    }
  } catch (error) {
    next(error);
  }
});

// Route to update user details
app.put("/api/user", async (req, res, next) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization.split(" ")[1];

    // Verify the token
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Extract the updated user data from the request body
    const { username, email } = req.body;

    // Fetch the current user data
    const fetchSQL = "SELECT * FROM users WHERE id = $1";
    const fetchResponse = await client.query(fetchSQL, [payload.userId]);
    const currentUser = fetchResponse.rows[0];

    // If a field is not provided in the request body, use the current value
    const updatedUsername =
      username !== undefined ? username : currentUser.username;
    const updatedEmail = email !== undefined ? email : currentUser.email;

    // Update the user with the userId from the token's payload
    const SQL =
      "UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING *";
    const response = await client.query(SQL, [
      updatedUsername,
      updatedEmail,
      payload.userId,
    ]);

    // If user is found and updated, send updated user details, else send error message
    if (response.rows.length > 0) {
      const user = response.rows[0];
      res.send({ success: true, user });
    } else {
      res.status(404).send({ success: false, message: "User not found" });
    }
  } catch (error) {
    next(error);
  }
});

// Route to update user details by user id
app.put("/api/users/:id", async (req, res, next) => {
  try {
    // Extract user details from request body and user id from request parameters
    const { email, password, accountType, username } = req.body;
    const { id } = req.params;

    // Fetch the current user data
    const currentUser = await getUserById(id);

    // If a field is not provided in the request body, use the current value
    const updatedEmail = email !== undefined ? email : currentUser.email;
    const updatedPassword =
      password !== undefined
        ? await bcrypt.hash(password, 10)
        : currentUser.password;
    const updatedAccountType =
      accountType !== undefined ? accountType : currentUser.accountType;
    const updatedUsername =
      username !== undefined ? username : currentUser.username;

    // Update the user with the userId from the request parameters
    const SQL =
      "UPDATE users SET email = $1, password = $2, accountType = $3, username = $4 WHERE id = $5 RETURNING *";
    const response = await client.query(SQL, [
      updatedEmail,
      updatedPassword,
      updatedAccountType,
      updatedUsername,
      id,
    ]);

    // Send the updated user details
    const user = response.rows[0];
    res.send(user);
  } catch (error) {
    next(error);
  }
});

// Route to get current user details
app.get("/api/me", async (req, res, next) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization.split(" ")[1];

    // Verify the token
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user with the userId from the token's payload
    const SQL = "SELECT * FROM users WHERE id = $1";
    const response = await client.query(SQL, [payload.userId]);

    // If user is found, send user details, else send error message
    if (response.rows.length > 0) {
      const user = response.rows[0];
      res.send({ success: true, user });
    } else {
      res.status(404).send({ success: false, message: "User not found" });
    }
  } catch (error) {
    next(error);
  }
});

// Route to login a user
app.post("/api/login", async (req, res, next) => {
  try {
    // Extract email and password from request body
    const { email, password } = req.body;

    // Authenticate the user
    const user = await authenticateUser(email, password);

    // If user is authenticated, generate a token and send it along with user id and email
    if (user) {
      const token = generateToken(user);
      res.json({ success: true, userId: user.id, token, email: user.email });
    } else {
      // If user is not authenticated, send an error message
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    next(error);
  }

  // Function to authenticate a user
  async function authenticateUser(email, password) {
    // SQL query to find the user with the given email
    const SQL = `SELECT * FROM users WHERE email = $1;`;
    const response = await client.query(SQL, [email]);

    // If user is found, check if the password is correct
    if (response.rows.length > 0) {
      const user = response.rows[0];
      const isPasswordCorrect = await bcrypt.compare(password, user.password);

      // If password is correct, return the user
      if (isPasswordCorrect) {
        return user;
      }
    }

    // If user is not found or password is incorrect, return null
    return null;
  }

  // Function to generate a token for a user
  function generateToken(user) {
    // Payload of the token is the user id
    const payload = { userId: user.id };

    // Secret to sign the token is the JWT_SECRET environment variable
    const secret = process.env.JWT_SECRET;

    // Token expires in 1 hour
    const options = { expiresIn: "1h" };

    // Generate and return the token
    return jwt.sign(payload, secret, options);
  }
});

// Route to register a new user
app.post("/api/register", async (req, res, next) => {
  try {
    // Extract user details from request body
    const { email = "", password = "", accountType = "", username } = req.body;

    // If username is not provided, send an error message
    if (!username) {
      res.status(400).send({ success: false, message: "Username is required" });
      return;
    }

    // Check if the username is unique
    const checkUsernameSQL = `SELECT * FROM users WHERE username = $1;`;
    const checkUsernameResponse = await client.query(checkUsernameSQL, [
      username,
    ]);
    if (checkUsernameResponse.rows.length > 0) {
      res
        .status(400)
        .send({ success: false, message: "Username is already taken" });
      return;
    }

    // If email is provided but password is not, send an error message
    if (email && !password) {
      res.status(400).send({
        success: false,
        message: "Password is required when an email is provided",
      });
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate an email verification token
    const emailToken = crypto.randomBytes(20).toString("hex");

    // SQL query to insert the new user into the database
    const SQL = `INSERT INTO users (username, email, password, accountType, emailToken) VALUES ($1, $2, $3, $4, $5) RETURNING *;`;
    const response = await client.query(SQL, [
      username,
      email,
      hashedPassword,
      accountType,
      emailToken,
    ]);

    // Send a verification email to the user
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Email Verification",
      text: `Please verify your email address by clicking the following link: http://localhost:5173/verify-email?token=${emailToken}`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error sending email: ", error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    // Send the user details
    const user = response.rows[0];
    res.send(user);
  } catch (error) {
    console.log("Error in register endpoint: ", error);
    next(error);
  }
});

// Route to verify a user's email
app.get("/api/verify-email/:token", async (req, res, next) => {
  try {
    // Extract the token from request parameters
    const { token } = req.params;

    // SQL query to verify the user's email
    const SQL = `UPDATE users SET verified = true, emailToken = NULL WHERE emailToken = $1 RETURNING *;`;
    const response = await client.query(SQL, [token]);

    // If user is found and email is verified, send user details, else send an error message
    if (response.rows.length > 0) {
      const user = response.rows[0];
      res.send({ success: true, user });
    } else {
      res.status(404).send({ success: false, message: "Invalid token" });
    }
  } catch (error) {
    next(error);
  }
});

// Middleware to check if user is admin
async function isAdmin(req, res, next) {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization.split(" ")[1];

    // Verify the token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Extract the user id from the token
    const userId = decodedToken.userId;

    // Fetch the user from the database
    const user = await getUserById(userId);

    // If user is an admin, proceed to the next middleware, else send an error message
    if (user && user.isAdmin) {
      next();
    } else {
      res.status(403).json({ message: "Forbidden" });
    }
  } catch {
    res.status(403).json({ message: "Forbidden" });
  }
}

// Route to fetch all products from the database
app.get("/admin/products", isAdmin, async (req, res) => {
  // Fetch all products from the database
  const products = await db.fetchProducts();

  // Send the products
  res.json(products);
});

// Route to add a new product to the database
app.post("/admin/products", isAdmin, async (req, res) => {
  try {
    // Extract product details from request body
    const { name, price } = req.body;

    // If name or price is not provided, send an error message
    if (!name || !price) {
      throw new Error("Invalid name or price");
    }

    // SQL query to insert the new product into the database
    const newProduct = await db.one(
      "INSERT INTO products(name, price) VALUES($1, $2) RETURNING *",
      [name, price]
    );

    // Send the new product
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Route to edit a product in the database
app.put("/admin/products/:id", isAdmin, async (req, res) => {
  // TODO: Implement this route
});

// Route to delete a product from the database
app.delete("/admin/products/:id", isAdmin, async (req, res) => {
  try {
    // Extract the product id from request parameters
    const { id } = req.params;

    // If id is not an integer, send an error message
    if (!Number.isInteger(id)) {
      throw new Error("Invalid id");
    }

    // SQL query to delete the product from the database
    await db.none("DELETE FROM products WHERE id = $1", [id]);

    // Send a success message
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route to fetch all products
app.get("/api/products", async (req, res, next) => {
  try {
    // Fetch all products from the database
    const response = await client.query("SELECT * FROM products");

    // Send the products
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

// Route to add a new product
app.post("/api/products", async (req, res, next) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization.split(" ")[1];

    // Verify the token
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Extract the product data from the request body
    const { name, price, details, quantity, category } = req.body;

    // SQL query to insert the new product into the database
    const SQL = `
      INSERT INTO products (name, price, details, quantity, seller_id, category)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const response = await client.query(SQL, [
      name,
      price,
      details,
      quantity,
      payload.userId,
      category,
    ]);

    // Send the new product
    const product = response.rows[0];
    res.send({ success: true, product });
  } catch (error) {
    next(error);
  }
});

// Route to fetch a product by id
app.get("/api/products/:item_id", async (req, res, next) => {
  try {
    // Extract the product id from request parameters
    const item_id = Number(req.params.item_id);

    // If id is not an integer, send an error message
    if (!Number.isInteger(item_id)) {
      throw new Error("Invalid item_id");
    }

    // SQL query to fetch the product from the database
    const SQL = `
      SELECT * FROM products
      WHERE id = $1;
    `;
    const response = await client.query(SQL, [item_id]);

    // Send the product
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});
// Route to fetch all products of a user
app.get("/api/products/user/:userId", async (req, res, next) => {
  try {
    // Extract the user id from request parameters
    const user_id = req.params.userId;

    // Check if user_id is a valid string representation of an integer
    if (!/^\d+$/.test(user_id)) {
      res.status(400).send({ success: false, message: "Invalid user_id" });
      return;
    }

    // Parse user_id to an integer
    const userIdInt = parseInt(user_id, 10);

    // If id is not an integer, send an error message
    if (!Number.isInteger(userIdInt)) {
      throw new Error("Invalid userId");
    }

    // SQL query to fetch the products from the database
    const SQL = `
        SELECT * FROM products
        WHERE seller_id = $1;
        `;
    const response = await client.query(SQL, [userIdInt]);

    // Send the products
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

// Route to add an item to the cart
// SQL queries for cart operations
const INSERT_INTO_CART = `
  INSERT INTO cart (user_id, product_id, quantity)
  VALUES ($1, $2, $3)
  RETURNING *;
`;

const SELECT_FROM_CART = `
  SELECT * FROM cart
  WHERE user_id = $1;
`;

const DELETE_FROM_CART = "DELETE FROM cart WHERE user_id = $1";

// SQL query to delete an item from the cart
const DELETE_ITEM_FROM_CART = `
  DELETE FROM cart
  WHERE user_id = $1 AND product_id = $2;
`;
// Route to add an item to the cart
app.post("/api/cart/:userId", async (req, res, next) => {
  try {
    // Extract the item from request body and user id from request parameters
    const { item } = req.body;
    const user_id = req.params.userId;

    // Check if user_id, item.product_id, and item.quantity are provided
    if (!user_id || !item || !item.product_id || !item.quantity) {
      res
        .status(400)
        .send({ success: false, message: "Missing required fields" });
      return;
    }

    // Parse user_id and item.product_id to integers
    const userIdInt = parseInt(user_id, 10);
    const productIdInt = parseInt(item.product_id, 10);

    // Check if the product exists
    const { rows } = await client.query(
      "SELECT * FROM products WHERE id = $1",
      [productIdInt]
    );
    if (rows.length === 0) {
      res
        .status(400)
        .send({ success: false, message: "Product does not exist" });
      return;
    }

    // Log the input values
    console.log("userIdInt:", userIdInt);
    console.log("productIdInt:", productIdInt);
    console.log("item.quantity:", item.quantity);

    // Validate the input
    if (
      !Number.isInteger(userIdInt) ||
      !Number.isInteger(productIdInt) ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      throw new Error("Invalid input");
    }

    // Insert the item into the cart
    const response = await client.query(INSERT_INTO_CART, [
      userIdInt,
      productIdInt,
      item.quantity,
    ]);

    // Send the inserted item or an error message
    if (response.rows.length > 0) {
      const insertedItem = response.rows[0];
      res.send({ success: true, item: insertedItem });
    } else {
      res
        .status(500)
        .send({ success: false, message: "Failed to add item to cart" });
    }
  } catch (error) {
    next(error);
  }
});

// Route to get a user's cart
app.get("/api/cart/:user_id", async (req, res, next) => {
  try {
    // Extract the user id from request parameters
    const user_id = parseInt(req.params.user_id, 10);

    // Validate the user id
    if (!Number.isInteger(user_id)) {
      throw new Error("Invalid user_id");
    }

    // Fetch the user's cart
    const response = await client.query(SELECT_FROM_CART, [user_id]);

    // Send the cart
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

// Route to update a user's cart
app.put("/api/cart/:user_id", async (req, res, next) => {
  try {
    // Extract the user id from request parameters
    const user_id =
      req.params.user_id === "guest"
        ? "guest"
        : parseInt(req.params.user_id, 10);
    const { cart } = req.body;

    // Validate the user id
    if (user_id !== "guest" && !Number.isInteger(user_id)) {
      throw new Error("Invalid user_id");
    }

    // Start a transaction
    await client.query("BEGIN");

    // If user_id is not "guest", update the cart in the database
    if (user_id !== "guest") {
      // Delete the user's cart
      await client.query(DELETE_FROM_CART, [user_id]);

      // Insert each item in the new cart into the cart
      if (!Array.isArray(cart)) {
        throw new Error("Invalid cart");
      }
      for (const item of cart) {
        const { product_id, quantity } = item;

        // Validate the item
        if (!Number.isInteger(quantity) || quantity <= 0) {
          throw new Error(`Invalid quantity: ${quantity}`);
        }
        if (!Number.isInteger(product_id)) {
          throw new Error(`Invalid product_id: ${product_id}`);
        }

        // Insert the item into the cart
        await client.query(INSERT_INTO_CART, [user_id, product_id, quantity]);
      }

      // Commit the transaction
      await client.query("COMMIT");

      // Fetch the updated cart
      const response = await client.query(SELECT_FROM_CART, [user_id]);

      // Send the updated cart
      res.send(response.rows);
    } else {
      // If user_id is "guest", don't update the cart in the database
      // You might want to handle this case differently depending on your application
      res.status(200).json({ message: "Cart updated for guest user" });
    }
  } catch (error) {
    // If an error occurred, rollback the transaction
    await client.query("ROLLBACK");

    // Log the error and send an error message
    console.error(error);
    res.status(500).json({
      error: `An error occurred while updating the cart: ${error.message}`,
    });
  }
});

// Define the SQL query string for deleting an item from the guest cart
const DELETE_ITEM_FROM_GUEST_CART = `
  DELETE FROM guest_cart
  WHERE product_id = $1
`;

// Route to remove an item from the cart
app.delete("/api/cart/:user_id/:product_id", async (req, res, next) => {
  try {
    // Extract the user id and product id from request parameters
    const { user_id, product_id } = req.params;

    // Validate the product id
    if (!Number.isInteger(Number(product_id))) {
      throw new Error("Invalid product_id");
    }

    if (user_id === "guest") {
      // Perform a different database operation for guest users
      try {
        await client.query(DELETE_ITEM_FROM_GUEST_CART, [product_id]);
      } catch (error) {
        console.error(`Error deleting item from guest cart: ${error}`);
        throw error;
      }
    } else {
      // Validate the user id
      if (!Number.isInteger(Number(user_id))) {
        throw new Error("Invalid user_id");
      }

      // Delete the item from the cart
      try {
        await client.query(DELETE_ITEM_FROM_CART, [user_id, product_id]);
      } catch (error) {
        console.error(`Error deleting item from cart: ${error}`);
        throw error;
      }
    }

    // Send a success message
    res.status(204).json({ message: "Item successfully removed from cart" });
  } catch (error) {
    next(error);
  }
});

// Route to create an order
app.post("/api/order", async (req, res, next) => {
  try {
    // Extract the user id and total from request body
    const { user_id, total } = req.body;

    // SQL query to insert the order into the database
    const SQL = `
        INSERT INTO orders (user_id, total)
        VALUES ($1, $2)
        RETURNING *;
        `;
    const response = await client.query(SQL, [user_id, total]);

    // Send the order
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Route to fetch a user's orders
app.get("/api/orders/:user_id", async (req, res, next) => {
  try {
    // Extract the user id from request parameters
    const { user_id } = req.params;

    // SQL query to fetch the user's orders from the database
    const SQL = `
        SELECT * FROM orders
        WHERE user_id = $1;
        `;
    const response = await client.query(SQL, [user_id]);

    // Send the orders
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

// Route to add a product to an order
app.post("/api/order_product", async (req, res, next) => {
  try {
    // Extract the order id, product id and quantity from request body
    const { order_id, product_id, quantity } = req.body;

    // SQL query to insert the product into the order
    const SQL = `
        INSERT INTO order_products (order_id, product_id, quantity)
        VALUES ($1, $2, $3)
        RETURNING *;
        `;
    const response = await client.query(SQL, [order_id, product_id, quantity]);

    // Send the order product
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

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
