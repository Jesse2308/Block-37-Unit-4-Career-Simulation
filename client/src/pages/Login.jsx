import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "./UserProvider";
import "./Login.css";

const Login = () => {
  const { user, login, isLoading } = useContext(UserContext);

  const [localEmail, setLocalEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(localEmail, password); // Use localEmail instead of email
      navigate("/account");
    } catch (error) {
      setError(error.message);
    }
  };

  // useEffect hook to handle redirection after user data is updated
  useEffect(() => {
    if (user) {
      if (user.isadmin) {
        navigate("/AdminAccount");
      } else {
        navigate("/account");
      }
    }
  }, [user, navigate]); // Add navigate to the dependency array

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
    </div>
  );
};

export default Login;
