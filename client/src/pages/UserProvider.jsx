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
  let data = await response.json();

  // If the server responds with an object without a 'cart' property or an empty array, return an empty array
  if (!Array.isArray(data)) {
    data = [data];
  }

  console.log(`Fetched user cart: ${JSON.stringify(data)}`);
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
    let savedCart;
    if (user && user.id) {
      savedCart = localStorage.getItem(`userCart_${user.id}`);
    } else {
      savedCart = localStorage.getItem("guestCart");
    }

    if (savedCart && savedCart !== "undefined") {
      const parsedCart = JSON.parse(savedCart);
      if (Array.isArray(parsedCart)) {
        console.log("Loaded cart from local storage:", parsedCart);
        return parsedCart;
      }
    }

    console.log("No cart found in local storage. Initializing empty cart.");
    return [];
  });

  const updateUserCart = async (user_id, cart) => {
    const cartArray = Array.isArray(cart) ? cart : [cart];
    const updatedCart = cartArray.map((item) => ({
      product_id: String(item.id),
      quantity: Number.isInteger(item.quantity) ? item.quantity : 1,
    }));
    console.log("Updating cart for user with id:", user_id);
    console.log("Updated cart:", updatedCart);

    // Get the cart id for the user
    const cartResponse = await fetch(`${BASE_URL}/api/cart/${user_id}`);
    const cartData = await cartResponse.json();
    if (cartData.cart) {
      const cartId = cartData.cart.id;
      console.log(`Cart ID for user with id ${user_id}: ${cartId}`);

      try {
        const response = await fetch(`${BASE_URL}/api/cart/${cartId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedCart),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Updated user cart: ${JSON.stringify(data)}`);
        return data;
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  // Function to fetch user data
  const fetchUserData = async () => {
    const tokenFromLocalStorage = localStorage.getItem("token");

    console.log("Token retrieved from localStorage:", tokenFromLocalStorage);

    if (!tokenFromLocalStorage) {
      console.log("No token in localStorage");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/me`, {
        headers: {
          Authorization: `Bearer ${tokenFromLocalStorage}`,
        },
      });

      console.log("Response from /api/me:", response);

      if (response.ok) {
        const data = await response.json();
        console.log("Data retrieved from /api/me:", data);
        setCurrentUser(data.user);
        setToken(tokenFromLocalStorage); // Set the token state with the token from local storage
        setIsLoading(false);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error in fetchUserData:", error);
      setIsLoading(false);
    }
  };

  // When the component mounts, fetch the user data and update the cart
  useEffect(() => {
    console.log("currentUser state in UserProvider:", user);
    fetchUserData();

    if (user && user.id && cart) {
      console.log(`Updating cart for user with id ${user.id}:`, cart);
      updateUserCart(user.id, cart);
    }
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
    localStorage.removeItem(`userCart_${user.id}`);
    // Add any other logout logic you need
  };

  // Update the token in local storage whenever the token state changes
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

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
