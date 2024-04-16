// Import dependencies
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const client = require("./db");

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
authRoutes.post("/api/login", loginUser);

// Get current user route
authRoutes.get("/me", getCurrentUser);

// Update user details route
authRoutes.put("/api/user", updateUserDetails);

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
        res.json({ success: true, userId: user.id, token, email: user.email });
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

async function getCurrentUser(req, res, next) {
  const token = req.headers.authorization.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getUserById(payload.userId);
    res.send({ success: true, user });
  } catch (error) {
    res.status(401).send({ success: false, message: "Unauthorized" });
  }
}

async function updateUserDetails(req, res, next) {
  const token = req.headers.authorization.split(" ")[1];
  const { email, password } = req.body;
  if (!email || !password) {
    res
      .status(400)
      .send({ success: false, message: "Missing required fields" });
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(password, 10);
    const SQL = `
              UPDATE users 
              SET email = $1, password = $2
              WHERE id = $3
              RETURNING *;
              `;
    const response = await client.query(SQL, [
      email,
      hashedPassword,
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
