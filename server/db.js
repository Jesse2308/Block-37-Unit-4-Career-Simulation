// Dependencies
const pg = require("pg");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { Pool } = pg;

// Constants
const JWT_SECRET = process.env.JWT_SECRET;

// Database client
const client = new Pool({
  connectionString:
    process.env.DATABASE_URL || "postgres://localhost/acme_jcomApp_db",
});

// Define createUser function
async function createUser({
  username,
  email,
  password,
  is_guest,
  emailtoken,
  verified,
  accounttype,
  isadmin,
}) {
  // Hash the password before storing it
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert the new user into the database
  const SQL = `
    INSERT INTO users (username, email, password, is_guest, emailtoken, verified, accounttype, isadmin)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
  const values = [
    username,
    email,
    hashedPassword,
    is_guest,
    emailtoken,
    verified,
    accounttype,
    isadmin,
  ];
  const result = await client.query(SQL, values);

  // Throw an error if the user couldn't be created
  if (result.rows.length === 0) {
    throw new Error("Error creating user");
  }

  return result.rows[0];
}

// Register a new user
const register = async ({ email, password, isadmin = false }) => {
  // Check if a user with the given email already exists
  const checkSQL = `
    SELECT * FROM users WHERE email = $1;
  `;
  const checkResponse = await client.query(checkSQL, [email]);
  if (checkResponse.rows.length > 0) {
    throw new Error("A user with this email already exists");
  }

  // If not, insert the new user
  const user = await createUser({ email, password, isadmin });

  // Send a verification email
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Email Verification",
    text: `Please verify your email address by clicking the following link: http://localhost:3000/verify-email?token=${user.emailToken}`,
  };
  await transporter.sendMail(mailOptions);

  return user;
};

// Fetch all users for an admin
async function fetchAllUsers() {
  const SQL = `
    SELECT * FROM users;
  `;
  const response = await client.query(SQL);
  return response.rows;
}

async function getUserById(userId) {
  const SQL = `
    SELECT * FROM users
    WHERE id = $1;
  `;

  const values = [userId];

  // Assuming 'client' is your PostgreSQL client
  const result = await client.query(SQL, values);

  return result.rows[0]; // Return the user
}
async function getUserByEmail(email) {
  const SQL = `
    SELECT * FROM users WHERE email = $1;
  `;
  const response = await client.query(SQL, [email]);
  return response.rows[0];
}

async function createUserTable() {
  const SQL = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      is_guest BOOLEAN DEFAULT false,
      emailtoken VARCHAR(255),
      verified BOOLEAN DEFAULT false,
      accounttype VARCHAR(255) DEFAULT 'standard',
      isadmin BOOLEAN DEFAULT false
    );
  `;
  await client.query(SQL);
}

// Fetch all products
const fetchProducts = async () => {
  const SQL = `
  SELECT * FROM products;
  `;
  const response = await client.query(SQL);
  return response.rows;
};

// Fetch all users
const fetchUsers = async () => {
  const SQL = `
  SELECT * FROM users;
  `;
  const response = await client.query(SQL);
  return response.rows;
};

// Authenticate a user
const authenticate = async ({ email, password }) => {
  const SQL = `
  SELECT id, email, password FROM users WHERE email=$1;
  `;
  const response = await client.query(SQL, [email]);
  if (
    !response.rows.length ||
    (await bcrypt.compare(password, response.rows[0].password)) === false
  ) {
    const error = Error("not authorized");
    error.status = 401;
    throw error;
  }
  const token = await jwt.sign({ id: response.rows[0].id }, JWT_SECRET);
  return { token };
};

// Find a user with a given token
const findUserWithToken = async (token) => {
  let id;
  try {
    const payload = await jwt.verify(token, JWT_SECRET);
    id = payload.id;
  } catch (ex) {
    const error = Error("not authorized");
    error.status = 401;
    throw error;
  }
  const SQL = `
  SELECT id, email FROM users WHERE id=$1;
  `;
  const response = await client.query(SQL, [id]);
  if (!response.rows.length) {
    const error = Error("not authorized");
    error.status = 401;
    throw error;
  }
  return response.rows[0];
};

const createProductsTable = async () => {
  const SQL = `
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(255) NOT NULL,
      price DECIMAL NOT NULL,
      description TEXT NOT NULL,
      image TEXT NOT NULL,
      quantity INTEGER NOT NULL
    );
  `;
  await client.query(SQL);
};

// Add a new product
async function addProduct(
  name,
  category,
  price,
  description,
  imageUrl,
  quantity
) {
  // Check if the product already exists
  const checkSQL = `
    SELECT * FROM products WHERE name = $1;
  `;
  const checkResponse = await client.query(checkSQL, [name]);
  if (checkResponse.rows.length > 0) {
    console.log(`Product with name ${name} already exists`);
    return;
  }

  // If not, insert the new product
  const SQL = `
    INSERT INTO products (name, category, price, description, image, quantity)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const values = [name, category, price, description, imageUrl, quantity];
  const result = await client.query(SQL, values);

  // Throw an error if the product couldn't be added
  if (result.rows.length === 0) {
    throw new Error("Error adding product");
  }

  return result.rows[0];
}

const assignCartToUser = async (user, cart) => {
  const SQL = `
    UPDATE cart 
    SET user_id = $1
    WHERE id = $2
    RETURNING *;
  `;

  const values = [user.id, cart.id];

  // Assuming 'client' is your PostgreSQL client
  const result = await client.query(SQL, values);

  return result.rows[0]; // Return the updated cart
};
// Define an async function to add products
async function addProducts() {
  await addProduct(
    "Basic Controller",
    "Controller",
    59.99,
    "High quality gaming controller.",
    "https://shorturl.at/cpJWX",
    100
  );
  await addProduct(
    "Controller with 2 Paddles",
    "Controller",
    119.99,
    "Gaming controller with 2 paddles.",
    "https://shorturl.at/bL359",
    100
  );
  await addProduct(
    "Controller with 4 Paddles",
    "Controller",
    219.99,
    "Gaming controller with 4 paddles.",
    "https://shorturl.at/qrvE8",
    100
  );
  await addProduct(
    "Gaming PC with 2070 GPU",
    "PC",
    1200.0,
    "High performance gaming PC.",
    "https://shorturl.at/ilrGV",
    50
  );
  await addProduct(
    "Gaming PC with 3070 GPU",
    "PC",
    2200.0,
    "High performance gaming PC with 2TB SSD.",
    "https://shorturl.at/uwNOX",
    50
  );
  await addProduct(
    "Gaming PC with 4070 GPU",
    "PC",
    4200.0,
    "High performance gaming PC with 4TB SSD.",
    "https://shorturl.at/cstU5",
    50
  );
  await addProduct(
    "Gaming Monitor",
    "Monitor",
    200.0,
    "24 inch gaming monitor.",
    "https://shorturl.at/iruU8",
    75
  );
  await addProduct(
    "27 inch Gaming Monitor",
    "Monitor",
    400.0,
    "27 inch gaming monitor.",
    "https://shorturl.at/lmEGX",
    75
  );
  await addProduct(
    "32 inch Gaming Monitor",
    "Monitor",
    800.0,
    "32 inch gaming monitor.",
    "https://tinyurl.com/24o53crt",
    75
  );
}

// Call the function
addProducts().catch(console.error);

// Exports
module.exports = {
  client,
  createUser,
  authenticate,
  findUserWithToken,
  fetchUsers,
  getUserById,
  register,
  fetchProducts,
  addProduct,
  createUserTable,
  createProductsTable,
  assignCartToUser,
  fetchAllUsers,
  getUserByEmail,
};
