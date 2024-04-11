import { useEffect, useState } from "react";

const Account = ({ currentUser, setCurrentUser }) => {
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

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("No token found");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    fetch(`http://localhost:3000/api/products/user/${currentUser.id}`, {
      headers,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Fetched data:", data);
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          console.error("Data is not an array:", data);
        }
      })
      .catch((error) => setError(error.message));
  }, [currentUser]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("No token found");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    fetch("http://localhost:3000/api/me", { headers })
      .then((response) => response.json())
      .then((data) => {
        setCurrentUser(data.user);
        setUsername(data.user.username || "");
        setEmail(data.user.email || "");
        setIsLoading(false);
        console.log("Current user:", currentUser);
        fetch(`http://localhost:3000/api/orders/${data.user.id}`, { headers })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => setPurchases(data))
          .catch((error) => setError(error.message));
      })
      .catch((error) => {
        setError(error.message);
        setIsLoading(false);
      });
  }, []);

  const handleUpdateAccount = async (event) => {
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

    fetch("http://localhost:3000/api/user", {
      method: "PUT",
      headers,
      body: JSON.stringify({ username, email }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => setCurrentUser(data.user))
      .catch((error) => setError(error.message));
  };

  const handleAddProduct = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      setError("No token found");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    fetch("http://localhost:3000/api/products", {
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
    const token = localStorage.getItem("token");

    if (!token) {
      setError("No token found");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(`/api/products/${productId}`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ sellerId: currentUser.id }),
    });

    if (response.ok) {
      // Remove the deleted product from the state
      setProducts(products.filter((product) => product.id !== productId));
    } else {
      const errorData = await response.json();
      setError(errorData.message);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h2>Account</h2>
      <p>Welcome, {currentUser.username}</p>
      <p>Email: {currentUser.email}</p>
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

      {currentUser.accounttype === "seller" && (
        <div>
          <h3>Your Products</h3>
          <ul>
            {products.map((product) => (
              <li key={product.id}>
                {product.name} - ${product.price}
                <button onClick={() => deleteProduct(product.id)}>
                  Delete
                </button>
              </li>
            ))}
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
