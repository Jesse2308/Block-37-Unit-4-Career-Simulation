import { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import "./ProductDetail.css";
import { UserContext } from "./UserProvider";
const BASE_URL = "http://localhost:3000";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const { user, cart, setCart } = useContext(UserContext);

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
            product_id: item.id,
            quantity: item.quantity,
          }),
        });

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        await response.json();
        setCart((prevCart) => [...prevCart, item]);
        console.log("Logged in user's cart updated with item:", item);
      } catch (error) {
        console.error(`Error adding item to cart: ${error}`);
      }
    } else {
      let guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];
      guestCart.push(item);
      localStorage.setItem("guestCart", JSON.stringify(guestCart));
      setCart((prevCart) => [...prevCart, item]);
      console.log("Guest user's cart updated with item:", item);
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
