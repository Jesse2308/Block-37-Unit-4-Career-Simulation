import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "./UserProvider";
import { useContext } from "react";

import "./Register.css";
const BASE_URL = "http://localhost:3000";

// Register component for user registration
const Register = () => {
  // State variables for form inputs and error message
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState("buyer"); // Default to 'buyer'
  const [error, setError] = useState(null);
  const { setToken } = useContext(UserContext);

  // useNavigate hook for redirecting users
  const navigate = useNavigate();

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    // Check if passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    console.log(
      `Email: ${email}, Password: ${password}, Account Type: ${accountType}`
    ); // Log the form data
    try {
      // Send a POST request to the /api/register endpoint
      const response = await fetch(`${BASE_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, accountType }), // Include accountType
      });
      console.log(
        `Response status: ${response.status}, Response ok: ${response.ok}`
      ); // Log the response status
      if (!response.ok) {
        throw new Error("Failed to register");
      }
      const data = await response.json(); // Extract data from the response
      console.log(`Response data: ${JSON.stringify(data)}`); // Log the response data
      if (!data.success) {
        throw new Error(data.message || "Registration failed"); // Use the server's error message if available
      }
      console.log("successfully registered");
      setToken(data.token); // Set the token state
      // Redirect to the login page after successful registration
      navigate("/login");
    } catch (error) {
      console.error(`Error: ${error.message}`); // Log the error message
      setError(error.message);
    }
  };

  // Render the registration form
  return (
    <div className="register">
      <h2 className="register-title">Register</h2>
      {error && <p className="register-error">{error}</p>}
      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-field">
          <label className="form-label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
        <div className="form-field">
          <label className="form-label">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <div className="form-field">
          <label className="form-label">Account Type</label>
          <div className="form-radio-group">
            <label className="form-radio-label">
              <input
                type="radio"
                value="buyer"
                checked={accountType === "buyer"}
                onChange={(e) => setAccountType(e.target.value)}
                className="form-radio-input"
              />
              Buyer
            </label>
            <label className="form-radio-label">
              <input
                type="radio"
                value="seller"
                checked={accountType === "seller"}
                onChange={(e) => setAccountType(e.target.value)}
                className="form-radio-input"
              />
              Seller
            </label>
          </div>
        </div>
        <button type="submit" className="form-submit-button">
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;
