// Dependencies
const pg = require("pg");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

// Constants
const JWT_SECRET = process.env.JWT_SECRET;

// Database client
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_jcomApp_db"
);

// User related functions
const createUser = async ({ email, password, isAdmin = false }) => {
  const SQL = `
    INSERT INTO users(email, password, isAdmin) VALUES($1, $2, $3) RETURNING *
  `;
  const hashedPassword = await bcrypt.hash(password, 5);

  // Log the values
  console.log(
    `email: ${email}, hashedPassword: ${hashedPassword}, isAdmin: ${isAdmin}`
  );

  const response = await client.query(SQL, [email, hashedPassword, isAdmin]);
  return response.rows[0];
};

async function createAdminAccount() {
  try {
    const admin = await createUser({
      email: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASS,
      isAdmin: true,
      accountType: "admin",
    });

    console.log("Admin account created:", admin);
  } catch (error) {
    console.error("Error creating admin account:", error);
  }
}

// Call createAdminAccount when the application starts
createAdminAccount();

const register = async ({ email, password, isAdmin = false }) => {
  // Check if a user with the given email already exists
  const checkSQL = `
    SELECT * FROM users WHERE email = $1;
  `;
  const checkResponse = await client.query(checkSQL, [email]);
  if (checkResponse.rows.length > 0) {
    throw new Error("A user with this email already exists");
  }

  // If not, insert the new user
  const user = await createUser({ email, password, isAdmin });

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
    text: `Please verify your email address by clicking the following link: http://localhost:5173/verify-email?token=${user.emailToken}`,
  };
  await transporter.sendMail(mailOptions);

  return user;
};

const isAdmin = async (userId) => {
  const SQL = `
    SELECT isAdmin FROM users WHERE id=$1;
  `;
  const response = await client.query(SQL, [userId]);
  if (!response.rows.length || !response.rows[0].isAdmin) {
    const error = Error("not authorized");
    error.status = 401;
    throw error;
  }
  return true;
};

// Admin account creation
async function createAdminAccount() {
  try {
    const admin = await createUser({
      email: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASS,
      isAdmin: true,
    });

    console.log("Admin account created:", admin);
  } catch (error) {
    console.error("Error creating admin account:", error);
  }
}

function setupRoutes(app) {
  app.get("/admin/products", adminOnly, async (req, res) => {
    const products = await fetchProducts();
    res.json(products);
  });
}

// Middleware
const adminOnly = async (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  const user = await findUserWithToken(token);
  if (!user.isAdmin) {
    const error = Error("not authorized");
    error.status = 401;
    throw error;
  }
  next();
};
const fetchProducts = async () => {
  const SQL = `
  SELECT * FROM products;
  `;
  const response = await client.query(SQL);
  return response.rows;
};
const editProduct = async (productId, productData) => {
  const { name, category, price, description, image, stock } = productData;
  const SQL = `
  UPDATE products
  SET name = $1, category = $2, price = $3, description = $4, image = $5, stock = $6
  WHERE id = $7
  RETURNING *;
  `;
  const response = await client.query(SQL, [
    name,
    category,
    price,
    description,
    image,
    stock,
    productId,
  ]);
  return response.rows[0];
};

const fetchUsers = async () => {
  const SQL = `
  SELECT * FROM users;
  `;
  const response = await client.query(SQL);
  return response.rows;
};

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
const fetchuserAdmin = async () => {
  const SQL = `
  SELECT id, email FROM users;
  `;
  const response = await client.query(SQL);
  return response.rows;
};

