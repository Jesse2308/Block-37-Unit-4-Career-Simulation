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
  const fetchUserData = async () => {
    const token = localStorage.getItem("token"); // replace this with the actual way you're storing the token

    console.log("Token retrieved from localStorage:", token);

    if (!token) {
      console.error("No token in localStorage");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5173/api/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Response from /api/user:", response);

      if (response.ok) {
        const data = await response.json();
        console.log("Data retrieved from /api/user:", data);
        setCurrentUser(data.user);
        setIsLoading(false);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error in fetchUserData:", error);
      setIsLoading(false);
    }
  };

  // When the component mounts, fetch the user data
  useEffect(() => {
    console.log("currentUser state in UserProvider:", user);
    fetchUserData();
  }, [user]);

  // Function to log out
  const logout = () => {
    console.log("Logging out...");
    // Clear user from state
    setCurrentUser(null);
    // Clear token from state
    setToken(null);
    // Clear local storage
    localStorage.removeItem("token");
    localStorage.removeItem("cart");
    // Add any other logout logic you need
  };

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
