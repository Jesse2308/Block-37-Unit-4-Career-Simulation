import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { useContext } from "react";
import { UserContext } from "./UserProvider";

const Login = () => {
  const {
    user,
    setCurrentUser,
    token,
    setToken,
    email,
    setEmail,
    cart,
    setCart,
  } = useContext(UserContext);
  console.log("setCurrentUser function in Login:", setCurrentUser);
  console.log("currentUser state in Login:", user);
  const [localEmail, setLocalEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const updateCartOnServer = async (cart, userData) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/cart/${userData.user.id}`,
        {
          method: "POST", // or 'POST'
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cart),
        }
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const cartData = await response.json();
      console.log(response);
      console.log(cartData);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    // Validate email
    if (!localEmail) {
      setError("Email is required");
      return;
    } else if (!/\S+@\S+\.\S+/.test(localEmail)) {
      setError("Email is invalid");
      return;
    }

    // Validate password
    if (!password) {
      setError("Password is required");
      return;
    } else if (password.length < 3) {
      setError("Password must be at least 3 characters");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      console.log(`Email: ${localEmail}, Password: ${password}`);
      const response = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: localEmail, password }),
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
        console.log(data);
      } else {
        console.error("Unexpected response:", await response.text());
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("email", data.email);
      setToken(data.token);
      setEmail(data.email);
      // Fetch the current user's data
      const userResponse = await fetch("/api/user", {
        headers: {
          Authorization: `Bearer ${data.token}`,
        },
      });
      if (!userResponse.ok) {
        throw new Error("Network response was not ok");
      }
      const userContentType = userResponse.headers.get("content-type");
      let userData;
      if (userContentType && userContentType.includes("application/json")) {
        userData = await userResponse.json();
        console.log("User data fetched:", userData);
        setCurrentUser(userData); // Set the currentUser state
      } else {
        console.error("Unexpected response:", await userResponse.text());
      }
      // Set the currentUser state
      setCurrentUser(userData);
      let cart = localStorage.getItem("cart");
      let mergedCart;
      if (cart && data.user) {
        cart = JSON.parse(cart);
        // Fetch the user's cart from the server
        const cartResponse = await fetch(
          `http://localhost:3000/api/cart/${data.user.id}`
        );
        if (!cartResponse.ok) {
          throw new Error("Network response was not ok");
        }
        const cartData = await cartResponse.json();
        const userCart = Array.isArray(cartData) ? cartData : [];
        // Merge the local cart with the user's cart from the server
        mergedCart = [...userCart, ...cart];
        // Update the user's cart on the server
        await updateCartOnServer({ cart: mergedCart }, data);
        // Clear the cart in local storage
        localStorage.removeItem("cart");
      }
      // Redirect to the account page
      navigate("/account");
    } catch (error) {
      console.error("Fetch error:", error);
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
