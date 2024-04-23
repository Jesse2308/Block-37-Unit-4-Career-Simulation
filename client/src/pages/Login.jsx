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

  const handleSubmit = (e) => {
    e.preventDefault();
    login(localEmail, password).catch(setError);
  };

  useEffect(() => {
    if (user) {
      navigate(user.isadmin ? "/AdminAccount" : "/account");
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
