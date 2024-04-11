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
        price: productPrice,
        details: productDetails,
        quantity: productQuantity,
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
      })
      .catch((error) => setError(error.message));
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
            <button type="submit">Add Product</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Account;
