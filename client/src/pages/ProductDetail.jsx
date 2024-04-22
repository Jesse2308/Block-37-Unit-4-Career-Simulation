import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { UserContext } from "./UserProvider";

const BASE_URL = "http://localhost:3000";

// Product component to display individual product details and Add to Cart and Buy Now buttons
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

// Store component to display all products and handle cart operations
const Store = () => {
  const { user, cart, setCart, updateUserCart } = useContext(UserContext);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Function to add a product to the cart
  const addToCart = async (productDetails, quantity = 1) => {
    const item = { product_id: productDetails.id, quantity }; // Only include id and quantity

    if (user && user.id) {
      addToCartLoggedInUser(item);
    } else {
      addToCartGuestUser(item);
    }
  };

  // Function to add a product to the cart for a logged in user
  // Function to add a product to the cart for a logged in user
  const addToCartLoggedInUser = async (item) => {
    const user_id = user.id;
    try {
      const response = await fetch(`${BASE_URL}/api/users/${user_id}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: item.product_id, // Use product_id directly
          quantity: item.quantity, // Use quantity directly
        }),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const updatedCart = await response.json();

      console.log("Logged in user's cart after adding item:", updatedCart);

      setCart(updatedCart);
      updateUserCart(user_id, updatedCart);
      // Save the logged-in user's cart under a different key in local storage
      localStorage.setItem(`userCart_${user_id}`, JSON.stringify(updatedCart));
    } catch (error) {
      console.error(`Error adding item to cart: ${error}`);
    }
  };

  // Function to add a product to the cart for a guest user
  const addToCartGuestUser = (item) => {
    // Get the guest cart from local storage
    let guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];

    // Check if the item already exists in the guest cart
    const existingItemIndex = guestCart.findIndex(
      (i) => i.product_id === item.product_id
    );
    if (existingItemIndex !== -1) {
      // Increment the quantity of the existing item
      guestCart[existingItemIndex].quantity += item.quantity;
    } else {
      // Add the new item to the guest cart
      guestCart.push(item);
    }

    // Save the updated guest cart in local storage
    localStorage.setItem("guestCart", JSON.stringify(guestCart));

    // Update the cart state
    setCart(guestCart);
  };

  // Function to navigate to the cart page
  const viewCart = () => {
    navigate("/cart");
    if (JSON.parse(localStorage.getItem("cart")) && user) {
      localStorage.removeItem("cart");
    }
  };

  // Function to fetch all products from the server
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

  // Function to handle the Buy Now operation
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

  // useEffect hook to update the cart in local storage whenever the cart state changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, []);

  // useEffect hook to fetch all products when the component mounts
  useEffect(() => {
    fetchProducts();
  }, []);

  // Render the products or loading/error messages
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
