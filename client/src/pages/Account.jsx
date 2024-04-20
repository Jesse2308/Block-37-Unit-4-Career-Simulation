import { useEffect, useState, useContext } from "react";
import { UserContext } from "./UserProvider";

const BASE_URL = "http://localhost:3000";

// This is the main Account component
const Account = () => {
  // State variables for user, loading status, error, user details, product details, and success message
  const { user, setCurrentUser } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [purchases, setPurchases] = useState([]);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [productQuantity, setProductQuantity] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productImage, setProductImage] = useState("");
  const [products, setProducts] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch the user's details
  useEffect(() => {
    console.log("Fetching user details...");
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("No token found");
      setError("No token found");
      setIsLoading(false);
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    fetch(`${BASE_URL}/api/me`, { headers })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data && data.user) {
          console.log("User details fetched successfully");
          setCurrentUser(data.user);
          setUsername(data.user.username || "");
          setEmail(data.user.email || "");
          console.log("Current user:", data.user);
        } else {
          console.log("User not found");
          setError("User not found");
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.log("Error fetching user details:", error.message);
        setError(error.message);
        setIsLoading(false);
      });
  }, []);

  // Fetch the user's orders
  useEffect(() => {
    if (!user) {
      console.log("User not set, skipping fetch for orders");
      return;
    }

    console.log("Fetching orders...");
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("No token found");
      setError("No token found");
      setIsLoading(false);
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    fetch(`${BASE_URL}/api/orders/${user.id}`, { headers })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          console.log("Orders fetched successfully");
          setPurchases(data);
        } else {
          console.log("No orders found");
          setPurchases([]);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.log("Error fetching orders:", error.message);
        setError(error.message);
        setIsLoading(false);
      });
  }, [user]);

  const handleUpdateAccount = async (event) => {
    console.log("Handling account update");
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
        console.error("Error:", error);
        // You can set the error message to your state to display it in your UI
        setError(error.message);
      });
  };

  const handleAddProduct = async (event) => {
    console.log("Handling product addition");
    event.preventDefault();

    if (
      !productName ||
      !productCategory ||
      !productPrice ||
      !productDetails ||
      !productQuantity
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

    fetch(`${BASE_URL}api/products`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: productName,
        category: productCategory,
        price: productPrice,
        details: productDetails,
        quantity: productQuantity,
        image: productImage,
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
        setProductName("");
        setProductPrice("");
        setProductDetails("");
        setProductQuantity("");
        setProductCategory("");
        setProductImage("");
      })
      .catch((error) => setError(error.message));
  };

  const deleteProduct = async (productId) => {
    console.log("Deleting product with ID:", productId);
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
      setSuccessMessage("Product successfully deleted"); // Add this line
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
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </label>
            <label>
              Category:
              <input
                type="text"
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
              />
            </label>
            <label>
              Price:
              <input
                type="number"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
              />
            </label>
            <label>
              Details:
              <textarea
                value={productDetails}
                onChange={(e) => setProductDetails(e.target.value)}
              />
            </label>
            <label>
              Quantity:
              <input
                type="number"
                value={productQuantity}
                onChange={(e) => setProductQuantity(e.target.value)}
              />
            </label>
            <label>
              Image:
              <img src={productImage} alt="Product" />
              <input
                type="text"
                value={productImage}
                onChange={(e) => setProductImage(e.target.value)}
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
