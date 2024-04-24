const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { client } = require("./db");
const app = express();
app.use(express.json());

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

authRoutes.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: "An error occurred" });
});

module.exports = {
  authenticateUser,
  generateToken,
};
