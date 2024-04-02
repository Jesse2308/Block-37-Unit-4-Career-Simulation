import React from "react";
import { Link } from "react-router-dom";

const NavBar = ({ token, username, logout }) => {
  return (
    <nav>
      <ul>
        {token && <li>Welcome, {username}!</li>}
        <li>
          <Link to="/">Home</Link>
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
            <li>
              <button onClick={logout}>Logout</button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default NavBar;
