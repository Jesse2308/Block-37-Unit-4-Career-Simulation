import React from "react";
import { Link, useNavigate } from "react-router-dom";

const NavBar = ({ token, logout, currentUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav>
      <ul>
        {token && currentUser && <li>Welcome, {currentUser.username}!</li>}
        <li>
          <Link to="/">Store</Link>
        </li>
        {!token && (
          <>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
          </>
        )}
        {token && (
          <>
            <li>
              <Link to="/account">Account</Link>
            </li>

            <button id="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </ul>
    </nav>
  );
};

export default NavBar;
