import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { UserContext } from "./UserProvider";

const BASE_URL = "http://localhost:3000";

const Product = ({ product, addToCart, buyNow }) => (
  <div key={product.id}>
    <h3>{product.name}</h3>
    <img src={product.image} alt={product.name} />
    <p>{product.description}</p>
    <p>${product.price}</p>
    <button onClick={() => addToCart(product)}>Add to Cart</button>
    <button onClick={() => buyNow(product)}>Buy Now</button>
  </div>
);

const Store = () => {
  const { user, cart, setCart, updateUserCart } = useContext(UserContext);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const addToCart = async (productDetails, quantity = 1) => {
    const item = { ...productDetails, quantity };

    if (user && user.id) {
      const user_id = user.id;
      try {
        const response = await fetch(`${BASE_URL}/api/cart/${user_id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: String(item.id), // Convert product_id to a string
            quantity: String(item.quantity), // Convert quantity to a string
          }),
        });

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        let updatedCart = [...cart]; // Copy the current cart

        // Check if the item already exists in the cart
        const existingItemIndex = updatedCart.findIndex(
          (cartItem) => cartItem.id === item.id
        );
        if (existingItemIndex >= 0) {
          // If the item already exists, update the quantity
          updatedCart[existingItemIndex].quantity += item.quantity;
        } else {
          // If the item doesn't exist, add it to the cart
          updatedCart.push(item);
        }

        setCart(updatedCart);
        updateUserCart(user_id, updatedCart);
        console.log("Logged in user's cart updated with item:", item);
        // Save the logged-in user's cart under a different key in local storage
        localStorage.setItem(
          `userCart_${user_id}`,
          JSON.stringify(updatedCart)
        );
      } catch (error) {
        console.error(`Error adding item to cart: ${error}`);
      }
    } else {
      let guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];

      // Check if the item already exists in the cart
      const existingItemIndex = guestCart.findIndex(
        (cartItem) => cartItem.id === item.id
      );
      if (existingItemIndex >= 0) {
        // If the item already exists, update the quantity
        guestCart[existingItemIndex].quantity += item.quantity;
      } else {
        // If the item doesn't exist, add it to the cart
        guestCart.push(item);
      }

      localStorage.setItem("guestCart", JSON.stringify(guestCart));
      setCart(guestCart);
      console.log("Guest user's cart updated with item:", item);
    }
  };

  const viewCart = () => {
    navigate("/cart");
    if (JSON.parse(localStorage.getItem("cart")) && user) {
      localStorage.removeItem("cart");
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/api/products`);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
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
    setCart((prevCart) => [...prevCart, updatedProduct]);
    alert("You have purchased this item: " + product.name);
  };

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="centered-div">
      <button id="view-cart-button" onClick={viewCart}>
        View Cart
      </button>
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <div className="item-container">
          {products.map((product) => (
            <div className="item" key={product.id}>
              <Product
                product={product}
                addToCart={() => addToCart(product)}
                buyNow={buyNow}
              />
              <button className="details-button">
                <Link to={`/products/${product.id}`} className="details-link">
                  View Details
                </Link>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Store;
