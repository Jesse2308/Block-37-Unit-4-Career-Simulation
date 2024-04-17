import "./Cart.css";
import { useEffect, useState } from "react";
import { useContext } from "react";
import { UserContext } from "./UserProvider";
import Checkout from "./Checkout";

const BASE_URL = "http://localhost:3000";

const Cart = () => {
  // Context and state variables
  const { user, cart, setCart, fetchUserCart } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);

  // Fetch cart items from server or local storage
  useEffect(() => {
    const user_id = user && user.id ? Number(user.id) : "guest";
    const fetchCart = async () => {
      try {
        setLoading(true);
        let cartItems = [];
        if (!user || !user.id) {
          const savedCart = localStorage.getItem("guestCart");
          cartItems = savedCart ? JSON.parse(savedCart) : [];
        } else {
          console.log(`Fetching cart for user_id: ${user_id}`);
          cartItems = await fetchUserCart(user_id);
        }
        setCart(cartItems);
        console.log("Cart items fetched:", cartItems);
      } catch (error) {
        setError(error.message);
        console.error("Error fetching cart:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [user, setCart]);

  // Load cart from local storage
  const loadLocalCart = () => {
    const savedCart = localStorage.getItem("guestCart");
    setCart(
      savedCart && savedCart !== "undefined" ? JSON.parse(savedCart) : []
    );
    setLoading(false);
  };

  useEffect(() => {
    loadLocalCart();
  }, []);

  // Save cart to local storage
  useEffect(() => {
    localStorage.setItem("guestCart", JSON.stringify(cart));
  }, [cart]);

  // Calculate total price
  useEffect(() => {
    const total = cart.reduce(
      (sum, item) => sum + (item.price || 0) * item.quantity,
      0
    );
    setTotalPrice(total.toFixed(2));
  }, [cart]);

  // Change quantity of a product in cart
  const changeQuantity = (product_id, quantity) => {
    const updatedQuantity = parseInt(quantity);
    if (isNaN(updatedQuantity)) {
      console.error("Invalid quantity:", quantity);
      return;
    }
    if (!Number.isInteger(Number(product_id)) || product_id <= 0) {
      console.error("Invalid product_id:", product_id);
      return;
    }
    setCart((prevCart) => {
      const updatedCart = prevCart.map((p) =>
        p.id === product_id ? { ...p, quantity: updatedQuantity } : p
      );
      updateCartOnServer(
        product_id,
        updatedCart.find((p) => p.id === product_id)
      );
      return updatedCart;
    });
  };

  // Update cart on server
  const updateCartOnServer = async (product_id, updatedItem) => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/cart/${Number(product_id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedItem),
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Updated item on server:", data);
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  // Remove product from cart
  const removeFromCart = async (product_id) => {
    if (!Number.isInteger(Number(product_id)) || product_id <= 0) {
      console.error("Invalid product_id");
      return;
    }
    const userId = user && user.id ? Number(user.id) : "guest";
    try {
      if (userId === "guest") {
        // If user is a guest
        // Get the guest's cart from local storage
        let guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];
        // Remove the item from the guest's cart
        guestCart = guestCart.filter((item) => item.id !== product_id);
        // Save the updated cart in local storage
        localStorage.setItem("guestCart", JSON.stringify(guestCart));
        console.log("Item removed from guest cart:", product_id);
      } else {
        // If user is logged in
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        console.log(
          `Attempting to remove product with id ${product_id} from cart...`
        );
        const response = await fetch(
          `${BASE_URL}/api/cart/${userId}/${Number(product_id)}`,
          {
            method: "DELETE",
            headers,
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      setCart((prevCart) => prevCart.filter((item) => item.id !== product_id));
      console.log("Item removed from cart:", product_id);
    } catch (error) {
      console.error(`Error removing item: ${error}`);
    }
  };

  // Loading and error handling
  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  // Render cart
  return (
    <div className="cart">
      <h2 className="cart-title">Your Cart</h2>
      {cart && cart.length === 0 ? (
        <p className="cart-empty">Your cart is empty</p>
      ) : (
        cart.map((item, index) => (
          <div key={index} className="cart-item">
            <img src={item.image} alt={item.name} className="cart-item-image" />
            <p className="cart-item-id">Product ID: {item.id}</p>
            <div className="cart-item-quantity">
              Quantity:
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => changeQuantity(item.id, e.target.value)}
                className="quantity-input"
              />
            </div>
            <p className="cart-item-price">
              Price: $
              {item.price && item.quantity
                ? (Number(item.price) * Number(item.quantity)).toFixed(2)
                : "0.00"}
            </p>
            <button onClick={() => removeFromCart(Number(item.id))}>
              Remove from cart
            </button>
          </div>
        ))
      )}
      <p className="cart-total">Total: ${totalPrice}</p>
      <Checkout cart={cart} />
    </div>
  );
};

export default Cart;
