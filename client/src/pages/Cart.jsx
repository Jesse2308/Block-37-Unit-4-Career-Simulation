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
      const userId = user && user.id ? Number(user.id) : "guest";
      try {
        let cartItems = [];
        if (!user || !user.id) {
          const savedCart = localStorage.getItem("guestCart");
          cartItems = savedCart ? JSON.parse(savedCart) : [];
        } else {
          console.log(`Fetching cart for user_id: ${userId}`);
          const userCart = await fetchUserCart(userId);
          // Flatten the cart items for logged-in users
          cartItems = userCart.items.map((item) => ({
            id: item.product_id,
            quantity: item.quantity,
          }));
        }
        // Check if cartItems is an object and not an array
        if (typeof cartItems === "object" && !Array.isArray(cartItems)) {
          // Convert the object into an array containing the object
          cartItems = [cartItems];
        }
        if (!Array.isArray(cartItems)) {
          throw new Error(`Cart items is not an array: ${cartItems}`);
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
          const productId = item.product_id;
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

  const removeFromCart = async (productId) => {
    try {
      console.log(`Trying to remove product with id ${productId} from cart`);

      const userId = user?.id || "guest";
      const deletedCartItem = await updateUserCart(userId, productId, "DELETE");

      setCart((prevCart) =>
        prevCart.filter((item) => item.id !== deletedCartItem.product_id)
      );
    } catch (error) {
      console.error(`Error removing item from cart: ${error}`);
    }
  };

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
    try {
      const userId = user?.id || "guest";
      const updatedItem = await updateUserCart(userId, id, "PUT", {
        quantity: updatedQuantity,
      });

      setCart((prevCart) =>
        prevCart.map((item) => (item.id === id ? updatedItem : item))
      );
    } catch (error) {
      console.error(`Error updating quantity: ${error}`);
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
      ) : !cart || cart.length === 0 ? (
        <p className="cart-empty">Your cart is empty</p>
      ) : (
        cart.map((item, index) => {
          const productId = item.product_id;
          const product = products.find((p) => p.id === productId);

          console.log("Cart item:", item);
          console.log("Product ID from cart item:", productId);
          console.log("Matched product from products list:", product);

          if (!product) {
            console.error(`Product not found for ID: ${productId}`);
            return <p>Product not found</p>;
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
