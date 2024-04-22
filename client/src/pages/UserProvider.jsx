import { createContext, useState, useEffect } from "react";
const BASE_URL = "http://localhost:3000";

// Create a context for user data
export const UserContext = createContext();

const fetchUserCart = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/users/${userId}/cart`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const cart = await response.json();
    return cart;
  } catch (error) {
    console.error(`Error fetching cart: ${error}`);
  }
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
  const [cart, setCart] = useState([]);

  // Load cart from local storage when user data changes
  useEffect(() => {
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
        setCart(parsedCart);
      }
    } else {
      console.log("No cart found in local storage. Initializing empty cart.");
      setCart([]);
    }
  }, [user]);
  // Function to add a product to the cart
  const addToCart = (product) => {
    // Create a new cart item
    const newItem = { product_id: product.id, quantity: 1 };

    // Check if the product is already in the cart
    const existingItem = cart.find((item) => item.product_id === product.id);

    if (existingItem) {
      // If the product is already in the cart, increase the quantity
      existingItem.quantity += 1;
    } else {
      // If the product is not in the cart, add the new item
      setCart((prevCart) => [...prevCart, newItem]);
    }

    // If the user is logged in, update the cart on the server
    if (user && user.id) {
      updateUserCart(user.id, cart);
    }
  };
  const updateUserCart = async (
    user_id,
    product_id,
    method = "PUT",
    body = null
  ) => {
    if (Array.isArray(user_id)) {
      console.log("Invalid user id:", user_id);
      return;
    }

    console.log("Updating cart for user with id:", user_id);
    console.log("Updated cart:", body);

    if (user_id === "guest") {
      // Handle cart operations for guest users
      let guestCart = localStorage.getItem("guestCart");
      guestCart = guestCart ? JSON.parse(guestCart) : [];
      if (method === "DELETE") {
        guestCart = guestCart.filter((item) => item.product_id !== product_id);
      } else if (method === "PUT") {
        const itemIndex = guestCart.findIndex(
          (item) => item.product_id === product_id
        );
        if (itemIndex !== -1) {
          guestCart[itemIndex].quantity = body.quantity;
        } else {
          guestCart.push({ product_id: product_id, quantity: body.quantity });
        }
      }
      localStorage.setItem("guestCart", JSON.stringify(guestCart));
      return guestCart;
    } else {
      // Handle cart operations for logged-in users
      try {
        const response = await fetch(
          `${BASE_URL}/api/users/${user_id}/cart/${product_id}`,
          {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : null,
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        let data;
        if (method !== "DELETE") {
          data = await response.json();
          console.log(`Updated user cart: ${JSON.stringify(data)}`);
        }

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
        addToCart,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
export default UserProvider;
