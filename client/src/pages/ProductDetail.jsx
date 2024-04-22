import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserContext } from "./UserProvider";
import "./ProductDetail.css";

const BASE_URL = "http://localhost:3000";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useContext(UserContext);
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Function to fetch the product details from the server
  const fetchProduct = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/api/products/${id}`);
      if (!response.ok) throw new Error("Failed to fetch product");
      const data = await response.json();
      setProduct(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect hook to fetch the product details when the component mounts
  useEffect(() => {
    fetchProduct();
  }, [id]); // Re-run the effect when the product ID changes

  // Render the product details or loading/error messages
  return (
    <div className="product-detail">
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        product && (
          <div>
            <h3 className="product-name">{product.name}</h3>
            <img
              className="product-image"
              src={product.image}
              alt={product.name}
            />
            <p className="product-description">{product.description}</p>
            <p className="product-price">${product.price}</p>
            <button
              className="add-to-cart-button"
              onClick={() => addToCart(product)}
            >
              Add to Cart
            </button>
            <button
              className="view-cart-button"
              onClick={() => navigate("/cart")}
            >
              View Cart
            </button>
          </div>
        )
      )}
    </div>
  );
};

export default ProductDetail;
