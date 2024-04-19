import { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import "./ProductDetail.css";
import { UserContext } from "./UserProvider";
const BASE_URL = "http://localhost:3000";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const { user, cart, setCart, updateUserCart } = useContext(UserContext);

  useEffect(() => {
    // Fetch the product data based on id
    fetch(`/api/products/${id}`)
      .then((response) => response.json())
      .then((data) => setProduct(data))
      .catch((error) => console.error("Error:", error));
  }, [id]);

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

        setCart((prevCart) => {
          let updatedCart = [...prevCart, data]; // Include all product details in the cart

          // Check if the item already exists in the cart
          const existingItem = updatedCart.find((i) => i.id === item.id);
          if (existingItem) {
            // Update the quantity of the existing item
            existingItem.quantity += item.quantity;
            updatedCart = updatedCart.filter((i) => i.id !== item.id);
            updatedCart.push(existingItem);
          } else {
            // Add the new item to the cart
            updatedCart.push(item);
          }

          updateUserCart(user_id, updatedCart);
          console.log("Logged in user's cart updated with item:", item);
          // Save the logged-in user's cart under a different key in local storage
          localStorage.setItem(
            `userCart_${user_id}`,
            JSON.stringify(updatedCart)
          );

          return updatedCart;
        });
      } catch (error) {
        console.error(`Error adding item to cart: ${error}`);
      }
    } else {
      let guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];

      // Check if the item already exists in the guest cart
      const existingItemIndex = guestCart.findIndex((i) => i.id === item.id);
      if (existingItemIndex !== -1) {
        // Update the quantity of the existing item
        guestCart[existingItemIndex].quantity += item.quantity;
      } else {
        // Add the new item to the guest cart
        guestCart.push(item);
      }

      localStorage.setItem("guestCart", JSON.stringify(guestCart));
      setCart((prevCart) => {
        const existingItemIndex = prevCart.findIndex((i) => i.id === item.id);
        if (existingItemIndex !== -1) {
          // Update the quantity of the existing item in the state
          const updatedCart = [...prevCart];
          updatedCart[existingItemIndex].quantity += item.quantity;
          console.log(
            "Guest user's cart updated with item:",
            updatedCart[existingItemIndex]
          );
          return updatedCart;
        } else {
          // Add the new item to the state
          const updatedCart = [...prevCart, item];
          console.log("Guest user's cart updated with item:", item);
          return updatedCart;
        }
      });
    }
  };

  if (!product) return "Loading...";

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
