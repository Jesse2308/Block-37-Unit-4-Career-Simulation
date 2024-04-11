import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <div>
      <h2>Register</h2>
      {error && <p>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Account Type</label>
          <div>
            <label>
              <input
                type="radio"
                value="buyer"
                checked={accountType === "buyer"}
                onChange={(e) => setAccountType(e.target.value)}
              />
              Buyer
            </label>
            <label>
              <input
                type="radio"
                value="seller"
                checked={accountType === "seller"}
                onChange={(e) => setAccountType(e.target.value)}
              />
              Seller
            </label>
          </div>
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
