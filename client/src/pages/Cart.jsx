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
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true); // New state variable for tracking the loading status of products

  // Fetch products data
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/products`);
        const data = await response.json();
        setProducts(data);
        setProductsLoading(false); // Set loading to false here
      } catch (error) {
        console.error(`Error fetching products: ${error}`);
      }
    };
    fetchProducts();
  }, []);

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
  const changeQuantity = (id, quantity) => {
    const updatedQuantity = Math.max(0, parseInt(quantity)); // Ensure quantity can't go negative
    if (isNaN(updatedQuantity)) {
      console.error("Invalid quantity:", quantity);
      return;
    }
    if (!Number.isInteger(Number(id)) || id <= 0) {
      console.error("Invalid id:", id);
      return;
    }
    setCart((prevCart) => {
      const updatedCart = prevCart.map((p) =>
        p.id === id ? { ...p, quantity: updatedQuantity } : p
      );
      if (user && user.id) {
        updateUserCart(
          user.id,
          updatedCart.find((p) => p.id === id)
        );
      } else {
        localStorage.setItem("guestCart", JSON.stringify(updatedCart));
      }
      return updatedCart;
    });
  };

  // Remove product from cart
  const removeFromCart = async (productId) => {
    try {
      if (user && user.id) {
        const response = await fetch(
          `${BASE_URL}/api/cart/${user.id}/${productId}`,
          {
            method: "DELETE",
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      // Remove item from local state
      setCart(cart.filter((item) => item.id !== productId));
      // Remove item from local storage
      const savedCart = JSON.parse(localStorage.getItem("guestCart"));
      if (savedCart) {
        const updatedCart = savedCart.filter((item) => item.id !== productId);
        localStorage.setItem("guestCart", JSON.stringify(updatedCart));
      }
      console.log(`Item with id ${productId} removed from cart`);
    } catch (error) {
      console.error(`Error removing item from cart: ${error}`);
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
      {productsLoading ? (
        <p>Loading products...</p>
      ) : cart && cart.length === 0 ? (
        <p className="cart-empty">Your cart is empty</p>
      ) : (
        cart &&
        cart.map((item) => {
          const productId = user && user.id ? item.product_id : item.id; // Use product_id for logged-in users and id for guest users
          const product = products.find((p) => p.id === productId);
          if (!product) {
            return <p>Loading product details...</p>;
          }
          return (
            <div key={item.cart_id || item.id} className="cart-item">
              {" "}
              <img
                src={product.image || "default-image.jpg"}
                alt={product.name}
                className="cart-item-image"
              />
              <p className="cart-item-id">Product ID: {product.id}</p>
              <div className="cart-item-quantity">
                Quantity:
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => changeQuantity(product.id, e.target.value)}
                  className="quantity-input"
                />
              </div>
              <p className="cart-item-price">
                Price: $
                {product.price && item.quantity
                  ? (Number(product.price) * Number(item.quantity)).toFixed(2)
                  : "0.00"}
              </p>
              <button
                onClick={() => {
                  // Check if the item is valid
                  if (
                    !product ||
                    !product.id ||
                    !Number.isInteger(item.quantity)
                  ) {
                    console.error("Invalid item:", product);
                    return;
                  }
                  removeFromCart(product.id);
                }}
              >
                Remove from cart
              </button>
            </div>
          );
        })
      )}
      <p className="cart-total">Total: ${totalPrice}</p>
      <div>
        <Checkout Cart={cart} />
      </div>
    </div>
  );
};
export default Cart;
