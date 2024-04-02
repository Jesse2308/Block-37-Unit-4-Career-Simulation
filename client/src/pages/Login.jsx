import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = ({ setToken, setUsername }) => {
  const [localUsername, setLocalUsername] = useState("");
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
        body: JSON.stringify({ username: localUsername, password }),
      });
      if (!response.ok) {
        throw new Error("Failed to login");
      }
      const data = await response.json();
      console.log("Response data:", data); // Add this line
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      console.log("Token in local storage:", localStorage.getItem("token")); // Add this line
      console.log(
        "Username in local storage:",
        localStorage.getItem("username")
      ); // Add this line
      setToken(data.token);
      setUsername(data.username);

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
    <div>
      <h2>Login</h2>
      {error && <p>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username</label>
          <input
            type="text"
            value={localUsername}
            onChange={(e) => setLocalUsername(e.target.value)}
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
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Loading..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;
