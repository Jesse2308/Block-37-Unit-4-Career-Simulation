import "./Cart.css";
import { useEffect, useState } from "react";
import { useContext } from "react";
import { UserContext } from "./UserProvider";
import Checkout from "./Checkout";

const BASE_URL = "http://localhost:3000";

// Cart component for the shopping cart
const Cart = () => {
  // Context and state variables
  const { user, cart, setCart, fetchUserCart, updateUserCart } =
    useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [productsLoading, setProductsLoading] = useState(true);

  // Fetch products data and cart items from server or local storage
  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/api/products`);
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error(`Error fetching products: ${error}`);
        setError(`Error fetching products: ${error.toString()}`);
      } finally {
        setProductsLoading(false);
      }
    };

    const fetchCart = async () => {
      const user_id = user && user.id ? Number(user.id) : "guest";
      try {
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
        console.error("Error fetching cart:", error);
        setError(`Error fetching cart: ${error.toString()}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    fetchCart();
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
    if (!Array.isArray(cart)) {
      console.error("cart is not an array:", cart);
      return;
    }

    const total = cart
      ? cart.reduce((sum, item) => {
          const product = products.find((p) => p.id === item.id);
          return sum + (product ? product.price * item.quantity : 0);
        }, 0)
      : 0;
    setTotalPrice(total.toFixed(2));
  }, [cart, products]);

  // After defining the changeQuantity function
  useEffect(() => {
    if (!user || !user.id) {
      const guestCart = localStorage.getItem("guestCart");
      if (guestCart) {
        setCart(JSON.parse(guestCart));
      }
    }
  }, []);

  const changeQuantity = (id, quantity) => {
    console.log(`Changing quantity for id ${id} to ${quantity}`);
    console.log(`Current cart: ${JSON.stringify(cart)}`);
    const updatedQuantity = Math.max(1, parseInt(quantity));
    if (isNaN(updatedQuantity)) {
      console.error("Invalid quantity:", quantity);
      return;
    }
    if (!Number.isInteger(Number(id)) || id <= 0) {
      console.error("Invalid id:", id);
      return;
    }
    setCart((prevCart) => {
      let updatedCart = prevCart;
      const existingItem = updatedCart.find((p) => p.id === id);
      if (existingItem) {
        // Set the quantity of the existing item to updatedQuantity
        updatedCart = updatedCart.map((p) =>
          p.id === id ? { ...p, quantity: updatedQuantity } : p
        );
      } else {
        // Add the new item to the cart
        updatedCart = [...updatedCart, { id: id, quantity: updatedQuantity }];
      }
      console.log(`Updated cart: ${JSON.stringify(updatedCart)}`);
      if (user && user.id) {
        // Call updateUserCart with the entire cart and handle the response
        console.log(`Updating cart in DB for user with id ${user.id}`);
        updateUserCart(user.id, updatedCart).then((response) => {
          console.log("Cart updated in DB:", response);
        });
      } else {
        localStorage.setItem("guestCart", JSON.stringify(updatedCart));
        console.log("Guest cart updated:", updatedCart);
      }
      return updatedCart;
    });
  };
  const removeFromCart = async (productId) => {
    try {
      console.log(`Trying to remove product with id ${productId} from cart`);

      // Log the cart before removing the item
      console.log("Cart before removing item:", cart);

      // Remove item from local state
      setCart((prevCart) => {
        const updatedCart = prevCart.filter((item) => {
          // Use item.product_id for logged in users and item.id for guest users
          const itemId = user && user.id ? item.product_id : item.id;
          return itemId !== productId;
        });

        // Log the updated cart
        console.log("Updated cart:", updatedCart);

        return updatedCart;
      });

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
        console.log(`Item with id ${productId} removed from cart`);
      } else {
        // Remove item from local storage
        const savedCart = JSON.parse(localStorage.getItem("guestCart"));
        if (savedCart) {
          const updatedCart = savedCart.filter((item) => item.id !== productId);
          localStorage.setItem("guestCart", JSON.stringify(updatedCart));
          setCart(updatedCart);
        }
      }
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
        cart.map((item, index) => {
          const productId = user && user.id ? item.product_id : item.id;
          const product = products.find((p) => p.id === productId);
          console.log("Item:", item);
          console.log("Product ID:", productId);
          console.log("Product:", product);
          if (!product) {
            return <p>Loading product details...</p>;
          }
          return (
            <div
              key={`${item.cart_id || item.id}-${index}`}
              className="cart-item"
            >
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
