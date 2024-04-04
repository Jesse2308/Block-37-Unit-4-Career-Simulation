const pg = require("pg");
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_jcomApp_db"
);

const bcrypt = require("bcrypt");

const register = async ({ username, password, email }) => {
  const SQL = `
    INSERT INTO users (username, password, email)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const hashedPassword = await bcrypt.hash(password, 10);
  const response = await client.query(SQL, [username, hashedPassword, email]);
  return response.rows[0];
};
const createUser = async ({ username, password }) => {
  const SQL = `
    INSERT INTO users(username, password) VALUES($1, $2) RETURNING *
  `;
  const hashedPassword = await bcrypt.hash(password, 5);
  const response = await client.query(SQL, [username, hashedPassword]);
  return response.rows[0];
};
const createUserTable = async () => {
  const SQL = `
    DROP TABLE IF EXISTS users CASCADE;
    CREATE TABLE Users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        is_guest BOOLEAN DEFAULT FALSE
    );
    `;

  await client.query(SQL);
};

const createProductTable = async () => {
  const SQL = `
    DROP TABLE IF EXISTS products CASCADE;
    CREATE TABLE Products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL CHECK (category IN ('Controller', 'PC', 'Monitor')),
        price DECIMAL(10, 2) NOT NULL,
        description TEXT,
        image VARCHAR(255),
        stock INT DEFAULT 0
    );
    `;
  await client.query(SQL);
};

const createCartTable = async () => {
  const SQL = `
    DROP TABLE IF EXISTS cart CASCADE;
    CREATE TABLE Cart (
        user_id INT,
        product_id INT,
        quantity INT NOT NULL,
        PRIMARY KEY(user_id, product_id),
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

const addProduct = async (name, category, price, description, image, stock) => {
  const SQL = `
    INSERT INTO Products (name, category, price, description, image, stock)
    VALUES ($1, $2, $3, $4, $5, $6);
    `;
  await client.query(SQL, [name, category, price, description, image, stock]);
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
    "Gaming Monitor",
    "Monitor",
    400.0,
    "27 inch gaming monitor.",
    "https://shorturl.at/lmEGX",
    75
  );
  await addProduct(
    "Gaming Monitor",
    "Monitor",
    800.0,
    "32 inch gaming monitor.",
    "https://tinyurl.com/24o53crt",
    75
  );
};

const authenticate = async ({ username, password }) => {
  const SQL = `
    SELECT id, username, password FROM users WHERE username=$1;
  `;
  const response = await client.query(SQL, [username]);
  if (
    !response.rows.length ||
    (await bcrypt.compare(password, response.rows[0].password)) === false
  ) {
    const error = Error("not authorized");
    error.status = 401;
    throw error;
  }
  const token = await jwt.sign({ id: response.rows[0].id }, JWT);
  return { token };
};

const findUserWithToken = async (token) => {
  let id;
  try {
    const payload = await jwt.verify(token, JWT);
    id = payload.id;
  } catch (ex) {
    const error = Error("not authorized");
    error.status = 401;
    throw error;
  }
  const SQL = `
    SELECT id, username FROM users WHERE id=$1;
  `;
  const response = await client.query(SQL, [id]);
  if (!response.rows.length) {
    const error = Error("not authorized");
    error.status = 401;
    throw error;
  }
  return response.rows[0];
};

const fetchUsers = async () => {
  const SQL = `
    SELECT id, username FROM users;
  `;
  const response = await client.query(SQL);
  return response.rows;
};

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
};
