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

  const addToCart = async (productDetails, quantity = 1) => {
    const item = { product_id: productDetails.id, quantity };

    if (user && user.id) {
      addToCartLoggedInUser(item);
    } else {
      addToCartGuestUser(item);
    }
  };

  const addToCartLoggedInUser = async (item) => {
    const user_id = user.id;
    try {
      const response = await fetch(`${BASE_URL}/api/users/${user_id}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: item.product_id,
          quantity: item.quantity,
        }),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const updatedCart = await response.json();

      console.log("Logged in user's cart after adding item:", updatedCart);

      setCart(updatedCart);
      updateUserCart(user_id, updatedCart);
      localStorage.setItem(`userCart_${user_id}`, JSON.stringify(updatedCart));
    } catch (error) {
      console.error(`Error adding item to cart: ${error}`);
    }
  };

  const addToCartGuestUser = (item) => {
    let guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];

    const existingItemIndex = guestCart.findIndex(
      (i) => i.product_id === item.product_id
    );
    if (existingItemIndex !== -1) {
      guestCart[existingItemIndex].quantity += item.quantity;
    } else {
      guestCart.push(item);
    }

    localStorage.setItem("guestCart", JSON.stringify(guestCart));
    setCart(guestCart);
  };

  const viewCart = () => {
    navigate("/cart");
    if (JSON.parse(localStorage.getItem("cart")) && user) {
      localStorage.removeItem("cart");
    }
  };

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

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    fetchProducts();
  }, []);

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
      <button id="view-cart-button" onClick={viewCart}>
        View Cart
      </button>
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <div className="item-container">
          {filteredProducts.map((product) => (
            <div className="item" key={product.id}>
              <Product
                product={product}
                addToCart={() => addToCart(product)}
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
      )}
    </div>
  );
};

export default Store;
