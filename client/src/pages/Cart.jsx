import "./Cart.css";
import { useEffect } from "react";

const Cart = ({ cart, setCart, newSetCart, user }) => {
  useEffect(() => {
    if (user) {
      // Fetch cart from server
      fetch(`/api/cart/${user.id}`)
        .then((response) => response.json())
        .then((data) => setCart(data.cart));
    } else {
      // Load cart from localStorage
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // Save cart to server
      fetch(`/api/cart/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cart),
      });
    } else if (cart) {
      // Save cart to localStorage
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart, user]);

  useEffect(() => {
    console.log("Cart state:", cart); // Log the cart state

    if (user) {
      // Save cart to server
      fetch(`/api/cart/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cart),
      });
    } else {
      // Save cart to localStorage
      console.log("Saving to local storage:", cart);
      localStorage.setItem("cart", JSON.stringify(cart));
      console.log("Saved to local storage:", localStorage.getItem("cart")); // Log the saved cart
    }
  }, [cart, user]);

  const changeQuantity = (productId, quantity) => {
    setCart((prevCart) =>
      prevCart.map((p) =>
        p.id === productId ? { ...p, quantity: parseInt(quantity) } : p
      )
    );
  };
  const removeFromCart = (id) => {
    setCart(cart.filter((product) => product.id !== id));
  };

  // Calculate the total price
  let totalPrice = 0;
  if (cart) {
    totalPrice = cart.reduce(
      (total, product) => total + product.price * product.quantity,
      0
    );
  }

  return (
    <div className="cart">
      <h2 className="cart-title">Your Cart</h2>
      {cart.length === 0 ? (
        <p className="cart-empty">Your cart is empty</p>
      ) : (
        cart.map((product) => (
          <div key={product.id} className="cart-item">
            <img
              src={product.image}
              alt={product.name}
              className="cart-item-image"
            />
            <p className="cart-item-id">Product ID: {product.id}</p>
            <div className="cart-item-quantity">
              Quantity:
              <input
                type="number"
                value={product.quantity}
                onChange={(e) => changeQuantity(product.id, e.target.value)}
                className="quantity-input"
              />
            </div>
            <p className="cart-item-price">
              Price: ${product.price * product.quantity}
            </p>
            <button
              onClick={() => removeFromCart(product.id)}
              className="cart-item-remove"
            >
              Remove from cart
            </button>
          </div>
        ))
      )}
      <p className="cart-total">Total: ${totalPrice}</p>
    </div>
  );
};

export default Cart;
