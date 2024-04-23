import { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

const BASE_URL = "http://localhost:3000";

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [token, setToken] = useState(null);

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

    if (data && data.token) {
      localStorage.setItem("token", data.token);
      return fetchUser(); // Fetch user details after login
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

      if (data.userId) {
        setUser({
          id: data.userId,
          email: data.email,
          isadmin: data.isadmin,
        });
      } else {
        throw new Error("User data is not available");
      }
    } catch (error) {
      setError(error.message);
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

  const updateCartOnServer = async (item) => {
    console.log("Updating cart on server", item, user);
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
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedCart = await response.json();
      setCart(updatedCart);
    } catch (error) {
      console.error(`Error adding item to cart: ${error}`);
    }
  };

  const addToCart = (product) => {
    const newItem = { product_id: product.id, quantity: 1 };
    const existingItem = cart.find((item) => item.product_id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      setCart((prevCart) => [...prevCart, newItem]);
    }

    if (user) {
      updateCartOnServer(newItem);
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

  const removeFromCart = (product_id) => {
    const updatedCart = cart.filter((item) => item.product_id !== product_id);
    setCart(updatedCart);

    if (user) {
      const item = { product_id, quantity: 0 };
      updateCartOnServer(item);
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