// Table creation functions
const createUserTable = async () => {
  const SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    accountType VARCHAR(255) NOT NULL,
    emailToken VARCHAR(255),
    verified BOOLEAN DEFAULT false,
    isAdmin BOOLEAN DEFAULT false
  );
  `;
  await client.query(SQL);
};
const createGuestCartTable = async () => {
  const SQL = `
    CREATE TABLE IF NOT EXISTS guest_cart (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL
    );
  `;
  await client.query(SQL);
};

async function createProductTableWithSeller() {
  try {
    const SQL = `
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      details TEXT,
      quantity INT NOT NULL,
      seller_id INT REFERENCES users(id)
    );
    `;
    await client.query(SQL);
    console.log("Created products table with seller");
  } catch (error) {
    console.error("Error creating products table with seller", error);
    throw error;
  }
}

const createProductTable = async () => {
  const SQL = `
  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    details TEXT,
    quantity INTEGER NOT NULL,
    seller_id INTEGER REFERENCES users(id)
  );
  `;
  await client.query(SQL);
};

const createCartTable = async () => {
  const SQL = `
  DROP TABLE IF EXISTS cart CASCADE;
  CREATE TABLE Cart (
    cart_id SERIAL PRIMARY KEY,
    user_id INT,
    product_id INT,
    quantity INT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES Users(id),
    FOREIGN KEY(product_id) REFERENCES Products(id)
  );
  `;
  await client.query(SQL);
};

const createOrderTable = async () => {
  const SQL = `
  DROP TABLE IF EXISTS orders CASCADE;
  CREATE TABLE Orders (
    id SERIAL PRIMARY KEY,
    user_id INT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10, 2),
    FOREIGN KEY(user_id) REFERENCES Users(id)
  );
  `;
  await client.query(SQL);
};

const createOrderProductTable = async () => {
  const SQL = `
  DROP TABLE IF EXISTS OrderItems CASCADE;
  CREATE TABLE OrderItems ( 
    order_id INT,
    product_id INT,
    quantity INT NOT NULL,
    PRIMARY KEY(order_id, product_id),
    FOREIGN KEY(order_id) REFERENCES Orders(id),
    FOREIGN KEY(product_id) REFERENCES Products(id)
  );
  `;
  await client.query(SQL);

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
};

const addProduct = async (name, category, price, description, image, stock) => {
  // Check if a product with the same name already exists
  const checkSQL = `
  SELECT * FROM products WHERE name = $1;
  `;
  const checkResponse = await client.query(checkSQL, [name]);
  if (checkResponse.rows.length > 0) {
    console.log(`Product with name ${name} already exists.`);
    return;
  }

  // If not, insert the new product
  const SQL = `
  INSERT INTO Products (name, category, price, description, image, stock)
  VALUES ($1, $2, $3, $4, $5, $6);
  `;
  await client.query(SQL, [name, category, price, description, image, stock]);

  // Log that the product was added
  console.log(`Added product: ${name}`);
};

const deleteProduct = async (productId, sellerId) => {
  const SQL = `
  DELETE FROM products
  WHERE id = $1 AND seller_id = $2;
  `;
  await client.query(SQL, [productId, sellerId]);
};

const deleteDuplicates = async () => {
  const query = `
  DELETE FROM products
  WHERE id IN (
    SELECT id
    FROM (
      SELECT id,
      ROW_NUMBER() OVER( PARTITION BY name, details ORDER BY id ) AS row_num
      FROM products
    ) t
    WHERE t.row_num > 1
  );
  `;

  try {
    const res = await client.query(query);
    console.log("Duplicates deleted successfully");
  } catch (err) {
    console.error("Error deleting duplicates:", err);
  }
};

// Column addition functions
const addDetailsColumn = async () => {
  const SQL = `
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS details TEXT;
  `;
  await client.query(SQL);
};

const addQuantityColumn = async () => {
  await client.query(
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0 NOT NULL;"
  );
  console.log("Quantity column added successfully.");
};

const addSellerIdColumn = async () => {
  const SQL = `
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS seller_id INTEGER REFERENCES users(id);
  `;
  await client.query(SQL);
};

// Execute column addition functions
(async () => {
  try {
    await addQuantityColumn();
    await addSellerIdColumn();
    await deleteDuplicates();
    await createAdminAccount();
    await createOrderProductTable();
    await createGuestCartTable();
  } catch (err) {
    console.error(err);
  }
})();

createOrderProductTable().catch((err) =>
  console.error("Error creating order product table:", err.stack)
);

// Exports
module.exports = {
  client,
  createUserTable,
  createProductTable,
  createCartTable,
  createOrderTable,
  createOrderProductTable,
  addProduct,
  createUser,
  authenticate,
  findUserWithToken,
  fetchUsers,
  register,
  createProductTableWithSeller,
  addDetailsColumn,
  addQuantityColumn,
  deleteProduct,
  isAdmin,
  fetchProducts,
  editProduct,
  fetchuserAdmin,
  setupRoutes,
  createGuestCartTable,
};
