import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { useContext } from "react";
import { UserContext } from "./UserProvider";
const BASE_URL = "http://localhost:3000";

// Login component for user login
const Login = () => {
  // useContext hook to get the user data and functions from the UserContext
  const {
    user,
    setCurrentUser,
    token,
    setToken,
    email,
    setEmail,
    cart,
    setCart,
    fetchUserCart,
    updateUserCart,
  } = useContext(UserContext);
  // State variables for form inputs and loading/error states
  const [localEmail, setLocalEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // useNavigate hook for redirecting users
  const navigate = useNavigate();

  // Function to handle login
  const login = async (username, password) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: username,
          password: password,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Login data:", data);
      if (data.userId) {
        setCurrentUser((prevUser) => {
          const newUser = {
            id: data.userId,
            email: data.email,
            isadmin: data.isadmin,
          };
          console.log("newUser:", newUser);

          if (newUser.isadmin) {
            console.log("Admin is being sent to AdminAccount");
            navigate("/AdminAccount");
            console.log("Should have navigated to /AdminAccount");
          } else {
            console.log("Navigating to /account");
            navigate("/account");
            console.log("Should have navigated to /account");
          }
          return newUser;
        });
        setToken(data.token);
        // Save the token in local storage
        localStorage.setItem("token", data.token);
        setEmail(data.email);
        // Get the user's cart from the server
        const userCart = await fetchUserCart(data.userId);
        // Get the guest's cart from local storage
        const guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];
        // Merge the guest's cart with the user's cart
        const mergedCart = [...userCart, ...guestCart];
        // Update the user's cart on the server
        await updateUserCart(data.userId, mergedCart);
        // Update the cart in the state
        setCart(mergedCart);
        // Clear the guest's cart from local storage
        localStorage.removeItem("guestCart");
      } else {
        throw new Error("User data is not available");
      }
      setIsLoading(false);
    } catch (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  // Function to handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    login(localEmail, password);
  };

  // useEffect hook to handle redirection after login
  useEffect(() => {
    const token = localStorage.getItem("token");
    // If the token is present, set it in the state
    if (token) {
      if (user && user.isadmin) {
        navigate("/AdminAccount");
      } else {
        navigate("/account");
      }
    }
  }, [user]);

  // useEffect hook to handle redirection after user data is updated
  useEffect(() => {
    if (user) {
      if (user.isadmin) {
        navigate("/AdminAccount");
      } else {
        navigate("/account");
      }
    }
  }, [user]);

  // Render the login form
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
      {/* Temporary button to test navigate
      <button onClick={() => navigate("/AdminAccount")}>
        Test navigate to AdminAccount
      </button> */}
    </div>
  );
};

export default Login;
