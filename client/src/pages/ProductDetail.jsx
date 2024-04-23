import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserContext } from "./UserProvider";
import "./ProductDetail.css";

const BASE_URL = "http://localhost:3000";

// Define useFetch hook inside ProductDetail.jsx
const useFetch = (url) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch data");
        const data = await response.json();
        setData(data);
        setError(null);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, isLoading, error };
};

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useContext(UserContext);
  const navigate = useNavigate();

  const {
    data: product,
    isLoading,
    error,
  } = useFetch(`${BASE_URL}/api/products/${id}`);

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
