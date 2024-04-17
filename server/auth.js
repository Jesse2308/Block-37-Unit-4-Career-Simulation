// Import dependencies
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { client, getUserById } = require("./db");

// SQL queries
const DELETE_FROM_CART = `
  DELETE FROM cart
  WHERE user_id = $1;
`;

const INSERT_INTO_CART = `
  INSERT INTO cart (user_id, product_id, quantity)
  VALUES ($1, $2, $3)
  RETURNING *;
`;
const SELECT_FROM_CART = `
  SELECT * FROM cart WHERE user_id = $1;
`;

// Create Express router
const authRoutes = express.Router();

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// User registration route
authRoutes.post("/register", registerUser);

// User login route
authRoutes.post("/login", loginUser);

// Get current user route
authRoutes.get("/me", getCurrentUser);

// Update user details route
authRoutes.put("/user", updateUserDetails);

// Export the router
module.exports = authRoutes;

// Route handler functions

// Register a new user
async function registerUser(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    res
      .status(400)
      .send({ success: false, message: "Missing required fields" });
    return;
  } else {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const SQL = `
            INSERT INTO users (email, password)
            VALUES ($1, $2)
            RETURNING *;
            `;
      const response = await client.query(SQL, [email, hashedPassword]);
      const user = response.rows[0];
      const token = generateToken(user);
      res.send({ success: true, user, token });
    } catch (error) {
      next(error);
    }
  }
}

// Login a user
async function loginUser(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    res
      .status(400)
      .send({ success: false, message: "Missing required fields" });
    return;
  } else {
    try {
      const user = await authenticateUser(email, password);
      if (user) {
        const token = generateToken(user);

        // Fetch the guest cart
        const guestCart = await client.query(SELECT_FROM_CART, [0]); // use 0 for guest user_id

        // Fetch the user's cart
        const userCart = await client.query(SELECT_FROM_CART, [user.id]);

        // Merge the two carts
        const mergedCart = mergeCarts(guestCart.rows, userCart.rows);

        // Update the user's cart with the merged cart
        await client.query(DELETE_FROM_CART, [user.id]);
        for (const item of mergedCart) {
          await client.query(INSERT_INTO_CART, [
            user.id,
            item.product_id,
            item.quantity,
          ]);
        }

        // Clear the guest cart
        await client.query(DELETE_FROM_CART, [0]); // use 0 for guest user_id

        res.json({
          success: true,
          userId: user.id,
          token,
          email: user.email,
          isadmin: user.isadmin, // Include isadmin in the response
          message: "User logged in and carts merged",
        });
      } else {
        res
          .status(401)
          .send({ success: false, message: "Invalid credentials" });
      }
    } catch (error) {
      next(error);
    }
  }
}

// Function to merge two carts
function mergeCarts(guestCart, userCart) {
  // Create a new array to hold the merged cart
  const mergedCart = [...userCart];

  // For each item in the guest cart
  for (const guestItem of guestCart) {
    // Check if the item is already in the user's cart
    const userItem = userCart.find(
      (item) => item.product_id === guestItem.product_id
    );

    if (userItem) {
      // If the item is already in the user's cart, increase the quantity
      userItem.quantity += guestItem.quantity;
    } else {
      // If the item is not in the user's cart, add it
      mergedCart.push(guestItem);
    }
  }

  return mergedCart;
}

async function getCurrentUser(req, res) {
  try {
    const authHeader = req.headers.authorization;
    console.log("Auth header:", authHeader); // Log the auth header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).send({ success: false, message: "Unauthorized" });
      return;
    }
    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Payload:", payload); // Log the payload
    const user = await getUserById(payload.userId);
    console.log("User:", user); // Log the user
    res.send({ success: true, user });
  } catch (error) {
    console.error("Error:", error); // Log the error
    res.status(401).send({ success: false, message: "Unauthorized" });
  }
}

async function updateUserDetails(req, res, next) {
  const token = req.headers.authorization.split(" ")[1];
  const { username } = req.body; // Extract only username from request body
  if (!username) {
    // Check if username is provided
    res
      .status(400)
      .send({ success: false, message: "Missing required fields" });
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const SQL = `
  UPDATE users 
  SET username = $1 /* Update only username in database */
  WHERE id = $2
  RETURNING *;
`;
    const response = await client.query(SQL, [
      username, // Pass username to SQL query
      payload.userId,
    ]);
    const user = response.rows[0];
    res.send({ success: true, user });
  } catch (error) {
    next(error);
  }
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
