// Cart.jsx
import { useState, useEffect, useContext } from "react";
import { UserContext } from "./UserProvider";
import Checkout from "./Checkout";
import "./Cart.css";

const BASE_URL = "http://localhost:3000";

const Cart = () => {
  const { user, cart, setCart, fetchUserCart, updateUserCart } =
    useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [productsLoading, setProductsLoading] = useState(true);

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

  useEffect(() => {
    if (cart) {
      localStorage.setItem("guestCart", JSON.stringify(cart));
    }
  }, [cart]);

  useEffect(() => {
    if (!Array.isArray(cart)) {
      console.error("cart is not an array:", cart);
      return;
    }

    const total = cart
      ? cart.reduce((sum, item) => {
          const productId = user && user.id ? item.product_id : item.id;
          const product = products.find((p) => p.id === productId);
          return sum + (product ? product.price * item.quantity : 0);
        }, 0)
      : 0;
    setTotalPrice(total.toFixed(2));
  }, [cart, products]);

  useEffect(() => {
    if (!user || !user.id) {
      const guestCart = localStorage.getItem("guestCart");
      if (guestCart) {
        setCart(JSON.parse(guestCart));
      }
    }
  }, []);

  const changeQuantity = async (id, quantity) => {
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
    if (user && user.id) {
      try {
        const response = await fetch(
          `${BASE_URL}/api/users/${user.id}/cart/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: updatedQuantity }),
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const updatedItem = await response.json();
        setCart((prevCart) =>
          prevCart.map((item) => (item.id === id ? updatedItem : item))
        );
      } catch (error) {
        console.error(`Error updating quantity: ${error}`);
      }
    } else {
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === id ? { ...item, quantity: updatedQuantity } : item
        )
      );
      localStorage.setItem("guestCart", JSON.stringify(cart));
    }
  };

  const removeFromCart = async (productId) => {
    try {
      console.log(`Trying to remove product with id ${productId} from cart`);

      if (user && user.id) {
        const response = await fetch(
          `${BASE_URL}/api/users/${user.id}/cart/${productId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();

        try {
          const data = JSON.parse(text);

          if (data.success) {
            console.log(`Item with id ${productId} removed from cart`);

            setCart((prevCart) => {
              const updatedCart = prevCart.filter((item) => {
                const itemId = item.product_id;
                return itemId !== productId;
              });

              console.log("Updated cart:", updatedCart);

              return updatedCart;
            });
          } else {
            console.error(`Server error: ${data.message}`);
          }
        } catch (error) {
          console.error(`Error parsing server response: ${text}`);
        }
      } else {
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

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="cart">
      <h2 className="cart-title">Your Cart</h2>
      {productsLoading ? (
        <p>Loading products...</p>
      ) : cart && cart.length === 0 ? (
        <p className="cart-empty">Your cart is empty</p>
      ) : (
        cart &&
        cart.items.map((item, index) => {
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
