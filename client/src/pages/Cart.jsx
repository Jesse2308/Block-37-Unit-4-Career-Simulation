import { useState, useEffect, useContext } from "react";
import { UserContext } from "./UserProvider";
import Checkout from "./Checkout";
import "./Cart.css";

const Cart = () => {
  const { cart, products, removeFromCart, changeQuantity } =
    useContext(UserContext);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    if (!Array.isArray(cart)) {
      return;
    }

    const total = cart.reduce((sum, item) => {
      const productId = item.product_id;
      const product = products.find((p) => p.id === productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    setTotalPrice(total.toFixed(2));
  }, [cart, products]);

  if (!Array.isArray(cart)) {
    return <p>Loading...</p>;
  }
  return (
    <div className="cart">
      <h2 className="cart-title">Your Cart</h2>
      {cart?.length === 0 ? (
        <p className="cart-empty">Your cart is empty</p>
      ) : (
        cart.map((item, index) => {
          const productId = item.product_id;
          const product = products.find((p) => p.id === productId);

          if (!product) {
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
                  onChange={(e) => {
                    const newQuantity = Number(e.target.value);
                    changeQuantity(
                      product.id,
                      newQuantity < 1 ? 1 : newQuantity
                    );
                  }}
                  className="quantity-input"
                />
              </div>
              <p className="cart-item-price">
                Price: $
                {product.price && item.quantity
                  ? (Number(product.price) * Number(item.quantity)).toFixed(2)
                  : "0.00"}
              </p>
              <button onClick={() => removeFromCart(product.id)}>
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
