import { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

const BASE_URL = "http://localhost:3000";

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [setToken] = useState(null);

  const setCurrentUser = (userData) => {
    setUser(userData);
  };

  const login = async (email, password) => {
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log("Response data:", data);

    if (data && data.user && data.user.token) {
      localStorage.setItem("token", data.user.token);
      const user = await fetchUser(); // Fetch user details after login
      return user; // Return the user data
    } else {
      throw new Error("No token received");
    }
  };

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response data from /api/me:", data);
      if (data.user && data.user.id) {
        const user = {
          id: data.user.id,
          email: data.user.email,
          isadmin: data.user.isadmin,
        };
        setUser(user);
        return user; // Return the user data
      } else {
        throw new Error("User data is not available");
      }
    } catch (error) {
      setError(error.message);
      throw error; // Re-throw the error
    } finally {
      setIsLoading(false);
    }
  };

  // Update user details
  const updateUser = (username) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("No token found");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    fetch(`${BASE_URL}/api/user`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ username }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setUser(data.user);
      })
      .catch((error) => {
        setError(error.message);
      });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
  };

  const addToCart = (product) => {
    // Get the current cart from local storage
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    // If cart is not an array, initialize it as an empty array
    if (!Array.isArray(cart)) {
      cart = [];
    }

    // Find the item in the cart
    let item = cart.find((item) => item.product_id === product.id);

    if (item) {
      // If the item exists, increment the quantity
      item.quantity++;
    } else {
      // If the item doesn't exist, add it to the cart
      cart.push({ product_id: product.id, quantity: 1 });
    }

    // Save the updated cart back to local storage
    localStorage.setItem("cart", JSON.stringify(cart));

    // Update the state of the cart
    setCart(cart);

    // If the user is logged in, update the cart on the server
    if (user) {
      updateCartOnServer(product.id, item ? item.quantity : 1);
    }
  };

  const updateCartOnServer = async (product_id, quantity) => {
    console.log("Updating cart on server", product_id, user);
    if (!user) {
      console.error("User is not logged in");
      return;
    }
    try {
      const response = await fetch(`${BASE_URL}/api/users/${user.id}/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product_id, quantity }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const serverResponse = await response.json();

      console.log("Server response:", serverResponse);

      let updatedCart;
      if (cart.some((item) => item.product_id === product_id)) {
        updatedCart = cart.map((item) =>
          item.product_id === product_id ? serverResponse : item
        );
      } else {
        updatedCart = cart.concat(serverResponse);
      }

      setCart(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
    } catch (error) {
      console.error("Error updating cart on server:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/products`);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error(`Error fetching products: ${error}`);
    }
  };

  const removeFromCart = async (product_id) => {
    const updatedCart = cart.filter((item) => item.product_id !== product_id);
    setCart(updatedCart);

    if (user) {
      try {
        const response = await fetch(
          `${BASE_URL}/api/users/${user.id}/cart/${product_id}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log(`Product ${product_id} removed from server cart`);
      } catch (error) {
        console.error("Error removing item from server cart:", error);
      }
    }
  };

  const changeQuantity = (id, quantity) => {
    const updatedCart = cart.map((item) => {
      if (item.product_id === id) {
        return { ...item, quantity };
      }
      return item;
    });
    setCart(updatedCart);

    if (user) {
      const item = { product_id: id, quantity };
      updateCartOnServer(item);
    }
  };

  const buyNow = (product) => {
    const updatedProduct = {
      ...product,
      stock: product.stock - 1,
      quantity: 1,
    };
    const updatedProducts = products.map((p) =>
      p.id === product.id ? updatedProduct : p
    );
    setProducts(updatedProducts);
    addToCart(updatedProduct);
    alert("You have purchased this item: " + product.name);
  };

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    console.log("Cart updated:", cart);
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        error,
        updateUser,
        login,
        cart,
        addToCart,
        products,
        buyNow,
        removeFromCart,
        changeQuantity,
        logout,
        setToken,
        fetchUser,
        setCurrentUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
