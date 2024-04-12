import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = ({ setToken, setEmail }) => {
  const [localEmail, setLocalEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: localEmail, password }),
      });
      if (!response.ok) {
        throw new Error("Failed to login");
      }
      const data = await response.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("email", data.email);
      setToken(data.token);
      setEmail(data.email);

      let cart = localStorage.getItem("cart");
      if (cart) {
        cart = JSON.parse(cart);
        // Assuming `userCart` is the user's cart from the server
        const userCart = [...userCart, ...cart];
        // Update the user's cart on the server
        await updateCartOnServer(userCart);
        // Clear the cart in local storage
        localStorage.removeItem("cart");
      }

      // Redirect to the account page
      navigate("/account");
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // If the token is present, set it in the state
      navigate("/account");
    }
  }, [navigate]);

  return (
    <div className="login">
      <h2 className="login-title">Login</h2>
      {error && <p className="login-error">{error}</p>}
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-field">
          <label className="form-label">Email</label>
          <input
            type="email"
            value={localEmail}
            onChange={(e) => setLocalEmail(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <div className="form-field">
          <label className="form-label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="form-submit-button"
        >
          {isLoading ? "Loading..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;
