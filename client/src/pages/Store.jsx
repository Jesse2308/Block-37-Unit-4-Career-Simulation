import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "./UserProvider";

const Product = ({ product, handleAddToCart, buyNow }) => (
  <div key={product.id}>
    <h3>{product.name}</h3>
    <img src={product.image} alt={product.name} />
    <p>{product.description}</p>
    <p>${product.price}</p>
    <button onClick={() => handleAddToCart(product)}>Add to Cart</button>
    <button onClick={() => buyNow(product)}>Buy Now</button>
  </div>
);

const Store = () => {
  const { products, addToCart, buyNow } = useContext(UserContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("none");
  const navigate = useNavigate();

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSortChange = (event) => {
    setSortOrder(event.target.value);
  };

  const filteredProducts = products
    .filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === "lowToHigh") {
        return a.price - b.price;
      } else if (sortOrder === "highToLow") {
        return b.price - a.price;
      } else {
        return 0;
      }
    });

  return (
    <div className="centered-div">
      <input
        type="text"
        placeholder="Search products"
        value={searchTerm}
        onChange={handleSearchChange}
      />
      <select value={sortOrder} onChange={handleSortChange}>
        <option value="none">Sort by price</option>
        <option value="lowToHigh">Low to High</option>
        <option value="highToLow">High to Low</option>
      </select>
      <button id="view-cart-button" onClick={() => navigate("/cart")}>
        View Cart
      </button>
      <div className="item-container">
        {filteredProducts.map((product) => (
          <div className="item" key={product.id}>
            <Product
              product={product}
              handleAddToCart={() => addToCart(product)}
              buyNow={buyNow}
            />
            <Link
              to={`/products/${product.id}`}
              className="details-button details-link"
            >
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Store;
