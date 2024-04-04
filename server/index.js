const {
  client,
  createUserTable,
  createProductTable,
  createCartTable,
  createOrderTable,
  createOrderProductTable,
} = require("./db");

const express = require("express");
const cors = require("cors");
const app = express();
app.use(express.json());
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const path = require("path");
app.use(cors());
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../client/dist/index.html"))
);
app.use(
  "/assets",
  express.static(path.join(__dirname, "../client/dist/assets"))
);

app.get("/api/user", async (req, res, next) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization.split(" ")[1];

    // Verify the token
    const payload = jwt.verify(token, "your_secret_key");

    // Find the user with the userId from the token's payload
    const SQL = `
        SELECT * FROM users WHERE id = $1;
        `;
    const response = await client.query(SQL, [payload.userId]);

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

app.put("/api/user", async (req, res, next) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization.split(" ")[1];

    // Verify the token
    const payload = jwt.verify(token, "your_secret_key");

    // Extract the updated user data from the request body
    const { username, email } = req.body;

    // Update the user with the userId from the token's payload
    const SQL = `
        UPDATE users
        SET username = $1, email = $2
        WHERE id = $3
        RETURNING *;
        `;
    const response = await client.query(SQL, [username, email, payload.userId]);

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
// This endpoint handles user login.
// It takes a username and password from the request body,
// finds the user with the given username in the database,
// and checks if the given password matches the user's password.
// If the password is correct, it generates a JWT and sends it in the response.
// If the password is incorrect or the user is not found, it sends an error message.
app.post("/api/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const SQL = `
        SELECT * FROM users WHERE username = $1;
        `;
    const response = await client.query(SQL, [username]);
    if (response.rows.length > 0) {
      const user = response.rows[0];
      if (await bcrypt.compare(password, user.password)) {
        // Generate a token
        const token = jwt.sign({ userId: user.id }, "your_secret_key", {
          expiresIn: "1h",
        });
        res.send({
          success: true,
          userId: user.id,
          token,
          username: user.username,
        });
      } else {
        res.status(401).send({ success: false, message: "Invalid password" });
      }
    } else {
      res.status(404).send({ success: false, message: "User not found" });
    }
  } catch (error) {
    next(error);
  }
});
// This endpoint handles user registration.
// It takes a username and password from the request body,
// hashes the password, and inserts a new user into the database with the given username and hashed password.
// It then sends the new user in the response.
app.post("/api/register", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const SQL = `
        INSERT INTO users (username, password)
        VALUES ($1, $2)
        RETURNING *;
        `;
    const response = await client.query(SQL, [username, hashedPassword]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});
// This endpoint fetches all products.
// It sends a query to the database to select all products,
// and then sends the products in the response.
app.get("/api/products", async (req, res, next) => {
  try {
    const response = await client.query("SELECT * FROM products");
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/products/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const SQL = `
        SELECT * FROM products
        WHERE id = $1;
        `;
    const response = await client.query(SQL, [id]);
    if (response.rows.length > 0) {
      res.send(response.rows[0]);
    } else {
      res.status(404).send({ message: "Product not found" });
    }
  } catch (error) {
    next(error);
  }
});

// This endpoint allows a user to add a product to their cart.
// It takes a user_id, product_id, and quantity from the request body,
// and inserts a new record into the cart table with these values.
app.post("/api/cart", async (req, res, next) => {
  try {
    const { user_id, product_id, quantity } = req.body;
    const SQL = `
        INSERT INTO cart (user_id, product_id, quantity)
        VALUES ($1, $2, $3)
        RETURNING *;
        `;
    const response = await client.query(SQL, [user_id, product_id, quantity]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});
// This endpoint allows a user to view the products in their cart.
// It takes a user_id from the request parameters, and fetches all records
// from the cart table where the user_id matches the provided user_id.
// It joins the cart and products tables to get the details of the products in the cart.
app.get("/api/cart/:user_id", async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const SQL = `
        SELECT * FROM cart
        JOIN products
        ON cart.product_id = products.id
        WHERE user_id = $1;
        `;
    const response = await client.query(SQL, [user_id]);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});
// This endpoint allows a user to remove a product from their cart.
// It takes a user_id and product_id from the request parameters,
// and deletes the record from the cart table where the user_id and product_id
// match the provided user_id and product_id.
app.delete("/api/cart/:user_id/:product_id", async (req, res, next) => {
  try {
    const { user_id, product_id } = req.params;
    const SQL = `
        DELETE FROM cart
        WHERE user_id = $1
        AND product_id = $2
        RETURNING *;
        `;
    const response = await client.query(SQL, [user_id, product_id]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});
// This endpoint creates a new order.
// It takes a user_id and total from the request body,
// and inserts a new record into the orders table with these values.
// The new order is then returned in the response.
app.post("/api/order", async (req, res, next) => {
  try {
    const { user_id, total } = req.body;
    const SQL = `
        INSERT INTO orders (user_id, total)
        VALUES ($1, $2)
        RETURNING *;
        `;
    const response = await client.query(SQL, [user_id, total]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// This endpoint fetches all orders for a specific user.
// It takes a user_id from the request parameters, and fetches all records
// from the orders table where the user_id matches the provided user_id.
app.get("/api/orders/:user_id", async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const SQL = `
        SELECT * FROM orders
        WHERE user_id = $1;
        `;
    const response = await client.query(SQL, [user_id]);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

// This endpoint adds a product to an order.
// It takes an order_id, product_id, and quantity from the request body,
// and inserts a new record into the order_products table with these values.
// The new order_product is then returned in the response.
app.post("/api/order_product", async (req, res, next) => {
  try {
    const { order_id, product_id, quantity } = req.body;
    const SQL = `
        INSERT INTO order_products (order_id, product_id, quantity)
        VALUES ($1, $2, $3)
        RETURNING *;
        `;
    const response = await client.query(SQL, [order_id, product_id, quantity]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send({ error: err.message });
});
const init = async () => {
  const PORT = process.env.PORT || 3000;
  await client.connect();
  console.log("Connected to database");

  await createUserTable();
  await createProductTable();
  await createCartTable();
  await createOrderTable();
  await createOrderProductTable();
  console.log("Tables created");

  app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
};
init();
