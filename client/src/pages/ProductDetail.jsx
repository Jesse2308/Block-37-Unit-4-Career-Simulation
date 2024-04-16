import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./ProductDetail.css";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    // Fetch the product data based on id
    fetch(`/api/products/${id}`)
      .then((response) => response.json())
      .then((data) => setProduct(data))
      .catch((error) => console.error("Error:", error));
  }, [id]);

  if (!product) return "Loading...";

  return (
    <div className="product-detail">
      <h2 className="product-name">{product.name}</h2>
      <img src={product.image} alt={product.name} className="product-image" />
      <p className="product-description">{product.description}</p>
      <p className="product-price">${product.price}</p>
      <p className="product-stock">Stock: {product.stock}</p>
    </div>
  );
};

export default ProductDetail;
