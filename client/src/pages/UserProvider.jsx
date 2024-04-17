import { createContext, useState, useEffect } from "react";
const BASE_URL = "http://localhost:3000";

// Create a context for user data
export const UserContext = createContext();

// Fetch and update cart functions
const fetchUserCart = async (user_id) => {
  // Check if user_id is provided
  if (!user_id) {
    console.error("Missing user_id");
    return;
  }
  const response = await fetch(`${BASE_URL}/api/cart/${user_id}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();

  if (!data.cart || data.cart.length === 0) {
    console.log("User has no items in cart");
  } else {
    console.log(`Fetched user cart: ${JSON.stringify(data.cart)}`);
  }

  return data.cart;
};

const updateUserCart = async (user_id, cart) => {
  // Check if user_id and cart are provided
  if (!user_id || !cart) {
    console.error("Missing user_id or cart");
    return;
  }
  const response = await fetch(`${BASE_URL}/api/cart/${user_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id, cart }), // Send user_id and cart in the request body
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  console.log(`Updated user cart: ${JSON.stringify(data)}`);
  return data;
};
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
      const response = await fetch(`${BASE_URL}/api/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Response from /api/me:", response);

      if (response.ok) {
        const data = await response.json();
        console.log("Data retrieved from /api/me:", data);
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
  useEffect(() => {
    if (user && user.id) {
      updateUserCart(user.id, cart)
        .then(() => console.log("Cart updated on server"))
        .catch((error) => console.error("Error updating cart:", error));
    }
  }, [cart, user]);

  // When the component mounts, fetch the user data
  useEffect(() => {
    console.log("currentUser state in UserProvider:", user);
    fetchUserData();
  }, []);

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
  }, []);

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
        fetchUserData,
        fetchUserCart,
        updateUserCart,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
