import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "./UserProvider";

// NavBar component for the navigation bar
const NavBar = () => {
  // useNavigate hook for redirecting users
  const navigate = useNavigate();
  // useContext hook to get the user data and logout function from the UserContext
  const { user, logout, isLoading } = useContext(UserContext);

  // Function to handle logout
  const handleLogout = () => {
    logout();
    // Redirect to the home page after logout
    navigate("/");
  };
  console.log("currentUser:", user);

  // If the user data is still loading, display a loading message
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Render the navigation links
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
