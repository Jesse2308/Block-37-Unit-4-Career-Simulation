const {
  client,
  createUserTable,
  createProductTable,
  createCartTable,
  createOrderTable,
  createOrderProductTable,
} = require("./db");

const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../client/dist/index.html"))
);
app.use(
  "/assets",
  express.static(path.join(__dirname, "../client/dist/assets"))
);

app.get("/api/products", async (req, res, next) => {
  try {
    const response = await client.query("SELECT * FROM products");
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

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
