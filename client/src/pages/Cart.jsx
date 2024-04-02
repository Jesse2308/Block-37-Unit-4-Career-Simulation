const Cart = ({ cart, setCart }) => {
    const removeFromCart = (productId) => {
      setCart((prevCart) => prevCart.filter((p) => p.id !== productId));
    };
  
    // Group the products by their id and calculate the quantity of each product
    const groupedProducts = cart.reduce((grouped, product) => {
      grouped[product.id] = grouped[product.id] || { ...product, quantity: 0 };
      grouped[product.id].quantity++;
      return grouped;
    }, {});
  
    // Calculate the total price
    const totalPrice = Object.values(groupedProducts).reduce(
      (total, product) => total + product.price * product.quantity,
      0
    );
  
    return (
      <div>
        <h2>Your Cart</h2>
        {Object.values(groupedProducts).length === 0 ? (
          <p>Your cart is empty</p>
        ) : (
          Object.values(groupedProducts).map((product) => (
            <div key={product.cartItemId}>
              <img src={product.image} alt={product.name} />
              <p>Product ID: {product.id}</p>
              <p>Quantity: {product.quantity}</p>
              <p>Price: ${product.price}</p>
              <button onClick={() => removeFromCart(product.id)}>
                Remove from cart
              </button>
            </div>
          ))
        )}
        <p>Total: ${totalPrice}</p>
      </div>
    );
  };
  
  export default Cart;