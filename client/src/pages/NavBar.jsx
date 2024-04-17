import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "./UserProvider";

const NavBar = () => {
  const navigate = useNavigate();
  const { user, logout, isLoading } = useContext(UserContext);

  const handleLogout = () => {
    logout();
    navigate("/");
  };
  console.log("currentUser:", user);

  if (isLoading) {
    return <div>Loading...</div>;
  }
  return (
    <nav>
      <ul>
        {user && <li>Welcome, {user.username}!</li>}
        <li>
          <Link to="/">Store</Link>
        </li>
        {!user && (
          <>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
          </>
        )}
        {user && (
          <>
            <li>
              {user.isadmin ? (
                <Link to="/AdminAccount">Admin Account</Link>
              ) : (
                <Link to="/account">Account</Link>
              )}
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
