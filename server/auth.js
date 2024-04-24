const express = require("express");
const { client, getUserById, getUserByEmail } = require("./db");
const { authenticateUser, generateToken } = require("./authHelpers");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const authRoutes = express.Router();

authRoutes.post("/register", registerUser);
authRoutes.post("/login", loginUser);
authRoutes.get("/me", getCurrentUser);
authRoutes.put("/user", updateUserDetails);

module.exports = authRoutes;

// Register a new user
async function registerUser(req, res, next) {
  const { email, password, accountType } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  try {
    // Check if the user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Begin a transaction
    await client.query("BEGIN");

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const userSQL = `
      INSERT INTO users (email, password, accountType)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const userResponse = await client.query(userSQL, [
      email,
      hashedPassword,
      accountType,
    ]);
    const user = userResponse.rows[0];

    // Create a new cart for the user
    const cartSQL = `
      INSERT INTO cart (user_id)
      VALUES ($1)
      RETURNING *;
    `;
    await client.query(cartSQL, [user.id]);

    // Generate a token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Commit the transaction
    await client.query("COMMIT");

    res.json({ success: true, user, token });
  } catch (error) {
    // Rollback the transaction in case of error
    await client.query("ROLLBACK");
    next(error);
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

        res.json({
          success: true,
          user: {
            ...user,
            token,
          },
          message: "User logged in",
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

// Update user details
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
