import { useEffect, useState, useContext } from "react";
import { UserContext } from "./UserProvider";

const BASE_URL = "http://localhost:3000";

const Account = () => {
  const { user, setCurrentUser } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // User details
  const [username, setUsername] = useState("");
  const [purchases, setPurchases] = useState([]);

  // Product details
  const [product, setProduct] = useState({
    name: "",
    price: "",
    details: "",
    quantity: "",
    category: "",
    image: "",
  });
  const [products, setProducts] = useState([]);

  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No token found");
      setIsLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}`, ...options.headers };

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  };

  const fetchUserDetails = () => {
    fetchWithAuth(`${BASE_URL}/api/me`)
      .then((data) => {
        if (data && data.user) {
          setCurrentUser(data.user);
          setUsername(data.user.username || "");
        } else {
          setError("User not found");
          setIsLoading(false);
        }
      })
      .catch((error) => {
        setError(error.message);
        setIsLoading(false);
      });
  };

  const fetchUserOrders = () => {
    if (!user) return;

    fetchWithAuth(`${BASE_URL}/api/orders/${user.id}`)
      .then((data) => {
        setPurchases(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setIsLoading(false);
      });
  };

  const fetchUserProducts = () => {
    if (!user) return;

    fetchWithAuth(`${BASE_URL}/api/products/user/${user.id}`)
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setIsLoading(false);
      });
  };

  useEffect(fetchUserDetails, []);
  useEffect(fetchUserOrders, [user]);
  useEffect(fetchUserProducts, [user]);

  const handleUpdateAccount = async (event) => {
    event.preventDefault();

    if (!username) {
      alert("Username is required");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("No token found");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    fetch(`${BASE_URL}/api/user`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ username }), // Send only username in request body
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setCurrentUser(data.user);
      })
      .catch((error) => {
        setError(error.message);
      });
  };

  const handleProductAction = async (event, productId, method) => {
    event.preventDefault();

    if (
      !product.name ||
      !product.category ||
      !product.price ||
      !product.details ||
      !product.quantity
    ) {
      alert("All fields are required");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("No token found");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    fetch(`${BASE_URL}/api/products${productId ? `/${productId}` : ""}`, {
      method,
      headers,
      body: JSON.stringify({
        ...product,
        sellerId: user.id,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // Clear the form
        setProduct({
          name: "",
          price: "",
          details: "",
          quantity: "",
          category: "",
          image: "",
        });

        // Fetch the products again
        fetchUserProducts();
      })
      .catch((error) => setError(error.message));
  };

  const handleAddProduct = (event) => handleProductAction(event, null, "POST");
  const handleUpdateProduct = (event, productId) =>
    handleProductAction(event, productId, "PUT");

  const deleteProduct = async (productId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("No token found");
      return;
    }
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(`${BASE_URL}/api/products/${productId}`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ sellerId: user.id }),
    });

    if (response.ok) {
      // Remove the deleted product from the state
      setProducts(products.filter((product) => product.id !== productId));
      setSuccessMessage("Product successfully deleted");
    } else {
      const errorData = await response.json();
      setError(errorData.message);
    }
  };

  // Clear the success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h2>Account</h2>
      {user ? (
        <>
          <p>Welcome, {user.username}</p>
          <p>Email: {user.email}</p>
        </>
      ) : (
        <p>Loading user data...</p>
      )}
      <h3>Purchase History</h3>
      <ul>
        {purchases.map((purchase) => (
          <li key={purchase.id}>
            {purchase.product_name} - {purchase.quantity}
          </li>
        ))}
      </ul>
      <h3>Update Account</h3>
      <form onSubmit={handleUpdateAccount}>
        <label>
          Username:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <button type="submit">Update</button>
      </form>
      {successMessage && <p>{successMessage}</p>}
      {user && user.accounttype === "seller" && (
        <div>
          <h3>Your Products</h3>
          <ul>
            {products && products.length > 0 ? (
              products.map((product) => (
                <li key={product.id}>
                  {product.name} - ${product.price}
                  <button onClick={() => deleteProduct(product.id)}>
                    Delete
                  </button>
                  <h4>Update Product</h4>
                  <form onSubmit={(e) => handleUpdateProduct(e, product.id)}>
                    <label>
                      Name:
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) =>
                          setProduct({ ...product, name: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Category:
                      <input
                        type="text"
                        value={product.category}
                        onChange={(e) =>
                          setProduct({ ...product, category: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Price:
                      <input
                        type="number"
                        value={product.price}
                        onChange={(e) =>
                          setProduct({ ...product, price: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Details:
                      <textarea
                        value={product.details}
                        onChange={(e) =>
                          setProduct({ ...product, details: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Quantity:
                      <input
                        type="number"
                        value={product.quantity}
                        onChange={(e) =>
                          setProduct({ ...product, quantity: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Image:
                      <img src={product.image} alt="Product" />
                      <input
                        type="text"
                        value={product.image}
                        onChange={(e) =>
                          setProduct({ ...product, image: e.target.value })
                        }
                      />
                    </label>
                    <button type="submit">Update Product</button>
                  </form>
                </li>
              ))
            ) : (
              <p>No products found</p>
            )}
          </ul>
          <h3>Add Product</h3>
          <form onSubmit={handleAddProduct}>
            <label>
              Name:
              <input
                type="text"
                value={product.name}
                onChange={(e) =>
                  setProduct({ ...product, name: e.target.value })
                }
              />
            </label>
            <label>
              Category:
              <input
                type="text"
                value={product.category}
                onChange={(e) =>
                  setProduct({ ...product, category: e.target.value })
                }
              />
            </label>
            <label>
              Price:
              <input
                type="number"
                value={product.price}
                onChange={(e) =>
                  setProduct({ ...product, price: e.target.value })
                }
              />
            </label>
            <label>
              Details:
              <textarea
                value={product.details}
                onChange={(e) =>
                  setProduct({ ...product, details: e.target.value })
                }
              />
            </label>
            <label>
              Quantity:
              <input
                type="number"
                value={product.quantity}
                onChange={(e) =>
                  setProduct({ ...product, quantity: e.target.value })
                }
              />
            </label>
            <label>
              Image:
              <img src={product.image} alt="Product" />
              <input
                type="text"
                value={product.image}
                onChange={(e) =>
                  setProduct({ ...product, image: e.target.value })
                }
              />
            </label>
            <button type="submit">Add Product</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Account;
