import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";

const Register = ({ token, setToken }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState("buyer"); // Default to 'buyer'
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const response = await fetch("http://localhost:3000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, accountType }), // Include accountType
      });
      if (!response.ok) {
        throw new Error("Failed to register");
      }
      console.log("successfully registered");
      navigate("/login");
    } catch (error) {
      setError(error.message);
    }
  };

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
