import { useState, useEffect } from 'react';

const Product = ({ product }) => (
  <div key={product.id}>
    <h3>{product.name}</h3>
    <p>{product.description}</p>
    <p>${product.price}</p>
  </div>
);

const Store = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
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

  if (isLoading) {
    return <div>Loading...</div>; // Consider replacing this with a skeleton screen or placeholder
  }

  if (error) {
    return (
      <div>
        {error}
        <button onClick={fetchProducts}>Retry</button>
      </div>
    );
  }

return (
    <div>
        <h2>Store</h2>
        {products.map((product) => (
            <Product key={product.id} product={product} />
        ))}
    </div>
);
};

export default Store;