import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { UserContext } from "./UserProvider";

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
  const { user, cart, setCart } = useContext(UserContext);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const viewCart = () => {
    navigate("/cart");
    let cartItems = JSON.parse(localStorage.getItem("cart"));
    if (cartItems && user) {
      localStorage.removeItem("cart");
    }
  };

  const addToCart = async (productDetails) => {
    const item = {
      ...productDetails,
      quantity: 1, // or the quantity you want to add to the cart
    };

    if (user && user.id) {
      // If user is logged in
      const user_id = user.id;
      // Send a request to the server to update the user's cart
      try {
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            item,
            user_id,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Item added to cart:", data);
      } catch (error) {
        console.error(`Error adding item to cart: ${error}`);
      }
    } else {
      // If user is a guest
      // Get the guest's cart from local storage
      let guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];
      // Add the new item to the guest's cart
      guestCart.push(item);
      // Save the updated cart in local storage
      localStorage.setItem("guestCart", JSON.stringify(guestCart));
      console.log("Item added to guest cart:", item);
      // Update the cart in the state
      setCart((prevCart) => [...prevCart, item]);
    }
  };
  // Function to update the cart
  const updateCart = async () => {
    if (!user) {
      return;
    }
    // Before sending the request to update the cart, check if user_id and cart are valid
    const user_id = user ? user.id : "guest";
    if (user_id !== "guest" && !/^\d+$/.test(user_id)) {
      console.error("Invalid user_id:", user_id);
      return;
    }

    if (!Array.isArray(cart)) {
      console.error("Invalid cart:", cart);
      return;
    }

    for (const item of cart) {
      if (!/^\d+$/.test(item.id)) {
        console.error("Invalid product_id:", item.id);
        return;
      }

      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        console.error("Invalid quantity:", item.quantity);
        return;
      }
    }

    // If user_id and cart are valid, send the request to update the cart
    try {
      const response = await fetch(`/api/cart/${user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cart }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Cart updated:", data);
    } catch (error) {
      console.error(`Error updating cart: ${error}`);
    }
  }; // This is the closing brace for the updateCart function
  useEffect(() => {
    updateCart();
  }, [cart]);

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
