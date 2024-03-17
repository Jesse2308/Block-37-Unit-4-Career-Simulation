const pg = require("pg");
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_jcomApp_db"
);

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
};

module.exports = {
  client,
  createUserTable,
  createProductTable,
  createCartTable,
  createOrderTable,
  createOrderProductTable,
};