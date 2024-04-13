import { createContext, useState, useEffect } from "react";

// Create a context for user data
export const UserContext = createContext();

// This component provides user data to its children
export const UserProvider = ({ children }) => {
  // User state
  const [user, setCurrentUser] = useState(null);
  // Token state
  const [token, setToken] = useState(null);
  // Email state
  const [email, setEmail] = useState(null);
  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Cart state
  const [cart, setCart] = useState(() => {
    // Try to load the cart from local storage
    let savedCart = localStorage.getItem("cart");
    if (savedCart && savedCart !== "undefined") {
      return JSON.parse(savedCart);
    } else {
      return [];
    }
  });

  // Function to fetch user data
  const fetchUserData = () => {
    return new Promise((resolve, reject) => {
      // Get the token from local storage
      const token = localStorage.getItem("token");
      if (!token) {
        reject("No token found");
        return;
      }
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      // Fetch the user data
      fetch("/api/user", {
        headers,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log("Fetched data:", data);
          if (data.success) {
            resolve(data.user);
          } else {
            reject("Failed to fetch user");
          }
        })
        .catch((error) => reject(error));
    });
  };

  // Function to log out
  const logout = () => {
    // Clear user from state
    setCurrentUser(null);
    // Clear token from state
    setToken(null);
    // Clear local storage
    localStorage.removeItem("token");
    localStorage.removeItem("cart");
    // Add any other logout logic you need
  };

  // When the component mounts, fetch the user data
  useEffect(() => {
    console.log("currentUser state in UserProvider:", user);
    fetchUserData()
      .then((userData) => {
        setCurrentUser(userData); // Set the user data
        console.log("User data fetched:", userData);
        setIsLoading(false); // Set loading to false when the data is fetched
      })
      .catch((error) => {
        console.error(error);
        setIsLoading(false);
      });
  }, []);

  // Log the current user's ID whenever the user state changes
  useEffect(() => {
    console.log("Current user ID in UserProvider:", user ? user.id : "No user");
  }, [user]);

  // Provide the user data to children
  return (
    <UserContext.Provider
      value={{
        user,
        setCurrentUser,
        logout,
        isLoading,
        token,
        setToken,
        email,
        setEmail,
        cart,
        setCart,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
