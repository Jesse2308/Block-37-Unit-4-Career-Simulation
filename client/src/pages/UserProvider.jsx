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

  // If the server responds with an object without a 'cart' property or an empty array, return an empty array
  if (!data.cart) {
    console.log("User has no items in cart");
    return [];
  } else {
    console.log(`Fetched user cart: ${JSON.stringify(data.cart)}`);
    return data.cart;
  }
};

const updateUserCart = async (user_id, cart) => {
  // Check if user_id is provided and cart is an array
  if (!user_id || !Array.isArray(cart)) {
    console.error("Missing or invalid user_id or cart");
    return;
  }

  console.log(
    "cart items:",
    cart.map((item) => ({ id: item.id, quantity: item.quantity }))
  );
  console.log("cart:", cart);

  const response = await fetch(`${BASE_URL}/api/cart/${user_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: user_id,
      cart: cart.reduce((acc, item) => {
        // Check if item.id and item.quantity are valid
        if (!item.id || !Number.isInteger(item.quantity)) {
          return acc;
        }

        acc.push({
          product_id: String(item.id),
          quantity: String(item.quantity),
        });

        return acc;
      }, []),
    }),
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
    if (user && user.id && cart) {
      // Transform cart items to have the expected structure
      const transformedCart = cart.map((item) => ({
        product_id: String(item.id), // Convert product_id to a string
        quantity: Number.isInteger(item.quantity) ? item.quantity : 1,
      }));

      updateUserCart(user.id, transformedCart)
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
