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
  const [localEmail, setLocalEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const updateCartOnServer = async (cart, userData) => {
    try {
      const response = await fetch(`/api/cart/${userData.user.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cart),
      });
      if (!response.ok) {
        throw new Error("There was an issue updating the cart on the server.");
      }
      const cartData = await response.json();
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const validateInputs = () => {
    // Validate email
    if (!localEmail) {
      setError("Email is required");
      return false;
    } else if (!/\S+@\S+\.\S+/.test(localEmail)) {
      setError("Email is invalid");
      return false;
    }

    // Validate password
    if (!password) {
      setError("Password is required");
      return false;
    } else if (password.length < 3) {
      setError("Password must be at least 3 characters");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    if (!validateInputs()) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: localEmail, password }),
      });

      if (!response.ok) {
        throw new Error(`There was an issue logging in. Please try again.`);
      }
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        throw new Error("Unexpected server response. Please try again.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("email", data.email);
      setToken(data.token);
      setEmail(data.email);
      await fetchUserData(data.token);
      await handleCart(data);
      // Redirect to the account page
      navigate("/account");
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserData = async (token) => {
    // Fetch the current user's data
    const userResponse = await fetch("/api/user", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!userResponse.ok) {
      throw new Error("There was an issue fetching user data.");
    }
    const userContentType = userResponse.headers.get("content-type");
    let userData;
    if (userContentType && userContentType.includes("application/json")) {
      userData = await userResponse.json();
      setCurrentUser(userData); // Set the currentUser state
    } else {
      throw new Error("Unexpected server response. Please try again.");
    }
  };

  const handleCart = async (data) => {
    let cart = localStorage.getItem("cart");
    let mergedCart;
    if (cart && data.user) {
      cart = JSON.parse(cart);
      const cartResponse = await fetch(`/api/cart/${data.user.id}`);
      if (!cartResponse.ok) {
        throw new Error("There was an issue fetching the cart.");
      }
      const cartData = await cartResponse.json();
      const userCart = Array.isArray(cartData) ? cartData : [];
      mergedCart = [...userCart, ...cart];
      if (mergedCart.length > 0) {
        await updateCartOnServer({ cart: mergedCart }, data);
      }
      localStorage.removeItem("cart");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin();
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // If the token is present, set it in the state
      navigate("/account");
    }
  }, []);

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
