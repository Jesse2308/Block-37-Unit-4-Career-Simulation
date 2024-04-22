import { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import "./ProductDetail.css";
import { UserContext } from "./UserProvider";
const BASE_URL = "http://localhost:3000";

// ProductDetail component to display detailed information about a product
const ProductDetail = () => {
  // useParams hook to get the product id from the URL
  const { id } = useParams();
  // State variable for the product data
  const [product, setProduct] = useState(null);
  // useContext hook to get the user and cart data from the UserContext
  const { user, cart, setCart, updateUserCart } = useContext(UserContext);

  // useEffect hook to fetch the product data when the component mounts
  useEffect(() => {
    // Fetch the product data based on id
    fetch(`/api/products/${id}`)
      .then((response) => response.json())
      .then((data) => setProduct(data))
      .catch((error) => console.error("Error:", error));
  }, [id]);

  // Function to add a product to the cart
  const addToCart = async (productDetails, quantity = 1) => {
    const item = { product_id: productDetails.id, quantity };

    if (user && user.id) {
      addToCartLoggedInUser(item);
    } else {
      addToCartGuestUser(item);
    }
  };

  // Function to add a product to the cart for a logged in user
  const addToCartLoggedInUser = async (item) => {
    const user_id = user.id;
    try {
      const response = await fetch(`${BASE_URL}/api/users/${user_id}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: String(item.id), // Convert product_id to a string
          quantity: String(item.quantity), // Convert quantity to a string
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
    // Add the new item to the state
    let guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];

    // Check if the item already exists in the guest cart
    const existingItemIndex = guestCart.findIndex((i) => i.id === item.id);
    if (existingItemIndex !== -1) {
      // Increment the quantity of the existing item
      guestCart[existingItemIndex].quantity += item.quantity;
    } else {
      // Add the new item to the guest cart
      guestCart.push(item);
    }

    if (guestCart.length > 2) {
      alert(
        "Please register for a buyer's account to add more items. If you want to sell items, register for a seller's account."
      );
    }

    localStorage.setItem("guestCart", JSON.stringify(guestCart));
    setCart(guestCart);
  };
  // If the product data is not yet loaded, display a loading message
  if (!product) return "Loading...";

  // Render the product details
  return (
    <div className="product-detail">
      <h2 className="product-name">{product.name}</h2>
      <img src={product.image} alt={product.name} className="product-image" />
      <p className="product-description">{product.description}</p>
      <p className="product-price">${product.price}</p>
      <p className="product-stock">Stock: {product.stock}</p>
      <button onClick={() => addToCart(product, 1)}>Add to Cart</button>
      <Link to="/cart" className="view-cart-button">
        View Cart
      </Link>
    </div>
  );
};

export default ProductDetail;
