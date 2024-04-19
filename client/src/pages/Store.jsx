import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { UserContext } from "./UserProvider";

const BASE_URL = "http://localhost:3000";

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

const Store = () => {
  const { user, cart, setCart, updateUserCart } = useContext(UserContext);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
          let updatedCart = [...prevCart]; // Copy the current cart

          // Check if the item already exists in the cart
          const existingItemIndex = updatedCart.findIndex(
            (i) => i.id === item.id
          );
          if (existingItemIndex !== -1) {
            // If the item already exists, update the quantity
            updatedCart[existingItemIndex].quantity += item.quantity;
          } else {
            // If the item doesn't exist, add it to the cart
            updatedCart.push(data); // Add the data returned from the server to the cart
          }

          console.log("Logged in user's cart after adding item:", updatedCart);

          updateUserCart(user_id, updatedCart);
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
      // Add the new item to the state
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
      <button id="view-cart-button" onClick={viewCart}>
        View Cart
      </button>
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <div className="item-container">
          {products.map((product) => (
            <div className="item" key={product.id}>
              <Product
                product={product}
                addToCart={() => addToCart(product)}
                buyNow={buyNow}
              />
              <button className="details-button">
                <Link to={`/products/${product.id}`} className="details-link">
                  View Details
                </Link>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Store;
