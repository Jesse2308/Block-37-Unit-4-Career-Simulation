import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Product = ({ product, addToCart, buyNow }) => (
  <div key={product.id}>
    <h3>{product.name}</h3>
    <img src={product.image} alt={product.name} />
    <p>{product.description}</p>
    <p>${product.price}</p>
    <p>Stock: {product.stock}</p>
    <button onClick={() => addToCart(product)}>Add to Cart</button>
    <button onClick={() => buyNow(product)}>Buy Now</button>
  </div>
);

const Store = ({ setCart }) => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const viewCart = () => {
    navigate("/cart");
  };

  const addToCart = (product) => {
    // Decrease the stock of the product
    const updatedProduct = { ...product, stock: product.stock - 1 };

    // Update the product in the products array
    const updatedProducts = products.map((p) =>
      p.id === product.id ? updatedProduct : p
    );
    setProducts(updatedProducts);

    // Add the product to the cart
    setCart((prevCart) => [
      ...prevCart,
      { ...updatedProduct, cartItemId: Date.now() },
    ]);
  };

  const buyNow = (product) => {
    // Decrease the stock of the product
    const updatedProduct = { ...product, stock: product.stock - 1 };

    // Update the product in the products array
    const updatedProducts = products.map((p) =>
      p.id === product.id ? updatedProduct : p
    );
    setProducts(updatedProducts);

    // Add the product to the cart and simulate the purchase
    setCart((prevCart) => [...prevCart, updatedProduct]);
    alert("You have purchased this item: " + product.name);
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3000/api/products");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div>
      <button onClick={viewCart}>View Cart</button>
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
    
        products.map((product) => (
          <Product
            key={product.id}
            product={product}
            addToCart={() => addToCart(product)}
            buyNow={buyNow}
          />
        ))
      )}
    </div>
  );
};

export default Store;
