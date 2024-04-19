import "./Cart.css";
import { useEffect, useState } from "react";
import { useContext } from "react";
import { UserContext } from "./UserProvider";
import Checkout from "./Checkout";

const BASE_URL = "http://localhost:3000";

const Cart = () => {
  // Context and state variables
  const { user, cart, setCart, fetchUserCart, updateUserCart } =
    useContext(UserContext);
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
    if (cart) {
      // Add check for cart before stringifying
      localStorage.setItem("guestCart", JSON.stringify(cart));
    }
  }, [cart]);

  // Calculate total price
  useEffect(() => {
    const total = cart
      ? cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)
      : 0;
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
      updateUserCart(
        user.id, // Use user.id instead of product_id
        updatedCart.find((p) => p.id === product_id)
      );
      return updatedCart;
    });
  };

  // Remove product from cart
  const removeFromCart = async (productId) => {
    if (user && user.id) {
      const user_id = user.id;
      try {
        const response = await fetch(
          `${BASE_URL}/api/cart/${user_id}/${productId}`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const updatedCart = cart.filter((item) => item.id !== productId);
        setCart(updatedCart);
        updateUserCart(user_id, updatedCart);
        console.log("Logged in user's cart updated, item removed:", productId);
        // Update the logged-in user's cart in local storage
        localStorage.setItem(
          `userCart_${user_id}`,
          JSON.stringify(updatedCart)
        );
      } catch (error) {
        console.error(`Error removing item from cart: ${error}`);
      }
    } else {
      let guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];
      guestCart = guestCart.filter((item) => item.id !== productId);
      localStorage.setItem("guestCart", JSON.stringify(guestCart));
      setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
      console.log("Guest user's cart updated, item removed:", productId);
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
        cart &&
        cart.map(
          (
            item,
            index // Add check for cart before mapping
          ) => (
            <div key={index} className="cart-item">
              <img
                src={item.image}
                alt={item.name}
                className="cart-item-image"
              />
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
              <button
                onClick={() => {
                  if (item && typeof item.product_id === "number") {
                    removeFromCart(item.product_id);
                  } else {
                    console.error("Invalid item:", item);
                  }
                }}
              >
                Remove from cart
              </button>
            </div>
          )
        )
      )}
      <p className="cart-total">Total: ${totalPrice}</p>
      <Checkout cart={cart} />
    </div>
  );
};

export default Cart;
